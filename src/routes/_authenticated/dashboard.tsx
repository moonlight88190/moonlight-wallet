import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Landmark, ScanLine, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useProfile, useRates, useSetPreferredCurrency, useWallet } from "@/hooks/use-wallet";
import { CURRENCIES, formatMoney } from "@/lib/currency";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CountryFlag, CurrencyIcon } from "@/components/AssetComponents";
import { MarketMiniWidget } from "@/components/MarketMiniWidget";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Moonlight Wallet" },
      {
        name: "description",
        content: "Your Moonlight Wallet balance, quick actions and global markets.",
      },
      { property: "og:title", content: "Moonlight Wallet" },
      { property: "og:description", content: "Your balance and market performance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const profile = useProfile();
  const wallet = useWallet();
  const rates = useRates();
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

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-in fade-in duration-200">
      {/* ─── Balance ─── */}
      <section className="text-center pt-2 pb-1">
        {/* Wallet code */}
        {wallet.data && (
          <button
            type="button"
            onClick={handleCopyCode}
            aria-label="Copy wallet ID"
            className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 border border-border/40 px-2.5 py-1 text-[11px] font-mono font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer touch-manipulation mb-3"
          >
            <span>{wallet.data.wallet_code}</span>
            {copiedCode ? (
              <Check className="h-3 w-3 text-emerald-500" />
            ) : (
              <Copy className="h-3 w-3 opacity-50" />
            )}
          </button>
        )}

        <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          Available balance
        </p>

        <div className="mt-1.5">
          {loading ? (
            <Skeleton className="mx-auto h-11 w-44 rounded-xl" />
          ) : (
            <h1 className="tabular text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
              {formatMoney(balance, cur)}
            </h1>
          )}
        </div>

        {/* Currency Switcher */}
        <div className="mt-3 flex items-center justify-center">
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
            <SelectTrigger className="h-8 rounded-full px-3 w-auto gap-2 border border-border/40 bg-secondary/50 hover:bg-secondary text-xs font-semibold cursor-pointer transition-colors">
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
      </section>

      {/* ─── Quick Actions ─── */}
      <section aria-label="Quick Actions">
        <div className="grid grid-cols-4 gap-2">
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
              className={`group flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-2xl border transition-all touch-manipulation min-h-[72px] active:scale-[0.97] ${
                action.primary
                  ? "border-primary/20 bg-primary/[0.04] hover:bg-primary/[0.08]"
                  : "border-border/50 bg-card hover:bg-secondary/40"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${
                  action.primary
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground"
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

      {/* ─── Markets Preview ─── */}
      <section aria-label="Markets Preview">
        <MarketMiniWidget />
      </section>
    </div>
  );
}
