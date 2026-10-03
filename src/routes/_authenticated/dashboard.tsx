import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  ScanLine,
  Copy,
  Check,
  ChevronRight,
  Clock,
  Gift,
} from "lucide-react";
import { toast } from "sonner";
import {
  useProfile,
  useRates,
  useSetPreferredCurrency,
  useWallet,
  useTransactions,
} from "@/hooks/use-wallet";
import { CURRENCIES, formatMoney } from "@/lib/currency";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CountryFlag, CurrencyIcon, GiftCardBrand } from "@/components/AssetComponents";
import { TxRow } from "@/components/TxRow";
import { HomeMarketSection } from "@/components/HomeMarketSection";
import { GIFT_CARDS } from "@/lib/assets";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Moonlight Wallet" },
      {
        name: "description",
        content:
          "Private financial ledger, instant transfers, global payout corridors and markets.",
      },
      { property: "og:title", content: "Moonlight Wallet" },
      { property: "og:description", content: "Private financial ledger and global corridors." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const profile = useProfile();
  const wallet = useWallet();
  const rates = useRates();
  const transactions = useTransactions(3);
  const setCur = useSetPreferredCurrency();
  const [copiedCode, setCopiedCode] = useState(false);

  const cur = profile.data?.preferred_currency ?? "EUR";
  const rate = rates.data?.rates[cur] ?? 1;
  const balance = Number(wallet.data?.balance_usd ?? 0) * rate;
  const loading = profile.isLoading || wallet.isLoading || rates.isLoading;

  const handleCopyCode = () => {
    if (!wallet.data?.wallet_code) return;
    navigator.clipboard.writeText(wallet.data.wallet_code);
    setCopiedCode(true);
    toast.success("Wallet ID copied");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const recentTxs = (transactions.data ?? []).slice(0, 3);

  return (
    <div className="mx-auto max-w-xl space-y-5 pb-12 animate-fade-up">
      {/* ═══════════════════════════════════════
           1. BALANCE & PRIMARY ACTIONS
         ═══════════════════════════════════════ */}
      <section className="relative overflow-hidden rounded-3xl border border-border/40 bg-card p-5 sm:p-6 shadow-card text-center space-y-4">
        {/* Subtle premium texture overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] via-transparent to-gold/[0.02] pointer-events-none" />

        {/* Wallet Code Capsule */}
        <div className="relative z-10 flex items-center justify-center">
          {wallet.data && (
            <button
              type="button"
              onClick={handleCopyCode}
              aria-label="Copy wallet ID"
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 border border-border/40 px-3 py-1 text-[11px] font-mono font-medium text-muted-foreground hover:text-foreground hover:border-border transition-all cursor-pointer touch-manipulation"
            >
              <span>{wallet.data.wallet_code}</span>
              {copiedCode ? (
                <Check className="h-3 w-3 text-success" />
              ) : (
                <Copy className="h-3 w-3 opacity-40" />
              )}
            </button>
          )}
        </div>

        {/* Balance Display */}
        <div className="relative z-10 space-y-1.5">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Available Balance
          </p>

          <div className="mt-1">
            {loading ? (
              <Skeleton className="mx-auto h-12 w-48 rounded-xl" />
            ) : (
              <h1 className="tabular font-sans text-[40px] sm:text-[48px] font-bold tracking-tight text-foreground leading-none">
                {formatMoney(balance, cur)}
              </h1>
            )}
          </div>
        </div>

        {/* Currency Switcher */}
        <div className="relative z-10 flex items-center justify-center">
          <Select
            value={cur}
            onValueChange={(v) =>
              profile.data &&
              setCur.mutate(
                { id: profile.data.id, currency: v },
                { onError: () => toast.error("Couldn't change currency") },
              )
            }
          >
            <SelectTrigger className="h-8 rounded-full px-3 w-auto gap-2 border border-border/40 bg-secondary/50 hover:bg-secondary text-[11px] font-semibold cursor-pointer transition-colors">
              <CurrencyIcon code={cur} />
            </SelectTrigger>
            <SelectContent className="rounded-2xl p-1">
              {CURRENCIES.map((c) => (
                <SelectItem
                  key={c.code}
                  value={c.code}
                  className="rounded-xl py-2 px-3 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <CountryFlag code={c.code} circle size="xs" />
                    <span className="font-semibold text-[12px]">{c.code}</span>
                    <span className="text-muted-foreground text-[11px]">· {c.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Actions */}
        <div className="relative z-10 grid grid-cols-4 gap-2 pt-3 border-t border-border/20">
          {[
            { to: "/send", label: "Send", icon: ArrowUpRight, primary: true },
            { to: "/receive", label: "Receive", icon: ArrowDownLeft },
            { to: "/withdraw", label: "Withdraw", icon: Landmark },
            {
              to: "/send",
              search: { scan: "true" },
              label: "Scan",
              icon: ScanLine,
            },
          ].map((action, idx) => (
            <Link
              key={`${action.to}-${idx}`}
              to={action.to}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              search={action.search as any}
              className={`group flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl border transition-all touch-manipulation min-h-[68px] active:scale-[0.97] ${
                action.primary
                  ? "border-primary/20 bg-primary/[0.04] hover:bg-primary/[0.08]"
                  : "border-border/30 bg-secondary/20 hover:bg-secondary/50"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${
                  action.primary
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-background text-foreground border border-border/30"
                }`}
              >
                <action.icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
              </span>
              <span className="text-[10px] font-semibold text-foreground tracking-tight text-center">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
           2. RECENT ACTIVITY
         ═══════════════════════════════════════ */}
      <section aria-label="Recent Activity" className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <h2 className="text-[11px] font-semibold tracking-[0.15em] text-muted-foreground uppercase">
              Recent Activity
            </h2>
          </div>
          <Link
            to="/transactions"
            className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary hover:underline underline-offset-2 touch-manipulation min-h-[32px]"
          >
            See all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="divide-y divide-border/20 rounded-2xl border border-border/40 bg-card overflow-hidden shadow-card">
          {transactions.isLoading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ) : recentTxs.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center">
              <div className="relative mb-3 h-14 w-14 overflow-hidden rounded-2xl border border-border/30 bg-secondary/30">
                <img
                  src="/assets/visuals/empty-vault.jpg"
                  alt="Vault"
                  className="h-full w-full object-cover opacity-60"
                />
              </div>
              <p className="font-semibold text-foreground text-[13px]">No activity yet</p>
              <p className="mt-1 text-muted-foreground text-[11px] max-w-[240px] leading-relaxed">
                Send funds or share your wallet ID to receive instant payments.
              </p>
            </div>
          ) : (
            recentTxs.map((tx) => <TxRow key={tx.id} tx={tx} walletId={wallet.data?.id} />)
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════
           3 & 4. MARKETS & INDEX CONSTITUENTS
         ═══════════════════════════════════════ */}
      <section aria-label="Global Markets">
        <HomeMarketSection />
      </section>

      {/* ═══════════════════════════════════════
           5. GIFT CARDS & DIGITAL VOUCHERS
         ═══════════════════════════════════════ */}
      <section aria-label="Digital Vouchers" className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5">
            <Gift className="h-3.5 w-3.5 text-gold" />
            <h2 className="text-[11px] font-semibold tracking-[0.15em] text-muted-foreground uppercase">
              Digital Vouchers
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/redeem"
              className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors touch-manipulation min-h-[32px]"
            >
              Redeem code
            </Link>
            <Link
              to="/withdraw"
              className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary hover:underline underline-offset-2 touch-manipulation min-h-[32px]"
            >
              Browse all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
          {GIFT_CARDS.slice(0, 5).map((card) => (
            <div key={card.id} className="w-[172px] shrink-0">
              <GiftCardBrand
                card={card}
                onClick={() => {
                  navigate({ to: "/withdraw" });
                }}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
