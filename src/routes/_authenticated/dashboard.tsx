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
    <div className="mx-auto max-w-xl space-y-6 pb-12 animate-in fade-in duration-200">
      {/* ─── 1. BALANCE & PRIMARY ACTIONS ─── */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-b from-card/95 via-card/85 to-card/65 p-5 sm:p-6 shadow-sm text-center space-y-4">
        {/* Subtle titanium texture overlay */}
        <div className="absolute inset-0 bg-[url('/assets/visuals/titanium-card-mesh.jpg')] bg-cover bg-center opacity-[0.04] pointer-events-none mix-blend-overlay" />

        {/* Top Wallet Code Capsule & Security Badge */}
        <div className="relative z-10 flex items-center justify-center gap-2">
          {wallet.data && (
            <button
              type="button"
              onClick={handleCopyCode}
              aria-label="Copy wallet ID"
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary/70 border border-border/50 px-3 py-1 text-[11px] font-mono font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer touch-manipulation hover:border-border"
            >
              <span>{wallet.data.wallet_code}</span>
              {copiedCode ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3 opacity-50" />
              )}
            </button>
          )}
        </div>

        <div className="relative z-10 space-y-1">
          <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
            Available Balance
          </p>

          <div className="mt-1">
            {loading ? (
              <Skeleton className="mx-auto h-12 w-48 rounded-xl" />
            ) : (
              <h1 className="tabular font-sans text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
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
            <SelectTrigger className="h-8 rounded-full px-3 w-auto gap-2 border border-border/50 bg-secondary/60 hover:bg-secondary text-xs font-semibold cursor-pointer transition-colors shadow-2xs">
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
                    <span className="font-semibold">{c.code}</span>
                    <span className="text-muted-foreground text-xs">· {c.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Actions */}
        <div className="relative z-10 grid grid-cols-4 gap-2 pt-2 border-t border-border/30">
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
                  ? "border-primary/25 bg-primary/[0.05] hover:bg-primary/[0.09] shadow-2xs"
                  : "border-border/40 bg-secondary/30 hover:bg-secondary/60"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${
                  action.primary
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-background text-foreground border border-border/40"
                }`}
              >
                <action.icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </span>
              <span className="text-[11px] font-semibold text-foreground tracking-tight text-center">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── 2. FIRST 3 RECENT ACTIVITIES ─── */}
      <section aria-label="Recent Activity" className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Recent Activity
            </h2>
          </div>
          <Link
            to="/transactions"
            className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline touch-manipulation min-h-[32px]"
          >
            See all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-border/30 rounded-3xl border border-border/50 bg-card/80 overflow-hidden shadow-xs">
          {transactions.isLoading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ) : recentTxs.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground flex flex-col items-center">
              <div className="relative mb-3 h-16 w-16 overflow-hidden rounded-2xl border border-border/40 shadow-xs">
                <img
                  src="/assets/visuals/empty-vault.jpg"
                  alt="Vault"
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="font-semibold text-foreground text-sm">No activity recorded yet</p>
              <p className="mt-1 text-muted-foreground text-xs max-w-xs">
                Send funds or share your wallet ID to receive instant payments.
              </p>
            </div>
          ) : (
            recentTxs.map((tx) => <TxRow key={tx.id} tx={tx} walletId={wallet.data?.id} />)
          )}
        </div>
      </section>

      {/* ─── 3 & 4. MARKETS & INDEX CONSTITUENTS ─── */}
      <section aria-label="Global Markets">
        <HomeMarketSection />
      </section>

      {/* ─── 5. GIFT CARDS & DIGITAL VOUCHERS ─── */}
      <section aria-label="Digital Vouchers" className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Gift className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Digital Vouchers
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/redeem"
              className="inline-flex items-center gap-0.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors touch-manipulation min-h-[32px]"
            >
              Redeem code
            </Link>
            <Link
              to="/withdraw"
              className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline touch-manipulation min-h-[32px]"
            >
              Browse all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
          {GIFT_CARDS.slice(0, 5).map((card) => (
            <div key={card.id} className="w-[180px] shrink-0">
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
