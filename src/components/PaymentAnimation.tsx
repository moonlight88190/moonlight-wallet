import React, { useEffect, useState, useRef } from "react";
import {
  Check,
  AlertCircle,
  XCircle,
  RefreshCw,
  Receipt,
  ArrowRight,
  Clock,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { BrandAsset, CountryFlag } from "@/components/AssetComponents";
import { resolvePaymentAsset } from "@/lib/assets";
import { formatMoney } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/Logo";

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

/* ─── Stage definitions for internal transfers ─── */

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

/* ─── Main PaymentAnimation Component ─── */

export function PaymentAnimation(props: PaymentAnimationProps) {
  if (props.type === "withdrawal") {
    return <WithdrawalAnimationView {...props} />;
  }
  return <TransferAnimationView {...props} />;
}

/* ─── Bespoke Outbound Withdrawal Animation View ─── */

function WithdrawalAnimationView({
  state,
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
  const isBackendDone = state === "completed";
  const isFailed = state === "failed";
  const isCancelled = state === "cancelled";
  const isCrossCurrency = sourceCurrency !== destinationCurrency;

  const paymentAsset = resolvePaymentAsset(
    paymentMethodName || paymentMethodId,
    recipientCode.includes("@") ? recipientCode : undefined,
    paymentMethodName,
    destinationCurrency,
    paymentMethodId || "withdrawal",
    "withdrawal",
  );

  // 5 realistic banking clearance stages (total ~7.2s sequence)
  const withdrawalStages = [
    {
      title: "Wallet Debit & Ledger Signature",
      description: "Securing balance, deducting fee & writing immutable double-entry ledger record",
      pill: "Ledger Signed",
      corridorStatus: "Debiting Balance",
      progress: 20,
    },
    {
      title: `Connecting ${paymentAsset.label} Gateway`,
      description: "Establishing encrypted TLS 1.3 socket with national payment clearance switch",
      pill: "Rail Connected",
      corridorStatus: "Switch Handshake",
      progress: 42,
    },
    {
      title: "Beneficiary Account Validation",
      description: `Validating recipient account credentials (${recipientCode}) with receiving institution`,
      pill: "Account Validated",
      corridorStatus: "Validating Account",
      progress: 65,
    },
    {
      title: "Outbound Batch Allocation",
      description: "Transaction allocated to settlement dispatch queue with 5–7 business days value date",
      pill: "Batch Queued",
      corridorStatus: "Batch Allocation",
      progress: 86,
    },
    {
      title: "Settlement Reference Confirmed",
      description: "Disbursement payload registered. Payout tracking active and queued for dispatch",
      pill: "Dispatched",
      corridorStatus: "Dispatched & Queued",
      progress: 100,
    },
  ];

  const totalStages = withdrawalStages.length;
  const [visualStage, setVisualStage] = useState(0);
  const [progressPercent, setProgressPercent] = useState(15);
  const [showComplete, setShowComplete] = useState(false);
  const backendDoneRef = useRef(isBackendDone);
  backendDoneRef.current = isBackendDone;

  // Realistic stage pacing: 1400ms, 1500ms, 1500ms, 1500ms, 1300ms (~7.2 seconds total)
  const stageDurations = [1400, 1500, 1500, 1500, 1300];

  useEffect(() => {
    if (isFailed || isCancelled) return;

    let current = 0;
    const timeouts: NodeJS.Timeout[] = [];

    const scheduleNext = (index: number) => {
      if (index >= totalStages - 1) {
        // At final stage, advance progress to 96% and wait for backend completion
        setProgressPercent(96);
        return;
      }
      const dur = stageDurations[index] || 1500;
      const t = setTimeout(() => {
        current = index + 1;
        setVisualStage(current);
        setProgressPercent(withdrawalStages[current]?.progress || 90);
        scheduleNext(current);
      }, dur);
      timeouts.push(t);
    };

    scheduleNext(0);

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [isFailed, isCancelled, totalStages]);

  // When backend is completed and we've reached stage 4, transition to complete
  useEffect(() => {
    if (isBackendDone && visualStage >= totalStages - 1) {
      setProgressPercent(100);
      const t = setTimeout(() => setShowComplete(true), 500);
      return () => clearTimeout(t);
    }
  }, [isBackendDone, visualStage, totalStages]);

  const isComplete = showComplete && isBackendDone;
  const isTerminal = isComplete || isFailed || isCancelled;

  const currentCorridorText =
    isComplete
      ? "Clearing Handshake Complete"
      : withdrawalStages[visualStage]?.corridorStatus || "In Transit";

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative mx-auto w-full max-w-md animate-in fade-in duration-300 space-y-4"
    >
      {/* ─── Main Dispatch Card ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-card space-y-5">
        {/* Specular accent line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        {/* Top Header: Badge & 5-7 Days Promise */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-bold tracking-wider text-primary uppercase">
              Outbound Bank Dispatch
            </span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            5–7 Business Days
          </span>
        </div>

        {/* Amount Hero */}
        <div className="text-center py-2 space-y-1">
          <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Total Withdrawn
          </p>
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-mono">
            {formatMoney(destinationAmount, destinationCurrency)}
          </div>
          {isCrossCurrency && exchangeRate && (
            <p className="text-xs text-muted-foreground font-mono">
              {formatMoney(sourceAmount, sourceCurrency)} · FX Rate: {exchangeRate.toFixed(2)}
            </p>
          )}
          {fee > 0 && (
            <p className="text-[11px] text-muted-foreground font-mono">
              Processing Fee: {formatMoney(fee, sourceCurrency)}
            </p>
          )}
        </div>

        {/* Real-time Smooth Progress Indicator */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              {!isTerminal && (
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              )}
              {isComplete
                ? "Dispatched & Confirmed"
                : withdrawalStages[visualStage]?.title || "Processing..."}
            </span>
            <span className="font-mono font-bold text-primary text-xs">
              {progressPercent}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden p-0.5">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                isComplete
                  ? "bg-emerald-500"
                  : isFailed
                    ? "bg-destructive"
                    : "bg-gradient-to-r from-primary/80 to-primary",
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* ─── Interactive Clearing Corridor (Visual Bridge) ─── */}
        <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Clearing Pipeline</span>
            <span className="text-primary font-mono">{currentCorridorText}</span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            {/* Origin Node: Moonlight Wallet */}
            <div className="flex flex-col items-center gap-1.5 flex-1 text-center">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-card border border-border/60 shadow-sm">
                <LogoMark className="h-6 w-6" />
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white text-[9px] font-bold">
                  ✓
                </span>
              </div>
              <span className="text-[11px] font-bold text-foreground truncate max-w-[90px]">
                Moonlight
              </span>
              <span className="text-[9px] text-muted-foreground">Balance Debited</span>
            </div>

            {/* Pulsing Interbank Transmission Bridge */}
            <div className="flex-1 flex flex-col items-center px-1">
              <div className="relative w-full flex items-center justify-center py-2">
                <div className="h-1.5 w-full rounded-full bg-secondary/80 overflow-hidden relative">
                  <div
                    className={cn(
                      "h-full rounded-full bg-gradient-to-r from-primary/30 via-primary to-primary/30 transition-all duration-700",
                      isComplete ? "w-full bg-emerald-500" : "w-3/4 animate-pulse",
                    )}
                  />
                </div>
                <div className="absolute flex items-center justify-center rounded-full bg-card border border-border/60 px-2 py-0.5 shadow-sm text-[9px] font-mono text-muted-foreground">
                  <ArrowRight
                    className={cn("h-3 w-3 text-primary", !isComplete && "animate-pulse")}
                  />
                </div>
              </div>
              <span className="text-[9px] font-mono text-muted-foreground text-center mt-0.5 truncate max-w-[120px]">
                {currentCorridorText}
              </span>
            </div>

            {/* Destination Node: External Rail */}
            <div className="flex flex-col items-center gap-1.5 flex-1 text-center">
              <div
                className={cn(
                  "relative flex h-12 w-12 items-center justify-center rounded-2xl bg-card border shadow-sm transition-all duration-300",
                  isComplete
                    ? "border-emerald-500/50 ring-2 ring-emerald-500/20"
                    : "border-border/60",
                )}
              >
                <BrandAsset id={paymentAsset.id} size="sm" />
                {isComplete && (
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white text-[9px] font-bold anim-success-scale">
                    ✓
                  </span>
                )}
              </div>
              <span className="text-[11px] font-bold text-foreground truncate max-w-[100px]">
                {paymentAsset.label}
              </span>
              <span className="text-[9px] text-muted-foreground truncate max-w-[90px]">
                {recipientCode}
              </span>
            </div>
          </div>
        </div>

        {/* ─── Real Banking Transit Milestones (5 Stages) ─── */}
        <div className="space-y-2 text-xs">
          {withdrawalStages.map((st, i) => {
            const isDone = isComplete || visualStage > i;
            const isCurrent = !isTerminal && visualStage === i;
            return (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-2.5 transition-all duration-300",
                  isDone
                    ? "border-emerald-500/25 bg-emerald-500/[0.04]"
                    : isCurrent
                      ? "border-primary/30 bg-primary/[0.04] shadow-xs"
                      : "border-border/30 bg-muted/20 opacity-40",
                )}
              >
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all",
                    isDone
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/20"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {isDone ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p
                      className={cn(
                        "font-semibold text-xs transition-colors",
                        isDone
                          ? "text-emerald-700 dark:text-emerald-300"
                          : isCurrent
                            ? "text-foreground"
                            : "text-muted-foreground",
                      )}
                    >
                      {st.title}
                    </p>
                    <span
                      className={cn(
                        "text-[9px] font-mono px-1.5 py-0.5 rounded",
                        isDone
                          ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                          : isCurrent
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground bg-muted/50",
                      )}
                    >
                      {isDone ? "Done" : st.pill}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {st.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── 5-7 Business Days Reassurance Card ─── */}
        <div className="flex items-center justify-between rounded-2xl bg-muted/40 border border-border/50 p-3.5 text-xs">
          <div className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-primary shrink-0" />
            <div>
              <p className="font-semibold text-foreground text-[11px]">
                Standard Banking Delivery Window
              </p>
              <p className="text-[10px] text-muted-foreground">
                Funds reflect in your beneficiary statement in 5–7 business days
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-primary font-mono shrink-0">
            5–7 Days
          </span>
        </div>

        {/* ─── Beneficiary & Payout Account Details ─── */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/30">
          <div className="rounded-xl bg-muted/30 border border-border/30 p-2.5">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Beneficiary
            </span>
            <span className="font-semibold text-foreground truncate block mt-0.5 text-xs">
              {recipientName || senderName}
            </span>
          </div>
          <div className="rounded-xl bg-muted/30 border border-border/30 p-2.5">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Payout Destination
            </span>
            <span className="font-mono font-medium text-foreground truncate block mt-0.5 text-[11px]">
              {recipientCode}
            </span>
          </div>
        </div>

        {/* ─── Terminal States & Actions ─── */}
        {isComplete ? (
          <div className="space-y-3 pt-2">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
                <Check className="h-4 w-4 stroke-[3]" />
                <span>Withdrawal Dispatched to Rail</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Your payout instruction has been registered. Expected in your account within 5–7 business days.
              </p>
            </div>

            {onViewReceipt && (
              <button
                type="button"
                onClick={onViewReceipt}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-xs font-bold tracking-wider uppercase text-primary-foreground shadow-md hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer touch-manipulation"
              >
                <Receipt className="h-4 w-4" />
                <span>View Settlement Record</span>
              </button>
            )}
          </div>
        ) : isFailed ? (
          <div className="space-y-3 pt-2">
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3.5 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-destructive font-semibold text-xs">
                <AlertCircle className="h-4 w-4" />
                <span>Withdrawal Failed</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {errorMessage || "Unable to dispatch withdrawal request."}
              </p>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-destructive px-4 py-3.5 text-xs font-bold tracking-wider uppercase text-destructive-foreground shadow-md hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>
            )}
          </div>
        ) : (
          <div className="pt-1">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full text-center py-2 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Standard Peer-to-Peer Transfer Animation View ─── */

function TransferAnimationView({
  state,
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
  const isBackendDone = state === "completed";
  const isFailed = state === "failed";
  const isCancelled = state === "cancelled";
  const isCrossCurrency = sourceCurrency !== destinationCurrency;

  const paymentAsset = resolvePaymentAsset(
    paymentMethodName || paymentMethodId,
    recipientCode.includes("@") ? recipientCode : undefined,
    paymentMethodName,
    destinationCurrency,
    "moonlight",
    "transfer",
  );

  const stages = getTransferStages(paymentAsset.label);
  const totalStages = stages.length;

  const [visualStage, setVisualStage] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const backendDoneRef = useRef(isBackendDone);
  backendDoneRef.current = isBackendDone;

  useEffect(() => {
    if (isFailed || isCancelled) return;

    let mounted = true;
    const timer = setInterval(() => {
      if (!mounted) return;
      setVisualStage((prev) => {
        const nextStage = prev + 1;
        if (nextStage >= totalStages - 1) {
          if (backendDoneRef.current) {
            return totalStages - 1;
          }
          return Math.min(prev, totalStages - 2);
        }
        return nextStage;
      });
    }, 1200);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [isFailed, isCancelled, totalStages]);

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
          Transfer
        </p>
        <h2 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight text-foreground tabular-nums font-mono">
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
          const isLast = idx === totalStages - 1;
          const showProviderLogo = idx === 1;

          return (
            <React.Fragment key={idx}>
              <div
                className={cn(
                  "flex items-start gap-3 py-3 px-1 transition-all duration-300",
                  isCurrent && "anim-stage-enter",
                  isDone && !isLast && "opacity-60",
                )}
                style={isCurrent ? { animationDelay: `${idx * 0.08}s` } : undefined}
              >
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
        <p className="mt-2 text-center text-[10px] text-muted-foreground font-mono">
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
                Payment Complete
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
            <span>View Receipt</span>
          </button>
        )}

        {isFailed && onRetry && (
          <button
            onClick={onRetry}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-destructive px-4 py-3.5 text-sm font-semibold text-destructive-foreground hover:opacity-90 transition-all shadow-sm cursor-pointer active:scale-[0.98] touch-manipulation"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
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
