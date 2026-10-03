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
  ShieldCheck,
  Sparkles,
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
import titaniumCardImg from "@/assets/titanium_card.jpg";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Moonlight Wallet — Luxury Financial Technology" },
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
    <div className="mx-auto max-w-xl space-y-6 pb-12 animate-fade-up">
      {/* ═══════════════════════════════════════
           1. CYBER-LUXURY TITANIUM BALANCE HERO
         ═══════════════════════════════════════ */}
      <section className="relative overflow-hidden rounded-3xl obsidian-card p-6 sm:p-7 text-center space-y-6 shadow-2xl gold-glow">
        {/* Holographic Titanium Card Background */}
        <div className="absolute inset-0 z-0 opacity-25 mix-blend-screen pointer-events-none">
          <img
            src={titaniumCardImg}
            alt="Moonlight Titanium Card"
            className="w-full h-full object-cover object-center transform scale-105"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D1117] via-transparent to-black/40 pointer-events-none" />

        {/* Top Header Badge & Wallet ID */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-[10px] font-bold text-gold tracking-widest uppercase">
            <Sparkles className="h-3 w-3" />
            <span>TITANIUM VIP</span>
          </div>

          {wallet.data && (
            <button
              type="button"
              onClick={handleCopyCode}
              aria-label="Copy wallet ID"
              className="inline-flex items-center gap-1.5 rounded-full bg-black/60 border border-gold/30 px-3 py-1 text-[11px] font-mono font-medium text-gold/90 hover:text-white hover:border-gold transition-all cursor-pointer touch-manipulation backdrop-blur-md"
            >
              <span>{wallet.data.wallet_code}</span>
              {copiedCode ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3 opacity-60" />
              )}
            </button>
          )}
        </div>

        {/* Balance Hero Display */}
        <div className="relative z-10 space-y-2 py-2">
          <p className="text-[10px] font-black tracking-[0.3em] text-gold/80 uppercase">
            Total Account Balance
          </p>

          <div>
            {loading ? (
              <Skeleton className="mx-auto h-14 w-56 rounded-2xl bg-white/10" />
            ) : (
              <h1 className="tabular font-sans text-[44px] sm:text-[54px] font-black tracking-tight text-white leading-none drop-shadow-md">
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
            <SelectTrigger className="h-9 rounded-full px-4 w-auto gap-2 border border-gold/40 bg-black/60 hover:bg-black text-xs font-bold text-gold cursor-pointer transition-all backdrop-blur-md">
              <CurrencyIcon code={cur} />
            </SelectTrigger>
            <SelectContent className="rounded-2xl p-1 border border-gold/30 bg-[#161B22] text-white">
              {CURRENCIES.map((c) => (
                <SelectItem
                  key={c.code}
                  value={c.code}
                  className="rounded-xl py-2 px-3 cursor-pointer hover:bg-gold/10"
                >
                  <div className="flex items-center gap-2">
                    <CountryFlag code={c.code} circle size="xs" />
                    <span className="font-bold text-[12px] text-white">{c.code}</span>
                    <span className="text-muted-foreground text-[11px]">· {c.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Actions */}
        <div className="relative z-10 grid grid-cols-4 gap-2.5 pt-4 border-t border-gold/20">
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
              className={`group flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-2xl border transition-all touch-manipulation min-h-[72px] active:scale-[0.96] ${
                action.primary
                  ? "border-gold/50 bg-gradient-to-b from-gold/20 to-gold/5 hover:from-gold/30 hover:to-gold/10 shadow-lg"
                  : "border-white/10 bg-black/40 hover:bg-black/70 backdrop-blur-md"
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${
                  action.primary
                    ? "bg-gold text-black shadow-md font-bold"
                    : "bg-white/10 text-white border border-white/10"
                }`}
              >
                <action.icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <span className="text-[11px] font-bold text-white tracking-wide text-center">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
           2. RECENT ACTIVITY
         ═══════════════════════════════════════ */}
      <section aria-label="Recent Activity" className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gold" />
            <h2 className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
              Recent Activity
            </h2>
          </div>
          <Link
            to="/transactions"
            className="inline-flex items-center gap-0.5 text-xs font-bold text-primary hover:underline touch-manipulation min-h-[32px]"
          >
            View all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {transactions.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 rounded-2xl bg-card/60" />
            ))}
          </div>
        ) : recentTxs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/60 bg-card/40 p-8 text-center space-y-2">
            <p className="font-semibold text-foreground text-sm">No transactions yet</p>
            <p className="text-xs text-muted-foreground">
              Your transfers, payouts, and voucher redemptions will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40 rounded-3xl border border-border/60 bg-card/60 overflow-hidden shadow-soft">
            {recentTxs.map((t) => (
              <TxRow key={t.id} tx={t} walletId={wallet.data?.id} />
            ))}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════
           3. GLOBAL MARKETS & GIFT CARDS
         ═══════════════════════════════════════ */}
      <HomeMarketSection />

      <section aria-label="Digital Gift Cards" className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-gold" />
            <h2 className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
              Digital Vouchers
            </h2>
          </div>
          <Link
            to="/withdraw"
            className="inline-flex items-center gap-0.5 text-xs font-bold text-primary hover:underline touch-manipulation min-h-[32px]"
          >
            Redeem <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
          {GIFT_CARDS.slice(0, 6).map((card) => (
            <div key={card.id} className="shrink-0 w-36">
              <GiftCardBrand card={card} onClick={() => navigate({ to: "/withdraw" })} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
