export const CURRENCIES = [
  { code: "EUR", name: "Euro" },
  { code: "CZK", name: "Czech Koruna" },
  { code: "USD", name: "US Dollar" },
  { code: "GBP", name: "British Pound" },
  { code: "INR", name: "Indian Rupee" },
  { code: "PHP", name: "Philippine Peso" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "AED", name: "UAE Dirham" },
  { code: "PLN", name: "Polish Zloty" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];
export const CURRENCY_CODES = CURRENCIES.map((c) => c.code) as CurrencyCode[];

/** Fallback rates (quote per 1 USD) if API or DB is pending. */
export const FALLBACK_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  CZK: 23.25,
  GBP: 0.79,
  INR: 83.2,
  PHP: 56.5,
  SGD: 1.35,
  AUD: 1.52,
  CAD: 1.36,
  JPY: 152.0,
  CHF: 0.88,
  AED: 3.67,
  PLN: 3.98,
};

/** Transfer fee charged to the sender. Must match public.send_transfer. */
export const TRANSFER_FEE_RATE = 0.1;

export function formatMoney(amount: number, currency: string, opts: { sign?: boolean } = {}) {
  const digits = currency === "JPY" ? 0 : 2;
  const str = new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Math.abs(amount));
  if (opts.sign) return (amount < 0 ? "−" : "+") + str;
  return amount < 0 ? "−" + str : str;
}

/**
 * Resolves FX rate (quote per 1 USD) for a currency.
 * Guarantees a valid, positive number by checking provided rates map,
 * falling back to FALLBACK_RATES, and defaulting to 1 for USD.
 */
export function getRate(currency?: string | null, rates?: Record<string, number> | null): number {
  if (!currency || currency.toUpperCase() === "USD") return 1.0;
  const upper = currency.toUpperCase();
  const r = rates?.[upper];
  if (typeof r === "number" && r > 0 && Number.isFinite(r)) return r;
  const fallback = FALLBACK_RATES[upper];
  if (typeof fallback === "number" && fallback > 0) return fallback;
  return 1.0;
}

/** rates are quote-per-1-USD */
export function convert(
  amount: number,
  from: string,
  to: string,
  rates?: Record<string, number> | null,
) {
  if (!amount || from === to) return amount;
  const f = getRate(from, rates);
  const t = getRate(to, rates);
  return (amount / f) * t;
}
