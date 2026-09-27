import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SYMBOLS = ["EUR", "GBP", "INR", "PHP", "SGD", "AUD", "CAD", "JPY", "CHF"];
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Returns FX rates (quote per 1 USD). Rates are cached in the database and
 * refreshed from Frankfurter (ECB reference rates, free, no key) at most once per 24h.
 */
export const getRates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const read = async () => {
      const { data, error } = await context.supabase.from("exchange_rates").select("quote, rate, fetched_at, source");
      if (error) throw new Error(error.message);
      return data ?? [];
    };
    let rows = await read();
    const oldest = rows.reduce((m, r) => Math.min(m, new Date(r.fetched_at).getTime()), Date.now());
    if (rows.length === 0 || Date.now() - oldest > DAY_MS) {
      try {
        const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=USD&symbols=${SYMBOLS.join(",")}`);
        if (res.ok) {
          const json = (await res.json()) as { rates: Record<string, number> };
          const now = new Date().toISOString();
          const upserts = [{ quote: "USD", rate: 1, source: "frankfurter", fetched_at: now }].concat(
            Object.entries(json.rates).map(([quote, rate]) => ({ quote, rate, source: "frankfurter", fetched_at: now })),
          );
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin.from("exchange_rates").upsert(upserts);
          rows = await read();
        }
      } catch (e) {
        console.error("FX refresh failed", e);
      }
    }
    const rates: Record<string, number> = {};
    for (const r of rows) rates[r.quote] = Number(r.rate);
    const fetchedAt = rows.reduce((m, r) => (r.fetched_at > m ? r.fetched_at : m), "");
    return { rates, fetchedAt, source: rows[0]?.source ?? "seed" };
  });
