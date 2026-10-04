import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { FALLBACK_RATES } from "@/lib/currency";

const SYMBOLS = [
  "EUR",
  "CZK",
  "GBP",
  "INR",
  "PHP",
  "SGD",
  "AUD",
  "CAD",
  "JPY",
  "CHF",
  "AED",
  "PLN",
];
const DAY_MS = 24 * 60 * 60 * 1000;

let memoryCachedResult: {
  rates: Record<string, number>;
  fetchedAt: string;
  source: string;
} | null = null;
let lastMemoryCacheTime = 0;
const MEMORY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Returns FX rates (quote per 1 USD). Rates are cached in the database and
 * refreshed from Frankfurter (ECB reference rates, free, no key) at most once per 24h.
 * Always guarantees complete rate coverage for all supported currencies.
 */
export const getRates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (memoryCachedResult && Date.now() - lastMemoryCacheTime < MEMORY_CACHE_TTL_MS) {
      return memoryCachedResult;
    }
    const read = async () => {
      try {
        const { data, error } = await context.supabase
          .from("exchange_rates")
          .select("quote, rate, fetched_at, source");
        if (error) {
          console.warn("Could not read exchange_rates from DB:", error.message);
          return [];
        }
        return data ?? [];
      } catch (err) {
        console.warn("exchange_rates read error:", err);
        return [];
      }
    };

    let rows = await read();
    const oldest = rows.reduce(
      (m, r) => Math.min(m, new Date(r.fetched_at).getTime()),
      Date.now(),
    );

    let freshRates: Record<string, number> | null = null;
    if (rows.length === 0 || Date.now() - oldest > DAY_MS) {
      try {
        const res = await fetch(
          `https://api.frankfurter.dev/v1/latest?base=USD&symbols=${SYMBOLS.join(",")}`,
        );
        if (res.ok) {
          const json = (await res.json()) as { rates: Record<string, number> };
          freshRates = json.rates;
          const now = new Date().toISOString();
          const upserts = [
            { quote: "USD", rate: 1, source: "frankfurter", fetched_at: now },
          ].concat(
            Object.entries(json.rates).map(([quote, rate]) => ({
              quote,
              rate,
              source: "frankfurter",
              fetched_at: now,
            })),
          );

          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            await supabaseAdmin.from("exchange_rates").upsert(upserts);
            rows = await read();
          } catch (adminErr) {
            console.warn(
              "Could not persist fresh rates to DB (service role key may be absent in client env):",
              adminErr,
            );
          }
        }
      } catch (e) {
        console.error("FX refresh failed", e);
      }
    }

    // Always initialize with comprehensive fallback rates (guarantees INR, AED, EUR, etc. exist)
    const rates: Record<string, number> = { ...FALLBACK_RATES };

    // Apply any database-stored rates
    for (const r of rows) {
      const val = Number(r.rate);
      if (val > 0) rates[r.quote] = val;
    }

    // Apply live Frankfurter rates if fetched this invocation
    if (freshRates) {
      for (const [quote, val] of Object.entries(freshRates)) {
        if (val > 0) rates[quote] = Number(val);
      }
    }

    const fetchedAt = rows.reduce(
      (m, r) => (r.fetched_at > m ? r.fetched_at : m),
      new Date().toISOString(),
    );

    const result = {
      rates,
      fetchedAt,
      source: rows[0]?.source ?? (freshRates ? "frankfurter" : "fallback"),
    };
    memoryCachedResult = result;
    lastMemoryCacheTime = Date.now();

    return result;
  });

