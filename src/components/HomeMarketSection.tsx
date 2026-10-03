import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { ChevronRight, TrendingUp, ShieldCheck } from "lucide-react";
import { useMarkets } from "@/hooks/use-markets";
import { BrandAsset } from "@/components/AssetComponents";
import { Skeleton } from "@/components/ui/skeleton";
import type { MarketTimeRange } from "@/lib/markets.types";

export function HomeMarketSection() {
  const { indices, status, fetchedAt, source, isLoading } = useMarkets();

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
  const gradId = `home-chart-${activeIndex?.id || "idx"}-${isPositive ? "up" : "down"}`;

  const lastUpdatedText = useMemo(() => {
    if (!fetchedAt) return "Daily snapshot";
    const d = new Date(fetchedAt);
    return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  }, [fetchedAt]);

  if (isLoading && indices.length === 0) {
    return (
      <div className="rounded-3xl border border-border/50 bg-card/60 p-4 space-y-3">
        <Skeleton className="h-6 w-36 rounded-lg" />
        <Skeleton className="h-44 w-full rounded-2xl" />
      </div>
    );
  }

  if (!activeIndex) {
    return (
      <div className="rounded-3xl border border-border/50 bg-card/60 p-4 space-y-3">
        <Skeleton className="h-6 w-36 rounded-lg" />
        <Skeleton className="h-44 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border/60 bg-card/70 p-4 sm:p-5 shadow-xs space-y-4">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            Global Benchmarks
          </h2>
          <span className="text-[10px] font-semibold text-muted-foreground/80 bg-secondary/80 px-2 py-0.5 rounded-full">
            {status === "live" ? "Live" : "Daily Close"} · {lastUpdatedText}
          </span>
        </div>

        <Link
          to="/markets"
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline touch-manipulation min-h-[32px]"
        >
          View all <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* ─── Major Indices Carousel / Chips ─── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {indices.map((idx) => {
          const isSelected = idx.id === activeIndex.id;
          const quote = idx.quote;
          const pos = (quote?.changePercent ?? 0) >= 0;

          return (
            <button
              key={idx.id}
              type="button"
              onClick={() => setSelectedIndexId(idx.id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-2xl border text-left shrink-0 transition-all cursor-pointer touch-manipulation min-w-[130px] ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-2xs font-semibold"
                  : "border-border/40 bg-card hover:bg-secondary/30"
              }`}
            >
              <BrandAsset id={idx.brandAssetId} size="xs" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-foreground truncate">{idx.name}</div>
                {quote ? (
                  <div className="flex items-center gap-1.5 mt-0.5 font-mono text-[11px]">
                    <span className="text-foreground">
                      {idx.currencySymbol}
                      {quote.price.toLocaleString(undefined, {
                        maximumFractionDigits: quote.price > 1000 ? 1 : 2,
                      })}
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        pos
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {pos ? "+" : ""}
                      {quote.changePercent.toFixed(1)}%
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-foreground">{idx.region}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ─── Active Index Performance Card ─── */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-secondary/15 p-3.5 space-y-3">
        <div className="absolute inset-0 bg-[url('/assets/visuals/market-mesh.jpg')] bg-cover bg-center opacity-[0.06] pointer-events-none mix-blend-screen" />
        <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            <BrandAsset id={activeIndex.brandAssetId} size="sm" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-foreground">{activeIndex.name}</span>
                <span className="text-[10px] font-mono font-medium text-muted-foreground bg-secondary px-1.5 py-0.2 rounded">
                  {activeIndex.symbol}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">{activeIndex.provider}</p>
            </div>
          </div>

          {activeQuote && (
            <div className="text-right">
              <div className="font-mono text-base font-bold text-foreground">
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

        {/* Mini Chart */}
        {chartData.length > 1 && (
          <div className="h-28 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
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
                      <div className="rounded-lg border border-border/50 bg-background/95 px-2 py-1 shadow-md text-center text-xs">
                        <span className="font-mono font-bold">
                          {activeIndex.currencySymbol}
                          {p.close.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <div className="text-[10px] text-muted-foreground">{p.date}</div>
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

        {/* Time range pills */}
        <div className="flex items-center justify-between border-t border-border/30 pt-2 text-[11px]">
          <span className="text-[10px] text-muted-foreground">Historical Trend</span>
          <div className="flex gap-1">
            {(["1W", "1M", "1Y"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                className={`px-2 py-0.5 rounded-md font-semibold text-[10px] transition-colors cursor-pointer ${
                  timeRange === r
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Index Constituent Stocks (5-6 representative) ─── */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              {activeIndex.name} Top Constituents
            </span>
            <span className="text-[10px] text-muted-foreground">
              ({activeIndex.constituents.length} key holdings)
            </span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">Market Move</span>
        </div>

        <div className="divide-y divide-border/30 rounded-2xl border border-border/40 bg-card overflow-hidden">
          {activeIndex.constituents.map((stock) => {
            const pos = (stock.changePercent ?? 0) >= 0;

            return (
              <div
                key={stock.symbol}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5 transition-colors hover:bg-secondary/30"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <BrandAsset id={stock.brandAssetId} size="xs" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-foreground truncate">
                        {stock.name}
                      </span>
                      <span className="text-[9px] font-mono text-muted-foreground px-1 py-0.2 bg-secondary rounded shrink-0">
                        {stock.symbol.split(".")[0]}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
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

      {/* ─── Official Constituent Source Provenance ─── */}
      <div className="flex items-center justify-between px-1 pt-1 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1 truncate max-w-[80%]">
          <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
          <span className="truncate">
            Source: {activeIndex.constituentSource.authority} ·{" "}
            {activeIndex.constituentSource.datasetName}
          </span>
        </div>
        <span className="shrink-0">
          {activeIndex.constituentSource.updateCadence.split(" ")[0]}
        </span>
      </div>
    </div>
  );
}
