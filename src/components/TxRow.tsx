import { Link } from "@tanstack/react-router";
import { formatMoney, convert, getRate, FALLBACK_RATES } from "@/lib/currency";
import { txView, type Tx } from "@/hooks/use-wallet";
import { cn } from "@/lib/utils";
import { CountryFlag, BrandAsset } from "@/components/AssetComponents";
import { resolvePaymentAsset } from "@/lib/assets";

/**
 * Renders a linked transaction summary relative to the supplied wallet.
 * Displays the resolved payment brand with a secondary currency flag.
 *
 * When `displayCur` and `rates` are provided, amounts are converted from
 * the transaction's stored currency to the user's preferred display currency
 * so that switching currency in the dashboard/settings is reflected everywhere.
 */
export function TxRow({
  tx,
  walletId,
  displayCur,
  rates,
}: {
  tx: Tx;
  walletId?: string | undefined;
  /** User's preferred display currency (e.g. "INR"). Falls back to tx currency. */
  displayCur?: string;
  /** Exchange-rate map (quote per 1 USD). */
  rates?: Record<string, number>;
}) {
  const v = txView(tx, walletId);
  const d = new Date(tx.created_at);

  const isExternal = tx.kind === "withdrawal";
  const isIndianRail =
    tx.route === "upi" ||
    tx.method?.toLowerCase().includes("upi") ||
    tx.method?.toLowerCase().includes("in-bank") ||
    tx.method?.toLowerCase().includes("bank") ||
    tx.method?.toLowerCase().includes("imps");

  const upiOrMask = isExternal && isIndianRail
    ? (tx as { upi_id?: string }).upi_id || tx.recipient_name || undefined
    : undefined;

  const paymentAsset = resolvePaymentAsset(
    isExternal ? tx.method || "Payout Rail" : undefined,
    upiOrMask,
    isExternal ? (tx as { provider?: string }).provider || undefined : undefined,
    tx.currency,
    tx.route,
    tx.kind,
  );

  // Determine the currency and amount to show in the row.
  // When a display currency is provided, calculate the authoritative amount
  // from the transaction's USD base (wallets.balance_usd architecture)
  // multiplied by the display currency's exchange rate.
  const txCurrency = isIndianRail && v.currency === "EUR" ? "INR" : v.currency;
  const effectiveCur = displayCur || txCurrency;
  const flagCode = isIndianRail && !displayCur ? "IN" : effectiveCur;

  let displayAmount: number;
  if (displayCur) {
    const curRate = getRate(displayCur, rates);
    if (tx.amount_usd != null && Number(tx.amount_usd) > 0) {
      if (v.outgoing) {
        const totalUsd =
          tx.fee_usd != null
            ? Number(tx.amount_usd) + Number(tx.fee_usd)
            : Number(tx.sender_debit ?? tx.amount) / (getRate(tx.currency, rates) || 1);
        displayAmount = -Math.abs(totalUsd * curRate);
      } else {
        displayAmount = Math.abs(Number(tx.amount_usd) * curRate);
      }
    } else {
      displayAmount = convert(v.amount, txCurrency, displayCur, rates);
    }
  } else {
    displayAmount = v.amount;
  }

  return (
    <Link
      to={tx.kind === "withdrawal" ? "/withdrawals/$id" : "/transactions/$id"}
      params={{ id: tx.id }}
      className="flex items-center gap-3 py-3.5 px-3.5 sm:px-4 min-h-[56px] transition-colors hover:bg-accent/30 touch-manipulation cursor-pointer group"
    >
      {/* Transaction Icon with secondary currency badge */}
      <div className="relative shrink-0">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card border border-border/60 shadow-2xs p-1.5 overflow-hidden">
          <BrandAsset
            id={paymentAsset.id}
            size="fit"
            className="h-full w-full"
            imgClassName="max-h-full max-w-full object-contain object-center"
          />
        </div>
        <div className="absolute -bottom-1 -right-1 ring-2 ring-background rounded-full pointer-events-none shadow-xs">
          <CountryFlag code={flagCode} circle size="xs" />
        </div>
      </div>

      {/* Transaction Details */}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium text-foreground">{v.title}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">
          {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ·{" "}
          {d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
          {tx.status !== "completed" && (
            <span className="ml-1.5 capitalize text-gold">· {tx.status}</span>
          )}
        </div>
      </div>

      {/* Amount — converted to user's preferred display currency */}
      <div
        className={cn(
          "tabular text-[13px] font-semibold shrink-0 text-right",
          !v.outgoing && "text-success",
        )}
      >
        {formatMoney(displayAmount, effectiveCur, { sign: true })}
      </div>
    </Link>
  );
}
