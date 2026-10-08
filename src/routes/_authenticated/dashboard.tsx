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
  Zap,
  Eye,
  EyeOff,
  Snowflake,
  Lock,
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
import { CURRENCIES, formatMoney, getRate } from "@/lib/currency";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CountryFlag, CurrencyIcon, GiftCardBrand } from "@/components/AssetComponents";
import { TxRow } from "@/components/TxRow";
import { HomeMarketSection } from "@/components/HomeMarketSection";
import { GIFT_CARDS } from "@/lib/assets";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Moonlight Private Wealth & Treasury" },
      {
        name: "description",
        content:
          "Private multi-currency financial ledger, instant SEPA transfers, global payout corridors, and live equity benchmarks.",
      },
      { property: "og:title", content: "Moonlight Wallet Dashboard" },
      { property: "og:description", content: "Private financial ledger and global corridors." },
    ],
  }),
  component: Dashboard,
});

/**
 * Renders the signed-in wallet overview with display-currency balances,
 * account geography, regional payment methods, and recent transactions.
 */
function Dashboard() {
  const navigate = useNavigate();
  const profile = useProfile();
  const wallet = useWallet();
  const rates = useRates();
  const geography = useAccountGeography();
  const transactions = useTransactions(4);
  const setCur = useSetPreferredCurrency();
  const [copiedCode, setCopiedCode] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  const isFrozen = wallet.data?.status === "frozen";

  const cur = profile.data?.preferred_currency ?? "EUR";
  const rate = getRate(cur, rates.data?.rates);
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

  return (
    <div className="mx-auto max-w-xl space-y-5 pb-2 animate-fade-up">
      <KycBanner />
      {/* ═══════════════════════════════════════
           1. MODERN ACCOUNT & BALANCE CARD
         ═══════════════════════════════════════ */}
      <section
        aria-label="Account Balance"
        className="relative overflow-hidden rounded-[28px] border border-border/70 bg-card p-6 sm:p-7 shadow-card transition-all space-y-6"
      >
        {/* Subtle Ambient Background Lighting */}
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/8 blur-[80px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-emerald-500/5 blur-[80px]"
          aria-hidden="true"
        />

        {/* Top Header: Region Badge & Wallet ID */}
        <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-secondary/60 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur-sm shadow-2xs">
              <CountryFlag code={geography.data?.countryCode || "IN"} size="xs" circle />
              <span>{getAccountRegionLabel(geography.data)}</span>
            </div>
          </div>

          {wallet.data && (
            <button
              type="button"
              onClick={handleCopyCode}
              aria-label="Copy wallet ID"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 hover:bg-muted px-3 py-1 text-[11px] font-mono font-medium text-foreground transition-all cursor-pointer touch-manipulation shadow-2xs active:scale-95"
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

        {/* Balance Hero Section */}
        <div className="relative z-10 space-y-2 text-center py-1">
          <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Available Balance</span>
            <button
              type="button"
              onClick={() => setShowBalance(!showBalance)}
              aria-label={showBalance ? "Hide balance" : "Show balance"}
              className="p-1 rounded-full text-muted-foreground/80 hover:text-foreground hover:bg-secondary/70 transition-colors cursor-pointer"
            >
              {showBalance ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>

          <div>
            {loading ? (
              <Skeleton className="mx-auto h-12 w-56 rounded-2xl" />
            ) : (
              <h1 className="tabular font-sans text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-none">
                {showBalance ? formatMoney(balance, cur) : "••••••••"}
              </h1>
            )}
          </div>

          {/* Currency Switcher Pill */}
          <div className="flex items-center justify-center pt-2">
            <Select
              value={cur}
              disabled={isFrozen}
              onValueChange={(v) => {
                if (isFrozen) {
                  toast.error("Account preferences are locked while wallet is frozen.");
                  return;
                }
                if (profile.data) {
                  setCur.mutate(
                    { id: profile.data.id, currency: v },
                    { onError: () => toast.error("Couldn't change currency") },
                  );
                }
              }}
            >
              <SelectTrigger
                className={`h-8 rounded-full px-3.5 w-auto gap-2 border border-border/70 bg-background/80 text-xs font-semibold text-foreground transition-all shadow-2xs ${
                  isFrozen ? "opacity-60 cursor-not-allowed" : "hover:bg-muted cursor-pointer"
                }`}
              >
                <CurrencyIcon code={cur} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl p-1 border border-border/60 bg-popover text-popover-foreground shadow-elevated">
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

        {/* Connected Rails & Capabilities Strip */}
        <div className="relative z-10 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Landmark className={`h-3.5 w-3.5 shrink-0 ${isFrozen ? "text-destructive" : "text-primary"}`} />
            <span className={`font-medium ${isFrozen ? "text-destructive font-semibold" : ""}`}>
              {isFrozen
                ? "Payouts & Transfers: Suspended under security freeze"
                : geography.data?.isIndia
                  ? "Payouts: UPI & IMPS enabled"
                  : geography.data?.isEurope
                    ? "Payouts: SEPA Instant enabled"
                    : geography.data?.isUK
                      ? "Payouts: UK Faster Payments enabled"
                      : "Domestic bank payouts connected"}
            </span>
          </div>
          {isFrozen ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-destructive">
              <Snowflake className="h-3 w-3 animate-spin duration-3000" />
              Frozen
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          )}
        </div>

        {/* Freeze Advisory Card inside Balance Section */}
        {isFrozen && (
          <div className="relative z-10 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-left space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-destructive font-bold text-xs uppercase tracking-wider">
                <Lock className="h-4 w-4" />
                <span>Account Freeze Active</span>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-destructive/20 border border-destructive/30 text-destructive">
                Transactions Locked
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This wallet has been restricted by administrative security or compliance hold. Funds remain safe in your ledger. Outgoing transfers, withdrawals, and digital voucher redemptions are paused.
            </p>
          </div>
        )}

        {/* 4 Primary Action Buttons */}
        <div className="relative z-10 grid grid-cols-4 gap-2 pt-1">
          {[
            {
              to: "/send",
              label: "Send",
              icon: ArrowUpRight,
              primary: true,
              lockable: true,
            },
            { to: "/receive", label: "Receive", icon: ArrowDownLeft, lockable: false },
            { to: "/withdraw", label: "Withdraw", icon: Landmark, lockable: true },
            {
              to: "/send",
              search: { scan: "true" },
              label: "Scan QR",
              icon: ScanLine,
              lockable: true,
            },
          ].map((action, idx) => {
            const isButtonLocked = isFrozen && action.lockable;
            return (
              <Link
                key={`${action.to}-${idx}`}
                to={action.to}
                preload="intent"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                search={action.search as any}
                onClick={(e) => {
                  if (isButtonLocked) {
                    toast.error("Wallet is frozen. Transfers and withdrawals are locked by security policy.");
                  }
                }}
                className={`group flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl border transition-all touch-manipulation min-h-[72px] relative active:scale-[0.97] ${
                  isButtonLocked
                    ? "opacity-65 border-destructive/40 bg-secondary/30 text-muted-foreground hover:border-destructive/60"
                    : action.primary
                      ? "border-primary bg-primary text-primary-foreground shadow-soft hover:opacity-95"
                      : "border-border/60 bg-secondary/50 hover:bg-secondary text-foreground hover:border-border"
                }`}
              >
                {isButtonLocked && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive/20 text-destructive border border-destructive/40">
                    <Lock className="h-2.5 w-2.5" />
                  </span>
                )}
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${
                    isButtonLocked
                      ? "bg-destructive/15 text-destructive"
                      : action.primary
                        ? "bg-primary-foreground/15 text-primary-foreground"
                        : "bg-background/80 text-foreground"
                  }`}
                >
                  <action.icon className="h-4.5 w-4.5" strokeWidth={2.2} />
                </span>
                <span className="text-[11px] font-semibold tracking-wide text-center">
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════
           2. OPERATIONAL STATUS CARDS
         ═══════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 px-0.5">
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3.5 text-xs shadow-2xs hover:border-border transition-colors">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-foreground truncate">Account Verified</div>
            <div className="text-[11px] text-muted-foreground truncate">Statutory KYC compliant</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3.5 text-xs shadow-2xs hover:border-border transition-colors">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <Zap className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-foreground truncate">Instant Transfers</div>
            <div className="text-[11px] text-muted-foreground truncate">Real-time ledger settlement</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3.5 text-xs shadow-2xs hover:border-border transition-colors">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <Landmark className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-foreground truncate">
              {geography.data?.isIndia
                ? "UPI & IMPS Rails"
                : geography.data?.isEurope
                  ? "SEPA Instant Rails"
                  : "Domestic Clearing"}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">Direct bank settlement</div>
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
                Your transfers, payouts, and digital voucher redemptions will appear here.
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
           4. GLOBAL BENCHMARKS & MARKETS
         ═══════════════════════════════════════ */}
      <HomeMarketSection />

      {/* ═══════════════════════════════════════
           5. DIGITAL VOUCHERS & LUXURY BRANDS
         ═══════════════════════════════════════ */}
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
