import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Globe,
  ScanLine,
  Gift,
  Lock,
  Smartphone,
  History,
  ArrowRightLeft,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  useProfile,
  useRates,
  useSetPreferredCurrency,
  useTransactions,
  useWallet,
  getAccountStatusLabel,
  isEuropeanVerified,
} from "@/hooks/use-wallet";
import { CURRENCIES, convert, formatMoney } from "@/lib/currency";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TxRow, groupByPeriod } from "@/components/TxRow";
import { CountryFlag, CurrencyIcon, GiftCardBrand } from "@/components/AssetComponents";
import { GIFT_CARDS } from "@/lib/assets";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Moonlight Wallet" },
      { name: "description", content: "Your Moonlight Wallet balance and recent activity." },
      { property: "og:title", content: "Moonlight Wallet" },
      { property: "og:description", content: "Your balance and recent activity." },
    ],
  }),
  component: Dashboard,
});

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const navigate = useNavigate();
  const profile = useProfile();
  const wallet = useWallet();
  const rates = useRates();
  const txs = useTransactions(8);
  const setCur = useSetPreferredCurrency();

  // Currency Converter local state
  const [calcAmount, setCalcAmount] = useState<string>("100");
  const [calcFrom, setCalcFrom] = useState<string>("EUR");
  const [calcTo, setCalcTo] = useState<string>("INR");

  // Simulated Security toggle
  const [biometricsEnabled, setBiometricsEnabled] = useState<boolean>(true);

  const cur = profile.data?.preferred_currency ?? "EUR";
  const rate = rates.data?.rates[cur] ?? 1;
  const balance = Number(wallet.data?.balance_usd ?? 0) * rate;
  const loading = profile.isLoading || wallet.isLoading || rates.isLoading;

  const firstName = profile.data?.full_name?.split(" ")[0] || "there";
  const greeting = `${getTimeGreeting()}, ${firstName}`;
  const isVerified = isEuropeanVerified(profile.data?.email);
  const statusLabel = getAccountStatusLabel(profile.data?.email);

  // Conversion calculations
  const r = rates.data?.rates ?? {};
  const inputAmt = Number(calcAmount) || 0;
  const convertedVal = convert(inputAmt, calcFrom, calcTo, r);

  return (
    <div className="mx-auto max-w-4xl space-y-8 sm:space-y-12">
      {/* Hero Balance Section */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/80 p-6 sm:p-8 text-center shadow-soft backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {isVerified ? (
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Globe className="h-3.5 w-3.5 text-blue-500" />
          )}
          <span>{greeting}</span>
          <span className="text-muted-foreground/60">•</span>
          <span
            className={
              isVerified
                ? "text-emerald-600 dark:text-emerald-400 font-bold"
                : "text-foreground font-semibold"
            }
          >
            {statusLabel}
          </span>
        </div>

        <div className="mt-2 sm:mt-3">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-muted-foreground uppercase">
            AVAILABLE BALANCE
          </p>
          {loading ? (
            <Skeleton className="mx-auto mt-3 h-12 w-52 sm:h-14 sm:w-64 rounded-2xl" />
          ) : (
            <h1 className="tabular mt-1.5 text-3xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-foreground break-normal">
              {formatMoney(balance, cur)}
            </h1>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
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
            <SelectTrigger className="min-h-[48px] rounded-full px-4 w-auto gap-2 border border-border/60 bg-background/80 text-xs font-semibold shadow-2xs hover:bg-accent transition-colors">
              <CurrencyIcon code={cur} />
            </SelectTrigger>
            <SelectContent className="rounded-2xl p-1.5">
              {CURRENCIES.map((c) => (
                <SelectItem
                  key={c.code}
                  value={c.code}
                  className="rounded-xl py-2.5 px-3 cursor-pointer min-h-[44px]"
                >
                  <div className="flex items-center gap-2.5">
                    <CountryFlag code={c.code} circle size="xs" />
                    <span className="font-semibold">{c.code}</span>
                    <span className="text-muted-foreground text-xs">· {c.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {wallet.data && (
            <span className="inline-flex items-center rounded-full bg-secondary px-3.5 py-2 font-mono text-[11px] font-semibold text-muted-foreground border border-border/40 min-h-[44px]">
              {wallet.data.wallet_code}
            </span>
          )}
        </div>
      </section>

      {/* Primary Quick Actions Bar */}
      <section className="mx-auto max-w-xl px-1">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3">
          {[
            { to: "/send", label: "Send", icon: ArrowUpRight, primary: true },
            { to: "/receive", label: "Receive", icon: ArrowDownLeft, primary: false },
            {
              to: "/send",
              search: { scan: "true" },
              label: "Scan & Pay",
              icon: ScanLine,
              primary: false,
            },
            { to: "/withdraw", label: "Withdraw", icon: Landmark, primary: false },
            { to: "/withdraw", label: "Gift Cards", icon: Gift, primary: false },
            { to: "/transactions", label: "Activity", icon: History, primary: false },
          ].map((a, idx) => (
            <Link
              key={`${a.to}-${idx}`}
              to={a.to}
              search={a.search}
              className="group flex flex-col items-center justify-center gap-1.5 p-3 min-h-[72px] rounded-2xl border border-border/60 bg-card hover:border-primary/40 hover:bg-accent/40 touch-manipulation active:scale-[0.96] transition-transform shadow-2xs"
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 ${
                  a.primary ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                }`}
              >
                <a.icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <span className="text-[11px] font-semibold text-foreground tracking-tight text-center truncate w-full">
                {a.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Activity & FX Converter Grid */}
      <section className="grid gap-8 md:grid-cols-5">
        {/* Recent Transactions Feed */}
        <div className="md:col-span-3 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
              Money activity
            </h2>
            <Link
              to="/transactions"
              className="flex items-center gap-0.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-2 py-1"
            >
              See all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {txs.isLoading ? (
            <div className="space-y-3 pt-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-14 rounded-2xl" />
              ))}
            </div>
          ) : !txs.data?.length ? (
            <div className="rounded-3xl border border-dashed p-8 text-center space-y-3">
              <p className="font-semibold text-sm text-foreground">No activity yet</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Share your wallet ID to receive your first transfer or send funds globally.
              </p>
              <Link
                to="/receive"
                className="inline-flex rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-soft active:scale-[0.98] min-h-[44px] items-center"
              >
                Receive money
              </Link>
            </div>
          ) : (
            groupByPeriod(txs.data).map((g) => (
              <div key={g.label} className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                  {g.label}
                </p>
                <div className="divide-y rounded-2xl border border-border/60 bg-card overflow-hidden shadow-2xs">
                  {g.items.map((t) => (
                    <TxRow key={t.id} tx={t} walletId={wallet.data?.id} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Currency Converter & Rates */}
        <aside className="md:col-span-2 space-y-6">
          <div className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-base text-foreground">Currency Converter</h2>
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full">
                ECB Live
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value)}
                  placeholder="100"
                  className="rounded-xl h-12 text-base font-semibold flex-1"
                />
                <Select value={calcFrom} onValueChange={setCalcFrom}>
                  <SelectTrigger className="h-12 w-full sm:w-28 rounded-xl border text-xs font-semibold">
                    <CurrencyIcon code={calcFrom} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl p-1">
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code} className="rounded-xl py-2">
                        <div className="flex items-center gap-2">
                          <CountryFlag code={c.code} circle size="xs" />
                          <span className="font-semibold">{c.code}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/50 bg-secondary/40 p-3 text-xs">
                <span className="text-muted-foreground font-medium">Converts to:</span>
                <span className="font-semibold text-sm text-foreground">
                  {formatMoney(convertedVal, calcTo)}
                </span>
              </div>

              <div className="flex justify-end">
                <Select value={calcTo} onValueChange={setCalcTo}>
                  <SelectTrigger className="h-12 w-full sm:w-32 rounded-xl border text-xs font-semibold">
                    <CurrencyIcon code={calcTo} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl p-1">
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code} className="rounded-xl py-2">
                        <div className="flex items-center gap-2">
                          <CountryFlag code={c.code} circle size="xs" />
                          <span className="font-semibold">{c.code}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick ECB Rates Table */}
            <div className="border-t border-border/40 pt-3 space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">
                POPULAR CORRIDORS
              </p>
              {rates.isLoading ? (
                <Skeleton className="h-28 rounded-xl" />
              ) : (
                <div className="divide-y divide-border/40 text-xs">
                  {["EUR", "USD", "GBP", "INR", "PHP", "CZK"]
                    .filter((c) => c !== cur)
                    .slice(0, 4)
                    .map((c) => {
                      const rateVal = (rates.data?.rates[c] ?? 1) / rate;
                      return (
                        <div key={c} className="flex justify-between items-center py-1.5">
                          <div className="flex items-center gap-2">
                            <CountryFlag code={c} circle size="xs" />
                            <span className="font-medium">1 {cur}</span>
                          </div>
                          <span className="tabular font-semibold">
                            ≈ {rateVal.toLocaleString(undefined, { maximumFractionDigits: 4 })} {c}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </aside>
      </section>

      {/* Digital Gift Cards Marketplace Section */}
      <section className="space-y-4 pt-4 border-t border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Digital Brand Vouchers
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Instant digital passes for global gaming, shopping and entertainment services.
            </p>
          </div>
          <Link
            to="/withdraw"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline min-h-[44px] px-2 py-1"
          >
            Explore all vouchers <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {GIFT_CARDS.slice(0, 6).map((card) => (
            <GiftCardBrand
              key={card.id}
              card={card}
              onClick={() => navigate({ to: "/withdraw" })}
            />
          ))}
        </div>
      </section>

      {/* Security & Account Controls Section */}
      <section className="space-y-4 pt-4 border-t border-border/50">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-emerald-500" />
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Security &amp; Account Controls
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Biometric Lock
              </span>
              <Smartphone className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-semibold text-foreground">Passcode &amp; Touch ID</span>
              <button
                onClick={() => {
                  setBiometricsEnabled(!biometricsEnabled);
                  toast.success(
                    !biometricsEnabled
                      ? "Biometric security enabled"
                      : "Biometric security disabled",
                  );
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  biometricsEnabled ? "bg-emerald-500" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    biometricsEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Require device biometric authentication for outgoing transfers.
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Two-Factor Status
              </span>
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="flex items-center gap-1.5 pt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Protected Session
            </div>
            <p className="text-[11px] text-muted-foreground">
              Secured via Supabase authentication &amp; encrypted token hydration.
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Account Tier
              </span>
              <Globe className="h-4 w-4 text-blue-500" />
            </div>
            <div className="pt-1 text-sm font-semibold text-foreground">{statusLabel}</div>
            <p className="text-[11px] text-muted-foreground truncate">{profile.data?.email}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
