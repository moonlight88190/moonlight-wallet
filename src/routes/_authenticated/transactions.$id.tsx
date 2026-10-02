import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  Copy,
  Check,
  Printer,
  Share2,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  ArrowDownToLine,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWallet, useProfile } from "@/hooks/use-wallet";
import { formatMoney } from "@/lib/currency";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandAsset, GiftCardImage, CountryFlag } from "@/components/AssetComponents";
import { resolvePaymentAsset } from "@/lib/assets";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/transactions/$id")({
  head: () => ({
    meta: [
      { title: "Transaction Details — Moonlight Wallet" },
      { name: "description", content: "Moonlight Wallet official transaction receipt and compliance status." },
      { property: "og:title", content: "Transaction Receipt — Moonlight Wallet" },
      { property: "og:description", content: "Transaction receipt and compliance timeline." },
    ],
  }),
  component: Receipt,
});

export interface ComplianceStage {
  stage: number;
  hourMin: number;
  hourMax: number;
  title: string;
  description: string;
}

export const WITHDRAWAL_COMPLIANCE_STAGES: ComplianceStage[] = [
  { stage: 1, hourMin: 0, hourMax: 12, title: "Payment Details Review", description: "Verifying withdrawal request parameters and beneficiary format." },
  { stage: 2, hourMin: 12, hourMax: 24, title: "Customer Due Diligence (CDD)", description: "Standard account verification and customer due diligence check." },
  { stage: 3, hourMin: 24, hourMax: 36, title: "Beneficiary Verification", description: "Validating recipient rail coordinates, account status, and routing data." },
  { stage: 4, hourMin: 36, hourMax: 48, title: "Transaction Monitoring", description: "Screening transaction patterns against anti-fraud and risk guidelines." },
  { stage: 5, hourMin: 48, hourMax: 60, title: "Source of Funds Assessment", description: "Internal balance audit and source of funds reconciliation." },
  { stage: 6, hourMin: 60, hourMax: 72, title: "Risk & Policy Review", description: "Compliance risk assessment for outbound transaction allocation." },
  { stage: 7, hourMin: 72, hourMax: 84, title: "Cross-Border Clearance Review", description: "Corridor currency conversion verification and fee validation." },
  { stage: 8, hourMin: 84, hourMax: 96, title: "Payout Channel Readiness", description: "Confirming outbound channel liquidity and settlement readiness." },
  { stage: 9, hourMin: 96, hourMax: 108, title: "Enhanced Due Diligence (EDD)", description: "Secondary risk review and periodic transaction audit clearance." },
  { stage: 10, hourMin: 108, hourMax: 120, title: "Internal Ledger Reconciliation", description: "Balance lock verification and settlement queue indexing." },
  { stage: 11, hourMin: 120, hourMax: 132, title: "Settlement Queue Processing", description: "Queued for payout disbursement authorization." },
  { stage: 12, hourMin: 132, hourMax: 144, title: "Manual Compliance Audit", description: "Final administrative review and compliance checklist verification." },
  { stage: 13, hourMin: 144, hourMax: 156, title: "Disbursement Verification", description: "Beneficiary channel handshake and transmission confirmation." },
  { stage: 14, hourMin: 156, hourMax: 168, title: "Final Review & Hold Window", description: "Pre-release audit stage prior to administrative release." },
];

