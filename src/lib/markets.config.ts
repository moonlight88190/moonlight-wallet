/**
 * Authoritative Market Index & Constituent Configuration.
 *
 * Source-of-truth metadata for major global indices and their representative constituents.
 * UI components must consume this data layer rather than hardcoding symbols or company names.
 */

import type { MarketRegion } from "./markets.types";

export interface ConstituentDef {
  symbol: string;
  name: string;
  category: string;
  exchange: string;
  currency: string;
  currencySymbol: string;
  brandAssetId: string;
  weightHint?: number; // approximate index weighting percentage
}

export interface IndexDef {
  id: string;
  symbol: string;
  name: string;
  provider: string;
  region: MarketRegion;
  currency: string;
  currencySymbol: string;
  brandAssetId: string;
  constituentSource: {
    authority: string;
    datasetName: string;
    url: string;
    updateCadence: string;
  };
  representativeConstituents: ConstituentDef[];
}

export const MAJOR_INDICES: IndexDef[] = [
  {
    id: "nifty-50",
    symbol: "^NSEI",
    name: "NIFTY 50",
    provider: "NSE India (niftyindices.com)",
    region: "India",
    currency: "INR",
    currencySymbol: "₹",
    brandAssetId: "nifty-50",
    constituentSource: {
      authority: "National Stock Exchange of India (NSE)",
      datasetName: "NIFTY 50 Official Constituent List",
      url: "https://www.niftyindices.com/indices/equity/broad-based-indices/NIFTY-50",
      updateCadence: "Semi-annual reconstitution (March/September)",
    },
    representativeConstituents: [
      {
        symbol: "HDFCBANK.NS",
        name: "HDFC Bank",
        category: "Banking & Financial Services",
        exchange: "NSE",
        currency: "INR",
        currencySymbol: "₹",
        brandAssetId: "hdfc-bank",
        weightHint: 11.5,
      },
      {
        symbol: "RELIANCE.NS",
        name: "Reliance Industries",
        category: "Energy & Telecommunications",
        exchange: "NSE",
        currency: "INR",
        currencySymbol: "₹",
        brandAssetId: "reliance",
        weightHint: 10.2,
      },
      {
        symbol: "ICICIBANK.NS",
        name: "ICICI Bank",
        category: "Banking & Financial Services",
        exchange: "NSE",
        currency: "INR",
        currencySymbol: "₹",
        brandAssetId: "icici-bank",
        weightHint: 7.9,
      },
      {
        symbol: "BHARTIARTL.NS",
        name: "Bharti Airtel",
        category: "Telecommunications",
        exchange: "NSE",
        currency: "INR",
        currencySymbol: "₹",
        brandAssetId: "airtel",
        weightHint: 4.8,
      },
      {
        symbol: "TCS.NS",
        name: "Tata Consultancy Services",
        category: "Information Technology",
        exchange: "NSE",
        currency: "INR",
        currencySymbol: "₹",
        brandAssetId: "tcs",
        weightHint: 4.2,
      },
      {
        symbol: "INFY.NS",
        name: "Infosys",
        category: "Digital Services & Consulting",
        exchange: "NSE",
        currency: "INR",
        currencySymbol: "₹",
        brandAssetId: "infosys",
        weightHint: 4.0,
      },
    ],
  },
  {
    id: "nasdaq-100",
    symbol: "^NDX",
    name: "Nasdaq-100",
    provider: "Nasdaq Global Indexes",
    region: "United States",
    currency: "USD",
    currencySymbol: "$",
    brandAssetId: "nasdaq-100",
    constituentSource: {
      authority: "Nasdaq, Inc. Index Services",
      datasetName: "Nasdaq-100 Index Reconstitution & Changes",
      url: "https://indexes.nasdaqomx.com/Index/Overview/NDX",
      updateCadence: "Annual reconstitution (December) & quarterly rebalancing",
    },
    representativeConstituents: [
      {
        symbol: "NVDA",
        name: "NVIDIA Corp.",
        category: "Accelerated Computing & AI",
        exchange: "NASDAQ",
        currency: "USD",
        currencySymbol: "$",
        brandAssetId: "nvidia",
        weightHint: 8.5,
      },
      {
        symbol: "AAPL",
        name: "Apple Inc.",
        category: "Consumer Technology",
        exchange: "NASDAQ",
        currency: "USD",
        currencySymbol: "$",
        brandAssetId: "apple",
        weightHint: 8.4,
      },
      {
        symbol: "MSFT",
        name: "Microsoft Corp.",
        category: "Cloud Infrastructure & AI",
        exchange: "NASDAQ",
        currency: "USD",
        currencySymbol: "$",
        brandAssetId: "microsoft",
        weightHint: 7.8,
      },
      {
        symbol: "AMZN",
        name: "Amazon.com Inc.",
        category: "E-Commerce & Cloud Platforms",
        exchange: "NASDAQ",
        currency: "USD",
        currencySymbol: "$",
        brandAssetId: "amazon",
        weightHint: 5.4,
      },
      {
        symbol: "GOOGL",
        name: "Alphabet Inc.",
        category: "Search, Cloud & AI",
        exchange: "NASDAQ",
        currency: "USD",
        currencySymbol: "$",
        brandAssetId: "alphabet",
        weightHint: 5.1,
      },
      {
        symbol: "META",
        name: "Meta Platforms",
        category: "Social Technologies & Metaverse",
        exchange: "NASDAQ",
        currency: "USD",
        currencySymbol: "$",
        brandAssetId: "meta",
        weightHint: 4.8,
      },
    ],
  },
  {
    id: "sp-500",
    symbol: "^GSPC",
    name: "S&P 500",
    provider: "S&P Dow Jones Indices",
    region: "United States",
    currency: "USD",
    currencySymbol: "$",
    brandAssetId: "sp-500",
    constituentSource: {
      authority: "S&P Dow Jones Indices (S&P Global)",
      datasetName: "S&P 500 Official Constituent Directory",
      url: "https://www.spglobal.com/spdji/en/indices/equity/sp-500/",
      updateCadence: "Quarterly rebalancing (March/June/September/December)",
    },
    representativeConstituents: [
      {
        symbol: "NVDA",
        name: "NVIDIA Corp.",
        category: "Accelerated Computing & AI",
        exchange: "NASDAQ",
        currency: "USD",
        currencySymbol: "$",
        brandAssetId: "nvidia",
        weightHint: 6.8,
      },
      {
        symbol: "AAPL",
        name: "Apple Inc.",
        category: "Consumer Technology",
        exchange: "NASDAQ",
        currency: "USD",
        currencySymbol: "$",
        brandAssetId: "apple",
        weightHint: 6.6,
      },
      {
        symbol: "MSFT",
        name: "Microsoft Corp.",
        category: "Enterprise Software & Cloud",
        exchange: "NASDAQ",
        currency: "USD",
        currencySymbol: "$",
        brandAssetId: "microsoft",
        weightHint: 6.4,
      },
      {
        symbol: "AMZN",
        name: "Amazon.com Inc.",
        category: "E-Commerce & Cloud Infrastructure",
        exchange: "NASDAQ",
        currency: "USD",
        currencySymbol: "$",
        brandAssetId: "amazon",
        weightHint: 3.8,
      },
      {
        symbol: "GOOGL",
        name: "Alphabet Inc.",
        category: "Search & Digital Media",
        exchange: "NASDAQ",
        currency: "USD",
        currencySymbol: "$",
        brandAssetId: "alphabet",
        weightHint: 3.7,
      },
      {
        symbol: "AVGO",
        name: "Broadcom Inc.",
        category: "Semiconductors & Infrastructure Software",
        exchange: "NASDAQ",
        currency: "USD",
        currencySymbol: "$",
        brandAssetId: "broadcom",
        weightHint: 2.2,
      },
    ],
  },
  {
    id: "euro-stoxx-50",
    symbol: "^STOXX50E",
    name: "EURO STOXX 50",
    provider: "STOXX / Deutsche Börse Group",
    region: "Europe",
    currency: "EUR",
    currencySymbol: "€",
    brandAssetId: "euro-stoxx-50",
    constituentSource: {
      authority: "STOXX Ltd. / Deutsche Börse Group",
      datasetName: "EURO STOXX 50 Official Index Directory",
      url: "https://www.stoxx.com/index-details?symbol=SX5E",
      updateCadence: "Annual review (September) & quarterly weight caps",
    },
    representativeConstituents: [
      {
        symbol: "ASML",
        name: "ASML Holding",
        category: "Semiconductor Lithography",
        exchange: "NASDAQ / Euronext",
        currency: "EUR",
        currencySymbol: "€",
        brandAssetId: "asml",
        weightHint: 8.8,
      },
      {
        symbol: "SAP",
        name: "SAP SE",
        category: "Enterprise Applications",
        exchange: "XETRA / NYSE",
        currency: "EUR",
        currencySymbol: "€",
        brandAssetId: "sap",
        weightHint: 7.2,
      },
      {
        symbol: "SIE.DE",
        name: "Siemens AG",
        category: "Industrial Automation & Infrastructure",
        exchange: "XETRA",
        currency: "EUR",
        currencySymbol: "€",
        brandAssetId: "siemens",
        weightHint: 4.8,
      },
      {
        symbol: "SAN.MC",
        name: "Banco Santander",
        category: "Retail & Commercial Banking",
        exchange: "Bolsas y Mercados Españoles",
        currency: "EUR",
        currencySymbol: "€",
        brandAssetId: "santander",
        weightHint: 3.8,
      },
      {
        symbol: "SU.PA",
        name: "Schneider Electric",
        category: "Energy Management & Automation",
        exchange: "Euronext Paris",
        currency: "EUR",
        currencySymbol: "€",
        brandAssetId: "schneider",
        weightHint: 3.6,
      },
      {
        symbol: "TTE.PA",
        name: "TotalEnergies",
        category: "Integrated Energy & Renewables",
        exchange: "Euronext Paris",
        currency: "EUR",
        currencySymbol: "€",
        brandAssetId: "totalenergies",
        weightHint: 3.5,
      },
    ],
  },
  {
    id: "dax-40",
    symbol: "^GDAXI",
    name: "DAX 40",
    provider: "Deutsche Börse AG / STOXX",
    region: "Germany",
    currency: "EUR",
    currencySymbol: "€",
    brandAssetId: "dax",
    constituentSource: {
      authority: "Deutsche Börse AG / XETRA Index Provider",
      datasetName: "DAX Official Benchmark Directory",
      url: "https://www.boerse-frankfurt.de/indices/dax",
      updateCadence: "Semi-annual review (March/September)",
    },
    representativeConstituents: [
      {
        symbol: "SAP",
        name: "SAP SE",
        category: "Enterprise Software",
        exchange: "XETRA",
        currency: "EUR",
        currencySymbol: "€",
        brandAssetId: "sap",
        weightHint: 12.0,
      },
      {
        symbol: "SIE.DE",
        name: "Siemens AG",
        category: "Digital Industries",
        exchange: "XETRA",
        currency: "EUR",
        currencySymbol: "€",
        brandAssetId: "siemens",
        weightHint: 10.4,
      },
      {
        symbol: "ALV.DE",
        name: "Allianz SE",
        category: "Insurance & Asset Management",
        exchange: "XETRA",
        currency: "EUR",
        currencySymbol: "€",
        brandAssetId: "allianz",
        weightHint: 8.2,
      },
      {
        symbol: "ASML",
        name: "ASML Holding",
        category: "Semiconductors",
        exchange: "NASDAQ",
        currency: "EUR",
        currencySymbol: "€",
        brandAssetId: "asml",
        weightHint: 6.5,
      },
      {
        symbol: "SU.PA",
        name: "Schneider Electric",
        category: "Industrial Technology",
        exchange: "Euronext Paris",
        currency: "EUR",
        currencySymbol: "€",
        brandAssetId: "schneider",
        weightHint: 5.2,
      },
    ],
  },
  {
    id: "ftse-100",
    symbol: "^FTSE",
    name: "FTSE 100",
    provider: "FTSE Russell / London Stock Exchange Group",
    region: "United Kingdom",
    currency: "GBP",
    currencySymbol: "£",
    brandAssetId: "ftse-100",
    constituentSource: {
      authority: "FTSE Russell / London Stock Exchange Group",
      datasetName: "FTSE UK Index Series",
      url: "https://www.lseg.com/en/ftse-russell/indices/ftse-uk",
      updateCadence: "Quarterly review (March/June/September/December)",
    },
    representativeConstituents: [
      {
        symbol: "AZN.L",
        name: "AstraZeneca",
        category: "Biopharmaceuticals",
        exchange: "LSE",
        currency: "GBP",
        currencySymbol: "£",
        brandAssetId: "asml",
        weightHint: 8.4,
      },
      {
        symbol: "SHEL.L",
        name: "Shell PLC",
        category: "Global Energy",
        exchange: "LSE",
        currency: "GBP",
        currencySymbol: "£",
        brandAssetId: "totalenergies",
        weightHint: 7.9,
      },
      {
        symbol: "HSBA.L",
        name: "HSBC Holdings",
        category: "International Banking",
        exchange: "LSE",
        currency: "GBP",
        currencySymbol: "£",
        brandAssetId: "santander",
        weightHint: 6.2,
      },
      {
        symbol: "AAPL",
        name: "Apple Inc.",
        category: "Consumer Tech",
        exchange: "NASDAQ",
        currency: "USD",
        currencySymbol: "$",
        brandAssetId: "apple",
        weightHint: 5.0,
      },
      {
        symbol: "MSFT",
        name: "Microsoft Corp.",
        category: "Cloud Services",
        exchange: "NASDAQ",
        currency: "USD",
        currencySymbol: "$",
        brandAssetId: "microsoft",
        weightHint: 4.8,
      },
    ],
  },
];

export function getIndexById(id: string): IndexDef | undefined {
  return MAJOR_INDICES.find((idx) => idx.id === id);
}

export function getIndexBySymbol(symbol: string): IndexDef | undefined {
  return MAJOR_INDICES.find((idx) => idx.symbol === symbol);
}

export function getAllMarketSymbols(): string[] {
  const symbolSet = new Set<string>();
  for (const idx of MAJOR_INDICES) {
    symbolSet.add(idx.symbol);
    for (const c of idx.representativeConstituents) {
      symbolSet.add(c.symbol);
    }
  }
  return Array.from(symbolSet);
}
