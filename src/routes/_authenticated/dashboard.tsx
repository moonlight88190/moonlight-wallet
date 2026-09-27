import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  ChevronRight,
  TrendingUp,
  Sparkles,
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
    <div className="space-y-16">
      <section className="pt-6 text-center sm:pt-10">
        <p className="text-[11px] font-medium tracking-[0.3em] text-muted-foreground">
          AVAILABLE BALANCE
        </p>
        {loading ? (
          <Skeleton className="mx-auto mt-5 h-16 w-72 rounded-2xl" />
        ) : (
          <h1 className="tabular mt-4 text-6xl font-semibold tracking-tight sm:text-7xl">
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
                { onError: () => toast.error("Couldn't change currency") },
              )
            }
          >
            <SelectTrigger className="h-9 w-auto gap-2 rounded-full border bg-card px-4 text-xs font-semibold shadow-soft">
              <CurrencyIcon code={cur} />
            </SelectTrigger>
            <SelectContent className="rounded-2xl p-1.5">
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
          <p className="mt-4 font-mono text-xs text-muted-foreground">{wallet.data.wallet_code}</p>
        )}
      </section>

      <section className="mx-auto grid max-w-md grid-cols-3 gap-4">
        {[
          { to: "/send", label: "Send", icon: ArrowUpRight },
          { to: "/receive", label: "Receive", icon: ArrowDownLeft },
          { to: "/withdraw", label: "Withdraw", icon: Landmark },
        ].map((a) => (
          <Link key={a.to} to={a.to} className="group flex flex-col items-center gap-2.5">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border bg-card shadow-soft transition-transform group-hover:-translate-y-0.5">
              <a.icon className="h-5 w-5" strokeWidth={1.5} />
            </span>
            <span className="text-sm font-medium">{a.label}</span>
          </Link>
        ))}
      </section>

      <section className="grid gap-10 md:grid-cols-5">
        <div className="md:col-span-3">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Money activity</h2>
            <Link
              to="/transactions"
              className="flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              See all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {txs.isLoading ? (
            <div className="space-y-4 pt-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : !txs.data?.length ? (
            <div className="rounded-3xl border border-dashed px-6 py-14 text-center">
              <p className="font-medium">No activity yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Share your wallet ID to receive your first transfer.
              </p>
              <Link
                to="/receive"
                className="mt-5 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
              >
                Receive money
              </Link>
            </div>
          ) : (
            groupByPeriod(txs.data).map((g) => (
              <div key={g.label} className="mt-4">
                <p className="text-xs font-medium text-muted-foreground">{g.label}</p>
                <div className="divide-y">
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
            <h2 className="mb-4 text-xl font-semibold tracking-tight">Exchange rates</h2>
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
                          className="flex items-center justify-between px-4 py-3 text-sm"
                        >
                          <div className="flex items-center gap-2.5">
                            <CountryFlag code={c} circle size="xs" />
                            <span className="font-medium">1 {cur}</span>
                          </div>
                          <span className="tabular font-semibold">
                            ≈ {r.toLocaleString(undefined, { maximumFractionDigits: 4 })} {c}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
            {rates.data?.fetchedAt && (
              <p className="mt-3 px-2 text-xs text-muted-foreground">
                ECB reference rates · updated {new Date(rates.data.fetchedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </aside>
      </section>

      {/* Wealth & Premium Services Showcase Section */}
      <section className="space-y-6 pt-4 border-t">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-semibold tracking-tight">
                Wealth &amp; Portfolio Standard
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              European private banking tools, multi-currency treasury &amp; global market
              allocations.
            </p>
          </div>
          <Link
            to="/withdraw"
            className="hidden sm:flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Explore Payouts &amp; Vouchers <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {INVESTMENTS.map((inv) => (
            <div
              key={inv.id}
              className="group relative overflow-hidden rounded-3xl border bg-card/70 p-5 shadow-soft transition-all duration-300 hover:border-primary/40 hover:-translate-y-0.5"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-muted">
                <img
                  src={inv.imageUrl}
                  alt={inv.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {inv.badge && (
                  <span className="absolute top-3 left-3 rounded-full bg-background/80 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-foreground border border-border/50">
                    {inv.badge}
                  </span>
                )}
              </div>
              <div className="mt-4">
                <span className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
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
