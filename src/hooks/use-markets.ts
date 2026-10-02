import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getMarkets } from "@/lib/markets.functions";
import { BASELINE_MARKETS } from "@/lib/markets.baseline";
import type { MarketFilter, MarketInstrument, MarketSnapshot } from "@/lib/markets.types";

export function useMarkets() {
  const fetchMarkets = useServerFn(getMarkets);
  const queryClient = useQueryClient();

  const query = useQuery<MarketSnapshot>({
    queryKey: ["market-snapshot"],
    queryFn: async () => {
      const data = await fetchMarkets({ data: { force: false } });
      return data ?? BASELINE_MARKETS;
    },
    // Keep data fresh on client for 1 hour to prevent unnecessary network calls
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    // Strictly disable window focus and interval polling per prompt requirements
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    initialData: BASELINE_MARKETS,
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const updated = await fetchMarkets({ data: { force: true } });
      return updated ?? BASELINE_MARKETS;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["market-snapshot"], data);
      if (data.status === "live") {
        toast.success("Market quotes refreshed successfully");
      } else {
        toast.info("Displaying latest verified daily market close snapshot");
      }
    },
    onError: (err) => {
      console.warn("Manual market refresh error:", err);
      toast.info("Using latest verified snapshot");
    },
  });

  const data = query.data ?? BASELINE_MARKETS;
  const instruments = data.instruments ?? [];

  const filterInstruments = (filter: MarketFilter, searchQuery: string): MarketInstrument[] => {
    let result = instruments;

    switch (filter) {
      case "indices":
        result = result.filter((i) => i.type === "index");
        break;
      case "stocks":
        result = result.filter((i) => i.type === "stock");
        break;
      case "europe":
        result = result.filter(
          (i) => i.region === "Europe" || i.region === "Germany" || i.region === "United Kingdom",
        );
        break;
      case "us":
        result = result.filter((i) => i.region === "United States");
        break;
      case "india":
        result = result.filter((i) => i.region === "India");
        break;
      case "all":
      default:
        break;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.symbol.toLowerCase().includes(q) ||
          i.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.exchange.toLowerCase().includes(q) ||
          i.region.toLowerCase().includes(q),
      );
    }

    return result;
  };

  return {
    snapshot: data,
    instruments,
    indices: data.indices ?? [],
    isLoading: query.isLoading,
    isRefreshing: refreshMutation.isPending || query.isFetching,
    refetch: () => refreshMutation.mutate(),
    filterInstruments,
    status: data.status,
    fetchedAt: data.fetchedAt,
    source: data.source,
  };
}
