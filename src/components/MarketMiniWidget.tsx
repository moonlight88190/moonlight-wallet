import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { ArrowUpRight, ArrowDownRight, ChevronRight, TrendingUp } from "lucide-react";
import { useMarkets } from "@/hooks/use-markets";
import { useProfile, useRates } from "@/hooks/use-wallet";
import { formatMoney, getRate } from "@/lib/currency";
import type { MarketInstrument, MarketTimeRange } from "@/lib/markets.types";
import { Skeleton } from "@/components/ui/skeleton";

const BENCHMARK_SYMBOLS = ["^NSEI", "^GSPC", "^STOXX50E", "^GDAXI"];

export function MarketMiniWidget() {
  const { instruments, status, fetchedAt, isLoading } = useMarkets();
  const profile = useProfile();
  const rates = useRates();

  const userCur = profile.data?.preferred_currency ?? "EUR";
  const userRate = getRate(userCur, rates.data?.rates);

  // Selected instrument for the mini chart
  const [selectedSymbol, setSelectedSymbol] = useState<string>("^STOXX50E");
  const [timeRange, setTimeRange] = useState<MarketTimeRange>("1M");

  const benchmarks = useMemo(() => {
    return BENCHMARK_SYMBOLS.map((sym) => {
      return (
        instruments.find((i) => i.symbol === sym) ||
        instruments.find((i) => i.symbol.includes(sym.replace("^", "")))
      );
    }).filter(Boolean) as MarketInstrument[];
  }, [instruments]);

  const activeInstrument = useMemo(() => {
    return instruments.find((i) => i.symbol === selectedSymbol) ?? benchmarks[0] ?? instruments[0];
  }, [instruments, selectedSymbol, benchmarks]);

  const chartData = useMemo(() => {
    if (!activeInstrument) return [];
    const list = activeInstrument.history[timeRange] ?? [];
    if (list.length === 0) {
      return [
        { date: "Previous", close: activeInstrument.previousClose || activeInstrument.price },
        { date: "Current", close: activeInstrument.price },
      ];
    }
    return list;
  }, [activeInstrument, timeRange]);

  const isPositive = (activeInstrument?.changePercent ?? 0) >= 0;
  const strokeColor = isPositive ? "#10b981" : "#f43f5e";
  const gradId = `mini-chart-grad-${activeInstrument?.symbol.replace(/[^a-zA-Z0-9]/g, "") || "market"}-${isPositive ? "up" : "down"}`;

  const lastUpdatedText = useMemo(() => {
    if (!fetchedAt) return "Daily snapshot";
    const d = new Date(fetchedAt);
    return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  }, [fetchedAt]);

  if (isLoading && !activeInstrument) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card/60 p-4 space-y-3">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!activeInstrument) return null;

  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Top Heading & Benchmark Selector Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <h2 className="text-sm font-semibold tracking-tight text-foreground uppercase">
            Markets
          </h2>
          <span className="text-[10px] font-medium text-muted-foreground/80 bg-secondary/80 px-2 py-0.5 rounded-full">
            {status === "live" ? "Synced" : "Daily Close"} · {lastUpdatedText}
          </span>
        </div>

        <Link
          to="/markets"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline self-start sm:self-auto touch-manipulation min-h-[32px]"
        >
          View Markets <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* 4 Benchmark Index Quick Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {benchmarks.map((bench) => {
          const isSelected = bench.symbol === activeInstrument.symbol;
          const pos = bench.changePercent >= 0;
          return (
            <button
              key={bench.symbol}
              type="button"
              onClick={() => setSelectedSymbol(bench.symbol)}
              className={`flex flex-col p-2.5 rounded-xl border text-left transition-all cursor-pointer touch-manipulation ${
                isSelected
                  ? "border-primary/50 bg-primary/5 shadow-2xs font-semibold"
                  : "border-border/50 bg-card hover:bg-secondary/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground truncate">
                  {(bench as { shortName?: string }).shortName || bench.name}
                </span>
                <span
                  className={`inline-flex items-center text-[10px] font-bold ${
                    pos
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {pos ? "+" : ""}
                  {bench.changePercent.toFixed(2)}%
                </span>
              </div>
              <div className="font-mono text-xs text-muted-foreground mt-0.5">
                {bench.currencySymbol}
                {bench.price.toLocaleString(undefined, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 2,
                })}
              </div>
            </button>
          );
        })}
      </div>

      {/* Mini Featured Chart Card */}
      <div className="rounded-xl border border-border/40 bg-secondary/20 p-3 sm:p-4 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground">{activeInstrument.name}</span>
              <span className="text-[10px] font-mono font-semibold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                {activeInstrument.symbol}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-mono text-lg font-bold text-foreground">
                {activeInstrument.currencySymbol}
                {activeInstrument.price.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span
                className={`inline-flex items-center text-xs font-bold ${
                  isPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5 stroke-[2.5]" />
                )}
                {isPositive ? "+" : ""}
                {activeInstrument.changePercent.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Timeframe selector */}
          <div className="flex items-center gap-1 rounded-lg bg-secondary/80 p-0.5 border border-border/40 text-[11px] font-semibold">
            {(["1W", "1M", "1Y"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                  timeRange === r
                    ? "bg-card text-foreground font-bold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Lightweight SVG Area Chart */}
        <div className="h-28 sm:h-32 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 2, left: 2, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const pt = payload[0];
                  if (!pt) return null;
                  return (
                    <div className="rounded-lg border border-border/80 bg-popover px-2.5 py-1 text-xs shadow-md">
                      <div className="font-mono font-bold text-foreground">
                        {activeInstrument.currencySymbol}
                        {Number(pt.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{pt.payload.date}</div>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={strokeColor}
                strokeWidth={1.75}
                fill={`url(#${gradId})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
