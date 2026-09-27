import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  ChevronRight,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Globe2,
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
import { CountryFlag, CurrencyIcon } from "@/components/AssetComponents";
import { INVESTMENTS } from "@/lib/assets";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your balance — Moonlight Wallet" },
      { name: "description", content: "Your Moonlight Wallet balance and recent activity." },
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
      {/* Available Balance Hero */}
      <section className="pt-2 text-center sm:pt-6">
        <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
          AVAILABLE BALANCE
        </p>
        {loading ? (
          <Skeleton className="mx-auto mt-4 h-14 w-64 rounded-2xl" />
        ) : (
          <h1 className="tabular mt-3 text-5xl font-bold tracking-tight sm:text-7xl text-foreground">
            {formatMoney(balance, cur)}
          </h1>
        )}
        <div className="mt-4 flex items-center justify-center gap-2">
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
            <SelectTrigger className="h-9 w-auto gap-2 rounded-full border border-border/60 bg-card px-4 text-xs font-bold shadow-soft transition-all hover:border-primary/40">
              <CurrencyIcon code={cur} />
            </SelectTrigger>
            <SelectContent className="rounded-2xl p-1.5">
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code} className="rounded-xl py-2 px-3">
                  <div className="flex items-center gap-2.5">
                    <CountryFlag code={c.code} circle size="xs" />
                    <span className="font-bold">{c.code}</span>
                    <span className="text-muted-foreground text-xs">· {c.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {wallet.data && (
          <p className="mt-3 font-mono text-[11px] sm:text-xs text-muted-foreground tracking-wider">
            {wallet.data.wallet_code}
          </p>
        )}
      </section>

      {/* Primary Actions */}
      <section className="mx-auto grid max-w-sm sm:max-w-md grid-cols-3 gap-3 sm:gap-4">
        {[
          { to: "/send", label: "Send", icon: ArrowUpRight },
          { to: "/receive", label: "Receive", icon: ArrowDownLeft },
          { to: "/withdraw", label: "Withdraw", icon: Landmark },
        ].map((a) => (
          <Link key={a.to} to={a.to} className="group flex flex-col items-center gap-2">
            <span className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border border-border/60 bg-card shadow-soft transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:bg-accent/40">
              <a.icon className="h-5 w-5 text-foreground" strokeWidth={1.75} />
            </span>
            <span className="text-xs sm:text-sm font-semibold text-foreground">{a.label}</span>
          </Link>
        ))}
      </section>

      {/* Activity & Exchange Rates Grid */}
      <section className="grid gap-8 md:grid-cols-5">
        <div className="md:col-span-3 space-y-4">
          <div className="flex items-baseline justify-between border-b pb-3">
            <h2 className="text-lg font-bold tracking-tight text-foreground">Money activity</h2>
            <Link
              to="/transactions"
              className="flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              See all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {txs.isLoading ? (
            <div className="space-y-3 pt-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12 rounded-2xl" />
              ))}
            </div>
          ) : !txs.data?.length ? (
            <div className="rounded-3xl border border-dashed border-border/60 px-6 py-12 text-center bg-card/40">
              <p className="font-bold text-sm text-foreground">No activity yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Share your wallet ID to receive your first transfer.
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
              <div key={g.label} className="mt-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  {g.label}
                </p>
                <div className="divide-y rounded-2xl border border-border/50 bg-card/60 px-3 py-1 shadow-xs">
                  {g.items.map((t) => (
                    <TxRow key={t.id} tx={t} walletId={wallet.data?.id} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <aside className="md:col-span-2 space-y-4">
          <div className="flex items-baseline justify-between border-b pb-3">
            <h2 className="text-lg font-bold tracking-tight text-foreground">Exchange rates</h2>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              ECB Live
            </span>
          </div>
          <div className="rounded-3xl border border-border/60 bg-card/80 p-2 shadow-soft">
            {rates.isLoading ? (
              <Skeleton className="h-40 rounded-2xl" />
            ) : (
              <div className="divide-y divide-border/40">
                {["EUR", "CZK", "INR", "PHP", "GBP", "USD"]
                  .filter((c) => c !== cur)
                  .slice(0, 5)
                  .map((c) => {
                    const r = (rates.data?.rates[c] ?? 1) / rate;
                    return (
                      <div
                        key={c}
                        className="flex items-center justify-between px-3.5 py-2.5 text-xs sm:text-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <CountryFlag code={c} circle size="xs" />
                          <span className="font-semibold text-foreground">1 {cur}</span>
                        </div>
                        <span className="tabular font-bold text-foreground">
                          ≈ {r.toLocaleString(undefined, { maximumFractionDigits: 4 })} {c}
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
          {rates.data?.fetchedAt && (
            <p className="px-1 text-[11px] text-muted-foreground">
              ECB reference rates · updated {new Date(rates.data.fetchedAt).toLocaleDateString()}
            </p>
          )}
        </aside>
      </section>

      {/* Wealth & Portfolio Standard Showcase Section */}
      <section className="space-y-6 pt-6 border-t border-border/60">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                Wealth &amp; Portfolio Standard
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              European private banking tools, multi-currency treasury &amp; global market allocations.
            </p>
          </div>
          <Link
            to="/withdraw"
            className="hidden sm:flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            Explore Vouchers <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {INVESTMENTS.map((inv) => (
            <div
              key={inv.id}
              className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card/80 p-5 shadow-soft transition-all duration-300 hover:border-primary/40 hover:-translate-y-0.5"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-muted/60">
                <img
                  src={inv.imageUrl}
                  alt={inv.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103"
                />
                {inv.badge && (
                  <span className="absolute top-3 left-3 rounded-full bg-background/90 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-foreground border border-border/50 shadow-xs">
                    {inv.badge}
                  </span>
                )}
              </div>
              <div className="mt-4">
                <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                  {inv.category}
                </span>
                <h3 className="font-bold text-base text-foreground mt-0.5">{inv.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{inv.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
