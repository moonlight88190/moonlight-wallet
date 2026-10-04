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
import { TitaniumCard3D } from "@/components/TitaniumCard3D";

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
      {/* ═══════════════════════════════════════
           1. 3D TITANIUM WEALTH & BALANCE MODULE
         ═══════════════════════════════════════ */}
      <section aria-label="Account Balance" className="space-y-4">
        {/* Interactive 3D Titanium Physical Card */}
        <TitaniumCard3D
          balance={balance}
          currency={cur}
          walletCode={wallet.data?.wallet_code}
          countryCode={geography.data?.countryCode || "IN"}
          regionLabel={getAccountRegionLabel(geography.data)}
          cardholderName={profile.data?.full_name || "Moonlight Member"}
          tierName="TITANIUM TREASURY"
          showPrivacyToggle={true}
          interactive={true}
        />

        {/* Currency Switcher & Rails Status Strip */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md text-xs shadow-soft">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Display Currency:
            </span>
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
              <SelectTrigger className="h-7.5 rounded-full px-3 w-auto gap-1.5 border border-border/70 bg-background hover:bg-muted text-xs font-semibold text-foreground cursor-pointer transition-all shadow-2xs">
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

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {geography.data?.isIndia
                ? "UPI & IMPS Rails"
                : geography.data?.isEurope
                  ? "SEPA Instant Rails"
                  : geography.data?.isUK
                    ? "Faster Payments"
                    : "Global Settlement"}
            </span>
          </div>
        </div>

        {/* 4 Primary Action Buttons with elevated tactile styling */}
        <div className="grid grid-cols-4 gap-2.5 pt-0.5">
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
              preload="intent"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              search={action.search as any}
              className={`group flex flex-col items-center justify-center gap-1.5 py-3.5 px-2 rounded-2xl border transition-all touch-manipulation min-h-[76px] cursor-pointer active:scale-[0.96] ${
                action.primary
                  ? "border-emerald-500/40 bg-primary text-primary-foreground shadow-elevated hover:brightness-110"
                  : "border-border/60 bg-card/80 hover:bg-secondary/70 text-foreground hover:border-border shadow-soft"
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 ${
                  action.primary
                    ? "bg-primary-foreground/15 text-primary-foreground shadow-xs"
                    : "bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground"
                }`}
              >
                <action.icon className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <span className="text-[12px] font-bold tracking-tight">{action.label}</span>
            </Link>
          ))}
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
            <div className="text-[11px] text-muted-foreground truncate">0% peer-to-peer fee</div>
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