export function getWithdrawalComplianceInfo(createdAtStr: string, dbStatus: string) {
  const createdDate = new Date(createdAtStr);
  const now = new Date();
  const elapsedMs = Math.max(0, now.getTime() - createdDate.getTime());
  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  const totalMinutes = Math.floor(elapsedMs / (1000 * 60));
  const displayHours = Math.floor(totalMinutes / 60);
  const displayMinutes = totalMinutes % 60;

  const upperStatus = (dbStatus || "PROCESSING").toUpperCase();

  // If finalized in database by administrator:
  if (upperStatus === "COMPLETED" || upperStatus === "SUCCESS" || upperStatus === "APPROVED") {
    return {
      statusLabel: "SUCCESS",
      stageTitle: "Payout Released",
      description: "Withdrawal confirmed and disbursed by Moonlight settlement administration.",
      isProcessing: false,
      isHold: false,
      isSuccess: true,
      stageNumber: 14,
      totalStages: 14,
      elapsedText: `${displayHours}h ${displayMinutes}m`,
      nextReviewHours: 0,
    };
  }

  if (upperStatus === "FAILED" || upperStatus === "REJECTED") {
    return {
      statusLabel: "FAILED",
      stageTitle: "Withdrawal Halted",
      description: "Request stopped during compliance evaluation. Funds returned to wallet balance.",
      isProcessing: false,
      isHold: false,
      isSuccess: false,
      stageNumber: 0,
      totalStages: 14,
      elapsedText: `${displayHours}h ${displayMinutes}m`,
      nextReviewHours: 0,
    };
  }

  if (upperStatus === "CANCELLED") {
    return {
      statusLabel: "CANCELLED",
      stageTitle: "Request Cancelled",
      description: "Withdrawal was cancelled. Funds returned to available balance.",
      isProcessing: false,
      isHold: false,
      isSuccess: false,
      stageNumber: 0,
      totalStages: 14,
      elapsedText: `${displayHours}h ${displayMinutes}m`,
      nextReviewHours: 0,
    };
  }

  // Active / in-flight review
  // At >= 168 hours: ON HOLD!
  if (elapsedHours >= 168 || upperStatus === "ON HOLD" || upperStatus === "HOLD") {
    return {
      statusLabel: "ON HOLD",
      stageTitle: "Compliance Hold Active",
      description: "168-hour review completed. Final manual compliance audit required before release.",
      isProcessing: true,
      isHold: true,
      isSuccess: false,
      stageNumber: 14,
      totalStages: 14,
      elapsedText: `${displayHours}h ${displayMinutes}m`,
      nextReviewHours: 0,
    };
  }

  // 0 to 168 hours: each 12-hour window corresponds to a distinct stage
  const currentStageIndex = Math.min(13, Math.floor(elapsedHours / 12));
  const stageObj = WITHDRAWAL_COMPLIANCE_STAGES[currentStageIndex]!;
  const nextWindowHours = 12 - (elapsedHours % 12);

  return {
    statusLabel: "PROCESSING",
    stageTitle: stageObj.title,
    description: stageObj.description,
    isProcessing: true,
    isHold: false,
    isSuccess: false,
    stageNumber: currentStageIndex + 1,
    totalStages: 14,
    elapsedText: `${displayHours}h ${displayMinutes}m`,
    nextReviewHours: Math.max(1, Math.ceil(nextWindowHours)),
  };
}

