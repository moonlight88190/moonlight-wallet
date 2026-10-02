import React, { useState, useEffect, useRef } from "react";
import {
  TrendingUp,
  TrendingDown,
  Search,
  AlertCircle,
  Loader2,
  Clock,
  Sparkles,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import {
  getMarkets,
  getStockQuote,
  getStockHistory,
  searchStocks,
  StockQuote,
  StockSearchResult,
  ChartPoint,
} from "@/lib/markets.functions";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

export function StockMarketSection() {
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [loadingMarkets, setLoadingMarkets] = useState(true);
  const [rateLimited, setRateLimited] = useState(false);

  // Featured stock state
  const [featuredSymbol, setFeaturedSymbol] = useState("NVDA");
  const [featuredQuote, setFeaturedQuote] = useState<StockQuote | null>(null);
  const [featuredTimeframe, setFeaturedTimeframe] = useState<"1D" | "1W" | "1M">("1M");
  const [chartPoints, setChartPoints] = useState<ChartPoint[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Fetch initial stock list
  const loadInitialMarkets = async () => {
    setLoadingMarkets(true);
    try {
      const res = await getMarkets();
      if (res.isRateLimited && res.quotes.length === 0) {
        setRateLimited(true);
      } else {
        setQuotes(res.quotes);
        setRateLimited(res.isRateLimited ?? false);
      }
    } catch {
      setRateLimited(true);
    } finally {
      setLoadingMarkets(false);
    }
  };

  useEffect(() => {
    loadInitialMarkets();
  }, []);

  // Fetch featured stock quote
  useEffect(() => {
    let isMounted = true;
    const fetchQuote = async () => {
      setLoadingFeatured(true);
      // Check if we already have it in quotes list
      const existing = quotes.find((q) => q.symbol === featuredSymbol);
      if (existing) {
        setFeaturedQuote(existing);
        setLoadingFeatured(false);
        return;
      }

      try {
        const res = await getStockQuote({ data: { symbol: featuredSymbol } });
        if (isMounted) {
          if (res.quote) {
            setFeaturedQuote(res.quote);
          } else if (res.isRateLimited) {
            setRateLimited(true);
          }
        }
      } catch {
        if (isMounted) {
          setRateLimited(true);
        }
      } finally {
        if (isMounted) setLoadingFeatured(false);
      }
    };

    fetchQuote();
    return () => {
      isMounted = false;
    };
  }, [featuredSymbol, quotes]);

  // Fetch featured stock history chart
  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      setLoadingChart(true);
      try {
        const res = await getStockHistory({
          data: { symbol: featuredSymbol, timeframe: featuredTimeframe },
        });
        if (isMounted) {
          if (res.points && res.points.length > 0) {
            setChartPoints(res.points);
          } else {
            setChartPoints([]);
            if (res.isRateLimited) setRateLimited(true);
          }
        }
      } catch {
        if (isMounted) {
          setChartPoints([]);
        }
      } finally {
        if (isMounted) setLoadingChart(false);
      }
    };

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [featuredSymbol, featuredTimeframe]);

  // Handle Search Input Debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchStocks({ data: { query: searchQuery } });
        setSearchResults(res.results || []);
        if (res.isRateLimited) setRateLimited(true);
        setSearchOpen(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSearchResult = (result: StockSearchResult) => {
    setFeaturedSymbol(result.symbol);
    setSearchQuery("");
    setSearchOpen(false);
  };

  const isPositive = (featuredQuote?.change ?? 0) >= 0;

  return (
    <section className="space-y-6 pt-4 border-t border-border/50">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Markets</h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Track global markets</p>
        </div>

        {/* Search Box */}
        <div ref={searchContainerRef} className="relative w-full sm:w-72">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search stocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setSearchOpen(true);
              }}
              className="pl-9 pr-8 h-10 rounded-2xl text-xs bg-card/80 border-border/60 focus:border-primary"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Search Dropdown */}
          {searchOpen && (
            <div className="absolute z-30 mt-1.5 w-full rounded-2xl border border-border/80 bg-popover/95 p-1.5 shadow-xl backdrop-blur-md max-h-60 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="p-3 text-center text-xs text-muted-foreground">
                  No matches found
                </div>
              ) : (
                searchResults.map((item) => (
                  <button
                    key={item.symbol}
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-accent flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="font-semibold text-foreground block truncate">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {item.symbol} • {item.region}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground">
                      {item.currency || "USD"}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rate Limit Alert */}
      {rateLimited && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-center gap-2.5 text-xs text-amber-700 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Market data temporarily unavailable — rate limit reached.</span>
        </div>
      )}

      {/* Horizontal Scroll Stock Cards */}
      <div className="relative">
        {loadingMarkets ? (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-1 px-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-44 shrink-0 rounded-2xl snap-start" />
            ))}
          </div>
        ) : quotes.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground rounded-2xl border border-dashed border-border/60">
            Market data temporarily unavailable
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-1 px-1">
            {quotes.map((stock) => {
              const stockPos = stock.change >= 0;
              const isSelected = stock.symbol === featuredSymbol;
              return (
                <button
                  key={stock.symbol}
                  onClick={() => setFeaturedSymbol(stock.symbol)}
                  className={`group text-left h-28 w-44 shrink-0 p-3.5 rounded-2xl border transition-all duration-200 snap-start flex flex-col justify-between cursor-pointer touch-manipulation ${
                    isSelected
                      ? "border-primary/80 bg-accent/60 shadow-md ring-1 ring-primary/40"
                      : "border-border/60 bg-card/80 hover:border-border hover:bg-accent/30 shadow-2xs"
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="truncate pr-1">
                      <span className="font-semibold text-xs text-foreground block truncate">
                        {stock.name}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {stock.ticker}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        stockPos
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-red-500/15 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {stockPos ? "+" : ""}
                      {stock.changePercent.toFixed(2)}%
                    </span>
                  </div>

                  <div className="flex items-end justify-between mt-2">
                    <div>
                      <span className="text-sm font-bold text-foreground tabular font-mono">
                        ${stock.price.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        {stockPos ? "+" : ""}
                        {stock.change.toFixed(2)}
                      </span>
                    </div>

                    {/* Mini Sparkline Chart */}
                    {stock.sparkline && stock.sparkline.length > 0 && (
                      <div className="h-7 w-12 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={stock.sparkline.map((v, idx) => ({ idx, v }))}>
                            <defs>
                              <linearGradient
                                id={`grad-${stock.symbol}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="0%"
                                  stopColor={stockPos ? "#10b981" : "#ef4444"}
                                  stopOpacity={0.4}
                                />
                                <stop
                                  offset="100%"
                                  stopColor={stockPos ? "#10b981" : "#ef4444"}
                                  stopOpacity={0.0}
                                />
                              </linearGradient>
                            </defs>
                            <Area
                              type="monotone"
                              dataKey="v"
                              stroke={stockPos ? "#10b981" : "#ef4444"}
                              strokeWidth={1.5}
                              fill={`url(#grad-${stock.symbol})`}
                              isAnimationActive={false}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Large Featured Stock Panel */}
      <div className="rounded-3xl border border-border/70 bg-card/90 p-5 sm:p-7 shadow-soft space-y-6 backdrop-blur-xl">
        {loadingFeatured && !featuredQuote ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-48 rounded-xl" />
            <Skeleton className="h-12 w-36 rounded-xl" />
            <Skeleton className="h-60 w-full rounded-2xl" />
          </div>
        ) : !featuredQuote ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Market data temporarily unavailable
          </div>
        ) : (
          <>
            {/* Featured Stock Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold tracking-tight text-foreground">
                    {featuredQuote.name}
                  </span>
                  <span className="font-mono text-xs font-semibold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full border border-border/40">
                    {featuredQuote.ticker}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    Last updated:{" "}
                    {featuredQuote.latestTradingDay || new Date().toISOString().split("T")[0]}
                  </span>
                </div>
              </div>

              {/* Price & Change Banner */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-extrabold text-foreground tabular font-mono">
                  ${featuredQuote.price.toFixed(2)}
                </span>
                <div
                  className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl ${
                    isPositive
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-red-500/15 text-red-600 dark:text-red-400"
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {isPositive ? "+" : ""}
                    {featuredQuote.change.toFixed(2)} ({isPositive ? "+" : ""}
                    {featuredQuote.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Timeframe Selectors & Chart */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Performance Chart
                </span>

                {/* 1D, 1W, 1M buttons */}
                <div className="inline-flex p-1 rounded-xl bg-secondary/80 border border-border/50">
                  {(["1D", "1W", "1M"] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setFeaturedTimeframe(tf)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer min-h-[32px] ${
                        featuredTimeframe === tf
                          ? "bg-background text-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Recharts Area */}
              <div className="h-64 sm:h-72 w-full pt-2">
                {loadingChart ? (
                  <Skeleton className="h-full w-full rounded-2xl" />
                ) : chartPoints.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    Historical chart data temporarily unavailable
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartPoints}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="featuredGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor={isPositive ? "#10b981" : "#ef4444"}
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="100%"
                            stopColor={isPositive ? "#10b981" : "#ef4444"}
                            stopOpacity={0.0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                        tickFormatter={(v) => v.slice(5) || v}
                      />
                      <YAxis
                        domain={["auto", "auto"]}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                        tickFormatter={(v) => `$${v.toFixed(0)}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-popover)",
                          borderColor: "var(--color-border)",
                          borderRadius: "1rem",
                          fontSize: "12px",
                          fontWeight: "600",
                          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                        }}
                        formatter={(val: number) => [`$${val.toFixed(2)}`, "Price"]}
                        labelFormatter={(lbl) => `Date: ${lbl}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke={isPositive ? "#10b981" : "#ef4444"}
                        strokeWidth={2.5}
                        fill="url(#featuredGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-[11px] text-center text-muted-foreground font-medium pt-1">
        Market data is for informational purposes only and may be delayed.
      </p>
    </section>
  );
}
