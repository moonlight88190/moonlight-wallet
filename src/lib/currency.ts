export const CURRENCIES = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "INR", name: "Indian Rupee" },
  { code: "PHP", name: "Philippine Peso" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CHF", name: "Swiss Franc" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];
export const CURRENCY_CODES = CURRENCIES.map((c) => c.code) as CurrencyCode[];

/** Transfer fee charged to the sender. Must match public.send_transfer. */
export const TRANSFER_FEE_RATE = 0.005;

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

/** rates are quote-per-1-USD */
export function convert(amount: number, from: string, to: string, rates: Record<string, number>) {
  const f = rates[from] ?? 1;
  const t = rates[to] ?? 1;
  return (amount / f) * t;
}
