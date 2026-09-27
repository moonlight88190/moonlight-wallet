import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  TrendingUp,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TxRow, groupByPeriod } from "@/components/TxRow";
import { CountryFlag, CurrencyIcon, GiftCardBrand } from "@/components/AssetComponents";
import { GIFT_CARDS, INVESTMENTS, LUXURY_BRANDS, PAYMENT_METHODS } from "@/lib/assets";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Moonlight Wallet" },
      {
        name: "description",
        content: "Your Moonlight Wallet balance, corridors, and recent activity.",
      },
      { property: "og:title", content: "Moonlight Wallet" },
      { property: "og:description", content: "Your balance and recent activity." },
    ],
  }),
  component: Dashboard,
});

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

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Balance Card Section */}
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-b from-card via-card to-secondary/30 p-8 sm:p-12 text-center shadow-soft">
        <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="h-3.5 w-3.5" /> European Private Standard
        </div>

        <p className="text-[11px] font-semibold tracking-[0.3em] text-muted-foreground uppercase">
          TOTAL BALANCE
        </p>

        {loading ? (
          <Skeleton className="mx-auto mt-4 h-16 w-72 rounded-2xl" />
        ) : (
          <h1 className="tabular mt-3 text-5xl font-semibold tracking-tight sm:text-7xl text-foreground">
            {formatMoney(balance, cur)}
          </h1>
        )}

        <div className="mt-5 flex items-center justify-center gap-2">
          <Select
            value={cur}
            onValueChange={(v) =>
              profile.data &&
              setCur.mutate(
                { id: profile.data.id, currency: v },
                { onError: () => toast.error("Couldn't change display currency") },
              )
            }
          >
            <SelectTrigger className="h-9 w-auto gap-2.5 rounded-full border bg-card/80 backdrop-blur-md px-4 text-xs font-semibold shadow-xs hover:border-primary/50 transition-colors">
              <CurrencyIcon code={cur} />
            </SelectTrigger>
            <SelectContent className="rounded-2xl p-1.5 max-h-72">
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code} className="rounded-xl py-2 px-3">
                  <div className="flex items-center gap-2.5">
                    <CountryFlag code={c.code} circle size="xs" />
                    <span className="font-semibold">{c.code}</span>
                    <span className="text-muted-foreground text-xs">· {c.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {wallet.data && (
          <p className="mt-4 font-mono text-xs text-muted-foreground tracking-wide">
            WALLET ID: {wallet.data.wallet_code}
          </p>
        )}
      </section>

      {/* Quick Action Navigation */}
      <section className="mx-auto grid max-w-lg grid-cols-3 gap-3 sm:gap-6">
        {[
          { to: "/send", label: "Send", icon: ArrowUpRight, desc: "Instant transfer" },
          { to: "/receive", label: "Receive", icon: ArrowDownLeft, desc: "ID & QR Code" },
          { to: "/withdraw", label: "Withdraw", icon: Landmark, desc: "Bank & Payouts" },
        ].map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="group flex flex-col items-center gap-2.5 p-3 rounded-2xl border bg-card shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-soft"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <a.icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="text-center">
              <span className="text-sm font-semibold block text-foreground">{a.label}</span>
              <span className="text-[10px] text-muted-foreground hidden sm:block mt-0.5">
                {a.desc}
              </span>
            </div>
          </Link>
        ))}
      </section>

      {/* Main Activity & Rates Split */}
      <section className="grid gap-10 md:grid-cols-5">
        <div className="md:col-span-3">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Money activity</h2>
            <Link
              to="/transactions"
              className="flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground"
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
            <div className="rounded-3xl border border-dashed px-6 py-12 text-center bg-card/40">
              <p className="font-semibold text-foreground">No transactions yet</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
                Share your Moonlight wallet ID to receive your first multi-currency transfer.
              </p>
              <Link
                to="/receive"
                className="mt-4 inline-flex rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-xs"
              >
                Receive money
              </Link>
            </div>
          ) : (
            groupByPeriod(txs.data).map((g) => (
              <div key={g.label} className="mt-4">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {g.label}
                </p>
                <div className="divide-y rounded-2xl border bg-card px-4 shadow-xs">
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
            <h2 className="mb-3 text-xl font-semibold tracking-tight">Live FX Indicative</h2>
            <div className="rounded-3xl border bg-card p-2 shadow-soft">
              {rates.isLoading ? (
                <Skeleton className="h-40 rounded-2xl" />
              ) : (
                <div className="divide-y">
                  {["EUR", "CZK", "INR", "PHP", "GBP", "USD"]
                    .filter((c) => c !== cur)
                    .slice(0, 5)
                    .map((c) => {
                      const r = (rates.data?.rates[c] ?? 1) / rate;
                      return (
                        <div
                          key={c}
                          className="flex items-center justify-between px-4 py-3 text-xs sm:text-sm"
                        >
                          <div className="flex items-center gap-2.5">
                            <CountryFlag code={c} circle size="xs" />
                            <span className="font-semibold">1 {cur}</span>
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
                ECB reference rates · updated daily
              </p>
            )}
          </div>
        </aside>
      </section>

      {/* Corridor & Payout Methods Showcase */}
      <section className="space-y-4 pt-6 border-t">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Withdrawal Corridors</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Instant local settlement across Europe, India, Philippines &amp; SWIFT rails.
            </p>
          </div>
          <Link
            to="/withdraw"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            All corridors <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PAYMENT_METHODS.slice(0, 4).map((m) => (
            <Link
              key={m.id}
              to="/withdraw"
              className="flex items-center justify-between p-3.5 rounded-2xl border bg-card shadow-xs hover:border-primary/40 transition-all"
            >
              <div className="flex items-center gap-3">
                <img src={m.iconUrl} alt={m.name} className="h-7 w-7 object-contain" />
                <div>
                  <h3 className="font-semibold text-xs text-foreground">{m.name}</h3>
                  <span className="text-[10px] text-muted-foreground">
                    {m.region} · {m.speed}
                  </span>
                </div>
              </div>
              {m.badge && (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
                  {m.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Luxury Brand Portfolio */}
      <section className="space-y-4 pt-6 border-t">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Luxury &amp; Boutique Concierge
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Direct redemptions &amp; vouchers with world-renowned European fashion and watch
              houses.
            </p>
          </div>
          <Link
            to="/withdraw"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Explore brands <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {LUXURY_BRANDS.slice(0, 6).map((b) => (
            <div
              key={b.id}
              className="flex flex-col items-center justify-center p-4 rounded-2xl border bg-card shadow-xs text-center group hover:border-primary/40 transition-all"
            >
              <div className="h-10 w-20 flex items-center justify-center">
                <img
                  src={b.logoUrl}
                  alt={b.name}
                  className="max-h-full max-w-full object-contain filter dark:invert dark:brightness-200 opacity-80 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <span className="text-xs font-medium text-foreground mt-2">{b.name}</span>
              <span className="text-[10px] text-muted-foreground">{b.origin}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Wealth & Portfolio Standard Showcase */}
      <section className="space-y-6 pt-6 border-t">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-semibold tracking-tight">
                Wealth &amp; Portfolio Standard
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              European private banking tools, multi-currency treasury &amp; global market
              allocations.
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {INVESTMENTS.map((inv) => (
            <div
              key={inv.id}
              className="group relative overflow-hidden rounded-3xl border bg-card p-5 shadow-soft transition-all duration-300 hover:border-primary/40"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-muted">
                <img
                  src={inv.imageUrl}
                  alt={inv.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {inv.badge && (
                  <span className="absolute top-3 left-3 rounded-full bg-background/90 backdrop-blur-md px-3 py-1 text-[10px] font-semibold text-foreground border border-border/50">
                    {inv.badge}
                  </span>
                )}
              </div>
              <div className="mt-4">
                <span className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">
                  {inv.category}
                </span>
                <h3 className="font-semibold text-base text-foreground mt-1">{inv.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{inv.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
