import { createServerFn } from "@tanstack/react-start";
import { BASELINE_MARKETS } from "./markets.baseline";
import type { MarketInstrument, MarketSnapshot } from "./markets.types";

const DAY_MS = 24 * 60 * 60 * 1000; // 24 hours daily update
const MIN_RETRY_INTERVAL_MS = 10 * 60 * 1000; // 10 min throttle on network failure

const INSTRUMENTS_DEF = [
  {
    symbol: "^STOXX50E",
    name: "EURO STOXX 50",
    region: "Europe",
    type: "index",
    category: "Eurozone Benchmark",
    exchange: "STOXX",
    currencySymbol: "€",
  },
  {
    symbol: "^GSPC",
    name: "S&P 500",
    region: "United States",
    type: "index",
    category: "US Large Cap",
    exchange: "S&P",
    currencySymbol: "$",
  },
  {
    symbol: "^NSEI",
    name: "NIFTY 50",
    region: "India",
    type: "index",
    category: "India Benchmark",
    exchange: "NSE",
    currencySymbol: "₹",
  },
  {
    symbol: "^GDAXI",
    name: "DAX 40",
    region: "Germany",
    type: "index",
    category: "German Benchmark",
    exchange: "XETRA",
    currencySymbol: "€",
  },
  {
    symbol: "^FTSE",
    name: "FTSE 100",
    region: "United Kingdom",
    type: "index",
    category: "UK Benchmark",
    exchange: "LSE",
    currencySymbol: "£",
  },
  {
    symbol: "ASML",
    name: "ASML Holding",
    region: "Europe",
    type: "stock",
    category: "Semiconductors",
    exchange: "NASDAQ",
    currencySymbol: "$",
  },
  {
    symbol: "SAP",
    name: "SAP SE",
    region: "Germany",
    type: "stock",
    category: "Enterprise Software",
    exchange: "NYSE",
    currencySymbol: "$",
  },
  {
    symbol: "MC.PA",
    name: "LVMH Moët Hennessy",
    region: "Europe",
    type: "stock",
    category: "Luxury Goods",
    exchange: "Euronext",
    currencySymbol: "€",
  },
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    region: "United States",
    type: "stock",
    category: "Consumer Tech",
    exchange: "NASDAQ",
    currencySymbol: "$",
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corp.",
    region: "United States",
    type: "stock",
    category: "Cloud & AI",
    exchange: "NASDAQ",
    currencySymbol: "$",
  },
  {
    symbol: "RELIANCE.NS",
    name: "Reliance Industries",
    region: "India",
    type: "stock",
    category: "Energy & Telecom",
    exchange: "NSE",
    currencySymbol: "₹",
  },
  {
    symbol: "INFY.NS",
    name: "Infosys",
    region: "India",
    type: "stock",
    category: "Digital Services",
    exchange: "NSE",
    currencySymbol: "₹",
  },
] as const;

// In-memory cache for fast sub-millisecond retrieval
let memoryCache: MarketSnapshot = { ...BASELINE_MARKETS };
let pendingFetch: Promise<MarketSnapshot> | undefined;
let lastAttemptTimestamp = 0;

