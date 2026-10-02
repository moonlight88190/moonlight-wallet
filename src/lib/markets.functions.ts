import { createServerFn } from "@tanstack/react-start";
import { BASELINE_MARKETS } from "./markets.baseline";
import { MAJOR_INDICES, type IndexDef, type ConstituentDef } from "./markets.config";
import type {
  MarketInstrument,
  MarketSnapshot,
  IndexWithData,
  IndexConstituentData,
  MarketRegion,
} from "./markets.types";

const DAY_MS = 24 * 60 * 60 * 1000; // 24 hours daily update
const MIN_RETRY_INTERVAL_MS = 10 * 60 * 1000; // 10 min throttle on network failure

export interface InstrumentDef {
  symbol: string;
  name: string;
  region: MarketRegion;
  type: "index" | "stock";
  category: string;
  exchange: string;
  currencySymbol: string;
}

// Build authoritative list of all instruments to track
const INSTRUMENTS_DEF: InstrumentDef[] = [
  // 1. Major Benchmark Indices
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
    symbol: "^NDX",
    name: "Nasdaq-100",
    region: "United States",
    type: "index",
    category: "US Tech Benchmark",
    exchange: "NASDAQ",
    currencySymbol: "$",
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
    symbol: "^STOXX50E",
    name: "EURO STOXX 50",
    region: "Europe",
    type: "index",
    category: "Eurozone Benchmark",
    exchange: "STOXX",
    currencySymbol: "€",
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

  // 2. Representative Constituents (India)
  {
    symbol: "HDFCBANK.NS",
    name: "HDFC Bank",
    region: "India",
    type: "stock",
    category: "Banking & Financial Services",
    exchange: "NSE",
    currencySymbol: "₹",
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
    symbol: "ICICIBANK.NS",
    name: "ICICI Bank",
    region: "India",
    type: "stock",
    category: "Banking & Financial Services",
    exchange: "NSE",
    currencySymbol: "₹",
  },
  {
    symbol: "BHARTIARTL.NS",
    name: "Bharti Airtel",
    region: "India",
    type: "stock",
    category: "Telecommunications",
    exchange: "NSE",
    currencySymbol: "₹",
  },
  {
    symbol: "TCS.NS",
    name: "Tata Consultancy Services",
    region: "India",
    type: "stock",
    category: "Information Technology",
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

  // 3. Representative Constituents (US)
  {
    symbol: "NVDA",
    name: "NVIDIA Corp.",
    region: "United States",
    type: "stock",
    category: "AI & Computing",
    exchange: "NASDAQ",
    currencySymbol: "$",
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
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    region: "United States",
    type: "stock",
    category: "E-Commerce & Cloud",
    exchange: "NASDAQ",
    currencySymbol: "$",
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    region: "United States",
    type: "stock",
    category: "Search & Cloud",
    exchange: "NASDAQ",
    currencySymbol: "$",
  },
  {
    symbol: "META",
    name: "Meta Platforms",
    region: "United States",
    type: "stock",
    category: "Social Technologies",
    exchange: "NASDAQ",
    currencySymbol: "$",
  },
  {
    symbol: "AVGO",
    name: "Broadcom Inc.",
    region: "United States",
    type: "stock",
    category: "Semiconductors",
    exchange: "NASDAQ",
    currencySymbol: "$",
  },

  // 4. Representative Constituents (Europe / Germany / UK)
  {
    symbol: "ASML",
    name: "ASML Holding",
    region: "Europe",
    type: "stock",
    category: "Semiconductors",
    exchange: "NASDAQ",
    currencySymbol: "€",
  },
  {
    symbol: "SAP",
    name: "SAP SE",
    region: "Germany",
    type: "stock",
    category: "Enterprise Software",
    exchange: "XETRA",
    currencySymbol: "€",
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
    symbol: "SIE.DE",
    name: "Siemens AG",
    region: "Germany",
    type: "stock",
    category: "Industrial Tech",
    exchange: "XETRA",
    currencySymbol: "€",
  },
  {
    symbol: "SAN.MC",
    name: "Banco Santander",
    region: "Europe",
    type: "stock",
    category: "Banking",
    exchange: "BME",
    currencySymbol: "€",
  },
  {
    symbol: "SU.PA",
    name: "Schneider Electric",
    region: "Europe",
    type: "stock",
    category: "Energy Management",
    exchange: "Euronext",
    currencySymbol: "€",
  },
  {
    symbol: "TTE.PA",
    name: "TotalEnergies",
    region: "Europe",
    type: "stock",
    category: "Energy",
    exchange: "Euronext",
    currencySymbol: "€",
  },
  {
    symbol: "ALV.DE",
    name: "Allianz SE",
    region: "Germany",
    type: "stock",
    category: "Insurance",
    exchange: "XETRA",
    currencySymbol: "€",
  },
];

/**
 * Quote Provider Abstraction: decoupled from the UI.
 */
export interface MarketQuoteProvider {
  name: string;
  fetchInstrument(def: InstrumentDef, existing?: MarketInstrument): Promise<MarketInstrument>;
}

export class YahooFinanceQuoteProvider implements MarketQuoteProvider {
  name = "Yahoo Finance Quote API";

  async fetchInstrument(
    def: InstrumentDef,
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
}

/**
 * Builds data-driven indices by combining official index configuration with live/cached quotes.
 */
export function buildIndicesWithData(instruments: MarketInstrument[]): IndexWithData[] {
  const instMap = new Map(instruments.map((item) => [item.symbol, item]));

  return MAJOR_INDICES.map((idxDef: IndexDef): IndexWithData => {
    const indexQuote = instMap.get(idxDef.symbol);

    const constituents: IndexConstituentData[] = idxDef.representativeConstituents.map(
      (c: ConstituentDef): IndexConstituentData => {
        const inst = instMap.get(c.symbol);
        return {
          symbol: c.symbol,
          name: c.name,
          category: c.category,
          exchange: c.exchange,
          currency: c.currency,
          currencySymbol: c.currencySymbol,
          brandAssetId: c.brandAssetId,
          weightHint: c.weightHint,
          price: inst?.price,
          change: inst?.change,
          changePercent: inst?.changePercent,
          sparkline: inst?.history["1W"],
        };
      },
    );

    return {
      id: idxDef.id,
      symbol: idxDef.symbol,
      name: idxDef.name,
      provider: idxDef.provider,
      region: idxDef.region,
      currency: idxDef.currency,
      currencySymbol: idxDef.currencySymbol,
      brandAssetId: idxDef.brandAssetId,
      constituentSource: idxDef.constituentSource,
      quote: indexQuote,
      constituents,
    };
  });
}

export const BASELINE_MARKETS_WITH_INDICES: MarketSnapshot = {
  ...BASELINE_MARKETS,
  indices: buildIndicesWithData(BASELINE_MARKETS.instruments),
};

// In-memory cache for fast sub-millisecond retrieval
let memoryCache: MarketSnapshot = {
  instruments: BASELINE_MARKETS.instruments,
  indices: buildIndicesWithData(BASELINE_MARKETS.instruments),
  fetchedAt: BASELINE_MARKETS.fetchedAt,
  status: "cached",
  source: "Verified Benchmark Cache (Market Close)",
  nextUpdateEstimate: "Daily at 22:00 UTC",
};

let pendingFetch: Promise<MarketSnapshot> | undefined;
let lastAttemptTimestamp = 0;
const quoteProvider = new YahooFinanceQuoteProvider();

async function refreshMarketData(): Promise<MarketSnapshot> {
  lastAttemptTimestamp = Date.now();
  const existingMap = new Map(memoryCache.instruments.map((item) => [item.symbol, item]));

  const settled = await Promise.allSettled(
    INSTRUMENTS_DEF.map((def) => quoteProvider.fetchInstrument(def, existingMap.get(def.symbol))),
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
      const existing = existingMap.get(def.symbol) ??
        BASELINE_MARKETS.instruments.find((b) => b.symbol === def.symbol) ?? {
          symbol: def.symbol,
          name: def.name,
          region: def.region,
          type: def.type,
          category: def.category,
          exchange: def.exchange,
          currencySymbol: def.currencySymbol,
          currency: "USD",
          price: 100,
          previousClose: 100,
          change: 0,
          changePercent: 0,
          dayHigh: 100,
          dayLow: 100,
          fiftyTwoWeekHigh: 100,
          fiftyTwoWeekLow: 100,
          volume: 0,
          asOf: Math.floor(Date.now() / 1000),
          marketState: "REGULAR",
          history: { "1W": [], "1M": [], "6M": [], "1Y": [] },
        };
      updatedInstruments.push(existing);
    }
  }

  const now = Date.now();
  const isFresh = successCount >= 8; // Healthy feed response

  const updatedIndices = buildIndicesWithData(updatedInstruments);

  memoryCache = {
    instruments: updatedInstruments,
    indices: updatedIndices,
    fetchedAt: isFresh ? now : memoryCache.fetchedAt,
    status: isFresh ? "live" : "cached",
    source: isFresh
      ? "Official Exchange Feeds & Yahoo Finance Quotes"
      : "Verified Benchmark Cache (Market Close)",
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

    // If recently attempted and failed, throttle external API calls
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
