import { createServerFn } from "@tanstack/react-start";

const INDICES = [
  { symbol: "^STOXX50E", name: "EURO STOXX 50", region: "Europe" },
  { symbol: "^GSPC", name: "S&P 500", region: "United States" },
  { symbol: "^NSEI", name: "NIFTY 50", region: "India" },
] as const;

export type MarketQuote = {
  symbol: string;
  name: string;
  region: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  asOf: number;
};

let cached: { quotes: MarketQuote[]; fetchedAt: number } | undefined;
let pending: Promise<{ quotes: MarketQuote[]; fetchedAt: number }> | undefined;
const CACHE_MS = 5 * 60 * 1000;

async function loadMarkets() {
  const settled = await Promise.allSettled(
    INDICES.map(async (index): Promise<MarketQuote> => {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(index.symbol)}?interval=1d&range=5d`;
      const response = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "MoonlightWallet/1.0" },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error(`Market feed returned ${response.status}`);
      const json = (await response.json()) as {
        chart?: {
          result?: Array<{
            meta?: {
              regularMarketPrice?: number;
              chartPreviousClose?: number;
              previousClose?: number;
              regularMarketTime?: number;
              currency?: string;
            };
            indicators?: { quote?: Array<{ close?: Array<number | null> }> };
          }>;
        };
      };
      const result = json.chart?.result?.[0];
      const meta = result?.meta;
      const close = result?.indicators?.quote?.[0]?.close?.filter(
        (value): value is number => typeof value === "number" && Number.isFinite(value),
      ) ?? [];
      const price = meta?.regularMarketPrice ?? close.at(-1);
      const previous = meta?.previousClose ?? meta?.chartPreviousClose ?? close.at(-2);
      if (!price || !previous || !Number.isFinite(price) || !Number.isFinite(previous)) {
        throw new Error("Market quote missing price or previous close");
      }
      return {
        ...index,
        currency: meta?.currency ?? "",
        price,
        change: price - previous,
        changePercent: ((price - previous) / previous) * 100,
        asOf: meta?.regularMarketTime ?? 0,
      };
    }),
  );
  const quotes = settled.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
  if (quotes.length === 0) throw new Error("Market quotes unavailable");
  cached = { quotes, fetchedAt: Date.now() };
  return cached;
}

export const getMarkets = createServerFn({ method: "GET" }).handler(async () => {
  if (cached && Date.now() - cached.fetchedAt < CACHE_MS) return cached;
  pending ??= loadMarkets().finally(() => { pending = undefined; });
  try {
    return await pending;
  } catch {
    if (cached) return cached;
    return { quotes: [], fetchedAt: 0 };
  }
});