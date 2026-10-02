import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDownRight, ArrowUpRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMarkets } from "@/lib/markets.functions";

export function MarketIndices() {
  const fetchMarkets = useServerFn(getMarkets);
  const { data, isPending, isFetching, refetch } = useQuery({
    queryKey: ["market-indices"],
    queryFn: () => fetchMarkets(),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  return (
    <section aria-labelledby="markets-heading" className="space-y-4 border-t border-border/50 pt-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h2 id="markets-heading" className="text-xl font-semibold text-foreground">
            Global markets
          </h2>
          <p className="text-xs text-muted-foreground">Europe · United States · India</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Refresh markets"
          title="Refresh markets"
          disabled={isFetching}
          onClick={() => refetch()}
        >
          <RefreshCw className={isFetching ? "animate-spin motion-reduce:animate-none" : ""} />
        </Button>
      </div>
      {data?.quotes.length ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {data.quotes.map((quote) => {
            const up = quote.change >= 0;
            return (
              <div
                key={quote.symbol}
                className="min-w-0 rounded-md border border-border/60 bg-card p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">{quote.region}</p>
                    <h3 className="truncate text-sm font-semibold text-foreground">{quote.name}</h3>
                  </div>
                  <span
                    className={`flex shrink-0 items-center gap-0.5 text-xs font-medium ${up ? "text-success" : "text-destructive"}`}
                  >
                    {up ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    {Math.abs(quote.changePercent).toFixed(2)}%
                  </span>
                </div>
                <p className="mt-4 text-2xl font-semibold tabular-nums text-foreground">
                  {new Intl.NumberFormat("en-US", {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  }).format(quote.price)}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {quote.currency}
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {up ? "+" : "−"}
                  {Math.abs(quote.change).toFixed(2)} ·{" "}
                  {quote.asOf
                    ? `As of ${new Date(quote.asOf * 1000).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`
                    : "Latest available"}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <p role="status" className="border-y border-border/50 py-6 text-sm text-muted-foreground">
          {isPending ? "Loading market indices…" : "Market quotes are temporarily unavailable."}
        </p>
      )}
      <p className="text-[11px] text-muted-foreground">
        Source: Yahoo Finance · Quotes may be delayed. Updated when available, including after
        market close.
      </p>
    </section>
  );
}
