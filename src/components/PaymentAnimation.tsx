import React, { useEffect, useState, useRef } from "react";
import {
  Check,
  AlertCircle,
  ArrowDown,
  RefreshCw,
  Receipt,
  XCircle,
  Building2,
  Wallet,
  ShieldCheck,
  Smartphone,
  ChevronRight,
} from "lucide-react";
import { BrandAsset, CountryFlag } from "@/components/AssetComponents";
import { resolvePaymentAsset } from "@/lib/assets";
import { formatMoney } from "@/lib/currency";
import { cn } from "@/lib/utils";

export interface PaymentAnimationProps {
  state: "validating" | "processing" | "completed" | "failed" | "cancelled" | "confirming";
  type?: "transfer" | "withdrawal";
  senderName: string;
  senderCode: string;
  recipientName: string;
  recipientCode: string;
  sourceAmount: number;
  sourceCurrency: string;
  destinationAmount: number;
  destinationCurrency: string;
  paymentMethodId?: string;
  paymentMethodName?: string;
  exchangeRate?: number;
  fee?: number;
  errorMessage?: string;
  onRetry?: () => void;
  onViewReceipt?: () => void;
  onCancel?: () => void;
}

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
  const isBackendCompleted = state === "completed";
  const isFailed = state === "failed";
  const isCancelled = state === "cancelled";
  const isCrossCurrency = sourceCurrency !== destinationCurrency;

  // Resolve payment provider via the shared authoritative resolver
  const paymentAsset = resolvePaymentAsset(
    paymentMethodName || paymentMethodId,
    recipientCode.includes("@") ? recipientCode : undefined,
    paymentMethodName,
    destinationCurrency,
  );

  // Progressive visual stage controller
  // For transfer: 1 -> 2 -> 3 -> 4 -> 5 (Completed) (~5.5s total)
  // For withdrawal: 1 -> 2 -> 3 -> 4 (Recorded) (~3.5s total)
  const maxVisualSteps = isWithdrawal ? 4 : 5;
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [canShowComplete, setCanShowComplete] = useState<boolean>(false);
  const backendDoneRef = useRef(isBackendCompleted);
  backendDoneRef.current = isBackendCompleted;

  useEffect(() => {
    if (isFailed || isCancelled) {
      return;
    }

    let isMounted = true;
    const stepIntervalMs = isWithdrawal ? 900 : 1200;

    const timer = setInterval(() => {
      if (!isMounted) return;
      setCurrentStep((prev) => {
        if (prev < maxVisualSteps - 1) {
          return prev + 1;
        } else if (prev === maxVisualSteps - 1) {
          // At the second to last step, only advance to final complete if the backend is also done!
          if (backendDoneRef.current) {
            setCanShowComplete(true);
            return maxVisualSteps;
          }
          return prev;
        }
        return prev;
      });
    }, stepIntervalMs);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [isWithdrawal, isFailed, isCancelled, maxVisualSteps]);

  // If backend finishes after we reached step (maxVisualSteps - 1), unlock completion immediately
  useEffect(() => {
    if (isBackendCompleted && currentStep >= maxVisualSteps - 1) {
      const delay = setTimeout(() => {
        setCanShowComplete(true);
        setCurrentStep(maxVisualSteps);
      }, 500);
      return () => clearTimeout(delay);
    }
  }, [isBackendCompleted, currentStep, maxVisualSteps]);

  const isFinalComplete = canShowComplete && isBackendCompleted;

  // Truthful status messaging
  const getTransferStepDescription = (step: number) => {
    switch (step) {
      case 1:
        return "Reviewing payment details & balance...";
      case 2:
        return `Routing to ${paymentAsset.label}...`;
      case 3:
        return "Securing transaction parameters...";
      case 4:
        return "Updating Moonlight balance & ledger snapshot...";
      case 5:
        return "Payment processed & settled successfully.";
      default:
        return "Processing transaction...";
    }
  };

  const getWithdrawalStepDescription = (step: number) => {
    switch (step) {
      case 1:
        return "Checking account balance & eligibility...";
      case 2:
        return `Authorizing payout via ${paymentAsset.label}...`;
      case 3:
        return "Recording beneficiary details & compliance window...";
      case 4:
        return "Withdrawal request recorded & queued for review.";
      default:
        return "Processing withdrawal...";
    }
  };

  const activeDescription = isFailed
    ? errorMessage || "Transaction could not be completed."
    : isCancelled
      ? "Transaction cancelled."
      : isWithdrawal
        ? getWithdrawalStepDescription(currentStep)
        : getTransferStepDescription(currentStep);

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-xl backdrop-blur-xl transition-all animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
            {isWithdrawal ? <Wallet className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <span className="text-xs font-bold text-foreground tracking-tight block truncate">
              {isWithdrawal ? "Moonlight Withdrawal" : "Moonlight Transfer"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-mono text-sm font-bold text-foreground tabular-nums">
            {formatMoney(destinationAmount, destinationCurrency)}
          </span>
          <CountryFlag code={destinationCurrency} circle size="xs" />
        </div>
      </div>

      {/* Progressive Step Progress Indicator */}
      <div className="flex items-center gap-1.5 mb-5 px-1">
        {Array.from({ length: maxVisualSteps }).map((_, idx) => {
          const stepNum = idx + 1;
          const isDone = currentStep > stepNum || (isFinalComplete && stepNum === maxVisualSteps);
          const isCurrent = currentStep === stepNum && !isFinalComplete && !isFailed;
          return (
            <div
              key={idx}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-300",
                isFailed
                  ? "bg-destructive/40"
                  : isDone
                    ? "bg-emerald-500"
                    : isCurrent
                      ? "bg-primary animate-pulse"
                      : "bg-secondary",
              )}
            />
          );
        })}
      </div>

      {/* Transaction Journey Cards: Source -> Selected Rail -> Destination */}
      <div className="space-y-2.5 mb-4">
        {/* Node 1: Sender / Source */}
        <div
          className={cn(
            "flex items-center justify-between rounded-xl border p-2.5 transition-all duration-300",
            currentStep >= 1
              ? "border-border/60 bg-secondary/30"
              : "border-border/30 opacity-60",
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary shrink-0 font-bold text-xs">
              ML
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Origin Account
              </div>
              <div className="text-xs font-semibold text-foreground truncate">
                {senderName || "Moonlight Wallet"}
              </div>
              <div className="font-mono text-[10px] text-muted-foreground truncate">
                {senderCode}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] font-semibold text-muted-foreground">Debited</div>
            <div className="font-mono text-xs font-bold text-foreground tabular-nums">
              {formatMoney(sourceAmount, sourceCurrency)}
            </div>
          </div>
        </div>

        {/* Transition Line 1 */}
        <div className="flex justify-center -my-1 relative z-10">
          <div
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full border transition-all duration-300",
              currentStep >= 2
                ? "border-primary/50 bg-background text-primary"
                : "border-border/40 bg-muted text-muted-foreground",
            )}
          >
            <ArrowDown className="h-3 w-3" />
          </div>
        </div>

        {/* Node 2: Selected Payment Provider / Rail (ALWAYS RETAINED) */}
        <div
          className={cn(
            "flex items-center justify-between rounded-xl border p-2.5 transition-all duration-300",
            currentStep >= 2
              ? isFinalComplete
                ? "border-emerald-500/40 bg-emerald-500/5 shadow-2xs"
                : isFailed
                  ? "border-destructive/30 bg-destructive/5"
                  : "border-primary/40 bg-primary/5 shadow-2xs"
              : "border-border/30 opacity-60",
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="flex items-center justify-center shrink-0">
              <BrandAsset id={paymentAsset.id} size="sm" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold text-primary uppercase tracking-wider">
                {isWithdrawal ? "Payout Rail" : "Payment Method"}
              </div>
              <div className="text-xs font-bold text-foreground truncate">
                {paymentAsset.label}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {recipientCode.includes("@")
                  ? `VPA: ${recipientCode}`
                  : paymentAsset.subtitle}
              </div>
            </div>
          </div>

          <div className="text-right shrink-0 pl-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase",
                isFinalComplete
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : isFailed
                    ? "bg-destructive/20 text-destructive"
                    : currentStep >= 2
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground",
              )}
            >
              {isFinalComplete ? "Settled" : isFailed ? "Halted" : "Active Rail"}
            </span>
            {isCrossCurrency && exchangeRate && (
              <div className="font-mono text-[9px] text-muted-foreground mt-0.5">
                1 {sourceCurrency} ≈ {exchangeRate.toFixed(2)} {destinationCurrency}
              </div>
            )}
          </div>
        </div>

        {/* Transition Line 2 */}
        <div className="flex justify-center -my-1 relative z-10">
          <div
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full border transition-all duration-300",
              currentStep >= 3
                ? "border-primary/50 bg-background text-primary"
                : "border-border/40 bg-muted text-muted-foreground",
            )}
          >
            <ArrowDown className="h-3 w-3" />
          </div>
        </div>

        {/* Node 3: Beneficiary / Destination */}
        <div
          className={cn(
            "flex items-center justify-between rounded-xl border p-2.5 transition-all duration-300",
            currentStep >= 3
              ? "border-border/60 bg-secondary/30"
              : "border-border/30 opacity-60",
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground shrink-0 font-bold text-xs">
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Beneficiary
              </div>
              <div className="text-xs font-semibold text-foreground truncate">
                {recipientName}
              </div>
              <div className="font-mono text-[10px] text-muted-foreground truncate">
                {recipientCode}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] font-semibold text-muted-foreground">Credited</div>
            <div className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatMoney(destinationAmount, destinationCurrency)}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Status Summary Box (Truthful Financial Wording, No Fake Theater) */}
      <div
        className={cn(
          "rounded-xl border p-3 text-center transition-all duration-200",
          isFinalComplete
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            : isFailed
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : isCancelled
                ? "border-muted bg-secondary/40 text-muted-foreground"
                : "border-primary/20 bg-primary/5 text-foreground",
        )}
      >
        <div className="flex items-center justify-center gap-1.5 font-bold text-xs">
          {isFinalComplete ? (
            <>
              <Check className="h-4 w-4 text-emerald-500 stroke-[3]" />
              <span>{isWithdrawal ? "Withdrawal Request Recorded" : "Transaction Settled"}</span>
            </>
          ) : isFailed ? (
            <>
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span>Request Could Not Be Processed</span>
            </>
          ) : isCancelled ? (
            <>
              <XCircle className="h-4 w-4 text-muted-foreground" />
              <span>Transaction Cancelled</span>
            </>
          ) : (
            <>
              <div className="h-2 w-2 rounded-full bg-primary motion-safe:animate-ping" />
              <span>{activeDescription}</span>
            </>
          )}
        </div>

        <p className="mt-1 text-[11px] text-muted-foreground leading-normal">
          {isFinalComplete
            ? isWithdrawal
              ? "Your withdrawal request is logged. 12-hour review stage initiated."
              : "Balance debited and internal ledger snapshot recorded."
            : isFailed
              ? errorMessage || "Unable to complete request. Your balance was not charged."
              : isCancelled
                ? "The transfer was aborted before settlement."
                : "Moonlight Ledger clearance in progress..."}
        </p>

        {fee > 0 && (
          <div className="mt-1.5 pt-1.5 border-t border-border/30 text-[10px] text-muted-foreground">
            Transaction Charge (10%): {formatMoney(fee, sourceCurrency)}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 space-y-2">
        {isFinalComplete && onViewReceipt && (
          <button
            onClick={onViewReceipt}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-3 text-xs font-semibold text-primary-foreground hover:opacity-95 transition-all shadow-md cursor-pointer active:scale-[0.98] touch-manipulation"
          >
            <Receipt className="h-3.5 w-3.5" />
            {isWithdrawal ? "View Withdrawal Confirmation" : "View Transaction Receipt"}
          </button>
        )}

        {isFailed && onRetry && (
          <button
            onClick={onRetry}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-destructive px-4 py-3 text-xs font-semibold text-destructive-foreground hover:opacity-90 transition-all shadow-sm cursor-pointer active:scale-[0.98] touch-manipulation"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry Transaction
          </button>
        )}

        {!isFinalComplete && !isFailed && onCancel && (
          <button
            onClick={onCancel}
            className="w-full text-center py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
