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
  CheckCircle,
  Shield,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import {
  useProfile,
  useRates,
  useSetPreferredCurrency,
  useWallet,
  useTransactions,
  useAccountGeography,
  getAccountRegionLabel,
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
      { title: "Dashboard — Moonlight Wallet" },
      {
        name: "description",
        content:
          "Your account dashboard. View your balance, recent transactions, and market data.",
      },
      { property: "og:title", content: "Moonlight Wallet Dashboard" },
      { property: "og:description", content: "Account dashboard and transaction history." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const profile = useProfile();
  const wallet = useWallet();
  const rates = useRates();
  const geography = useAccountGeography();
  const transactions = useTransactions(4);
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
    toast.success("Wallet ID copied to clipboard");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const recentTxs = (transactions.data ?? []).slice(0, 4);

  // Account status indicators — driven by real application state
  const accountAge = profile.data?.created_at
    ? (Date.now() - new Date(profile.data.created_at).getTime()) / (1000 * 60 * 60)
    : 0;
  const withdrawalsEnabled = accountAge >= 48;
  const accountRegion = getAccountRegionLabel(geography.data);

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-12 animate-fade-up">
      {/* ═══════════════════════════════════════
           1. ACCOUNT BALANCE CARD
         ═══════════════════════════════════════ */}
      <section
        aria-label="Account Balance"
        className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 sm:p-7 shadow-card transition-all"
      >
        {/* Top: Account label + Wallet ID */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CountryFlag
              code={geography.data?.countryCode || "GLOBAL"}
              size="xs"
              circle
            />
            <span className="text-[11px] font-medium text-muted-foreground">
              {accountRegion}
            </span>
          </div>

          {wallet.data && (
            <button
              type="button"
              onClick={handleCopyCode}
              aria-label="Copy wallet ID"
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary hover:bg-muted border border-border/40 px-3 py-1 text-[11px] font-mono font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer touch-manipulation active:scale-95"
            >
              <span>{wallet.data.wallet_code}</span>
              {copiedCode ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3 opacity-60" />
              )}
            </button>
          )}
        </div>

        {/* Balance */}
        <div className="space-y-2 pt-6 pb-4 text-center">
          <p className="text-[11px] font-medium text-muted-foreground">
            Available balance
          </p>

          <div>
            {loading ? (
              <Skeleton className="mx-auto h-14 w-56 rounded-2xl" />
            ) : (
              <h1 className="tabular font-sans text-[42px] sm:text-[52px] font-bold tracking-tight text-foreground leading-none">
                {formatMoney(balance, cur)}
              </h1>
            )}
          </div>

          {/* Display currency switcher */}
          <div className="flex items-center justify-center pt-2">
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
              <SelectTrigger className="h-8 rounded-full px-3.5 w-auto gap-2 border border-border/40 bg-secondary hover:bg-muted text-xs font-semibold text-foreground cursor-pointer transition-all shadow-2xs">
                <CurrencyIcon code={cur} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl p-1 border border-border/40 bg-popover text-popover-foreground shadow-elevated">
                {CURRENCIES.map((c) => (
                  <SelectItem
                    key={c.code}
                    value={c.code}
                    className="rounded-xl py-2 px-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <CountryFlag code={c.code} circle size="xs" />
                      <span className="font-bold text-[12px]">{c.code}</span>
                      <span className="text-muted-foreground text-[11px]">· {c.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-2 sm:gap-2.5 pt-4 border-t border-border/40">
          {[
            {
              to: "/send",
              label: "Send",
              icon: ArrowUpRight,
              primary: true,
            },
            { to: "/receive", label: "Receive", icon: ArrowDownLeft },
            { to: "/withdraw", label: "Withdraw", icon: Landmark },
            {
              to: "/send",
              search: { scan: "true" },
              label: "Scan QR",
              icon: ScanLine,
            },
          ].map((action, idx) => (
            <Link
              key={`${action.to}-${idx}`}
              to={action.to}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              search={action.search as any}
              className={`group flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl border transition-all touch-manipulation min-h-[72px] active:scale-[0.96] ${
                action.primary
                  ? "border-primary/30 bg-primary text-primary-foreground font-bold shadow-sm hover:opacity-95"
                  : "border-border/40 bg-secondary/50 hover:bg-secondary text-foreground"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${
                  action.primary ? "bg-primary-foreground/15 text-primary-foreground" : "bg-card text-foreground"
                }`}
              >
                <action.icon className="h-4.5 w-4.5" strokeWidth={2.2} />
              </span>
              <span
                className={`text-[11px] font-semibold tracking-wide text-center ${
                  action.primary ? "text-primary-foreground" : "text-foreground"
                }`}
              >
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
           2. ACCOUNT STATUS INDICATORS
         ═══════════════════════════════════════ */}
      <div className="grid grid-cols-3 gap-2 px-1">
        <div className="flex items-center gap-2 rounded-2xl border border-border/40 bg-card/50 p-2.5 sm:p-3 text-[11px] shadow-2xs">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
          <div className="min-w-0">
            <div className="font-semibold text-foreground truncate">Account Active</div>
            <div className="text-[10px] text-muted-foreground truncate">Verified</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-border/40 bg-card/50 p-2.5 sm:p-3 text-[11px] shadow-2xs">
          <Wallet className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <div className="font-semibold text-foreground truncate">Transfers</div>
            <div className="text-[10px] text-muted-foreground truncate">Available</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-border/40 bg-card/50 p-2.5 sm:p-3 text-[11px] shadow-2xs">
          <Shield className="h-4 w-4 shrink-0 text-amber-500" />
          <div className="min-w-0">
            <div className="font-semibold text-foreground truncate">Withdrawals</div>
            <div className="text-[10px] text-muted-foreground truncate">
              {withdrawalsEnabled ? "Available" : "48h wait"}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
           3. RECENT ACTIVITY
         ═══════════════════════════════════════ */}
      <section aria-label="Recent Activity" className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
              Recent Activity
            </h2>
          </div>
          <Link
            to="/transactions"
            className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline touch-manipulation min-h-[32px]"
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
          <div className="rounded-3xl border border-dashed border-border/60 bg-card/40 p-8 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">No transactions yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your transfers, withdrawals, and gift card redemptions will appear here.
              </p>
            </div>
            <div className="pt-1 flex items-center justify-center gap-2">
              <Link
                to="/receive"
                className="rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-xs font-semibold hover:opacity-90 transition-all"
              >
                Receive Funds
              </Link>
              <Link
                to="/send"
                className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-secondary transition-all"
              >
                Send Money
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/40 rounded-3xl border border-border/60 bg-card/70 overflow-hidden shadow-soft">
            {recentTxs.map((t) => (
              <TxRow key={t.id} tx={t} walletId={wallet.data?.id} />
            ))}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════
           4. MARKET DATA
         ═══════════════════════════════════════ */}
      <HomeMarketSection />

      {/* ═══════════════════════════════════════
           5. DIGITAL GIFT CARDS
         ═══════════════════════════════════════ */}
      <section aria-label="Digital Gift Cards" className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
              Gift Cards
            </h2>
          </div>
          <Link
            to="/withdraw"
            className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline touch-manipulation min-h-[32px]"
          >
            Redeem <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
          {GIFT_CARDS.slice(0, 8).map((card) => (
            <div key={card.id} className="shrink-0 w-36">
              <GiftCardBrand card={card} onClick={() => navigate({ to: "/withdraw" })} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
