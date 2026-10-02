import { createServerFn } from "@tanstack/react-start";

const ALPHA_VANTAGE_API_KEY = "C4998GP4UBORCGPX";
const BASE_URL = "https://www.alphavantage.co/query";

export type StockQuote = {
  symbol: string;
  name: string;
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  latestTradingDay: string;
  sparkline: number[];
  currency?: string;
  isRateLimited?: boolean;
};

export type ChartPoint = {
  date: string;
  price: number;
};

export type StockChartData = {
  symbol: string;
  timeframe: "1D" | "1W" | "1M";
  points: ChartPoint[];
  isRateLimited?: boolean;
};

export type StockSearchResult = {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
};

export const INITIAL_STOCKS = [
  { symbol: "AAPL", name: "Apple", ticker: "AAPL" },
  { symbol: "MSFT", name: "Microsoft", ticker: "MSFT" },
  { symbol: "NVDA", name: "NVIDIA", ticker: "NVDA" },
  { symbol: "TSLA", name: "Tesla", ticker: "TSLA" },
  { symbol: "AMZN", name: "Amazon", ticker: "AMZN" },
  { symbol: "GOOGL", name: "Alphabet", ticker: "GOOGL" },
  { symbol: "RELIANCE.BSE", name: "Reliance Industries", ticker: "RELIANCE.BSE" },
  { symbol: "TCS.BSE", name: "Tata Consultancy Services", ticker: "TCS.BSE" },
] as const;

// In-memory cache
const quoteCache = new Map<string, { quote: StockQuote; fetchedAt: number }>();
const historyCache = new Map<string, { timeSeries: ChartPoint[]; fetchedAt: number }>();
let defaultMarketsCache: { quotes: StockQuote[]; fetchedAt: number; rateLimited: boolean } | null =
  null;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function fetchGlobalQuote(
  symbol: string,
  defaultName?: string,
): Promise<{ quote: StockQuote | null; rateLimited: boolean }> {
  try {
    const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return { quote: null, rateLimited: false };

    const data = await res.json();
    if (data.Information || data.Note || data["Error Message"]) {
      return { quote: null, rateLimited: true };
    }

    const gq = data["Global Quote"];
    if (!gq || !gq["05. price"]) {
      return { quote: null, rateLimited: false };
    }

    const price = parseFloat(gq["05. price"]);
    const change = parseFloat(gq["09. change"]);
    const changePercentStr = (gq["10. change percent"] || "0%").replace("%", "");
    const changePercent = parseFloat(changePercentStr);
    const previousClose = parseFloat(gq["08. previous close"]) || price - change;
    const latestTradingDay = gq["07. latest trading day"] || new Date().toISOString().split("T")[0];

    const stockMeta = INITIAL_STOCKS.find((s) => s.symbol === symbol);
    const name = stockMeta?.name || defaultName || symbol;

    const quote: StockQuote = {
      symbol,
      name,
      ticker: symbol,
      price,
      change,
      changePercent,
      previousClose,
      latestTradingDay,
      sparkline: [previousClose, price],
    };

    return { quote, rateLimited: false };
  } catch {
    return { quote: null, rateLimited: false };
  }
}

