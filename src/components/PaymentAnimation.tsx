import { useEffect, useState } from "react";
import {
  Check,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Receipt,
  ShieldCheck,
  Activity,
  Clock,
} from "lucide-react";
import { CountryFlag } from "@/components/AssetComponents";
import { formatMoney } from "@/lib/currency";
import { cn } from "@/lib/utils";

export interface PaymentAnimationProps {
  state: "confirming" | "processing" | "completed" | "failed";
  type?: "transfer" | "withdrawal";
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
  CAD: "C$",
  AUD: "A$",
  SGD: "S$",
  AED: "AED",
  CZK: "Kč",
  PLN: "zł",
};

const WITHDRAWAL_STAGES = [
  "Confirming withdrawal request & beneficiary details...",
  "Routing request to international wiring system & payout gateway...",
  "Validating interbank clearing limits & account authorization...",
  "Executing direct ledger debit & issuing transaction tracking code...",
  "Finalizing payout dispatch to international banking network...",
  "Withdrawal request submitted to international wiring system",
];

const TRANSFER_STAGES = [
  "Verifying sender authorization & international interbank clearing system...",
  "Validating beneficiary account & SWIFT/SEPA network rails...",
  "Executing real-time multi-currency FX clearance & conversion...",
  "Moving funds through international wiring system & interbank ledger...",
  "Generating cryptographic receipt & immutable ledger proof...",
  "Settlement confirmed & official international wiring record issued",
];

