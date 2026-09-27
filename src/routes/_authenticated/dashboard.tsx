import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  useProfile,
  useRates,
  useSetPreferredCurrency,
  useTransactions,
  useWallet,
} from "@/hooks/use-wallet";
import { CURRENCIES, formatMoney } from "@/lib/currency";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TxRow, groupByPeriod } from "@/components/TxRow";
import { CountryFlag, CurrencyIcon } from "@/components/AssetComponents";
import { INVESTMENTS } from "@/lib/assets";

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
  const profile = useProfile();
  const wallet = useWallet();
  const rates = useRates();
  const txs = useTransactions(8);
  const setCur = useSetPreferredCurrency();

  const cur = profile.data?.preferred_currency ?? "EUR";
  const rate = rates.data?.rates[cur] ?? 1;
  const balance = Number(wallet.data?.balance_usd ?? 0) * rate;
  const loading = profile.isLoading || wallet.isLoading || rates.isLoading;

  const firstName = profile.data?.full_name?.split(" ")[0] || "there";
  const greeting = `${getTimeGreeting()}, ${firstName}`;

  return (
    <div className="mx-auto max-w-4xl space-y-8 sm:space-y-12">
      {/* Hero Balance Section */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/80 p-6 sm:p-8 text-center shadow-soft backdrop-blur-xl">
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>{greeting}</span>
        </div>

        <div className="mt-2 sm:mt-3">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-muted-foreground uppercase">
            AVAILABLE BALANCE
          </p>
          {loading ? (
            <Skeleton className="mx-auto mt-3 h-12 w-52 sm:h-14 sm:w-64 rounded-2xl" />
          ) : (
            <h1 className="tabular mt-1.5 text-3xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-foreground">
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
            <SelectTrigger className="h-8 sm:h-9 w-auto gap-2 rounded-full border border-border/60 bg-background/80 px-3.5 text-xs font-semibold shadow-2xs hover:bg-accent transition-colors">
              <CurrencyIcon code={cur} />
            </SelectTrigger>
            <SelectContent className="rounded-2xl p-1.5">
              {CURRENCIES.map((c) => (
                <SelectItem
                  key={c.code}
                  value={c.code}
                  className="rounded-xl py-2 px-3 cursor-pointer"
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
            <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 font-mono text-[11px] text-muted-foreground border border-border/40">
              {wallet.data.wallet_code}
            </span>
          )}
        </div>
      </section>

      {/* Mobile-Optimized Quick Actions */}
      <section className="mx-auto max-w-lg px-2">
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {[
            { to: "/send", label: "Send", icon: ArrowUpRight, primary: true },
            { to: "/receive", label: "Receive", icon: ArrowDownLeft, primary: false },
            { to: "/withdraw", label: "Withdraw", icon: Landmark, primary: false },
            { to: "/transactions", label: "Activity", icon: TrendingUp, primary: false },
          ].map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="group flex flex-col items-center gap-1.5 p-1 touch-manipulation active:scale-[0.96] transition-transform"
            >
              <span
                className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border transition-all duration-200 shadow-soft group-hover:-translate-y-0.5 ${
                  a.primary
                    ? "bg-primary text-primary-foreground border-primary/20"
                    : "bg-card text-foreground border-border/60 group-hover:border-primary/40 group-hover:bg-accent/40"
                }`}
              >
                <a.icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.75} />
              </span>
              <span className="text-xs font-semibold text-foreground tracking-tight">
                {a.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Transactions & Exchange Rates Grid */}
      <section className="grid gap-8 md:grid-cols-5">
        <div className="md:col-span-3">
          <div className="mb-3 flex items-center justify-between border-b pb-2">
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
              Money activity
            </h2>
            <Link
              to="/transactions"
              className="flex items-center gap-0.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
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
                className="inline-flex rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-soft active:scale-[0.98]"
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

        <aside className="md:col-span-2 space-y-6">
          <div>
            <div className="mb-3 flex items-center justify-between border-b pb-2">
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
                Exchange rates
              </h2>
              <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full">
                ECB Live
              </span>
            </div>

            <div className="rounded-3xl border border-border/60 bg-card/80 p-2 shadow-soft">
              {rates.isLoading ? (
                <Skeleton className="h-44 rounded-2xl" />
              ) : (
                <div className="divide-y divide-border/40">
                  {["EUR", "USD", "GBP", "CZK", "INR", "PHP", "CHF"]
                    .filter((c) => c !== cur)
                    .slice(0, 5)
                    .map((c) => {
                      const r = (rates.data?.rates[c] ?? 1) / rate;
                      return (
                        <div
                          key={c}
                          className="flex items-center justify-between px-3.5 py-2.5 text-xs sm:text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <CountryFlag code={c} circle size="xs" />
                            <span className="font-semibold text-foreground">1 {cur}</span>
                          </div>
                          <span className="tabular font-semibold text-foreground">
                            ≈ {r.toLocaleString(undefined, { maximumFractionDigits: 4 })} {c}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
            {rates.data?.fetchedAt && (
              <p className="mt-2.5 px-2 text-[11px] text-muted-foreground">
                ECB reference rates · updated {new Date(rates.data.fetchedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </aside>
      </section>

      {/* Wealth & Premium Services Showcase Section */}
      <section className="space-y-6 pt-6 border-t border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Wealth &amp; Portfolio Standard
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              European private banking tools, multi-currency treasury &amp; global market
              allocations.
            </p>
          </div>
          <Link
            to="/withdraw"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Explore Payouts &amp; Vouchers <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {INVESTMENTS.map((inv) => (
            <div
              key={inv.id}
              className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-4 sm:p-5 shadow-soft transition-all duration-300 hover:border-primary/40 hover:-translate-y-0.5"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-muted">
                <img
                  src={inv.imageUrl}
                  alt={inv.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {inv.badge && (
                  <span className="absolute top-3 left-3 rounded-full bg-background/80 backdrop-blur-md px-3 py-1 text-[10px] font-semibold text-foreground border border-border/50">
                    {inv.badge}
                  </span>
                )}
              </div>
              <div className="mt-3.5">
                <span className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">
                  {inv.category}
                </span>
                <h3 className="font-semibold text-sm sm:text-base text-foreground mt-0.5">
                  {inv.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{inv.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