async function fetchDailyTimeSeries(
  symbol: string,
): Promise<{ points: ChartPoint[]; rateLimited: boolean }> {
  const cached = historyCache.get(symbol);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { points: cached.timeSeries, rateLimited: false };
  }

  try {
    const url = `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(symbol)}&outputsize=compact&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return { points: [], rateLimited: false };

    const data = await res.json();
    if (data.Information || data.Note || data["Error Message"]) {
      return { points: cached ? cached.timeSeries : [], rateLimited: true };
    }

    const timeSeriesObj = data["Time Series (Daily)"];
    if (!timeSeriesObj) {
      return { points: cached ? cached.timeSeries : [], rateLimited: false };
    }

    const dates = Object.keys(timeSeriesObj).sort(); // ascending date order
    const points: ChartPoint[] = dates.map((date) => ({
      date,
      price: parseFloat(timeSeriesObj[date]["4. close"]),
    }));

    historyCache.set(symbol, { timeSeries: points, fetchedAt: Date.now() });
    return { points, rateLimited: false };
  } catch {
    return { points: cached ? cached.timeSeries : [], rateLimited: false };
  }
}

export const getMarkets = createServerFn({ method: "GET" }).handler(async () => {
  if (defaultMarketsCache && Date.now() - defaultMarketsCache.fetchedAt < CACHE_TTL_MS) {
    return {
      quotes: defaultMarketsCache.quotes,
      fetchedAt: defaultMarketsCache.fetchedAt,
      isRateLimited: defaultMarketsCache.rateLimited,
    };
  }

  let rateLimited = false;
  const quotes: StockQuote[] = [];

  for (const item of INITIAL_STOCKS) {
    const cachedItem = quoteCache.get(item.symbol);
    if (cachedItem && Date.now() - cachedItem.fetchedAt < CACHE_TTL_MS) {
      quotes.push(cachedItem.quote);
      continue;
    }

    const { quote, rateLimited: rl } = await fetchGlobalQuote(item.symbol, item.name);
    if (rl) {
      rateLimited = true;
    }

    if (quote) {
      // Get sparkline from daily series if possible
      const { points } = await fetchDailyTimeSeries(item.symbol);
      if (points.length >= 7) {
        quote.sparkline = points.slice(-7).map((p) => p.price);
      }
      quoteCache.set(item.symbol, { quote, fetchedAt: Date.now() });
      quotes.push(quote);
    } else if (cachedItem) {
      quotes.push(cachedItem.quote);
    }
  }

  if (quotes.length > 0) {
    defaultMarketsCache = { quotes, fetchedAt: Date.now(), rateLimited };
  }

  return {
    quotes: quotes.length > 0 ? quotes : defaultMarketsCache?.quotes || [],
    fetchedAt: Date.now(),
    isRateLimited: rateLimited && quotes.length === 0,
  };
});

export const getStockQuote = createServerFn({ method: "POST" })
  .validator((d: { symbol: string; name?: string }) => d)
  .handler(async ({ data }) => {
    const cached = quoteCache.get(data.symbol);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return { quote: cached.quote, isRateLimited: false };
    }

    const { quote, rateLimited } = await fetchGlobalQuote(data.symbol, data.name);
    if (quote) {
      const { points } = await fetchDailyTimeSeries(data.symbol);
      if (points.length >= 7) {
        quote.sparkline = points.slice(-7).map((p) => p.price);
      }
      quoteCache.set(data.symbol, { quote, fetchedAt: Date.now() });
      return { quote, isRateLimited: false };
    }

    if (cached) {
      return { quote: cached.quote, isRateLimited: rateLimited };
    }

    return { quote: null, isRateLimited: rateLimited };
  });

export const getStockHistory = createServerFn({ method: "POST" })
  .validator((d: { symbol: string; timeframe: "1D" | "1W" | "1M" }) => d)
  .handler(async ({ data }) => {
    const { points, rateLimited } = await fetchDailyTimeSeries(data.symbol);

    let filtered: ChartPoint[] = points;
    if (data.timeframe === "1D") {
      // 1D fallback: last 2-3 points or intra-day approximation
      filtered = points.slice(-5);
    } else if (data.timeframe === "1W") {
      filtered = points.slice(-7);
    } else if (data.timeframe === "1M") {
      filtered = points.slice(-30);
    }

    return {
      symbol: data.symbol,
      timeframe: data.timeframe,
      points: filtered,
      isRateLimited: rateLimited,
    };
  });

export const searchStocks = createServerFn({ method: "POST" })
  .validator((d: { query: string }) => d)
  .handler(async ({ data }) => {
    if (!data.query || data.query.trim().length < 1) {
      return { results: [], isRateLimited: false };
    }

    try {
      const url = `${BASE_URL}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(data.query.trim())}&apikey=${ALPHA_VANTAGE_API_KEY}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return { results: [], isRateLimited: false };

      const json = await res.json();
      if (json.Information || json.Note || json["Error Message"]) {
        return { results: [], isRateLimited: true };
      }

      const matches = json.bestMatches || [];
      const results: StockSearchResult[] = matches.map((m: Record<string, string>) => ({
        symbol: m["1. symbol"],
        name: m["2. name"],
        type: m["3. type"],
        region: m["4. region"],
        currency: m["8. currency"],
      }));

      return { results, isRateLimited: false };
    } catch {
      return { results: [], isRateLimited: false };
    }
  });
