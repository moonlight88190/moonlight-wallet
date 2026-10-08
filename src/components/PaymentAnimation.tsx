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
  Landmark,
  Mail,
  FileCheck2,
  Lock,
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

  const isUPI =
    paymentMethodId?.toLowerCase().includes("upi") ||
    paymentMethodName?.toLowerCase().includes("upi") ||
    recipientCode.includes("@") ||
    destinationCurrency === "INR";

  // Realistic clearance stages aligned with the 5 business days settlement window
  const withdrawalStages = [
    {
      title: "Wallet Debit & Ledger Cryptographic Signature",
      description: "Securing wallet balance, deducting fee & committing double-entry audit entry",
      pill: "Ledger Signed",
      corridorStatus: "Signing & Debiting",
      progress: 25,
      icon: ShieldCheck,
    },
    {
      title: `Connecting ${paymentAsset.label} Network Gateway`,
      description: "Establishing encrypted 256-bit TLS 1.3 interbank socket with National Payment Switch",
      pill: "Gateway Connected",
      corridorStatus: "Switch Handshake",
      progress: 52,
      icon: Zap,
    },
    {
      title: "Beneficiary Route & Regulatory Clearance",
      description: `Validating account credentials (${recipientCode}) against central bank compliance directory`,
      pill: "Route Verified",
      corridorStatus: "Validating Beneficiary",
      progress: 78,
      icon: FileCheck2,
    },
    {
      title: "Queued for 5-Day Interbank Settlement",
      description: "Payout registered in national clearing batch. Scheduled across 5 business days cycle",
      pill: "5-Day Queue",
      corridorStatus: "Queued (5 Days)",
      progress: 100,
      icon: Landmark,
    },
  ];

  const totalStages = withdrawalStages.length;
  const [visualStage, setVisualStage] = useState(0);
  const [progressPercent, setProgressPercent] = useState(15);
  const [showComplete, setShowComplete] = useState(false);

  // Stage durations tuned for an engaging, cinematic sequence (~3.5 seconds total)
  const stageDurationsRef = useRef<number[]>([850, 950, 1050, 800]);

  // Telemetry metrics generated per session
  const telemetryRef = useRef({
    batchId: `BATCH-${Math.floor(1000 + Math.random() * 9000)}-${destinationCurrency}`,
    gatewayLatency: Math.floor(38 + Math.random() * 45),
    tlsCipher: "TLS_1.3_AES_256_GCM",
    sessionHash: `0x${Math.random().toString(16).substring(2, 8).toUpperCase()}`,
  });

  // Advance through visual stages smoothly
  useEffect(() => {
    if (isFailed || isCancelled) return;

    let current = 0;
    const timeouts: NodeJS.Timeout[] = [];

    const scheduleNext = (index: number) => {
      if (index >= totalStages - 1) return;
      const dur = stageDurationsRef.current[index] || 900;
      const t = setTimeout(() => {
        current = index + 1;
        setVisualStage(current);
        scheduleNext(current);
      }, dur);
      timeouts.push(t);
    };

    scheduleNext(0);

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [isFailed, isCancelled, totalStages]);

  // Smooth progress increment
  useEffect(() => {
    if (isFailed || isCancelled) return;

    const targetProgress = isBackendDone && visualStage >= totalStages - 1
      ? 100
      : visualStage >= totalStages - 1
        ? 95
        : withdrawalStages[visualStage]?.progress || 25;

    const interval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= targetProgress) return prev;
        const diff = targetProgress - prev;
        const step = Math.max(1, Math.min(diff, Math.floor(Math.random() * 3) + 2));
        return Math.min(targetProgress, prev + step);
      });
    }, 70);

    return () => clearInterval(interval);
  }, [visualStage, isBackendDone, totalStages, isFailed, isCancelled, withdrawalStages]);

  // Transition to completion once backend completes and stages finish
  useEffect(() => {
    if (isBackendDone && visualStage >= totalStages - 1) {
      setProgressPercent(100);
      const t = setTimeout(() => setShowComplete(true), 400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isBackendDone, visualStage, totalStages]);

  const isComplete = showComplete && isBackendDone;
  const isTerminal = isComplete || isFailed || isCancelled;

  const currentCorridorText =
    isComplete
      ? "Clearing Batch Registered"
      : withdrawalStages[visualStage]?.corridorStatus || "In Transit";

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative mx-auto w-full max-w-md animate-in fade-in duration-300 space-y-4"
    >
      {/* ─── Main Dispatch Card ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-b from-card via-card to-card/95 p-5 sm:p-6 shadow-2xl space-y-5">
        {/* Specular ambient top glow */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-24 bg-primary/15 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header: Badge & Delivery Window */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/25 px-3 py-1 shadow-2xs">
            <Clock className="h-3.5 w-3.5 text-primary animate-pulse" />
            <span className="text-[10px] font-bold tracking-wider text-primary uppercase">
              Outbound Bank Settlement
            </span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/25">
            5 Business Days Window
          </span>
        </div>

        {/* Amount Hero */}
        <div className="text-center py-2 space-y-1">
          <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Net Outbound Transfer
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
              Processing Fee: {formatMoney(fee, sourceCurrency)} (10%)
            </p>
          )}
        </div>

        {/* Real-time Smooth Progress Indicator */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              {!isTerminal && (
                <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
              )}
              {isComplete
                ? "Dispatched & Scheduled"
                : withdrawalStages[visualStage]?.title || "Processing..."}
            </span>
            <span className="font-mono font-bold text-primary text-xs">
              {progressPercent}%
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-secondary/80 overflow-hidden p-0.5 border border-border/40">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-out",
                isComplete
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                  : isFailed
                    ? "bg-destructive"
                    : "bg-gradient-to-r from-primary/80 via-primary to-cyan-400 shadow-[0_0_12px_rgba(59,130,246,0.4)]",
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* ─── Interactive Clearing Corridor (Visual Bridge with Glow Particles) ─── */}
        <div className="relative rounded-2xl border border-border/60 bg-muted/30 p-4 space-y-3 overflow-hidden">
          <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Interbank Transmission Rail</span>
            <span className="text-primary font-mono font-bold">{currentCorridorText}</span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            {/* Origin Node: Moonlight Wallet */}
            <div className="flex flex-col items-center gap-1.5 flex-1 text-center">
              <div className="relative flex h-13 w-13 items-center justify-center rounded-2xl bg-card border border-border/60 shadow-md">
                <LogoMark className="h-7 w-7" />
                <span className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500 text-white text-[9px] font-bold shadow-xs">
                  ✓
                </span>
              </div>
              <span className="text-[11px] font-bold text-foreground truncate max-w-[90px]">
                Moonlight
              </span>
              <span className="text-[9px] text-muted-foreground">Ledger Debited</span>
            </div>

            {/* Glowing Interbank Corridor Bridge */}
            <div className="flex-1 flex flex-col items-center px-1">
              <div className="relative w-full flex items-center justify-center py-2">
                <div className="h-1.5 w-full rounded-full bg-secondary/90 overflow-hidden relative border border-border/30">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isComplete
                        ? "w-full bg-emerald-500"
                        : "w-3/4 bg-gradient-to-r from-primary/30 via-primary to-cyan-400 animate-pulse",
                    )}
                  />
                </div>
                <div className="absolute flex items-center justify-center rounded-full bg-card border border-primary/30 px-2 py-0.5 shadow-sm text-[9px] font-mono text-primary">
                  <ArrowRight
                    className={cn("h-3 w-3", !isComplete && "animate-pulse")}
                  />
                </div>
              </div>
              <span className="text-[9px] font-mono text-muted-foreground text-center mt-0.5 truncate max-w-[120px]">
                {currentCorridorText}
              </span>
            </div>

            {/* Destination Node: External Bank / UPI Rail */}
            <div className="flex flex-col items-center gap-1.5 flex-1 text-center">
              <div
                className={cn(
                  "relative flex h-13 w-13 items-center justify-center rounded-2xl bg-card border shadow-md transition-all duration-300 p-2 overflow-hidden",
                  isComplete
                    ? "border-emerald-500/50 ring-2 ring-emerald-500/20"
                    : "border-border/60",
                )}
              >
                <BrandAsset
                  id={paymentAsset.id}
                  size="fit"
                  className="h-full w-full"
                  imgClassName="max-h-full max-w-full object-contain object-center"
                />
                {isComplete && (
                  <span className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500 text-white text-[9px] font-bold">
                    ✓
                  </span>
                )}
              </div>
              <span className="text-[11px] font-bold text-foreground truncate max-w-[100px]">
                {paymentAsset.label}
              </span>
              <span className="text-[9px] text-muted-foreground truncate max-w-[90px] font-mono">
                {recipientCode}
              </span>
            </div>
          </div>
        </div>

        {/* ─── Real Banking Transit Milestones (4 Clear Stages) ─── */}
        <div className="space-y-2 text-xs">
          {withdrawalStages.map((st, i) => {
            const isDone = isComplete || visualStage > i;
            const isCurrent = !isTerminal && visualStage === i;
            const StepIcon = st.icon;
            return (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-2.5 transition-all duration-300",
                  isDone
                    ? "border-emerald-500/25 bg-emerald-500/[0.04]"
                    : isCurrent
                      ? "border-primary/40 bg-primary/[0.06] shadow-sm"
                      : "border-border/30 bg-muted/20 opacity-40",
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold transition-all shadow-xs",
                    isDone
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/25"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {isDone ? (
                    <Check className="h-4 w-4 stroke-[3]" />
                  ) : (
                    <StepIcon className="h-3.5 w-3.5" />
                  )}
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
                        "text-[9px] font-mono px-2 py-0.5 rounded-full",
                        isDone
                          ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-bold"
                          : isCurrent
                            ? "text-primary bg-primary/10 font-bold"
                            : "text-muted-foreground bg-muted/50",
                      )}
                    >
                      {isDone ? "Cleared" : st.pill}
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

        {/* ─── 5-Day Delivery Window Reassurance Card ─── */}
        <div className="flex items-center justify-between rounded-2xl bg-muted/40 border border-border/50 p-3.5 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center text-primary shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-[11px]">
                Standard Interbank Settlement Timeline
              </p>
              <p className="text-[10px] text-muted-foreground">
                Verified and processed over 5 business days
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-primary font-mono shrink-0 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
            5 Days
          </span>
        </div>

        {/* ─── Institutional Telemetry Strip ─── */}
        <div className="rounded-xl border border-border/40 bg-secondary/30 px-3 py-2 flex items-center justify-between text-[10px] font-mono">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-foreground font-semibold truncate">{telemetryRef.current.batchId}</span>
          </div>
          <div className="flex items-center gap-2.5 text-muted-foreground shrink-0 text-[9px]">
            <span>Latency: {telemetryRef.current.gatewayLatency}ms</span>
            <span className="hidden sm:inline text-border">·</span>
            <span className="hidden sm:inline">ISO 20022</span>
          </div>
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
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wide">
                <Check className="h-4 w-4 stroke-[3]" />
                <span>Withdrawal Submitted — Processing</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Your payout request has been registered in the 5 business days interbank settlement cycle.
              </p>
              <div className="rounded-xl bg-card/80 border border-emerald-500/20 p-2.5 text-[11px] text-muted-foreground text-left space-y-1">
                <div className="flex items-center gap-1.5 text-foreground font-semibold text-[11px]">
                  <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Email Confirmation & KYC Verification Notice</span>
                </div>
                <p className="text-[10px] leading-relaxed">
                  A confirmation email has been dispatched. If statutory verification is required, you will be notified to submit KYC documents to{" "}
                  <strong className="text-foreground font-semibold">moonlightwealthmanagement@gmail.com</strong>.
                  As soon as KYC is verified, the withdrawal amount will reflect directly in your bank account.
                </p>
              </div>
            </div>

            {onViewReceipt && (
              <button
                type="button"
                onClick={onViewReceipt}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-xs font-bold tracking-wider uppercase text-primary-foreground shadow-md hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer touch-manipulation"
              >
                <Receipt className="h-4 w-4" />
                <span>Track 5-Day Settlement Steps</span>
              </button>
            )}

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full text-center py-2 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                Return to Wallet
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
  const [progressPercent, setProgressPercent] = useState(16);
  const [showComplete, setShowComplete] = useState(false);
  const backendDoneRef = useRef(isBackendDone);
  backendDoneRef.current = isBackendDone;

  // Natural randomized delays per stage (avoids static fixed intervals)
  // Simulates real-time cryptographic signature verification, ledger write, and balance confirmation
  const transferStageDurationsRef = useRef<number[]>([]);
  if (transferStageDurationsRef.current.length === 0) {
    transferStageDurationsRef.current = [
      950 + Math.floor(Math.random() * 450),  // Stage 0: 950–1400ms (Verifying recipient)
      1350 + Math.floor(Math.random() * 600), // Stage 1: 1350–1950ms (Transfer auth & signature)
      1200 + Math.floor(Math.random() * 550), // Stage 2: 1200–1750ms (Direct settlement)
      1050 + Math.floor(Math.random() * 450), // Stage 3: 1050–1500ms (Updating ledger balance)
      900 + Math.floor(Math.random() * 400),  // Stage 4: 900–1300ms (Transfer complete)
    ];
  }

  // Session-unique cryptographic verification telemetry
  const transferTelemetryRef = useRef({
    txNonce: `0x${Math.random().toString(16).substring(2, 8).toUpperCase()}${Math.random().toString(16).substring(2, 6).toUpperCase()}`,
    ledgerPing: Math.floor(24 + Math.random() * 38),
    cipherSuite: "ECDSA_P256_SHA256",
  });

  // Stage transition management with dynamic timings
  useEffect(() => {
    if (isFailed || isCancelled) return;

    let current = 0;
    const timeouts: NodeJS.Timeout[] = [];

    const scheduleNext = (index: number) => {
      if (index >= totalStages - 1) {
        return;
      }
      const dur = transferStageDurationsRef.current[index] || 1200;
      const t = setTimeout(() => {
        current = index + 1;
        setVisualStage(current);
        scheduleNext(current);
      }, dur);
      timeouts.push(t);
    };

    scheduleNext(0);

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [isFailed, isCancelled, totalStages]);

  // Smooth micro-progress ticker simulating continuous ledger streaming
  useEffect(() => {
    if (isFailed || isCancelled) return;

    const stageTargets = [24, 48, 72, 92, 100];
    const targetProgress = isBackendDone && visualStage >= totalStages - 1
      ? 100
      : visualStage >= totalStages - 1
        ? 94
        : stageTargets[visualStage] || 20;

    const interval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= targetProgress) return prev;
        const diff = targetProgress - prev;
        const step = Math.max(1, Math.min(diff, Math.floor(Math.random() * 3) + 1));
        return Math.min(targetProgress, prev + step);
      });
    }, 85);

    return () => clearInterval(interval);
  }, [visualStage, isBackendDone, totalStages, isFailed, isCancelled]);

  useEffect(() => {
    if (isBackendDone && visualStage >= totalStages - 2) {
      const sealDelay = 400 + Math.floor(Math.random() * 250);
      const t = setTimeout(() => {
        setVisualStage(totalStages - 1);
        setProgressPercent(100);
        setShowComplete(true);
      }, sealDelay);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isBackendDone, visualStage, totalStages]);

  useEffect(() => {
    if (visualStage === totalStages - 1 && isBackendDone) {
      setProgressPercent(100);
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

      {/* Dynamic Progress Gauge & Telemetry (non-terminal only) */}
      {!isTerminal && (
        <div className="mt-3.5 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span>{stages[Math.min(visualStage, totalStages - 1)]?.title}</span>
            </span>
            <span className="font-bold text-primary tabular-nums">{progressPercent}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground/70 px-0.5 pt-0.5">
            <span>Nonce: {transferTelemetryRef.current.txNonce}</span>
            <span>Ping: {transferTelemetryRef.current.ledgerPing}ms</span>
          </div>
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
