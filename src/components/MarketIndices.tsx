import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  TrendingUp,
  RefreshCw,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Building2,
  Clock,
  Sparkles,
} from "lucide-react";
import { useMarkets } from "@/hooks/use-markets";
import { useProfile, useRates } from "@/hooks/use-wallet";
import { StockChart } from "@/components/StockChart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MarketFilter, MarketInstrument } from "@/lib/markets.types";
import { formatMoney } from "@/lib/currency";

interface MarketIndicesProps {
  compact?: boolean;
  showHeader?: boolean;
}

export function MarketIndices({ compact = false, showHeader = true }: MarketIndicesProps) {
  const {
    instruments,
    snapshot,
    isRefreshing,
    refetch,
    filterInstruments,
    status,
    fetchedAt,
    source,
  } = useMarkets();

  const profile = useProfile();
  const rates = useRates();
  const userCur = profile.data?.preferred_currency ?? "EUR";
  const userRate = rates.data?.rates[userCur] ?? 1;

  const [activeFilter, setActiveFilter] = useState<MarketFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState<string>("^STOXX50E");

  const filtered = useMemo(
    () => filterInstruments(activeFilter, searchQuery),
    [filterInstruments, activeFilter, searchQuery],
  );

  // Selected instrument for spotlight chart
  const selectedInstrument = useMemo(() => {
    return instruments.find((i) => i.symbol === selectedSymbol) ?? filtered[0] ?? instruments[0]!;
  }, [instruments, selectedSymbol, filtered]);

  const lastUpdatedText = useMemo(() => {
    if (!fetchedAt) return "Daily snapshot";
    const d = new Date(fetchedAt);
    return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }, [fetchedAt]);

  const filterTabs: Array<{ id: MarketFilter; label: string }> = [
    { id: "all", label: "All" },
    { id: "indices", label: "Indices" },
    { id: "stocks", label: "Stocks" },
    { id: "europe", label: "Europe" },
    { id: "us", label: "US" },
    { id: "india", label: "India" },
  ];

  return (
    <section aria-labelledby="markets-heading" className="space-y-6 pt-6">
      {/* Markets Section Header */}
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <TrendingUp className="h-4 w-4" />
              </span>
              <h2
                id="markets-heading"
                className="text-xl sm:text-2xl font-bold tracking-tight text-foreground"
              >
                Markets &amp; Global Indices
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Official European, US &amp; Indian equity benchmarks · Daily close reference snapshots
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {/* Status Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/80 border border-border/50 text-[11px] font-medium text-muted-foreground">
              <span
                className={`h-2 w-2 rounded-full ${
                  status === "live" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              <span>{status === "live" ? "Daily Feed Synced" : "Daily Close Archive"}</span>
              <span className="text-muted-foreground/40">•</span>
              <span className="font-mono text-[10px]">{lastUpdatedText}</span>
            </div>

            {/* Manual Refresh Button */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-border/60 hover:bg-secondary touch-manipulation cursor-pointer"
              aria-label="Refresh market data"
              title="Refresh market data"
              disabled={isRefreshing}
              onClick={() => refetch()}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  isRefreshing ? "animate-spin motion-reduce:animate-none" : ""
                }`}
              />
            </Button>
          </div>
        </div>
      )}

      {/* Featured Spotlight Interactive Chart */}
      {selectedInstrument && (
        <div className="animate-in fade-in duration-300">
          <StockChart instrument={selectedInstrument} userCurrency={userCur} userRate={userRate} />
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Scrollable Filter Chips (Mobile-First touch scroll) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none -mx-1 px-1">
          {filterTabs.map((tab) => {
            const active = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all touch-manipulation cursor-pointer min-h-[36px] ${
                  active
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-secondary/70 text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symbol, stock, index..."
            className="pl-8 h-9 text-xs rounded-full bg-secondary/40 border-border/60 focus:bg-background"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Instruments Grid / Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center space-y-2">
          <p className="text-sm font-semibold text-foreground">No instruments found</p>
          <p className="text-xs text-muted-foreground">
            No matching stocks or indices found for "{searchQuery}". Try a different search term.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setActiveFilter("all");
            }}
            className="text-xs font-semibold text-primary"
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const isSelected = item.symbol === selectedInstrument.symbol;
            const up = item.change >= 0;
            const convertedVal =
              userCur.toUpperCase() !== item.currency.toUpperCase() && userRate > 0
                ? item.price / userRate
                : null;

            return (
              <div
                key={item.symbol}
                onClick={() => setSelectedSymbol(item.symbol)}
                className={`group relative rounded-2xl border p-4 transition-all duration-200 cursor-pointer touch-manipulation text-left ${
                  isSelected
                    ? "border-primary/60 bg-accent/40 shadow-soft ring-1 ring-primary/20"
                    : "border-border/60 bg-card hover:border-border hover:bg-secondary/40 shadow-2xs"
                }`}
              >
                {/* Header: Region badge & Ticker */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-foreground bg-secondary px-1.5 py-0.5 rounded border border-border/40">
                        {item.symbol}
                      </span>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                        {item.region}
                      </span>
                    </div>
                    <h4 className="mt-1 truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-muted-foreground truncate">{item.category}</p>
                  </div>

                  {/* Sparkline Visual */}
                  <div className="shrink-0 flex flex-col items-end">
                    <Sparkline points={item.history["1M"]} isPositive={up} />
                  </div>
                </div>

                {/* Price and 1-Day Change Bar */}
                <div className="mt-3 pt-3 border-t border-border/40 flex items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-lg font-bold tabular-nums text-foreground tracking-tight">
                      {item.currencySymbol}
                      {new Intl.NumberFormat("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(item.price)}
                    </div>
                    {convertedVal !== null && (
                      <div className="text-[11px] text-muted-foreground">
                        ≈ {formatMoney(convertedVal, userCur)}
                      </div>
                    )}
                  </div>

                  {/* Movement Pill */}
                  <span
                    className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      up
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {up ? (
                      <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5 stroke-[2.5]" />
                    )}
                    {up ? "+" : "−"}
                    {Math.abs(item.changePercent).toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Disclaimer & Source Attributions */}
      <div className="rounded-2xl border border-border/40 bg-secondary/30 p-3.5 text-[11px] text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span>
            {source} · Reference quotes update once daily. Cached locally for zero-latency viewing.
          </span>
        </div>
        <span className="shrink-0 font-medium">Closed-loop Financial Analytics</span>
      </div>
    </section>
  );
}

function Sparkline({
  points,
  isPositive,
}: {
  points?: Array<{ date: string; close: number }>;
  isPositive: boolean;
}) {
  if (!points || points.length < 2) return null;
  const closes = points.map((p) => p.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const width = 68;
  const height = 26;

  const path = points
    .map((p, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - ((p.close - min) / range) * (height - 6) - 3;
      return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="flex items-center justify-end">
      <svg width={width} height={height} className="overflow-visible">
        <path
          d={path}
          fill="none"
          stroke={isPositive ? "#10b981" : "#f43f5e"}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
