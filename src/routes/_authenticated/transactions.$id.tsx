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
  CheckCircle2,
  AlertCircle,
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
      { name: "description", content: "Moonlight Wallet transaction receipt and status." },
      { property: "og:title", content: "Transaction Receipt — Moonlight Wallet" },
      { property: "og:description", content: "Transaction receipt and compliance timeline." },
    ],
  }),
  component: Receipt,
});

/* ─── 14-stage 168-hour withdrawal compliance timeline ─── */

export interface ComplianceStage {
  stage: number;
  hourMin: number;
  hourMax: number;
  title: string;
  description: string;
}

export const WITHDRAWAL_COMPLIANCE_STAGES: ComplianceStage[] = [
  { stage: 1, hourMin: 0, hourMax: 12, title: "Payment Details Review", description: "Verifying withdrawal request parameters and payout destination format." },
  { stage: 2, hourMin: 12, hourMax: 24, title: "Customer Due Diligence", description: "Standard identity verification and customer due diligence check." },
  { stage: 3, hourMin: 24, hourMax: 36, title: "Beneficiary Verification", description: "Validating recipient account details, routing data and account status." },
  { stage: 4, hourMin: 36, hourMax: 48, title: "Transaction Monitoring", description: "Screening transaction patterns against risk and fraud guidelines." },
  { stage: 5, hourMin: 48, hourMax: 60, title: "Source of Funds Review", description: "Internal balance audit and source of funds assessment." },
  { stage: 6, hourMin: 60, hourMax: 72, title: "Risk Assessment", description: "Compliance risk review for outbound transaction allocation." },
  { stage: 7, hourMin: 72, hourMax: 84, title: "Cross-Border Processing", description: "Currency conversion verification and corridor fee validation." },
  { stage: 8, hourMin: 84, hourMax: 96, title: "Payout Processing", description: "Confirming outbound channel readiness and settlement preparation." },
  { stage: 9, hourMin: 96, hourMax: 108, title: "Enhanced Due Diligence", description: "Secondary risk review and periodic transaction audit." },
  { stage: 10, hourMin: 108, hourMax: 120, title: "Compliance Review", description: "Balance verification and settlement queue indexing." },
  { stage: 11, hourMin: 120, hourMax: 132, title: "Payout Queue", description: "Queued for disbursement authorization." },
  { stage: 12, hourMin: 132, hourMax: 144, title: "Manual Review", description: "Administrative review and compliance checklist verification." },
  { stage: 13, hourMin: 144, hourMax: 156, title: "Final Review", description: "Pre-release audit and beneficiary confirmation." },
  { stage: 14, hourMin: 156, hourMax: 168, title: "Hold Window", description: "Final review stage prior to administrative release." },
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

  // Finalized by admin
  if (upperStatus === "COMPLETED" || upperStatus === "SUCCESS" || upperStatus === "APPROVED") {
    return {
      statusLabel: "SUCCESS",
      stageTitle: "Payout Released",
      description: "Withdrawal confirmed and released by Moonlight administration.",
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
      description: "Request stopped during review. Funds returned to wallet balance.",
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

  // At >= 168 hours: ON HOLD
  if (elapsedHours >= 168 || upperStatus === "ON HOLD" || upperStatus === "HOLD") {
    return {
      statusLabel: "ON HOLD",
      stageTitle: "Compliance Hold",
      description: "168-hour review completed. Final administrative sign-off required before release.",
      isProcessing: true,
      isHold: true,
      isSuccess: false,
      stageNumber: 14,
      totalStages: 14,
      elapsedText: `${displayHours}h ${displayMinutes}m`,
      nextReviewHours: 0,
    };
  }

  // 0–168 hours: each 12-hour window is a distinct stage
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

/* ─── Compact timeline summary steps ─── */
const TIMELINE_STEPS = [
  { stageNum: 1, label: "Request received" },
  { stageNum: 2, label: "Payment details review" },
  { stageNum: 3, label: "Customer due diligence" },
  { stageNum: 4, label: "Transaction monitoring" },
  { stageNum: 6, label: "Source of funds review" },
  { stageNum: 8, label: "Payout processing" },
  { stageNum: 12, label: "Manual review" },
  { stageNum: 14, label: "Final review" },
];

/* ─── Receipt Component ─── */

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
          <h2 className="text-base font-semibold text-foreground">Transaction Not Found</h2>
          <p className="text-xs text-muted-foreground mt-1">
            This reference may be invalid or belongs to another account.
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
    toast.success("Reference copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const text = `Moonlight ${referenceCode}: ${formatMoney(Number(rawData.amount), rawData.currency)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Moonlight Receipt", text });
      } catch {
        // dismissed
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Receipt copied to clipboard");
    }
  };

  // Payment asset resolution
  const paymentAsset = resolvePaymentAsset(
    rawData.method,
    rawData.upi_id,
    rawData.provider,
    rawData.currency,
  );

  // Amounts
  const grossAmount = Number(rawData.amount) || 0;
  const currency = (rawData.currency as string) || "EUR";
  const feeAmount = rawData.fee ? Number(rawData.fee) : grossAmount * 0.1;
  const netAmount = rawData.recipient_amount
    ? Number(rawData.recipient_amount)
    : grossAmount - (isWithdrawal ? feeAmount : 0);
  const recipientCurrency = (rawData.recipient_currency as string) || currency;

  // Compliance info for withdrawals
  const complianceInfo = isWithdrawal
    ? getWithdrawalComplianceInfo(rawData.created_at, rawData.status)
    : null;

  return (
    <div className="mx-auto max-w-sm px-2 sm:px-3 space-y-4 pb-20 animate-in fade-in duration-200">
      {/* Navigation */}
      <div className="flex items-center justify-between py-1 no-print">
        <Link
          to="/transactions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-2 touch-manipulation"
        >
          <ChevronLeft className="h-4 w-4" />
          Activity
        </Link>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleShare}
            aria-label="Share receipt"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer touch-manipulation"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => window.print()}
            aria-label="Print"
            className="flex h-8 items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/40 px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer touch-manipulation"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* ─── Receipt Card ─── */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft print:border-none print:shadow-none print:p-0">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">
                Moonlight
              </p>
              <h1 className="text-sm font-semibold text-foreground mt-0.5">
                {isWithdrawal ? "Withdrawal Confirmation" : "Transaction Confirmation"}
              </h1>
            </div>

            {/* Status */}
            {isWithdrawal && complianceInfo ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase shrink-0",
                  complianceInfo.isSuccess
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : complianceInfo.isHold
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : !complianceInfo.isProcessing
                        ? "bg-destructive/10 text-destructive"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400",
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
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="h-3 w-3" />
                Complete
              </span>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="text-center py-4 border-t border-border/40">
          <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {formatMoney(grossAmount, currency)}
          </span>
          {currency !== recipientCurrency && rawData.fx_rate && (
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              ≈ {formatMoney(netAmount, recipientCurrency)} · Rate: {Number(rawData.fx_rate).toFixed(4)}
            </p>
          )}
        </div>

        {/* Provider */}
        <div className="mx-5 sm:mx-6 mb-4">
          <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-secondary/15 px-3 py-2.5">
            {paymentAsset.type === "gift" && paymentAsset.giftCard ? (
              <div className="w-10 shrink-0">
                <GiftCardImage imageUrl={paymentAsset.giftCard.imageUrl} alt={paymentAsset.giftCard.brand} />
              </div>
            ) : (
              <BrandAsset id={paymentAsset.id} size="xs" />
            )}
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold text-foreground block truncate">
                {paymentAsset.label}
              </span>
              <span className="text-[11px] text-muted-foreground block truncate">
                {rawData.upi_id
                  ? rawData.upi_id
                  : isWithdrawal
                    ? "Payout channel"
                    : `Paid with ${paymentAsset.label}`}
              </span>
            </div>
          </div>
        </div>

        {/* ─── Withdrawal Timeline ─── */}
        {isWithdrawal && complianceInfo && (
          <div className="mx-5 sm:mx-6 mb-4 rounded-xl border border-border/40 bg-secondary/10 p-3.5 space-y-3">
            {/* Timeline Header */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Withdrawal Status
                </span>
                <span className="text-xs font-semibold text-foreground">
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

            {/* Current Stage */}
            <div className="rounded-lg border border-border/30 bg-card px-3 py-2 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                {complianceInfo.isHold ? (
                  <Lock className="h-3 w-3 text-amber-500" />
                ) : complianceInfo.isSuccess ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary anim-subtle-pulse" />
                )}
                <span>{complianceInfo.stageTitle}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 pl-4">
                {complianceInfo.description}
              </p>
            </div>

            {/* Visual Timeline */}
            <div className="space-y-1.5">
              {TIMELINE_STEPS.map((step, idx) => {
                const isHoldStep = idx === TIMELINE_STEPS.length - 1 && complianceInfo.isHold;
                const isPassed = complianceInfo.stageNumber > step.stageNum || complianceInfo.isSuccess;
                const isCurrent = complianceInfo.stageNumber === step.stageNum && !complianceInfo.isSuccess;
                return (
                  <div key={idx} className="flex items-center gap-2 text-[11px]">
                    <div
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
                        isPassed
                          ? "bg-emerald-500 text-white"
                          : isCurrent
                            ? isHoldStep
                              ? "bg-amber-500 text-white"
                              : "bg-primary text-primary-foreground ring-1 ring-primary/20"
                            : "bg-muted text-muted-foreground/50",
                      )}
                    >
                      {isPassed ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : null}
                    </div>
                    <span
                      className={cn(
                        isCurrent
                          ? "font-semibold text-foreground"
                          : isPassed
                            ? "text-muted-foreground"
                            : "text-muted-foreground/40",
                      )}
                    >
                      {isHoldStep && complianceInfo.isHold
                        ? "Compliance hold (168h)"
                        : step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {complianceInfo.isHold && (
              <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                7-day (168-hour) review window elapsed. Final administrative sign-off required before release.
              </p>
            )}
          </div>
        )}

        {/* ─── Details Table ─── */}
        <div className="px-5 sm:px-6 divide-y divide-border/30 text-xs">
          <DetailRow label="Reference" mono>
            <span className="flex items-center gap-1.5">
              {referenceCode}
              <button
                onClick={handleCopy}
                aria-label="Copy"
                className="p-0.5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              </button>
            </span>
          </DetailRow>

          <DetailRow label="Date">
            {formattedDate} · {formattedTime}
          </DetailRow>

          <DetailRow label="From">
            {rawData.sender_name || profile.data?.full_name || "Moonlight Wallet"}
          </DetailRow>

          <DetailRow label="To">
            {rawData.full_name || rawData.recipient_name || rawData.email || "Recipient"}
          </DetailRow>

          {(rawData.upi_id || rawData.email) && (
            <DetailRow label="Destination" mono>
              {rawData.upi_id || rawData.email}
            </DetailRow>
          )}

          <DetailRow label="Amount" mono>
            {formatMoney(grossAmount, currency)}
          </DetailRow>

          {feeAmount > 0 && (
            <DetailRow label="Fee (10%)" muted mono>
              {formatMoney(feeAmount, currency)}
            </DetailRow>
          )}

          {(netAmount !== grossAmount || currency !== recipientCurrency) && (
            <DetailRow label="Net amount" bold mono emerald>
              {formatMoney(netAmount, recipientCurrency)}
            </DetailRow>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 mt-2 border-t border-border/30 text-center">
          <p className="text-[10px] text-muted-foreground">
            Moonlight Wallet · Digital Ledger Statement
          </p>
        </div>
      </div>

      {/* Done */}
      <div className="no-print">
        <Link
          to="/transactions"
          className="w-full flex items-center justify-center rounded-full h-12 bg-primary text-primary-foreground font-semibold text-sm shadow-xs hover:opacity-95 active:scale-[0.98] transition-transform touch-manipulation"
        >
          Done
        </Link>
      </div>
    </div>
  );
}

/* ─── Detail Row Helper ─── */

function DetailRow({
  label,
  children,
  mono,
  muted,
  bold,
  emerald,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
  muted?: boolean;
  bold?: boolean;
  emerald?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className={cn("text-muted-foreground shrink-0", muted && "text-muted-foreground/60")}>
        {label}
      </span>
      <span
        className={cn(
          "text-right truncate max-w-[200px]",
          mono && "font-mono",
          bold ? "font-semibold text-foreground" : "font-medium text-foreground",
          emerald && "text-emerald-600 dark:text-emerald-400",
          muted && "text-muted-foreground",
        )}
      >
        {children}
      </span>
    </div>
  );
}
