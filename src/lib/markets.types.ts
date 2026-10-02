export type ChartPoint = {
  date: string; // ISO date "YYYY-MM-DD"
  close: number;
};

export type MarketRegion = "Europe" | "United States" | "India" | "Germany" | "United Kingdom";

export type MarketInstrumentType = "index" | "stock";

export type MarketTimeRange = "1W" | "1M" | "6M" | "1Y";

export type MarketInstrument = {
  symbol: string;
  name: string;
  region: MarketRegion;
  type: MarketInstrumentType;
  category: string;
  exchange: string;
  currency: string;
  currencySymbol: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  volume: number;
  asOf: number; // Unix timestamp in seconds
  marketState: "REGULAR" | "CLOSED" | "PRE" | "POST";
  history: {
    "1W": ChartPoint[];
    "1M": ChartPoint[];
    "6M": ChartPoint[];
    "1Y": ChartPoint[];
  };
};

export type MarketSnapshot = {
  instruments: MarketInstrument[];
  fetchedAt: number; // Unix timestamp in ms
  status: "live" | "cached" | "delayed";
  source: string;
  nextUpdateEstimate: string;
};

export type MarketFilter = "all" | "indices" | "stocks" | "europe" | "us" | "india";
