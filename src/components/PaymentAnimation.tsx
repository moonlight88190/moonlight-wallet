import { useEffect, useState } from "react";
import {
  Check,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Receipt,
  ShieldCheck,
  Building2,
  Wallet,
  ArrowDownToLine,
  Send,
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

const TRANSFER_STEPS = [
  { id: "auth", label: "Authorization", desc: "Verifying account balance & limits" },
  { id: "routing", label: "Rail Routing", desc: "Establishing direct peer connection" },
  { id: "clearing", label: "Ledger Update", desc: "Applying atomic debit & credit balance" },
  { id: "settlement", label: "Settled", desc: "Funds delivered to recipient wallet" },
];

const WITHDRAWAL_STEPS = [
  { id: "validation", label: "Validation", desc: "Checking beneficiary & channel limits" },
  { id: "dispatch", label: "Payout Dispatch", desc: "Queued for settlement gateway" },
  { id: "processing", label: "Processing", desc: "Awaiting corridor clearing confirmation" },
  { id: "scheduled", label: "Confirmed", desc: "Payout recorded on settlement ledger" },
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
  const [activeStep, setActiveStep] = useState(state === "completed" ? 3 : 0);
  const isWithdrawal = type === "withdrawal";
  const steps = isWithdrawal ? WITHDRAWAL_STEPS : TRANSFER_STEPS;
  const isCrossCurrency = sourceCurrency !== destinationCurrency;

  useEffect(() => {
    if (state === "completed") {
      setActiveStep(3);
      return undefined;
    }

    if (state === "failed") {
      return undefined;
    }

    if (state === "processing") {
      setActiveStep(0);

      // Check prefers-reduced-motion
      if (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        setActiveStep(2);
        return undefined;
      }

      // Smooth step progression over ~4.8s
      const timer1 = setTimeout(() => setActiveStep(1), 1100);
      const timer2 = setTimeout(() => setActiveStep(2), 2400);
      const timer3 = setTimeout(() => setActiveStep(3), 4200);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }

    return undefined;
  }, [state]);

  const isComplete = state === "completed" || activeStep === 3;
  const isFailed = state === "failed";

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-lg backdrop-blur-xl transition-all"
    >
      {/* Top Header: Route badge & Amount */}
      <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
            {isWithdrawal ? (
              <ArrowDownToLine className="h-3 w-3" />
            ) : (
              <Send className="h-3 w-3" />
            )}
          </div>
          <span className="text-xs font-semibold text-foreground tracking-tight">
            {isWithdrawal ? "Payout Request" : "Transfer"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-mono text-sm font-bold text-foreground">
            {formatMoney(destinationAmount, destinationCurrency)}
          </span>
          <CountryFlag code={destinationCurrency} circle size="xs" />
        </div>
      </div>

      {/* Corridor Summary Row: Sender -> Destination */}
      <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2.5 mb-4 text-xs">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
            {isWithdrawal ? "From" : "Sender"}
          </div>
          <div className="font-medium text-foreground truncate">
            {senderName}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground truncate">
            {senderCode}
          </div>
        </div>

        <div className="flex flex-col items-center px-2 shrink-0">
          <div
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full border transition-colors",
              isComplete
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"
                : isFailed
                  ? "border-destructive/50 bg-destructive/10 text-destructive"
                  : "border-primary/40 bg-primary/10 text-primary",
            )}
          >
            <ArrowRight className="h-3 w-3" />
          </div>
          {isCrossCurrency && exchangeRate && (
            <span className="font-mono text-[9px] text-muted-foreground mt-0.5">
              FX {exchangeRate.toFixed(2)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 text-right">
          <div className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
            {isWithdrawal ? "Destination" : "Recipient"}
          </div>
          <div className="font-medium text-foreground truncate">
            {recipientName}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground truncate">
            {recipientCode}
          </div>
        </div>
      </div>

      {/* Progress Journey Track */}
      <div className="space-y-3 my-2">
        <div className="flex items-center justify-between text-xs px-0.5">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {isFailed
              ? "Transaction Status"
              : isComplete
                ? "Settlement Confirmed"
                : "Transaction Progress"}
          </span>
          <span
            className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
              isFailed
                ? "bg-destructive/15 text-destructive"
                : isComplete
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-primary/15 text-primary",
            )}
          >
            {isFailed ? "Failed" : isComplete ? "Completed" : steps[activeStep]?.label}
          </span>
        </div>

        {/* Step Nodes Row */}
        <div className="relative flex items-center justify-between px-1">
          {/* Connecting line */}
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-border/60 -z-0" />
          <div
            className="absolute left-4 top-1/2 -translate-y-1/2 h-0.5 bg-primary transition-all duration-700 ease-out -z-0"
            style={{
              width: `${(Math.min(activeStep, 3) / 3) * (100 - 8)}%`,
            }}
          />

          {steps.map((s, idx) => {
            const stepDone = isComplete || activeStep > idx;
            const stepActive = !isComplete && !isFailed && activeStep === idx;
            return (
              <div key={s.id} className="relative z-10 flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold transition-all duration-300",
                    stepDone
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : stepActive
                        ? "border-primary bg-background text-primary ring-2 ring-primary/20 scale-110"
                        : "border-border bg-card text-muted-foreground",
                  )}
                >
                  {stepDone ? (
                    <Check className="h-3 w-3 stroke-[3]" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Stage Description */}
        <div className="rounded-xl border border-border/60 bg-secondary/30 p-2.5 text-center transition-all">
          <div className="text-xs font-semibold text-foreground">
            {isFailed
              ? "Payment could not be processed"
              : isComplete
                ? isWithdrawal
                  ? "Withdrawal Dispatched Successfully"
                  : "Funds Transferred Successfully"
                : steps[activeStep]?.desc}
          </div>
          {fee > 0 && (
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Service Fee: {formatMoney(fee, sourceCurrency)}
            </div>
          )}
        </div>
      </div>

      {/* Failure State */}
      {isFailed && (
        <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Transfer Failed</span>
          </div>
          <p className="text-[11px] leading-relaxed opacity-90">
            {errorMessage || "Unable to complete transaction. Balance has not been debited."}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:opacity-90"
            >
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          )}
        </div>
      )}

      {/* Completion Action */}
      {isComplete && onViewReceipt && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <button
            onClick={onViewReceipt}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-95 transition-all shadow-xs cursor-pointer active:scale-[0.98]"
          >
            <Receipt className="h-3.5 w-3.5" />
            View Transaction Receipt
          </button>
        </div>
      )}
    </div>
  );
}
