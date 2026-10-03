import React, { useEffect, useState, useRef } from "react";
import { Check, AlertCircle, XCircle, RefreshCw, Receipt } from "lucide-react";
import { BrandAsset, CountryFlag } from "@/components/AssetComponents";
import { resolvePaymentAsset } from "@/lib/assets";
import { formatMoney } from "@/lib/currency";
import { cn } from "@/lib/utils";

/* ─── Types ─── */

export interface PaymentAnimationProps {
  state: "validating" | "processing" | "completed" | "failed" | "cancelled" | "confirming";
  type?: "transfer" | "withdrawal" | undefined;
  senderName: string;
  senderCode: string;
  recipientName: string;
  recipientCode: string;
  sourceAmount: number;
  sourceCurrency: string;
  destinationAmount: number;
  destinationCurrency: string;
  paymentMethodId?: string | undefined;
  paymentMethodName?: string | undefined;
  exchangeRate?: number | undefined;
  fee?: number | undefined;
  errorMessage?: string | undefined;
  onRetry?: (() => void) | undefined;
  onViewReceipt?: (() => void) | undefined;
  onCancel?: (() => void) | undefined;
}

/* ─── Stage definitions ─── */

interface StageConfig {
  title: string;
  description: string;
}

function getTransferStages(providerLabel: string): StageConfig[] {
  return [
    { title: "Verifying Account", description: "Checking recipient identity and balance" },
    { title: "Transfer Authorization", description: `Authorizing Moonlight internal transfer` },
    { title: "Direct Settlement", description: "Processing transfer between Moonlight accounts" },
    { title: "Updating Balance", description: "Recording debit and credit entries" },
    { title: "Transfer Complete", description: "Funds delivered to recipient wallet" },
  ];
}

function getWithdrawalStages(providerLabel: string, routeId?: string): StageConfig[] {
  if (routeId === "upi" || providerLabel.toLowerCase().includes("upi")) {
    return [
      { title: "Verifying Details", description: "Validating UPI VPA and mobile phone number" },
      { title: "Routing Payout", description: `Directing instruction via ${providerLabel}` },
      { title: "Processing Queue", description: "Queued for settlement preparation" },
      { title: "Payout Confirmed", description: "Withdrawal request recorded successfully" },
    ];
  }
  if (routeId === "in-bank" || providerLabel.toLowerCase().includes("bank")) {
    return [
      { title: "Beneficiary Check", description: "Validating bank account and IFSC code" },
      { title: "Banking Rail", description: `Routing to ${providerLabel} via IMPS` },
      { title: "Processing Queue", description: "Queued for settlement authorization" },
      { title: "Payout Confirmed", description: "Bank withdrawal instruction recorded" },
    ];
  }
  return [
    { title: "Eligibility Check", description: "Verifying balance and account parameters" },
    { title: "Routing Channel", description: `Connecting to ${providerLabel}` },
    { title: "Processing Queue", description: "Instruction queued for payout release" },
    { title: "Request Confirmed", description: "Withdrawal request recorded successfully" },
  ];
}

