import React from "react";
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
} from "lucide-react";
import { BrandAsset, CountryFlag } from "@/components/AssetComponents";
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
  const isCompleted = state === "completed";
  const isFailed = state === "failed";
  const isCancelled = state === "cancelled";
  const isProcessing = state === "processing" || state === "validating" || state === "confirming";
  const isCrossCurrency = sourceCurrency !== destinationCurrency;

  // Resolve method ID and name for the payment corridor node
  const resolvedMethodId =
    paymentMethodId ||
    (recipientCode.includes("@")
      ? "upi"
      : destinationCurrency === "INR"
        ? "upi"
        : isWithdrawal
          ? "in-bank"
          : "moonlight");

  const resolvedMethodName =
    paymentMethodName ||
    (resolvedMethodId === "google-pay"
      ? "Google Pay"
      : resolvedMethodId === "phonepe"
        ? "PhonePe"
        : resolvedMethodId === "paytm"
          ? "Paytm"
          : resolvedMethodId === "bhim"
            ? "BHIM UPI"
            : resolvedMethodId === "amazon-pay"
              ? "Amazon Pay"
              : resolvedMethodId === "upi"
                ? "UPI Direct"
                : resolvedMethodId === "sbi"
                  ? "State Bank of India"
                  : resolvedMethodId === "hdfc"
                    ? "HDFC Bank"
                    : resolvedMethodId === "icici"
                      ? "ICICI Bank"
                      : resolvedMethodId === "axis"
                        ? "Axis Bank"
                        : resolvedMethodId === "yes-bank"
                          ? "YES BANK"
                          : isWithdrawal
                            ? "Payout Rail"
                            : "Moonlight Wallet");

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-border/80 bg-card p-4 sm:p-6 shadow-xl backdrop-blur-xl transition-all"
    >
      {/* Top Header: Badge, Currency & Destination Amount */}
      <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
            {isWithdrawal ? <Wallet className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
          </span>
          <div className="min-w-0">
            <span className="text-xs font-bold text-foreground tracking-tight block truncate">
              {isWithdrawal ? "Payout Transfer" : "Wallet Transfer"}
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

      {/* Structured Pipeline Journey: Source -> Selected Rail -> Recipient */}
      <div className="space-y-2 mb-4">
        {/* Node 1: Sender (Moonlight Account) */}
        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-secondary/30 p-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary shrink-0 font-bold text-xs">
              ML
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Origin
              </div>
              <div className="text-xs font-semibold text-foreground truncate">
                {senderName}
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
              "flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-300",
              isCompleted
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                : isFailed
                  ? "border-destructive bg-destructive/10 text-destructive"
                  : "border-primary/50 bg-background text-primary",
            )}
          >
            <ArrowDown className={cn("h-3.5 w-3.5", isProcessing && "motion-safe:animate-bounce")} />
          </div>
        </div>

        {/* Node 2: Selected Payment Provider / Rail (ALWAYS RETAINED) */}
        <div
          className={cn(
            "flex items-center justify-between rounded-xl border p-2.5 transition-all duration-300",
            isCompleted
              ? "border-emerald-500/40 bg-emerald-500/5 shadow-2xs"
              : isFailed
                ? "border-destructive/30 bg-destructive/5"
                : "border-primary/40 bg-primary/5 shadow-2xs",
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="flex items-center justify-center shrink-0">
              <BrandAsset id={resolvedMethodId} size="sm" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold text-primary uppercase tracking-wider">
                Selected Rail
              </div>
              <div className="text-xs font-bold text-foreground truncate">
                {resolvedMethodName}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {recipientCode.includes("@")
                  ? `VPA: ${recipientCode}`
                  : destinationCurrency === "INR"
                    ? "Instant Indian Clearing"
                    : "Direct Ledger Allocation"}
              </div>
            </div>
          </div>

          <div className="text-right shrink-0 pl-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase",
                isCompleted
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : isFailed
                    ? "bg-destructive/20 text-destructive"
                    : "bg-primary/20 text-primary",
              )}
            >
              {isCompleted ? "Transacted" : isFailed ? "Halted" : "Active Rail"}
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
              "flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-300",
              isCompleted
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                : isFailed
                  ? "border-destructive bg-destructive/10 text-destructive"
                  : "border-primary/50 bg-background text-primary",
            )}
          >
            {isCompleted ? (
              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
            ) : isFailed ? (
              <AlertCircle className="h-3.5 w-3.5" />
            ) : (
              <ArrowDown className={cn("h-3.5 w-3.5", isProcessing && "motion-safe:animate-bounce")} />
            )}
          </div>
        </div>

        {/* Node 3: Beneficiary / Destination */}
        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-secondary/30 p-2.5">
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

      {/* Transaction Status Summary Box (Real Product State, No Fake Claims) */}
      <div
        className={cn(
          "rounded-xl border p-3 text-center transition-all duration-200",
          isCompleted
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            : isFailed
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : isCancelled
                ? "border-muted bg-secondary/40 text-muted-foreground"
                : "border-primary/20 bg-primary/5 text-foreground",
        )}
      >
        <div className="flex items-center justify-center gap-1.5 font-bold text-xs">
          {isCompleted ? (
            <>
              <Check className="h-4 w-4 text-emerald-500 stroke-[3]" />
              <span>Transaction Settled Successfully</span>
            </>
          ) : isFailed ? (
            <>
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span>Transaction Could Not Be Processed</span>
            </>
          ) : isCancelled ? (
            <>
              <XCircle className="h-4 w-4 text-muted-foreground" />
              <span>Transaction Cancelled</span>
            </>
          ) : (
            <>
              <div className="h-2 w-2 rounded-full bg-primary motion-safe:animate-ping" />
              <span>Simulating Moonlight Ledger Clearance...</span>
            </>
          )}
        </div>

        <p className="mt-1 text-[11px] text-muted-foreground leading-normal">
          {isCompleted
            ? "Balance debited and internal ledger snapshot recorded."
            : isFailed
              ? errorMessage || "Unable to complete request. Your balance was not charged."
              : isCancelled
                ? "The transfer was aborted before settlement."
                : "Verifying account rules and applying security balance lock."}
        </p>

        {fee > 0 && (
          <div className="mt-1.5 pt-1.5 border-t border-border/30 text-[10px] text-muted-foreground">
            Transaction Charge (10%): {formatMoney(fee, sourceCurrency)}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 space-y-2">
        {isCompleted && onViewReceipt && (
          <button
            onClick={onViewReceipt}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-3 text-xs font-semibold text-primary-foreground hover:opacity-95 transition-all shadow-md cursor-pointer active:scale-[0.98] touch-manipulation"
          >
            <Receipt className="h-3.5 w-3.5" />
            View Transaction Receipt
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

        {!isCompleted && !isFailed && onCancel && (
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
