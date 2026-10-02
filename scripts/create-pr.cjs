const { execSync } = require("child_process");

const credsRaw = execSync("echo url=https://github.com/moonlight88190/moonlight-wallet.git | git credential fill", {
  encoding: "utf-8",
});
const lines = credsRaw.split("\n");
let token = "";
for (const l of lines) {
  if (l.startsWith("password=")) token = l.slice(9).trim();
}

async function createPR() {
  const prBody = `## Summary of Changes

### 1. Market Data Architecture & Daily Caching
- **Daily 24-Hour Cache Cycle**: Switched market feed refresh from rapid 5-minute polling to once-daily updates (\`24 * 60 * 60 * 1000\`).
- **In-Flight Request Deduplication**: Prevents duplicate parallel external requests using shared promise caching.
- **Circuit Breaker on Failure**: 10-minute lockout on network failure to avoid hammering external endpoints.
- **Resilient Baseline Snapshot**: Bundled verified real market reference data with 1-year historical points in \`src/lib/markets.baseline.ts\`, ensuring zero UI failure or blank screens even when offline or during provider downtime.
- **Client Cache Optimization**: Configured TanStack Query with 1-hour client \`staleTime\`, zero periodic polling, and disabled window-focus refetching.

### 2. Modern Stock Market Experience
- **12 Curated Instruments**:
  - **Indices**: EURO STOXX 50 (\`^STOXX50E\`), S&P 500 (\`^GSPC\`), NIFTY 50 (\`^NSEI\`), DAX 40 (\`^GDAXI\`), FTSE 100 (\`^FTSE\`).
  - **Equities**: ASML Holding (\`ASML\`), SAP SE (\`SAP\`), LVMH (\`MC.PA\`), Apple (\`AAPL\`), Microsoft (\`MSFT\`), Reliance Industries (\`RELIANCE.NS\`), Infosys (\`INFY.NS\`).
- **Multi-Currency Pricing**: Displays both native currency prices and converted user preferred currency equivalents using Moonlight's FX rate engine.
- **Comprehensive Market Metrics**: Day High/Low, 52-Week Range, Previous Close, Volume, and Market State.

### 3. Responsive Stock Chart
- Built using the project's existing Recharts library.
- Dynamic color styling: Emerald green for gains, Rose red for losses over selected periods.
- Timeframe toggles: **1W**, **1M**, **6M**, and **1Y** with dynamic period return calculations.
- Touch/mouse scrubbing with custom glassmorphic tooltip.
- Custom SVG sparkline indicators on instrument cards.

### 4. Mobile-First Redesign & Navigation
- **Dashboard Integration**: Added a dedicated **Markets** quick-action button and embedded the Market & Indices section right on the authenticated dashboard.
- **Dedicated Route**: Created \`/_authenticated/markets\` for full-page market analysis.
- **Desktop Navigation**: Added Markets to the AppShell desktop nav bar and dropdown menu.
- **Mobile Usability**: Touch targets conform to 44px+ minimum sizing, filter chips scroll cleanly, and search allows instant filtering.

### 5. Mobile UX Audit & Type Cleanup
- Refined Currency Converter on mobile with compact result and responsive selector.
- Made SelectTrigger in \`send.tsx\` responsive on compact screens (320px–360px).
- Added \`shrink-0\` to \`TxRow.tsx\` amounts to prevent unwanted wrapping.
- Resolved pre-existing TypeScript index signature errors in \`transactions.$id.tsx\`, \`__root.tsx\`, and \`vite.config.ts\`.

### Verification
- TypeScript (\`tsc --noEmit\`): Passed with 0 errors.
- ESLint (\`npm run lint\`): Passed with 0 errors.
- Production Build (\`npm run build\`): Passed successfully.`;

  const payload = {
    title: "feat: overhaul markets & stock experience with daily caching and interactive chart",
    head: "feat/markets-stock-chart-overhaul",
    base: "main",
    body: prBody,
  };

  const res = await fetch("https://api.github.com/repos/moonlight88190/moonlight-wallet/pulls", {
    method: "POST",
    headers: {
      Authorization: "token " + token,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Moonlight-Wallet-Agent",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (res.status === 201) {
    console.log("PR_URL:" + json.html_url);
    console.log("PR_NUMBER:" + json.number);
  } else {
    console.error("Failed to create PR:", res.status, json.message || json);
  }
}

createPR();
