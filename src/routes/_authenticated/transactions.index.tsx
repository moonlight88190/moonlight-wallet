import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useTransactions, useWallet, useProfile, useRates, txView } from "@/hooks/use-wallet";
import { TxRow } from "@/components/TxRow";
import { groupByPeriod } from "@/lib/compliance";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTitle } from "@/components/AppShell";
import { Receipt, Search, X, Filter, ArrowUpRight, ArrowDownLeft, Landmark } from "lucide-react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/transactions/")({
  head: () => ({
    meta: [
      { title: "Activity — Moonlight Wallet" },
      { name: "description", content: "Your full Moonlight Wallet transaction history." },
      { property: "og:title", content: "Activity — Moonlight Wallet" },
      { property: "og:description", content: "Your transaction history." },
    ],
  }),
  component: History,
});

type FilterType = "all" | "sent" | "received" | "payouts";

/**
 * Renders up to 200 wallet transactions with search, filter tabs,
 * loading, error, and empty states.
 */
function History() {
  const wallet = useWallet();
  const profile = useProfile();
  const rates = useRates();
  const txs = useTransactions(200);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const walletId = wallet.data?.id;
  const displayCur = profile.data?.preferred_currency ?? "EUR";
  const ratesMap = rates.data?.rates;

  const rawList = txs.data ?? [];

  // Filter and search transactions
  const filteredTxs = useMemo(() => {
    return rawList.filter((tx) => {
      const v = txView(tx, walletId);

      // Tab filter
      if (activeFilter === "payouts" && tx.kind !== "withdrawal") return false;
      if (activeFilter === "sent" && (tx.kind === "withdrawal" || !v.outgoing)) return false;
      if (activeFilter === "received" && v.outgoing) return false;

      // Text search
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const titleMatch = v.title.toLowerCase().includes(q);
        const refMatch = (tx.reference || "").toLowerCase().includes(q);
        const nameMatch = (tx.recipient_name || "").toLowerCase().includes(q);
        const methodMatch = (tx.method || "").toLowerCase().includes(q);
        const codeMatch = (tx.recipient_wallet_code || "").toLowerCase().includes(q);
        const amtMatch = String(tx.amount).includes(q) || String(v.amount).includes(q);
        return titleMatch || refMatch || nameMatch || methodMatch || codeMatch || amtMatch;
      }

      return true;
    });
  }, [rawList, activeFilter, search, walletId]);

  // Counts for tabs
  const counts = useMemo(() => {
    let sent = 0;
    let received = 0;
    let payouts = 0;
    for (const tx of rawList) {
      const v = txView(tx, walletId);
      if (tx.kind === "withdrawal") {
        payouts++;
      } else if (v.outgoing) {
        sent++;
      } else {
        received++;
      }
    }
    return { all: rawList.length, sent, received, payouts };
  }, [rawList, walletId]);

  const filterTabs = [
    { id: "all" as const, label: "All", count: counts.all },
    { id: "sent" as const, label: "Sent", icon: ArrowUpRight, count: counts.sent },
    { id: "received" as const, label: "Received", icon: ArrowDownLeft, count: counts.received },
    { id: "payouts" as const, label: "Payouts", icon: Landmark, count: counts.payouts },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-3 animate-in fade-in duration-200">
      <PageTitle eyebrow="WALLET ACTIVITY" title="Transaction History">
        View your peer transfers, instant payouts, and financial ledger activity.
      </PageTitle>

      {/* ─── Search & Filter Controls ─── */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by recipient, reference, or amount..."
            className="h-11 rounded-2xl bg-card pl-10 pr-9 text-xs sm:text-sm border-border/60 shadow-2xs focus-visible:ring-2 focus-visible:ring-primary/20"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/80 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer touch-manipulation shrink-0 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-secondary/70 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/40"
                }`}
              >
                {tab.icon && <tab.icon className="h-3 w-3" />}
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Transaction List or State ─── */}
      {txs.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 rounded-2xl bg-card/60" />
          ))}
        </div>
      ) : txs.error ? (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
          <p className="text-xs font-semibold text-rose-500">
            Could not load your transaction history.
          </p>
        </div>
      ) : rawList.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/60 bg-card/40 p-12 text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center">
            <Receipt className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">No transactions yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your transfers, payouts, and wallet activity will appear here.
            </p>
          </div>
        </div>
      ) : filteredTxs.length === 0 ? (
        <div className="rounded-3xl border border-border/60 bg-card/40 p-10 text-center space-y-3">
          <div className="mx-auto h-10 w-10 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
            <Filter className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">No matching transactions</p>
            <p className="text-xs text-muted-foreground mt-1">
              No results found for &ldquo;{search}&rdquo; in {activeFilter} activity.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setActiveFilter("all");
            }}
            className="text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            Clear Search &amp; Filters
          </button>
        </div>
      ) : (
        groupByPeriod(filteredTxs).map((g) => (
          <div key={g.label} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                {g.label}
              </p>
              <span className="text-[10px] font-mono text-muted-foreground/80">
                {g.items.length} {g.items.length === 1 ? "entry" : "entries"}
              </span>
            </div>
            <div className="divide-y divide-border/40 rounded-3xl border border-border/60 bg-card/70 overflow-hidden shadow-soft">
              {g.items.map((t) => (
                <TxRow key={t.id} tx={t} walletId={walletId} displayCur={displayCur} rates={ratesMap} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
