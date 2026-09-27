import { useEffect, useState } from "react";
import { Check, AlertCircle, ArrowRight, RefreshCw } from "lucide-react";
import { CountryFlag } from "@/components/AssetComponents";
import { formatMoney } from "@/lib/currency";
import { cn } from "@/lib/utils";

export interface PaymentAnimationProps {
  state: "confirming" | "processing" | "completed" | "failed";
  senderName: string;
  senderCode: string;
  recipientName: string;
  recipientCode: string;
  sourceAmount: number;
  sourceCurrency: string;
  destinationAmount: number;
  destinationCurrency: string;
  exchangeRate?: number;
  fee?: number;
  errorMessage?: string;
  onRetry?: () => void;
  onViewReceipt?: () => void;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  INR: "₹",
  PHP: "₱",
  JPY: "¥",
  CHF: "CHF",
  CAD: "$",
  AUD: "$",
  SGD: "S$",
  AED: "AED",
  CZK: "Kč",
  PLN: "zł",
};

export function PaymentAnimation({
  state,
  senderName,
  senderCode,
  recipientName,
  recipientCode,
  sourceAmount,
  sourceCurrency,
  destinationAmount,
  destinationCurrency,
  exchangeRate,
  fee = 0,
  errorMessage,
  onRetry,
  onViewReceipt,
}: PaymentAnimationProps) {
  const [stage, setStage] = useState<"confirming" | "processing" | "completed" | "failed">(state);
  const [showFX, setShowFX] = useState(false);

  useEffect(() => {
    setStage(state);
    if (state === "processing") {
      const timer = setTimeout(() => setShowFX(true), 600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [state]);

  const sourceSymbol = CURRENCY_SYMBOLS[sourceCurrency] || sourceCurrency;
  const destSymbol = CURRENCY_SYMBOLS[destinationCurrency] || destinationCurrency;
  const isCrossCurrency = sourceCurrency !== destinationCurrency;

  return (
    <div className="relative mx-auto flex w-full max-w-md flex-col items-center justify-center overflow-hidden rounded-3xl border border-border/60 bg-card/90 p-6 sm:p-8 shadow-soft backdrop-blur-xl transition-all duration-500">
      {/* Route Header: Country/Currency route */}
      <div className="flex w-full items-center justify-between border-b border-border/40 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <CountryFlag code={sourceCurrency} circle size="xs" />
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {sourceCurrency}
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-[11px] font-semibold text-muted-foreground">
          <span>Route</span>
          <ArrowRight className="h-3 w-3" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {destinationCurrency}
          </span>
          <CountryFlag code={destinationCurrency} circle size="xs" />
        </div>
      </div>

      {/* Main Animated Currency Orb */}
      <div className="relative my-4 flex h-32 w-32 items-center justify-center">
        {/* Processing Animated Ring */}
        {stage === "processing" && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping opacity-25" />
            <div className="absolute inset-0 rounded-full border-2 border-t-primary border-r-primary/40 border-b-primary/10 border-l-transparent animate-spin duration-700" />
          </>
        )}

        {/* Success Ripple Ring */}
        {stage === "completed" && (
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-pulse" />
        )}

        {/* Failed Status Outer Ring */}
        {stage === "failed" && (
          <div className="absolute inset-0 rounded-full border-2 border-destructive/40" />
        )}

        {/* Core Currency Circle */}
        <div
          className={cn(
            "relative flex h-24 w-24 items-center justify-center rounded-full shadow-lg transition-all duration-500",
            stage === "completed"
              ? "bg-emerald-500 text-white shadow-emerald-500/20 scale-105"
              : stage === "failed"
                ? "bg-destructive text-destructive-foreground shadow-destructive/20"
                : "bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950 shadow-slate-950/20",
          )}
        >
          {stage === "completed" ? (
            <svg
              className="h-10 w-10 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M20 6L9 17l-5-5"
                className="animate-[dash_0.6s_ease-in-out_forwards]"
                style={{ strokeDasharray: 30, strokeDashoffset: 0 }}
              />
            </svg>
          ) : stage === "failed" ? (
            <AlertCircle className="h-10 w-10" />
          ) : (
            <span className="text-3xl font-bold tracking-tight">
              {showFX && isCrossCurrency ? destSymbol : sourceSymbol}
            </span>
          )}
        </div>
      </div>

      {/* Dynamic Amount Display */}
      <div className="mt-2 text-center">
        {stage === "completed" ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
              {formatMoney(destinationAmount, destinationCurrency)}
            </h2>
            <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Transfer Completed
            </p>
          </div>
        ) : stage === "failed" ? (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-2xl font-semibold tracking-tight text-destructive">
              Transfer Failed
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {errorMessage || "Transaction was declined."}
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
              {formatMoney(sourceAmount, sourceCurrency)}
            </h2>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {stage === "confirming" ? "Confirming transfer..." : "Processing transfer..."}
            </p>
          </div>
        )}
      </div>

      {/* Recipient Details & Cross Currency FX */}
      <div className="mt-6 w-full rounded-2xl border border-border/50 bg-secondary/30 p-4 space-y-2.5 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Recipient</span>
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <CountryFlag code={destinationCurrency} circle size="xs" />
            {recipientName} ({recipientCode})
          </span>
        </div>

        {isCrossCurrency && (
          <div className="flex justify-between items-center pt-1 border-t border-border/40">
            <span className="text-muted-foreground">Recipient Gets</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {formatMoney(destinationAmount, destinationCurrency)}
            </span>
          </div>
        )}

        {exchangeRate && isCrossCurrency && (
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Exchange Rate</span>
            <span>
              1 {sourceCurrency} ≈ {exchangeRate.toFixed(4)} {destinationCurrency}
            </span>
          </div>
        )}

        {fee > 0 && (
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Transfer Fee</span>
            <span>{formatMoney(fee, sourceCurrency)}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 w-full space-y-2">
        {stage === "completed" && onViewReceipt && (
          <button
            onClick={onViewReceipt}
            className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-soft transition-opacity hover:opacity-90"
          >
            View Official Receipt
          </button>
        )}

        {stage === "failed" && onRetry && (
          <button
            onClick={onRetry}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-soft transition-opacity hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" /> Retry Transfer
          </button>
        )}
      </div>
    </div>
  );
}
