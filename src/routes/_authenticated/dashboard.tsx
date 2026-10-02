import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  ScanLine,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  useProfile,
  useRates,
  useSetPreferredCurrency,
  useWallet,
} from "@/hooks/use-wallet";
import { CURRENCIES, formatMoney } from "@/lib/currency";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CountryFlag, CurrencyIcon } from "@/components/AssetComponents";
import { MarketMiniWidget } from "@/components/MarketMiniWidget";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Moonlight Wallet" },
      { name: "description", content: "Your Moonlight Wallet balance, quick actions and global markets." },
      { property: "og:title", content: "Moonlight Wallet" },
      { property: "og:description", content: "Your balance and market performance." },
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
  const setCur = useSetPreferredCurrency();
  const [copiedCode, setCopiedCode] = useState(false);

  const cur = profile.data?.preferred_currency ?? "EUR";
  const rate = rates.data?.rates[cur] ?? 1;
  const balance = Number(wallet.data?.balance_usd ?? 0) * rate;
  const loading = profile.isLoading || wallet.isLoading || rates.isLoading;

  const firstName = profile.data?.full_name?.split(" ")[0] || "there";
  const greeting = `${getTimeGreeting()}, ${firstName}`;

  const handleCopyCode = () => {
    if (!wallet.data?.wallet_code) return;
    navigator.clipboard.writeText(wallet.data.wallet_code);
    setCopiedCode(true);
    toast.success("Wallet ID copied to clipboard");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* 1. Subtle Wallet Header Greeting */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium text-muted-foreground">
          {greeting}
        </span>
        {wallet.data && (
          <button
            type="button"
            onClick={handleCopyCode}
            aria-label="Copy wallet ID"
            className="inline-flex items-center gap-1.5 rounded-full bg-secondary/80 hover:bg-secondary border border-border/40 px-2.5 py-1 text-[11px] font-mono font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer touch-manipulation"
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

      {/* 2. My Money: Clean, Authoritative Balance Hero */}
      <section className="rounded-3xl border border-border/70 bg-card p-6 sm:p-8 text-center shadow-xs">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          AVAILABLE BALANCE
        </p>

        <div className="mt-2">
          {loading ? (
            <Skeleton className="mx-auto h-12 w-48 sm:h-14 sm:w-56 rounded-2xl" />
          ) : (
            <h1 className="tabular text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground">
              {formatMoney(balance, cur)}
            </h1>
          )}
        </div>

        {/* Currency Switcher Pill */}
        <div className="mt-4 flex items-center justify-center">
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
            <SelectTrigger className="h-9 rounded-full px-3.5 w-auto gap-2 border border-border/50 bg-secondary/60 hover:bg-secondary text-xs font-semibold cursor-pointer transition-colors shadow-2xs">
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

      {/* 3. Quick Actions: 4 Compact Controls */}
      <section aria-label="Quick Actions">
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {[
            { to: "/send", label: "Send", icon: ArrowUpRight, primary: true },
            { to: "/receive", label: "Receive", icon: ArrowDownLeft, primary: false },
            { to: "/withdraw", label: "Withdraw", icon: Landmark, primary: false },
            {
              to: "/send",
              search: { scan: "true" },
              label: "Scan & Pay",
              icon: ScanLine,
              primary: false,
            },
          ].map((action, idx) => (
            <Link
              key={`${action.to}-${idx}`}
              to={action.to}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              search={action.search as any}
              className="group flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border border-border/60 bg-card hover:bg-accent/40 active:scale-[0.97] transition-all touch-manipulation min-h-[76px] shadow-2xs"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${
                  action.primary
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground"
                }`}
              >
                <action.icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <span className="text-xs font-semibold text-foreground tracking-tight text-center truncate w-full">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. What The Market Is Doing: Compact Home Market Preview */}
      <section aria-label="Markets Preview">
        <MarketMiniWidget />
      </section>
    </div>
  );
}