export function PaymentAnimation({
  state,
  type = "transfer",
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
  const [activeStep, setActiveStep] = useState(0);

  const steps = type === "withdrawal" ? WITHDRAWAL_STAGES : TRANSFER_STAGES;

  useEffect(() => {
    setStage(state);
    if (state === "processing") {
      setActiveStep(0);

      if (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        setActiveStep(steps.length - 1);
        return undefined;
      }

      // 5.0s to 6.0s total duration for realistic bank clearance animation (~1000ms - 1200ms per step across 5 step transitions)
      const baseMin = 1000;
      const baseMax = 1200;

      const step1 = Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin;
      const step2 = Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin;
      const step3 = Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin;
      const step4 = Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin;
      const step5 = Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin;

      const d1 = step1;
      const d2 = d1 + step2;
      const d3 = d2 + step3;
      const d4 = d3 + step4;
      const d5 = d4 + step5;

      const timers: NodeJS.Timeout[] = [
        setTimeout(() => setActiveStep(1), d1),
        setTimeout(() => setActiveStep(2), d2),
        setTimeout(() => setActiveStep(3), d3),
        setTimeout(() => setActiveStep(4), d4),
        setTimeout(() => setActiveStep(5), d5),
      ];

      return () => {
        timers.forEach((t) => clearTimeout(t));
      };
    } else if (state === "completed") {
      setActiveStep(steps.length - 1);
    }
    return undefined;
  }, [state, type, steps.length]);

  const sourceSymbol = CURRENCY_SYMBOLS[sourceCurrency] || sourceCurrency;
  const destSymbol = CURRENCY_SYMBOLS[destinationCurrency] || destinationCurrency;
  const isCrossCurrency = sourceCurrency !== destinationCurrency;

  return (
    <div className="relative mx-auto flex w-full max-w-md flex-col items-center justify-center overflow-hidden rounded-3xl border border-border/60 bg-card/95 p-5 sm:p-8 shadow-soft backdrop-blur-xl transition-all duration-300">
      {/* Route Header: Country/Currency route */}
      <div className="flex w-full items-center justify-between border-b border-border/50 pb-4 mb-5">
        <div className="flex items-center gap-2">
          <CountryFlag code={sourceCurrency} circle size="xs" />
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {sourceCurrency}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary border border-border/40 text-[11px] font-semibold text-muted-foreground">
          <span>{formatMoney(sourceAmount, sourceCurrency)}</span>
          <ArrowRight className="h-3 w-3 text-primary animate-pulse motion-reduce:animate-none" />
          <span className="text-foreground">
            {formatMoney(destinationAmount, destinationCurrency)}
          </span>
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
        {stage === "processing" && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping opacity-25 motion-reduce:animate-none" />
            <div className="absolute inset-0 rounded-full border-2 border-t-primary border-r-primary/40 border-b-primary/10 border-l-transparent animate-spin duration-700 motion-reduce:animate-none" />
          </>
        )}

        {stage === "completed" && (
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-pulse motion-reduce:animate-none" />
        )}

        {stage === "failed" && (
          <div className="absolute inset-0 rounded-full border-2 border-destructive/40" />
        )}

        {/* Core Circle */}
        <div
          className={cn(
            "relative flex h-24 w-24 items-center justify-center rounded-full shadow-lg transition-all duration-500",
            stage === "completed"
              ? "bg-emerald-500 text-white shadow-emerald-500/20 scale-105"
              : stage === "failed"
                ? "bg-destructive text-destructive-foreground shadow-destructive/20"
                : type === "withdrawal"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                  : "bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950 shadow-slate-950/20",
          )}
        >
          {stage === "completed" ? (
            <Check className="h-10 w-10 stroke-[3] animate-in zoom-in-75 duration-300" />
          ) : stage === "failed" ? (
            <AlertCircle className="h-10 w-10 stroke-[2.5]" />
          ) : type === "withdrawal" ? (
            <Clock className="h-10 w-10 text-amber-500 animate-pulse" />
          ) : (
            <span className="text-3xl font-bold tracking-tight">
              {isCrossCurrency ? destSymbol : sourceSymbol}
            </span>
          )}
        </div>
      </div>

      {/* Dynamic Amount / Status Display */}
      <div className="mt-2 text-center">
        {type === "withdrawal" && stage === "processing" ? (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
              {formatMoney(sourceAmount, sourceCurrency)}
            </h2>
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full">
              <Clock className="h-3.5 w-3.5" /> Withdrawal Processing
            </div>
            <p className="mt-2 text-xs text-muted-foreground max-w-xs mx-auto">
              Submitted successfully. Status is actively tracked in your account.
            </p>
          </div>
        ) : stage === "completed" ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
              {formatMoney(destinationAmount, destinationCurrency)}
            </h2>
            <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
              <ShieldCheck className="h-3.5 w-3.5" /> Official Settlement Record
            </div>
          </div>
        ) : stage === "failed" ? (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-2xl font-semibold tracking-tight text-destructive">
              Transaction Failed
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
            <div className="mt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Activity className="h-3.5 w-3.5 animate-pulse text-primary" />
              <span>{steps[activeStep] || steps[0]}</span>
            </div>
          </div>
        )}
      </div>

      {/* Details Box */}
      <div className="mt-6 w-full rounded-2xl border border-border/50 bg-secondary/30 p-4 space-y-2.5 text-xs">
        <div className="flex justify-between items-center gap-2">
          <span className="text-muted-foreground shrink-0">Recipient / Method</span>
          <span className="font-semibold text-foreground flex items-center gap-1.5 truncate justify-end">
            <CountryFlag code={destinationCurrency} circle size="xs" />
            <span className="truncate">{recipientName}</span>
            <span className="font-mono text-[10px] text-muted-foreground">({recipientCode})</span>
          </span>
        </div>

        {isCrossCurrency && (
          <div className="flex justify-between items-center pt-1 border-t border-border/40">
            <span className="text-muted-foreground">Destination Amount</span>
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
            <span>Fee</span>
            <span>{formatMoney(fee, sourceCurrency)}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 w-full space-y-2">
        {(stage === "completed" || (type === "withdrawal" && stage === "processing")) &&
          onViewReceipt && (
            <button
              onClick={onViewReceipt}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer touch-manipulation"
            >
              <Receipt className="h-4 w-4" /> View Receipt
            </button>
          )}

        {stage === "failed" && onRetry && (
          <button
            onClick={onRetry}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer touch-manipulation"
          >
            <RefreshCw className="h-4 w-4" /> Retry Operation
          </button>
        )}
      </div>
    </div>
  );
}