function Receipt() {
  const { id } = Route.useParams();
  const profile = useProfile();
  const [copied, setCopied] = useState(false);

  const tx = useQuery({
    queryKey: ["transaction", id],
    queryFn: async () => {
      // 1. Check transactions table
      const { data: txData } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (txData) {
        if (txData.kind === "withdrawal") {
          const { data: wdData } = await supabase
            .from("withdrawals")
            .select("*")
            .or(`id.eq.${txData.id},transaction_id.eq.${txData.id}`)
            .maybeSingle();

          if (wdData) {
            return { type: "withdrawal" as const, data: wdData, txData };
          }

          return {
            type: "withdrawal" as const,
            data: {
              id: txData.id,
              amount: txData.amount,
              currency: txData.currency,
              method: txData.method || "Payout Rail",
              full_name: txData.recipient_name || "Beneficiary",
              email: txData.recipient_wallet_code || "",
              status: txData.status || "PROCESSING",
              reference_code: txData.reference || `MLW-${txData.id.substring(0, 8).toUpperCase()}`,
              created_at: txData.created_at,
            },
            txData,
          };
        }
        return { type: "transaction" as const, data: txData };
      }

      // 2. Check withdrawals table directly
      const { data: wdData } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (wdData) return { type: "withdrawal" as const, data: wdData };

      return null;
    },
  });

  if (tx.isLoading) {
    return (
      <div className="mx-auto max-w-sm space-y-4 px-2 py-6">
        <Skeleton className="h-8 w-28 rounded-lg" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!tx.data) {
    return (
      <div className="mx-auto max-w-sm text-center py-16 space-y-4 px-4">
        <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
        <div>
          <h2 className="text-base font-semibold text-foreground">Transaction Record Not Found</h2>
          <p className="text-xs text-muted-foreground mt-1">
            This reference code may be invalid or belongs to another account.
          </p>
        </div>
        <Link
          to="/transactions"
          className="inline-flex items-center justify-center rounded-xl bg-secondary px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent"
        >
          Return to Activity
        </Link>
      </div>
    );
  }

  const isWithdrawal = tx.data.type === "withdrawal";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawData = tx.data.data as any;
  const createdAt = new Date(rawData.created_at as string);

  const formattedDate = createdAt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const formattedTime = createdAt.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const referenceCode = (
    rawData.reference_code ||
    rawData.reference ||
    `ML-${rawData.id?.substring(0, 8)}`
  ).toUpperCase();

  const handleCopy = () => {
    navigator.clipboard.writeText(referenceCode);
    setCopied(true);
    toast.success("Reference code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const text = `Moonlight Transaction ${referenceCode}: ${formatMoney(Number(rawData.amount), rawData.currency)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Moonlight Transaction Receipt", text });
      } catch {
        // dismissed
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Receipt details copied to clipboard");
    }
  };

  // Payment asset resolution via centralized resolver
  const paymentAsset = resolvePaymentAsset(
    rawData.method,
    rawData.upi_id,
    rawData.provider,
    rawData.currency,
  );

  // Compute dynamic amounts
  const grossAmount = Number(rawData.amount) || 0;
  const currency = (rawData.currency as string) || "EUR";
  const feeAmount = rawData.fee ? Number(rawData.fee) : grossAmount * 0.1;
  const netAmount = rawData.recipient_amount
    ? Number(rawData.recipient_amount)
    : grossAmount - (isWithdrawal ? feeAmount : 0);
  const recipientCurrency = (rawData.recipient_currency as string) || currency;

  // Withdrawal compliance info
  const complianceInfo = isWithdrawal
    ? getWithdrawalComplianceInfo(rawData.created_at, rawData.status)
    : null;

  return (
    <div className="mx-auto max-w-sm px-2 sm:px-3 space-y-4 pb-20 animate-in fade-in duration-200">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between py-1">
        <Link
          to="/transactions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-2 touch-manipulation"
        >
          <ChevronLeft className="h-4 w-4" /> Activity
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            aria-label="Share receipt"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer touch-manipulation"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => window.print()}
            aria-label="Print receipt"
            className="flex h-8 items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/40 px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer touch-manipulation"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Main Digital Statement Card (Optimized for Mobile Screenshot at 320-430px) */}
      <div className="overflow-hidden rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-md space-y-5 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border/50 pb-4">
          <div>
            <div className="text-[10px] font-bold tracking-widest text-primary uppercase">
              Moonlight Wallet
            </div>
            <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight mt-0.5">
              {isWithdrawal ? "Withdrawal Confirmation" : "Transaction Confirmation"}
            </h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {formattedDate} · {formattedTime}
            </p>
          </div>

          {/* Status Badge */}
          <div className="text-right shrink-0">
            {isWithdrawal && complianceInfo ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase",
                  complianceInfo.isSuccess
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : complianceInfo.isHold
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                      : !complianceInfo.isProcessing
                        ? "bg-destructive/10 text-destructive border border-destructive/20"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
                )}
              >
                {complianceInfo.isSuccess ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : complianceInfo.isHold ? (
                  <Lock className="h-3 w-3" />
                ) : !complianceInfo.isProcessing ? (
                  <AlertCircle className="h-3 w-3" />
                ) : (
                  <Clock className="h-3 w-3" />
                )}
                {complianceInfo.statusLabel}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3" />
                Settled
              </span>
            )}
          </div>
        </div>

        {/* Hero Amount */}
        <div className="text-center py-1">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            {isWithdrawal ? "Disbursed Amount" : "Transferred Amount"}
          </div>
          <div className="font-mono text-3xl font-extrabold tracking-tight text-foreground">
            {formatMoney(grossAmount, currency)}
          </div>
          {currency !== recipientCurrency && rawData.fx_rate && (
            <p className="font-mono text-xs text-muted-foreground mt-1">
              ≈ {formatMoney(netAmount, recipientCurrency)} (Rate: {Number(rawData.fx_rate).toFixed(4)})
            </p>
          )}
        </div>

        {/* Payment Method / Brand Row */}
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-secondary/20 p-3">
          {paymentAsset.type === "gift" && paymentAsset.giftCard ? (
            <div className="w-14 shrink-0">
              <GiftCardImage imageUrl={paymentAsset.giftCard.imageUrl} alt={paymentAsset.giftCard.brand} />
            </div>
          ) : (
            <div className="flex items-center justify-center shrink-0">
              <BrandAsset id={paymentAsset.id} size="sm" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {isWithdrawal ? "Payout Rail" : "Payment Method"}
            </div>
            <div className="font-bold text-foreground text-xs truncate">
              {paymentAsset.label}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {rawData.upi_id
                ? `VPA: ${rawData.upi_id}`
                : isWithdrawal
                  ? "Standard Payout Channel"
                  : `Paid with ${paymentAsset.label}`}
            </div>
          </div>
        </div>

        {/* 14-STAGE 12-HOUR WITHDRAWAL TIMELINE (FOR WITHDRAWALS ONLY) */}
        {isWithdrawal && complianceInfo && (
          <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Withdrawal Status
                </span>
                <span className="text-xs font-bold text-foreground">
                  {complianceInfo.statusLabel} · Stage {complianceInfo.stageNumber} of 14
                </span>
              </div>
              <div className="text-right text-[10px] text-muted-foreground">
                <div>Elapsed: <strong className="text-foreground">{complianceInfo.elapsedText}</strong></div>
                {complianceInfo.nextReviewHours > 0 && (
                  <div>Next window: ≈{complianceInfo.nextReviewHours}h</div>
                )}
              </div>
            </div>

            {/* Current Stage Description */}
            <div className="rounded-xl border border-border/40 bg-card p-2.5 text-xs space-y-0.5">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                {complianceInfo.isHold ? (
                  <Lock className="h-3.5 w-3.5 text-amber-500" />
                ) : complianceInfo.isSuccess ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-primary motion-safe:animate-ping" />
                )}
                <span>Current: {complianceInfo.stageTitle}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed pl-3.5">
                {complianceInfo.description}
              </p>
            </div>

            {/* Compact Visual 8-Step Timeline Summary */}
            <div className="space-y-2 pt-1">
              {[
                { stageNum: 1, label: "Request received" },
                { stageNum: 2, label: "Payment details review" },
                { stageNum: 3, label: "Customer due diligence (CDD)" },
                { stageNum: 4, label: "Transaction monitoring" },
                { stageNum: 6, label: "Source of funds assessment" },
                { stageNum: 8, label: "Payout channel readiness" },
                { stageNum: 12, label: "Manual compliance audit" },
                { stageNum: 14, label: complianceInfo.isHold ? "Compliance hold (168h)" : "Final release review" },
              ].map((stepItem, sIdx) => {
                const isPassed = complianceInfo.stageNumber > stepItem.stageNum || complianceInfo.isSuccess;
                const isCurrent = complianceInfo.stageNumber === stepItem.stageNum && !complianceInfo.isSuccess;
                return (
                  <div key={sIdx} className="flex items-center gap-2 text-[11px]">
                    <div
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
                        isPassed
                          ? "bg-emerald-500 text-white"
                          : isCurrent
                            ? complianceInfo.isHold
                              ? "bg-amber-500 text-white"
                              : "bg-primary text-primary-foreground ring-2 ring-primary/20"
                            : "bg-muted text-muted-foreground border border-border/40",
                      )}
                    >
                      {isPassed ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : stepItem.stageNum}
                    </div>
                    <span
                      className={cn(
                        isCurrent
                          ? "font-bold text-foreground"
                          : isPassed
                            ? "text-muted-foreground"
                            : "text-muted-foreground/60",
                      )}
                    >
                      {stepItem.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {complianceInfo.isHold && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium leading-tight">
                7-day (168-hour) standard review window elapsed. Final administrative sign-off required prior to fund release.
              </div>
            )}
          </div>
        )}

        {/* Structured 2-Column Details Table */}
        <div className="divide-y divide-border/40 border-t border-b border-border/50 text-xs">
          {/* Reference row */}
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">Reference ID</span>
            <div className="flex items-center gap-1.5 font-mono font-bold text-foreground">
              <span>{referenceCode}</span>
              <button
                onClick={handleCopy}
                aria-label="Copy reference"
                className="p-1 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Sender */}
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">Source Account</span>
            <span className="font-medium text-foreground text-right truncate max-w-[180px]">
              {rawData.sender_name || profile.data?.full_name || "Moonlight Wallet"}
            </span>
          </div>

          {/* Destination */}
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">Beneficiary</span>
            <span className="font-medium text-foreground text-right truncate max-w-[180px]">
              {rawData.full_name || rawData.recipient_name || rawData.email || "Valued Customer"}
            </span>
          </div>

          {/* VPA or Account */}
          {(rawData.upi_id || rawData.email) && (
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Destination Identifier</span>
              <span className="font-mono text-foreground text-right truncate max-w-[180px]">
                {rawData.upi_id || rawData.email}
              </span>
            </div>
          )}

          {/* Gross Amount */}
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">Gross Amount</span>
            <span className="font-mono font-semibold text-foreground">
              {formatMoney(grossAmount, currency)}
            </span>
          </div>

          {/* Fee */}
          {feeAmount > 0 && (
            <div className="flex items-center justify-between py-2 text-muted-foreground">
              <span>Transaction Fee (10%)</span>
              <span className="font-mono">{formatMoney(feeAmount, currency)}</span>
            </div>
          )}

          {/* Net Amount */}
          <div className="flex items-center justify-between py-2 font-bold text-foreground">
            <span>Net Settled Amount</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">
              {formatMoney(netAmount, recipientCurrency)}
            </span>
          </div>
        </div>

        {/* Footer Verification Notice */}
        <div className="pt-1 text-center space-y-1.5 border-t border-border/40">
          <div className="inline-flex items-center justify-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Verified Moonlight Wallet Ledger Statement
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed px-2">
            Cryptographically sealed and logged under Moonlight account compliance guidelines.
          </p>
        </div>
      </div>

      {/* Done Action */}
      <div>
        <Link
          to="/transactions"
          className="w-full flex items-center justify-center rounded-full h-12 bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:opacity-95 active:scale-[0.98] transition-transform"
        >
          Done &amp; Return to Activity
        </Link>
      </div>
    </div>
  );
}
