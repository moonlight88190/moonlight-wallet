import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { ChevronRight, TrendingUp, ShieldCheck } from "lucide-react";
import { useMarkets } from "@/hooks/use-markets";
import { BrandAsset } from "@/components/AssetComponents";
import { Skeleton } from "@/components/ui/skeleton";
import type { MarketTimeRange } from "@/lib/markets.types";

export function HomeMarketSection() {
  const { indices, status, fetchedAt, isLoading } = useMarkets();

  // Selected index for focus
  const [selectedIndexId, setSelectedIndexId] = useState<string>("nifty-50");
  const [timeRange, setTimeRange] = useState<MarketTimeRange>("1M");

  const activeIndex = useMemo(() => {
    return indices.find((idx) => idx.id === selectedIndexId) ?? indices[0];
  }, [indices, selectedIndexId]);

  const activeQuote = activeIndex?.quote;

  const chartData = useMemo(() => {
    if (!activeQuote) return [];
    const list = activeQuote.history[timeRange] ?? [];
    if (list.length === 0) {
      return [
        { date: "Previous", close: activeQuote.previousClose || activeQuote.price },
        { date: "Current", close: activeQuote.price },
      ];
    }
    return list;
  }, [activeQuote, timeRange]);

  const isPositive = (activeQuote?.changePercent ?? 0) >= 0;
  const strokeColor = isPositive ? "#10b981" : "#f43f5e";
  const gradId = `market-chart-${activeIndex?.id || "idx"}-${isPositive ? "up" : "down"}`;

  const lastUpdatedText = useMemo(() => {
    if (!fetchedAt) return "Daily snapshot";
    const d = new Date(fetchedAt);
    return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  }, [fetchedAt]);

  if (isLoading && indices.length === 0) {
    return (
      <div className="rounded-3xl border border-border/60 bg-card p-5 space-y-4 shadow-soft">
        <Skeleton className="h-6 w-40 rounded-lg" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  if (!activeIndex) {
    return null;
  }

  return (
    <section
      aria-label="Stock Market Benchmarks"
      className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6 shadow-soft space-y-5"
    >
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground tracking-tight">Market Benchmarks</h2>
            <p className="text-[11px] text-muted-foreground">
              Official equity indices · {status === "live" ? "Live session" : "Daily close"} (
              {lastUpdatedText})
            </p>
          </div>
        </div>

        <Link
          to="/markets"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline touch-manipulation min-h-[32px]"
        >
          <span>View all</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* ─── Index Selector Tabs / Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {indices.slice(0, 4).map((idx) => {
          const isSelected = idx.id === activeIndex.id;
          const quote = idx.quote;
          const pos = (quote?.changePercent ?? 0) >= 0;

          return (
            <button
              key={idx.id}
              type="button"
              onClick={() => setSelectedIndexId(idx.id)}
              className={`flex flex-col p-3 rounded-2xl border text-left transition-all cursor-pointer touch-manipulation min-h-[78px] ${
                isSelected
                  ? "border-primary/80 bg-primary/5 shadow-xs ring-1 ring-primary/20"
                  : "border-border/60 bg-card/60 hover:bg-muted/40 hover:border-border"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <BrandAsset id={idx.brandAssetId} size="xs" />
                <span
                  className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md ${
                    pos
                      ? "text-emerald-700 bg-emerald-500/10 dark:text-emerald-400"
                      : "text-rose-700 bg-rose-500/10 dark:text-rose-400"
                  }`}
                >
                  {pos ? "+" : ""}
                  {quote?.changePercent.toFixed(1)}%
                </span>
              </div>
              <div className="font-bold text-xs text-foreground truncate">{idx.name}</div>
              <div className="font-mono text-[11px] text-muted-foreground mt-0.5">
                {idx.currencySymbol}
                {quote?.price.toLocaleString(undefined, {
                  maximumFractionDigits: quote.price > 1000 ? 1 : 2,
                })}
              </div>
            </button>
          );
        })}
      </div>

      {/* ─── Active Index Performance & Interactive Chart ─── */}
      <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4 sm:p-5 space-y-4">
        {/* Top Info Banner */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <BrandAsset id={activeIndex.brandAssetId} size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-foreground tracking-tight">
                  {activeIndex.name}
                </span>
                <span className="text-[10px] font-mono font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                  {activeIndex.symbol}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{activeIndex.provider}</p>
            </div>
          </div>

          {activeQuote && (
            <div className="text-right">
              <div className="font-mono text-lg sm:text-xl font-bold text-foreground">
                {activeIndex.currencySymbol}
                {activeQuote.price.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div
                className={`font-mono text-xs font-semibold ${
                  isPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {isPositive ? "+" : ""}
                {activeQuote.change >= 0 ? "+" : ""}
                {activeQuote.change.toFixed(2)} ({isPositive ? "+" : ""}
                {activeQuote.changePercent.toFixed(2)}%)
              </div>
            </div>
          )}
        </div>

        {/* Minimal Financial Trend Chart */}
        {chartData.length > 1 && (
          <div className="h-32 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={strokeColor} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0]?.payload as { date: string; close: number };
                    return (
                      <div className="rounded-xl border border-border/80 bg-popover/95 p-2 shadow-elevated text-center">
                        <span className="font-mono font-bold text-xs text-foreground">
                          {activeIndex.currencySymbol}
                          {p.close.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{p.date}</div>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke={strokeColor}
                  strokeWidth={2}
                  fill={`url(#${gradId})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Timeframe Controls */}
        <div className="flex items-center justify-between border-t border-border/40 pt-3 text-[11px]">
          <span className="text-[11px] text-muted-foreground font-medium">Historical range</span>
          <div className="flex gap-1 bg-background/60 p-0.5 rounded-lg border border-border/40">
            {(["1W", "1M", "1Y"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                  timeRange === r
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Top Index Constituents ─── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-foreground tracking-tight">
            {activeIndex.name} Key Constituents
          </span>
          <span className="text-[11px] text-muted-foreground">
            {activeIndex.constituents.length} major holdings
          </span>
        </div>

        <div className="divide-y divide-border/40 rounded-2xl border border-border/60 bg-card overflow-hidden shadow-2xs">
          {activeIndex.constituents.map((stock) => {
            const pos = (stock.changePercent ?? 0) >= 0;

            return (
              <div
                key={stock.symbol}
                className="flex items-center justify-between gap-3 p-3 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <BrandAsset id={stock.brandAssetId} size="xs" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-foreground truncate">
                        {stock.name}
                      </span>
                      <span className="text-[9px] font-mono text-muted-foreground px-1.5 py-0.2 bg-secondary rounded shrink-0">
                        {stock.symbol.split(".")[0]}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {stock.category}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {typeof stock.price === "number" ? (
                    <>
                      <div className="font-mono text-xs font-semibold text-foreground">
                        {stock.currencySymbol}
                        {stock.price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <div
                        className={`font-mono text-[10px] font-bold ${
                          pos
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {pos ? "+" : ""}
                        {stock.changePercent?.toFixed(2)}%
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground font-mono">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Data Source & Cadence ─── */}
      <div className="flex items-center justify-between px-1 pt-1 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5 truncate max-w-[80%]">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <span className="truncate">
            Source: {activeIndex.constituentSource.authority} ·{" "}
            {activeIndex.constituentSource.datasetName}
          </span>
        </div>
        <span className="shrink-0 font-medium">
          {activeIndex.constituentSource.updateCadence.split(" ")[0]}
        </span>
      </div>
    </section>
  );
}