/* ─── Component ─── */

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
  paymentMethodId,
  paymentMethodName,
  exchangeRate,
  fee = 0,
  errorMessage,
  onRetry,
  onViewReceipt,
  onCancel,
}: PaymentAnimationProps) {
  const isWithdrawal = type === "withdrawal";
  const isBackendDone = state === "completed";
  const isFailed = state === "failed";
  const isCancelled = state === "cancelled";
  const isCrossCurrency = sourceCurrency !== destinationCurrency;

  // Resolve payment provider asset authoritatively
  const paymentAsset = resolvePaymentAsset(
    paymentMethodName || paymentMethodId,
    recipientCode.includes("@") ? recipientCode : undefined,
    paymentMethodName,
    destinationCurrency,
    isWithdrawal ? paymentMethodId || "withdrawal" : "moonlight",
    isWithdrawal ? "withdrawal" : "transfer",
  );

  const stages = isWithdrawal
    ? getWithdrawalStages(paymentAsset.label, paymentMethodId)
    : getTransferStages(paymentAsset.label);

  const totalStages = stages.length;

  // Animation timeline controller
  const [visualStage, setVisualStage] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const backendDoneRef = useRef(isBackendDone);
  backendDoneRef.current = isBackendDone;

  // Step intervals: internal transfer ~1.2s per step (total 5-6s), withdrawal ~0.9s per step (total 3.5s)
  const stepMs = isWithdrawal ? 900 : 1200;

  useEffect(() => {
    if (isFailed || isCancelled) return;

    let mounted = true;
    const timer = setInterval(() => {
      if (!mounted) return;
      setVisualStage((prev) => {
        const nextStage = prev + 1;
        // Can only reach final stage if backend is done
        if (nextStage >= totalStages - 1) {
          if (backendDoneRef.current) {
            return totalStages - 1;
          }
          // Hold at penultimate stage
          return Math.min(prev, totalStages - 2);
        }
        return nextStage;
      });
    }, stepMs);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [isWithdrawal, isFailed, isCancelled, totalStages, stepMs]);

  // If backend finishes while we're at or past penultimate stage, advance
  useEffect(() => {
    if (isBackendDone && visualStage >= totalStages - 2) {
      const t = setTimeout(() => {
        setVisualStage(totalStages - 1);
        setShowComplete(true);
      }, 400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isBackendDone, visualStage, totalStages]);

  // Mark complete when visual reaches final stage AND backend is done
  useEffect(() => {
    if (visualStage === totalStages - 1 && isBackendDone) {
      setShowComplete(true);
    }
  }, [visualStage, totalStages, isBackendDone]);

  const isComplete = showComplete && isBackendDone;
  const isTerminal = isComplete || isFailed || isCancelled;

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative mx-auto w-full max-w-sm animate-in fade-in duration-200"
    >
      {/* Amount Hero */}
      <div className="text-center mb-6">
        <p className="text-[11px] font-semibold tracking-[0.15em] text-muted-foreground uppercase">
          {isWithdrawal ? "Withdrawal" : "Transfer"}
        </p>
        <h2 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight text-foreground tabular-nums">
          {formatMoney(destinationAmount, destinationCurrency)}
        </h2>
        {isCrossCurrency && exchangeRate && (
          <p className="mt-1 text-xs text-muted-foreground font-mono">
            {formatMoney(sourceAmount, sourceCurrency)} · 1 {sourceCurrency} ≈{" "}
            {exchangeRate.toFixed(2)} {destinationCurrency}
          </p>
        )}
      </div>

      {/* Journey Timeline */}
      <div className="space-y-0">
        {stages.map((stage, idx) => {
          const isDone = isComplete ? true : visualStage > idx;
          const isCurrent = !isTerminal && visualStage === idx;
          const isPending = !isDone && !isCurrent;
          const isLast = idx === totalStages - 1;
          const showProviderLogo = idx === 1; // Stage 2: Payment method

          return (
            <React.Fragment key={idx}>
              {/* Stage Row */}
              <div
                className={cn(
                  "flex items-start gap-3 py-3 px-1 transition-all duration-300",
                  isCurrent && "anim-stage-enter",
                  isDone && !isLast && "opacity-60",
                )}
                style={isCurrent ? { animationDelay: `${idx * 0.08}s` } : undefined}
              >
                {/* Stage Indicator */}
                <div className="flex flex-col items-center pt-0.5">
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300 shrink-0",
                      isFailed && isCurrent
                        ? "bg-destructive/15 text-destructive border border-destructive/30"
                        : isDone
                          ? "bg-emerald-500 text-white"
                          : isCurrent
                            ? "bg-primary text-primary-foreground ring-2 ring-primary/20"
                            : "bg-secondary text-muted-foreground border border-border/50",
                    )}
                  >
                    {isDone ? (
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    ) : isFailed && isCurrent ? (
                      <AlertCircle className="h-3.5 w-3.5" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>
                </div>

                {/* Stage Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-semibold transition-colors duration-200",
                        isCurrent
                          ? "text-foreground"
                          : isDone
                            ? "text-muted-foreground"
                            : "text-muted-foreground/50",
                      )}
                    >
                      {stage.title}
                    </span>
                    {isCurrent && !isFailed && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary anim-subtle-pulse" />
                    )}
                  </div>
                  <p
                    className={cn(
                      "text-[11px] leading-relaxed mt-0.5 transition-colors duration-200",
                      isCurrent ? "text-muted-foreground" : "text-muted-foreground/40",
                    )}
                  >
                    {isFailed && isCurrent
                      ? errorMessage || "Transaction could not be completed."
                      : stage.description}
                  </p>

                  {/* Provider logo appears at stage 2 */}
                  {showProviderLogo && (isCurrent || isDone) && (
                    <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-border/50 bg-secondary/30 px-3 py-2 anim-stage-enter">
                      <BrandAsset id={paymentAsset.id} size="xs" />
                      <div className="min-w-0">
                        <span className="text-[11px] font-semibold text-foreground block truncate">
                          {paymentAsset.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground block truncate">
                          {recipientCode.includes("@") ? recipientCode : paymentAsset.subtitle}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Connection Line (between stages) */}
              {!isLast && (
                <div className="flex items-stretch gap-3 pl-1">
                  <div className="flex justify-center w-7">
                    <div
                      className={cn(
                        "w-px h-3 transition-all duration-500",
                        isDone ? "bg-emerald-500/40" : isCurrent ? "bg-primary/30" : "bg-border/40",
                      )}
                    />
                  </div>
                  <div className="flex-1" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Participants Row */}
      <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-border/50 bg-secondary/20 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block">
            From
          </span>
          <span className="text-[11px] font-semibold text-foreground truncate block">
            {senderName}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground truncate block">
            {senderCode}
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-2 shrink-0">
          <svg width="24" height="12" viewBox="0 0 24 12" className="text-muted-foreground/40">
            <path
              d="M0 6h20M16 2l4 4-4 4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <CountryFlag code={destinationCurrency} circle size="xs" />
        </div>
        <div className="min-w-0 flex-1 text-right">
          <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block">
            To
          </span>
          <span className="text-[11px] font-semibold text-foreground truncate block">
            {recipientName}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground truncate block">
            {recipientCode}
          </span>
        </div>
      </div>

      {/* Fee */}
      {fee > 0 && (
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Fee: {formatMoney(fee, sourceCurrency)}
        </p>
      )}

      {/* Status Summary */}
      <div
        className={cn(
          "mt-4 rounded-xl border px-4 py-3 text-center transition-all duration-300",
          isComplete
            ? "border-emerald-500/30 bg-emerald-500/5"
            : isFailed
              ? "border-destructive/30 bg-destructive/5"
              : isCancelled
                ? "border-border bg-secondary/30"
                : "border-primary/15 bg-primary/[0.03]",
        )}
      >
        <div className="flex items-center justify-center gap-2">
          {isComplete ? (
            <>
              <div className="anim-success-scale">
                <Check className="h-5 w-5 text-emerald-500 stroke-[2.5]" />
              </div>
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                {isWithdrawal ? "Withdrawal request recorded" : "Payment complete"}
              </span>
            </>
          ) : isFailed ? (
            <>
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-semibold text-destructive">
                Request could not be processed
              </span>
            </>
          ) : isCancelled ? (
            <>
              <XCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-muted-foreground">
                Transaction cancelled
              </span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-primary anim-subtle-pulse" />
              <span className="text-xs font-medium text-foreground">
                {stages[Math.min(visualStage, totalStages - 1)]?.description}
              </span>
            </>
          )}
        </div>
        {isComplete && isWithdrawal && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            12-hour compliance review initiated
          </p>
        )}
        {isFailed && errorMessage && (
          <p className="mt-1 text-[11px] text-muted-foreground">{errorMessage}</p>
        )}
      </div>

      {/* Progress Bar (non-terminal only) */}
      {!isTerminal && (
        <div className="mt-3 h-1 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${((visualStage + 1) / totalStages) * 100}%` }}
          />
        </div>
      )}

      {/* Actions */}
      <div className="mt-5 space-y-2">
        {isComplete && onViewReceipt && (
          <button
            onClick={onViewReceipt}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-95 transition-all shadow-soft cursor-pointer active:scale-[0.98] touch-manipulation anim-stage-enter"
          >
            <Receipt className="h-4 w-4" />
            {isWithdrawal ? "View confirmation" : "View receipt"}
          </button>
        )}

        {isFailed && onRetry && (
          <button
            onClick={onRetry}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-destructive px-4 py-3.5 text-sm font-semibold text-destructive-foreground hover:opacity-90 transition-all shadow-sm cursor-pointer active:scale-[0.98] touch-manipulation"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        )}

        {!isTerminal && onCancel && (
          <button
            onClick={onCancel}
            className="w-full text-center py-2 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
