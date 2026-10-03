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
  Zap,
  Lock,
  Wifi,
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

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-12 animate-fade-up">
      {/* ═══════════════════════════════════════
           1. EXECUTIVE TITANIUM TREASURY CARD
         ═══════════════════════════════════════ */}
      <section
        aria-label="Account Balance"
        className="relative overflow-hidden rounded-[28px] border border-white/10 dark:border-white/15 bg-gradient-to-br from-[#161B26] via-[#0E131C] to-[#070A0F] p-6 sm:p-7 text-white shadow-[0_24px_50px_rgba(0,0,0,0.3)] transition-all"
      >
        {/* Ambient Sheen & Radial Lighting */}
        <div
          className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-[80px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-gold/15 blur-[80px]"
          aria-hidden="true"
        />
        {/* Subtle Brushed Metal Grid Background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"
          aria-hidden="true"
        />

        {/* Top Header: Badge, Contactless, & Wallet ID */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-gold/20 via-gold/10 to-transparent border border-gold/30 text-[10px] font-bold text-gold tracking-widest uppercase shadow-2xs">
              <Sparkles className="h-3 w-3 text-gold" />
              <span>TITANIUM TREASURY</span>
            </div>
            <Wifi
              className="h-3.5 w-3.5 text-white/40 rotate-90 hidden sm:block"
              aria-label="Contactless"
            />
          </div>

          {wallet.data && (
            <button
              type="button"
              onClick={handleCopyCode}
              aria-label="Copy wallet ID"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1 text-[11px] font-mono font-medium text-white/90 hover:text-white transition-all cursor-pointer touch-manipulation backdrop-blur-md active:scale-95"
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

        {/* Balance Hero Section */}
        <div className="relative z-10 space-y-2 pt-6 pb-4 text-center">
          <p className="text-[10px] font-bold tracking-[0.25em] text-white/50 uppercase">
            Available Ledger Liquidity
          </p>

          <div>
            {loading ? (
              <Skeleton className="mx-auto h-14 w-56 rounded-2xl bg-white/10" />
            ) : (
              <h1 className="tabular font-sans text-[42px] sm:text-[52px] font-bold tracking-tight text-white leading-none drop-shadow-sm">
                {formatMoney(balance, cur)}
              </h1>
            )}
          </div>

          {/* Currency Switcher Pill */}
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
              <SelectTrigger className="h-8 rounded-full px-3.5 w-auto gap-2 border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/90 hover:text-white cursor-pointer transition-all backdrop-blur-md shadow-2xs">
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

        {/* Smart Chip Graphic & Action Buttons Divider */}
        <div className="relative z-10 flex items-center justify-between pt-2 pb-3">
          <div className="flex items-center gap-1.5 opacity-70">
            {/* Realistic gold metallic contact chip */}
            <div className="h-6 w-8 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-[1px] shadow-xs">
              <div className="h-full w-full rounded-[4px] bg-[#1a1710] flex items-center justify-center">
                <div className="h-3 w-5 border border-amber-400/50 rounded-xs" />
              </div>
            </div>
            <span className="text-[9px] font-mono tracking-widest text-white/50 uppercase">
              SEPA·IMPS
            </span>
          </div>

          <div className="text-[10px] font-medium text-white/50 tracking-wide">
            {getAccountRegionLabel(geography.data)}
          </div>
        </div>

        {/* 4 Precision Action Hardware Keys */}
        <div className="relative z-10 grid grid-cols-4 gap-2 sm:gap-2.5 pt-3 border-t border-white/10">
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
                  ? "border-amber-400/60 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 text-slate-950 font-bold shadow-md hover:brightness-105"
                  : "border-white/10 bg-white/5 hover:bg-white/10 text-white backdrop-blur-md"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${
                  action.primary ? "bg-slate-950/15 text-slate-950" : "bg-white/10 text-white/90"
                }`}
              >
                <action.icon className="h-4.5 w-4.5" strokeWidth={2.2} />
              </span>
              <span
                className={`text-[11px] font-semibold tracking-wide text-center ${
                  action.primary ? "text-slate-950 font-bold" : "text-white/90"
                }`}
              >
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
           2. INSTITUTIONAL ASSURANCE STRIP
         ═══════════════════════════════════════ */}
      <div className="grid grid-cols-3 gap-2 px-1">
        <div className="flex items-center gap-2 rounded-2xl border border-border/40 bg-card/50 p-2.5 sm:p-3 text-[11px] backdrop-blur-sm shadow-2xs">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
          <div className="min-w-0">
            <div className="font-semibold text-foreground truncate">256-Bit Ledger</div>
            <div className="text-[10px] text-muted-foreground truncate">Zero-Trust SQL</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-border/40 bg-card/50 p-2.5 sm:p-3 text-[11px] backdrop-blur-sm shadow-2xs">
          <Zap className="h-4 w-4 shrink-0 text-amber-500" />
          <div className="min-w-0">
            <div className="font-semibold text-foreground truncate">Instant Rails</div>
            <div className="text-[10px] text-muted-foreground truncate">SEPA &amp; IMPS</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-border/40 bg-card/50 p-2.5 sm:p-3 text-[11px] backdrop-blur-sm shadow-2xs">
          <Lock className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <div className="font-semibold text-foreground truncate">FATF Compliant</div>
            <div className="text-[10px] text-muted-foreground truncate">Audit Verified</div>
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
