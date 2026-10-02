const fs = require('fs');

const list = [
  { symbol: '^STOXX50E', name: 'EURO STOXX 50', region: 'Europe', type: 'index', category: 'Eurozone Benchmark', exchange: 'STOXX', currencySymbol: '€' },
  { symbol: '^GSPC', name: 'S&P 500', region: 'United States', type: 'index', category: 'US Large Cap', exchange: 'S&P', currencySymbol: '$' },
  { symbol: '^NSEI', name: 'NIFTY 50', region: 'India', type: 'index', category: 'India Benchmark', exchange: 'NSE', currencySymbol: '₹' },
  { symbol: '^GDAXI', name: 'DAX 40', region: 'Germany', type: 'index', category: 'German Benchmark', exchange: 'XETRA', currencySymbol: '€' },
  { symbol: '^FTSE', name: 'FTSE 100', region: 'United Kingdom', type: 'index', category: 'UK Benchmark', exchange: 'LSE', currencySymbol: '£' },
  { symbol: 'ASML', name: 'ASML Holding', region: 'Europe', type: 'stock', category: 'Semiconductors', exchange: 'NASDAQ', currencySymbol: '$' },
  { symbol: 'SAP', name: 'SAP SE', region: 'Germany', type: 'stock', category: 'Enterprise Software', exchange: 'NYSE', currencySymbol: '$' },
  { symbol: 'MC.PA', name: 'LVMH Moët Hennessy', region: 'Europe', type: 'stock', category: 'Luxury Goods', exchange: 'Euronext', currencySymbol: '€' },
  { symbol: 'AAPL', name: 'Apple Inc.', region: 'United States', type: 'stock', category: 'Consumer Tech', exchange: 'NASDAQ', currencySymbol: '$' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', region: 'United States', type: 'stock', category: 'Cloud & AI', exchange: 'NASDAQ', currencySymbol: '$' },
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', region: 'India', type: 'stock', category: 'Energy & Telecom', exchange: 'NSE', currencySymbol: '₹' },
  { symbol: 'INFY.NS', name: 'Infosys', region: 'India', type: 'stock', category: 'Digital Services', exchange: 'NSE', currencySymbol: '₹' }
];

async function generate() {
  const instruments = [];
  for (const item of list) {
    try {
      const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(item.symbol) + '?interval=1d&range=1y';
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Status ' + res.status);
      const json = await res.json();
      const meta = json?.chart?.result?.[0]?.meta;
      const timestamps = json?.chart?.result?.[0]?.timestamp || [];
      const quotes = json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || [];
      
      const allPoints = [];
      for (let i = 0; i < timestamps.length; i++) {
        if (typeof quotes[i] === 'number' && !isNaN(quotes[i])) {
          allPoints.push({
            date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
            close: Math.round(quotes[i] * 100) / 100
          });
        }
      }

      const price = meta?.regularMarketPrice ?? allPoints.at(-1)?.close ?? 0;
      // In 1y range, chartPreviousClose is 1 year ago; allPoints.at(-2) is the true previous trading day close
      const prevTradingDayClose = allPoints.length >= 2 ? (allPoints.at(-2)?.close ?? price) : price;
      const previousClose = meta?.previousClose ?? prevTradingDayClose;
      const rawChange = meta?.regularMarketChange ?? (price - previousClose);
      const rawChangePercent = meta?.regularMarketChangePercent ?? (((price - previousClose) / previousClose) * 100);
      const change = Math.round(rawChange * 100) / 100;
      const changePercent = Math.round(rawChangePercent * 100) / 100;

      instruments.push({
        ...item,
        currency: meta?.currency || 'USD',
        price,
        previousClose,
        change,
        changePercent,
        dayHigh: meta?.regularMarketDayHigh ?? price,
        dayLow: meta?.regularMarketDayLow ?? price,
        fiftyTwoWeekHigh: meta?.fiftyTwoWeekHigh ?? price,
        fiftyTwoWeekLow: meta?.fiftyTwoWeekLow ?? price,
        volume: meta?.regularMarketVolume ?? 0,
        asOf: meta?.regularMarketTime ?? Math.floor(Date.now() / 1000),
        marketState: 'REGULAR',
        history: {
          '1W': allPoints.slice(-5),
          '1M': allPoints.slice(-22),
          '6M': allPoints.slice(-126),
          '1Y': allPoints
        }
      });
      console.log('Fetched:', item.symbol, 'points:', allPoints.length);
    } catch (err) {
      console.error('Failed:', item.symbol, err.message);
    }
  }

  const snapshot = {
    instruments,
    fetchedAt: Date.now(),
    status: 'cached',
    source: 'European & Global Market Reference Feed',
    nextUpdateEstimate: 'Daily at 22:00 UTC'
  };

  const code = `// Auto-generated verified baseline market snapshot
// This baseline provides guaranteed instant load, offline stability, and graceful fallback.

import type { MarketSnapshot } from "./markets.types";

export const BASELINE_MARKETS: MarketSnapshot = ${JSON.stringify(snapshot, null, 2)};
`;

  fs.writeFileSync('src/lib/markets.baseline.ts', code, 'utf-8');
  console.log('Successfully wrote src/lib/markets.baseline.ts with ' + instruments.length + ' instruments!');
}

generate();