async function fetchInstrumentData(
  def: (typeof INSTRUMENTS_DEF)[number],
  existing?: MarketInstrument,
): Promise<MarketInstrument> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(def.symbol)}?interval=1d&range=1y`;
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(9000),
  });

  if (!response.ok) {
    throw new Error(`Feed returned status ${response.status}`);
  }

  const json = (await response.json()) as {
    chart?: {
      result?: Array<{
        meta?: {
          regularMarketPrice?: number;
          chartPreviousClose?: number;
          previousClose?: number;
          regularMarketChange?: number;
          regularMarketChangePercent?: number;
          regularMarketDayHigh?: number;
          regularMarketDayLow?: number;
          fiftyTwoWeekHigh?: number;
          fiftyTwoWeekLow?: number;
          regularMarketVolume?: number;
          regularMarketTime?: number;
          currency?: string;
        };
        timestamp?: number[];
        indicators?: { quote?: Array<{ close?: Array<number | null> }> };
      }>;
    };
  };

  const result = json.chart?.result?.[0];
  const meta = result?.meta;
  const timestamps = result?.timestamp ?? [];
  const quotes = result?.indicators?.quote?.[0]?.close ?? [];

  const allPoints: Array<{ date: string; close: number }> = [];
  for (let i = 0; i < timestamps.length; i++) {
    const rawVal = quotes[i];
    const ts = timestamps[i];
    if (typeof rawVal === "number" && Number.isFinite(rawVal) && typeof ts === "number") {
      allPoints.push({
        date: new Date(ts * 1000).toISOString().split("T")[0] as string,
        close: Math.round(rawVal * 100) / 100,
      });
    }
  }

  // Fallback to existing history if new points are empty
  const historyPoints = allPoints.length >= 5 ? allPoints : (existing?.history["1Y"] ?? []);
  const price = meta?.regularMarketPrice ?? historyPoints.at(-1)?.close ?? existing?.price ?? 0;
  const prevTradingDayClose =
    historyPoints.length >= 2 ? (historyPoints.at(-2)?.close ?? price) : price;
  const previousClose = meta?.previousClose ?? prevTradingDayClose;
  const rawChange = meta?.regularMarketChange ?? price - previousClose;
  const rawChangePercent =
    meta?.regularMarketChangePercent ??
    (previousClose > 0 ? ((price - previousClose) / previousClose) * 100 : 0);

  return {
    symbol: def.symbol,
    name: def.name,
    region: def.region,
    type: def.type,
    category: def.category,
    exchange: def.exchange,
    currencySymbol: def.currencySymbol,
    currency: meta?.currency ?? existing?.currency ?? "USD",
    price,
    previousClose,
    change: Math.round(rawChange * 100) / 100,
    changePercent: Math.round(rawChangePercent * 100) / 100,
    dayHigh: meta?.regularMarketDayHigh ?? existing?.dayHigh ?? price,
    dayLow: meta?.regularMarketDayLow ?? existing?.dayLow ?? price,
    fiftyTwoWeekHigh: meta?.fiftyTwoWeekHigh ?? existing?.fiftyTwoWeekHigh ?? price,
    fiftyTwoWeekLow: meta?.fiftyTwoWeekLow ?? existing?.fiftyTwoWeekLow ?? price,
    volume: meta?.regularMarketVolume ?? existing?.volume ?? 0,
    asOf: meta?.regularMarketTime ?? Math.floor(Date.now() / 1000),
    marketState: "REGULAR",
    history: {
      "1W": historyPoints.slice(-5),
      "1M": historyPoints.slice(-22),
      "6M": historyPoints.slice(-126),
      "1Y": historyPoints,
    },
  };
}

async function refreshMarketData(): Promise<MarketSnapshot> {
  lastAttemptTimestamp = Date.now();
  const existingMap = new Map(memoryCache.instruments.map((item) => [item.symbol, item]));

  const settled = await Promise.allSettled(
    INSTRUMENTS_DEF.map((def) => fetchInstrumentData(def, existingMap.get(def.symbol))),
  );

  let successCount = 0;
  const updatedInstruments: MarketInstrument[] = [];

  for (let i = 0; i < INSTRUMENTS_DEF.length; i++) {
    const res = settled[i];
    const def = INSTRUMENTS_DEF[i]!;
    if (res && res.status === "fulfilled") {
      updatedInstruments.push(res.value);
      successCount++;
    } else {
      // Graceful fallback for single instrument failure
      const existing =
        existingMap.get(def.symbol) ??
        BASELINE_MARKETS.instruments.find((b) => b.symbol === def.symbol)!;
      updatedInstruments.push(existing);
    }
  }

  const now = Date.now();
  const isFresh = successCount >= 6; // Majority succeeded

  memoryCache = {
    instruments: updatedInstruments,
    fetchedAt: isFresh ? now : memoryCache.fetchedAt,
    status: isFresh ? "live" : "cached",
    source: isFresh ? "Global Market Intelligence Feed" : "Moonlight Daily Archive (ECB/Global)",
    nextUpdateEstimate: "Daily at 22:00 UTC",
  };

  return memoryCache;
}

export const getMarkets = createServerFn({ method: "GET" })
  .validator((d: { force?: boolean } | undefined) => d)
  .handler(async ({ data }) => {
    const force = Boolean(data?.force);
    const age = Date.now() - memoryCache.fetchedAt;
    const sinceLastAttempt = Date.now() - lastAttemptTimestamp;

    // If within daily refresh cycle and not forced, return cached snapshot immediately
    if (!force && age < DAY_MS) {
      return memoryCache;
    }

    // If recently attempted and failed, protect external API from hammering
    if (force && sinceLastAttempt < MIN_RETRY_INTERVAL_MS && age < DAY_MS) {
      return memoryCache;
    }

    // Deduplicate in-flight promises
    pendingFetch ??= refreshMarketData().finally(() => {
      pendingFetch = undefined;
    });

    try {
      return await pendingFetch;
    } catch (err) {
      console.warn("Markets refresh encountered an error; falling back to cached snapshot:", err);
      return memoryCache;
    }
  });
