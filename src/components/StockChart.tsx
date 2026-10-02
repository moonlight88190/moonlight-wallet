import { useState, useMemo } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import type { ChartPoint, MarketInstrument, MarketTimeRange } from "@/lib/markets.types";
import { formatMoney } from "@/lib/currency";

interface StockChartProps {
  instrument: MarketInstrument;
  userCurrency?: string;
  userRate?: number;
  className?: string;
}

export function StockChart({
  instrument,
  userCurrency,
  userRate = 1,
  className = "",
}: StockChartProps) {
  const [timeRange, setTimeRange] = useState<MarketTimeRange>("1M");
  const [activePoint, setActivePoint] = useState<ChartPoint | null>(null);

  // Pick history for selected time range
  const chartData = useMemo(() => {
    const list = instrument.history[timeRange] ?? [];
    if (list.length === 0) {
      // Fallback: create 2 dummy points if empty
      return [
        { date: "Previous", close: instrument.previousClose || instrument.price },
        { date: "Current", close: instrument.price },
      ];
    }
    return list;
  }, [instrument, timeRange]);

  const firstPoint = chartData[0];
  const lastPoint = chartData[chartData.length - 1];
  const startPrice = firstPoint?.close ?? instrument.price;
  const currentDisplayedPrice = activePoint?.close ?? lastPoint?.close ?? instrument.price;

  // Calculate range change
  const rangeChange = currentDisplayedPrice - startPrice;
  const rangeChangePercent = startPrice > 0 ? (rangeChange / startPrice) * 100 : 0;
  const isPositive = rangeChange >= 0;

  // Domain calculation with safe margins
  const { minPrice, maxPrice } = useMemo(() => {
    if (chartData.length === 0) return { minPrice: 0, maxPrice: 100 };
    const prices = chartData.map((d) => d.close);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.08 || min * 0.02 || 1;
    return {
      minPrice: Math.max(0, min - padding),
      maxPrice: max + padding,
    };
  }, [chartData]);

  // Color tokens
  const strokeColor = isPositive ? "#10b981" : "#f43f5e";
  const gradientId = `stock-chart-grad-${instrument.symbol.replace(/[^a-zA-Z0-9]/g, "")}-${isPositive ? "up" : "down"}`;

  // Converted price helper if different currency
  const showConversion =
    userCurrency && userCurrency.toUpperCase() !== instrument.currency.toUpperCase();
  const convertedCurrent =
    showConversion && userRate > 0 ? currentDisplayedPrice / (userRate || 1) : null;

  return (
    <div
      className={`rounded-3xl border border-border/60 bg-card p-4 sm:p-6 shadow-soft transition-all ${className}`}
    >
      {/* Chart Top Bar: Instrument & Price Info */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold tracking-wider px-2 py-0.5 rounded-md bg-secondary text-foreground border border-border/50">
              {instrument.symbol}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {instrument.exchange} · {instrument.category}
            </span>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {instrument.region}
            </span>
          </div>

          <h3 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
            {instrument.name}
          </h3>

          <div className="mt-2 flex items-baseline gap-2.5 flex-wrap">
            <span className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-foreground">
              {instrument.currencySymbol}
              {new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(currentDisplayedPrice)}
            </span>
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              {instrument.currency}
            </span>

            {convertedCurrent !== null && userCurrency && (
              <span className="text-xs font-medium text-muted-foreground">
                ≈ {formatMoney(convertedCurrent, userCurrency)}
              </span>
            )}
          </div>

          {/* Movement Pill */}
          <div className="mt-1.5 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isPositive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 stroke-[2.5]" />
              )}
              {isPositive ? "+" : "−"}
              {Math.abs(rangeChange).toFixed(2)} ({Math.abs(rangeChangePercent).toFixed(2)}%)
            </span>
            <span className="text-[11px] text-muted-foreground">
              {activePoint
                ? `at ${activePoint.date}`
                : `past ${timeRange === "1W" ? "week" : timeRange === "1M" ? "month" : timeRange === "6M" ? "6 months" : "year"}`}
            </span>
          </div>
        </div>

        {/* Timeframe Selectors */}
        <div className="flex items-center self-start sm:self-auto rounded-2xl bg-secondary/80 p-1 border border-border/40 shadow-2xs">
          {(["1W", "1M", "6M", "1Y"] as const).map((r) => {
            const active = timeRange === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setTimeRange(r);
                  setActivePoint(null);
                }}
                className={`min-h-[36px] min-w-[40px] sm:min-w-[44px] px-3 py-1 text-xs font-bold rounded-xl transition-all touch-manipulation cursor-pointer ${
                  active
                    ? "bg-background text-foreground shadow-xs font-semibold scale-100"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>

      {/* Responsive Stock Chart Area */}
      <div className="mt-6 h-56 sm:h-72 w-full touch-pan-x">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 8, left: -20, bottom: 0 }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onMouseMove={(state: any) => {
              if (state?.activePayload && state.activePayload.length > 0) {
                const pt = state.activePayload[0]?.payload as ChartPoint;
                if (pt) setActivePoint(pt);
              }
            }}
            onMouseLeave={() => setActivePoint(null)}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.35} />
                <stop offset="85%" stopColor={strokeColor} stopOpacity={0.02} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="date"
              stroke="currentColor"
              className="text-[10px] text-muted-foreground"
              tickLine={false}
              axisLine={false}
              tickFormatter={(val: string) => {
                const parts = val.split("-");
                if (parts.length >= 3) {
                  return `${parts[1]}/${parts[2]}`;
                }
                return val;
              }}
              minTickGap={35}
            />

            <YAxis
              domain={[minPrice, maxPrice]}
              stroke="currentColor"
              className="text-[10px] text-muted-foreground"
              orientation="left"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => {
                if (v >= 10000) return `${(v / 1000).toFixed(1)}k`;
                if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
                return v.toFixed(0);
              }}
            />

            <Tooltip
              content={<CustomTooltip currencySymbol={instrument.currencySymbol} />}
              cursor={{
                stroke: strokeColor,
                strokeWidth: 1.25,
                strokeDasharray: "3 3",
                opacity: 0.6,
              }}
            />

            <Area
              type="monotone"
              dataKey="close"
              stroke={strokeColor}
              strokeWidth={2.25}
              fill={`url(#${gradientId})`}
              isAnimationActive={true}
              animationDuration={500}
              activeDot={{
                r: 5,
                fill: strokeColor,
                stroke: "white",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer: Essential Key Statistics */}
      <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/30">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Day High / Low
          </span>
          <span className="mt-1 font-semibold tabular-nums text-foreground block truncate">
            {instrument.currencySymbol}
            {instrument.dayHigh.toFixed(2)} / {instrument.currencySymbol}
            {instrument.dayLow.toFixed(2)}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/30">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
            52-Week Range
          </span>
          <span className="mt-1 font-semibold tabular-nums text-foreground block truncate">
            {instrument.currencySymbol}
            {instrument.fiftyTwoWeekLow.toFixed(1)} – {instrument.currencySymbol}
            {instrument.fiftyTwoWeekHigh.toFixed(1)}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/30">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Previous Close
          </span>
          <span className="mt-1 font-semibold tabular-nums text-foreground block truncate">
            {instrument.currencySymbol}
            {instrument.previousClose.toFixed(2)}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/30">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Market State
          </span>
          <div className="mt-1 flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="uppercase text-[11px] tracking-wide">
              {instrument.marketState === "REGULAR" ? "Settled / Active" : instrument.marketState}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomTooltip({
  active,
  payload,
  currencySymbol,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
  currencySymbol: string;
}) {
  if (active && payload && payload.length > 0) {
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="rounded-xl border border-border/70 bg-card/95 px-3 py-2 shadow-lg backdrop-blur-md text-xs space-y-0.5 pointer-events-none">
        <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{data.date}</span>
        </div>
        <div className="text-sm font-bold tabular-nums text-foreground">
          {currencySymbol}
          {data.close.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      </div>
    );
  }
  return null;
}
