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
  Lock,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWallet, useProfile, useRates } from "@/hooks/use-wallet";
import { formatMoney, getRate, convert } from "@/lib/currency";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandAsset, GiftCardImage, CountryFlag } from "@/components/AssetComponents";
import { resolvePaymentAsset } from "@/lib/assets";
import { resolveTransactionRoute } from "@/lib/routes";
import { LogoMark } from "@/components/Logo";
import { cn } from "@/lib/utils";
import {
  getWithdrawalComplianceInfo,
  TIMELINE_SUMMARY_STEPS as TIMELINE_STEPS,
} from "@/lib/compliance";

export const Route = createFileRoute("/_authenticated/transactions/$id")({
  head: () => ({
    meta: [
      { title: "Transaction Details — Moonlight Wallet" },
      {
        name: "description",
        content: "Official Moonlight Wallet transaction receipt and status confirmation.",
      },
      { property: "og:title", content: "Transaction Receipt — Moonlight Wallet" },
      { property: "og:description", content: "Official transaction receipt and confirmation." },
    ],
  }),
  component: Receipt,
});

/* ─── Receipt Component ─── */

function Receipt() {
  const { id } = Route.useParams();
  const profile = useProfile();
  const wallet = useWallet();
  const rates = useRates();
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
              fee: txData.fee,
              route: txData.route,
              method: txData.method || "Payout Rail",
              full_name: txData.recipient_name || "Beneficiary",
              email: txData.recipient_wallet_code || "",
              status: txData.status || "PROCESSING",
              reference_code: txData.reference || `MLW-${txData.id.substring(0, 8).toUpperCase()}`,
              created_at: txData.created_at,
              recipient_amount: txData.recipient_amount,
              recipient_currency: txData.recipient_currency,
              sender_debit: txData.sender_debit,
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

  // Authoritative Route Resolution
  const resolvedRoute = resolveTransactionRoute({
    route: rawData.route,
    kind: isWithdrawal ? "withdrawal" : rawData.kind,
    method: rawData.method,
    provider: rawData.provider,
    upiId: rawData.upi_id,
    recipientCode: rawData.recipient_wallet_code,
    recipientName: rawData.recipient_name || rawData.full_name,
  });

  // Payment asset resolution with route and kind
  const paymentAsset = resolvePaymentAsset(
    rawData.method,
    rawData.upi_id,
    rawData.provider,
    rawData.currency,
    rawData.route || resolvedRoute.id,
    isWithdrawal ? "withdrawal" : rawData.kind,
  );

  // Authoritative stored economics
  const grossAmount = Number(rawData.amount) || 0;
  const isIndianRail =
    isWithdrawal &&
    (rawData.route === "upi" ||
      rawData.method?.toLowerCase().includes("upi") ||
      rawData.method?.toLowerCase().includes("in-bank") ||
      rawData.method?.toLowerCase().includes("bank") ||
      rawData.method?.toLowerCase().includes("imps"));
  const currency =
    isIndianRail && rawData.currency === "EUR"
      ? "INR"
      : (rawData.currency as string) || "EUR";
  const feeAmount = rawData.fee != null ? Number(rawData.fee) : 0;
  const netAmount =
    rawData.recipient_amount != null
      ? Number(rawData.recipient_amount)
      : isWithdrawal
        ? grossAmount - feeAmount
        : grossAmount;
  const recipientCurrency = (rawData.recipient_currency as string) || currency;
  const ratesMap = rates.data?.rates;
  const preferredCur = profile.data?.preferred_currency || "EUR";

  const isGlitched1to1 =
    currency === "USD" &&
    recipientCurrency === "INR" &&
    (rawData.recipient_amount === grossAmount || Number(rawData.fx_rate) === 1);

  const effectiveNetAmount = isGlitched1to1
    ? Number(rawData.amount_usd ?? grossAmount) * getRate("INR", ratesMap)
    : netAmount;

  const effectiveFxRate = isGlitched1to1
    ? getRate("INR", ratesMap)
    : Number(rawData.fx_rate || 1);

  const senderDebit =
    rawData.sender_debit != null
      ? Number(rawData.sender_debit)
      : isWithdrawal
        ? grossAmount
        : grossAmount + feeAmount;

  const isUPI =
    rawData.route?.toLowerCase() === "upi" ||
    rawData.recipient_name?.toLowerCase().includes("upi") ||
    (rawData.recipient_name && rawData.recipient_name.includes("@")) ||
    paymentAsset.id?.toLowerCase().includes("upi");

  // Compliance info for withdrawals
  const complianceInfo = isWithdrawal
    ? getWithdrawalComplianceInfo(rawData.created_at, rawData.status, {
        isUPI,
        method: rawData.recipient_name || rawData.route || undefined,
        route: rawData.route || undefined,
      })
    : null;
  // Counterparty resolution for direct Pay Back / Send Again actions
  const myWalletId = wallet.data?.id;
  const myWalletCode = wallet.data?.wallet_code;
  const isTransfer = !isWithdrawal && rawData.kind === "transfer";
  const isIncomingTransfer =
    isTransfer &&
    (rawData.recipient_wallet_id === myWalletId ||
      (rawData.recipient_wallet_code && rawData.recipient_wallet_code === myWalletCode) ||
      (rawData.sender_wallet_code && rawData.sender_wallet_code !== myWalletCode));
  const isOutgoingTransfer =
    isTransfer &&
    (rawData.sender_wallet_id === myWalletId ||
      (rawData.sender_wallet_code && rawData.sender_wallet_code === myWalletCode));

  const counterpartyWalletCode = isIncomingTransfer
    ? rawData.sender_wallet_code
    : isOutgoingTransfer
      ? rawData.recipient_wallet_code
      : null;

  const counterpartyName = isIncomingTransfer
    ? rawData.sender_name || "Sender"
    : isOutgoingTransfer
      ? rawData.recipient_name || rawData.full_name || "Recipient"
      : null;

  return (
    <div className="mx-auto max-w-sm sm:max-w-md px-2 sm:px-4 space-y-4 pb-2 animate-in fade-in duration-200">
      {/* Navigation & Actions */}
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
      <div className="rounded-3xl border border-border/60 bg-card shadow-soft print:border-none print:shadow-none print:p-0 overflow-visible">
        {/* Moonlight Official Header */}
        <div className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6 border-b border-border/30">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <LogoMark className="h-8 w-8 shrink-0" />
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] text-foreground uppercase">
                  MOONLIGHT
                </p>
                <h1 className="text-xs font-semibold text-muted-foreground">
                  {resolvedRoute.terminology.flowTitle}
                </h1>
              </div>
            </div>

            {/* Status Badge */}
            {isWithdrawal && complianceInfo ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase shrink-0",
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
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="h-3 w-3" />
                Completed
              </span>
            )}
          </div>
        </div>

        {/* Amount Hero */}
        <div className="text-center py-5 px-4 bg-secondary/10">
          <span className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground tabular-nums">
            {formatMoney(grossAmount, currency)}
          </span>
          {currency !== recipientCurrency && (
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              Net: {formatMoney(effectiveNetAmount, recipientCurrency)} · FX Rate:{" "}
              {Number(effectiveFxRate).toFixed(4)}
            </p>
          )}
          {preferredCur !== currency && preferredCur !== recipientCurrency && (
            <p className="text-xs text-primary font-medium mt-1 font-mono">
              ≈ {formatMoney(Number(rawData.amount_usd ?? grossAmount) * getRate(preferredCur, ratesMap), preferredCur)} ({preferredCur})
            </p>
          )}
        </div>

        {/* Resolved Route & Brand Identity */}
        <div className="mx-5 sm:mx-6 my-4">
          <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-secondary/20 p-3">
            {paymentAsset.type === "gift" && paymentAsset.giftCard ? (
              <div className="w-12 shrink-0">
                <GiftCardImage
                  imageUrl={paymentAsset.giftCard.imageUrl}
                  alt={paymentAsset.giftCard.brand}
                />
              </div>
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-card border border-border/60 shadow-2xs p-1.5 overflow-hidden">
                <BrandAsset
                  id={paymentAsset.id}
                  size="fit"
                  className="h-full w-full"
                  imgClassName="max-h-full max-w-full object-contain object-center"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-foreground block truncate">
                {resolvedRoute.name}
              </span>
              <span className="text-[11px] text-muted-foreground block truncate">
                {resolvedRoute.terminology.routeDescription}
              </span>
            </div>
          </div>
        </div>

        {/* ─── Payout Progress & 5–7 Business Days Timeline ─── */}
        {isWithdrawal && complianceInfo && (
          <div className="mx-5 sm:mx-6 mb-4 rounded-2xl border border-border/40 bg-muted/30 p-3.5 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Payout Timeline
                </span>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  {complianceInfo.isSuccess ? "Settled" : complianceInfo.estimatedDaysText}
                </span>
              </div>
              <div className="text-right text-[10px] text-muted-foreground">
                <div>
                  Expected: <strong className="text-foreground">{complianceInfo.estimatedArrivalDate}</strong>
                </div>
                {complianceInfo.nextReviewHours > 0 && (
                  <div>Next window: ≈{complianceInfo.nextReviewHours}h</div>
                )}
              </div>
            </div>

            {/* Current Step Banner */}
            <div className="rounded-xl border border-border/30 bg-card px-3 py-2 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                {complianceInfo.isHold ? (
                  <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                ) : complianceInfo.isSuccess ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-primary anim-subtle-pulse shrink-0" />
                )}
                <span>{complianceInfo.currentStep}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 pl-5 leading-relaxed">
                {complianceInfo.currentStepDescription}
              </p>
            </div>

            {/* Visual Step Progression */}
            <div className="space-y-1.5 pt-1">
              {TIMELINE_STEPS.map((step, idx) => {
                const isPassed =
                  complianceInfo.stageNumber > step.stepNum || complianceInfo.isSuccess;
                const isCurrent =
                  complianceInfo.stageNumber === step.stepNum && !complianceInfo.isSuccess;
                return (
                  <div key={idx} className="flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
                          isPassed
                            ? "bg-emerald-500 text-white"
                            : isCurrent
                              ? "bg-primary text-primary-foreground ring-1 ring-primary/20"
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
                        {step.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {step.timeWindow}
                    </span>
                  </div>
                );
              })}
            </div>

            {complianceInfo.isHold && (
              <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-2 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                Standard operational clearing review in progress. Delivery remains expected within 5–7 business days.
              </p>
            )}
          </div>
        )}

        {/* ─── Moonlight Official Operations Note ─── */}
        {(rawData.reason || rawData.note) && (
          <div className="mx-5 sm:mx-6 mb-4 rounded-2xl border border-primary/25 bg-primary/8 p-4 text-left shadow-2xs space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <LogoMark className="h-4 w-4 shrink-0" />
              <span>Official Note from Moonlight Operations</span>
            </div>
            <p className="text-xs text-foreground leading-relaxed pl-6 font-medium">
              {rawData.reason || rawData.note}
            </p>
          </div>
        )}

        {/* ─── Details Table (Mobile-Safe & Non-Clipping) ─── */}
        <div className="px-5 sm:px-6 divide-y divide-border/30 text-xs">
          <DetailRow label="Reference">
            <span className="flex items-center justify-end gap-1.5 font-mono">
              <span className="break-all">{referenceCode}</span>
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy reference"
                className="p-1 text-muted-foreground hover:text-foreground cursor-pointer transition-colors shrink-0"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </span>
          </DetailRow>

          <DetailRow label="Date & Time">
            {formattedDate} · {formattedTime}
          </DetailRow>

          <DetailRow label="Transaction Type">
            {resolvedRoute.terminology.transactionType}
          </DetailRow>

          <DetailRow label="From">
            {rawData.sender_name || profile.data?.full_name || "Moonlight Wallet"}
          </DetailRow>

          <DetailRow label="To">
            {rawData.full_name || rawData.recipient_name || rawData.email || "Recipient"}
          </DetailRow>

          {/* External UPI / Bank Destination */}
          {rawData.upi_id && (
            <DetailRow label="UPI VPA" mono>
              {rawData.upi_id}
            </DetailRow>
          )}

          {rawData.phone && (
            <DetailRow label="Beneficiary Mobile" mono>
              {rawData.phone}
            </DetailRow>
          )}

          {(rawData.reason || rawData.note) && (
            <DetailRow label="Operations Note">
              <span className="font-medium text-primary break-words">
                {rawData.reason || rawData.note}
              </span>
            </DetailRow>
          )}

          {/* Economics breakdown */}
          <DetailRow label={isWithdrawal ? "Requested Withdrawal" : "Transfer Amount"} mono>
            {formatMoney(grossAmount, currency)}
          </DetailRow>

          {feeAmount > 0 && (
            <DetailRow
              label={
                isWithdrawal ? "Processing Fee (10% out of amount)" : "Service Fee (10% on top)"
              }
              muted
              mono
            >
              {formatMoney(feeAmount, currency)}
            </DetailRow>
          )}

          {isWithdrawal ? (
            <>
              <DetailRow label="Wallet Debit" bold mono>
                {formatMoney(senderDebit, currency)}
              </DetailRow>
              <DetailRow label="Net Payout" bold mono emerald>
                {formatMoney(netAmount, recipientCurrency)}
              </DetailRow>
            </>
          ) : (
            <>
              <DetailRow label="Total Sender Debit" bold mono>
                {formatMoney(senderDebit, currency)}
              </DetailRow>
              <DetailRow label="Recipient Receives" bold mono emerald>
                {formatMoney(effectiveNetAmount, recipientCurrency)}
              </DetailRow>
            </>
          )}
        </div>

        {/* ─── Footer ─── */}
        <div className="px-5 sm:px-6 py-4 mt-2 border-t border-border/30 text-center">
          <p className="text-[11px] font-medium text-muted-foreground">
            Moonlight Wallet · Official Financial Confirmation
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
            Retain this confirmation for accounting and reconciliation records.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="no-print pt-2 space-y-2.5">
        {counterpartyWalletCode && (
          <Link
            to="/send"
            search={{ to: counterpartyWalletCode }}
            preload="intent"
            className="w-full flex items-center justify-center gap-2 rounded-full h-12 bg-primary text-primary-foreground font-semibold text-sm shadow-soft hover:brightness-110 active:scale-[0.98] transition-all touch-manipulation cursor-pointer"
          >
            <ArrowUpRight className="h-4 w-4" strokeWidth={2.2} />
            <span>
              {isIncomingTransfer
                ? `Pay Back ${counterpartyName ? counterpartyName.split(" ")[0] : "Sender"}`
                : `Send Again to ${counterpartyName ? counterpartyName.split(" ")[0] : "Recipient"}`}
            </span>
          </Link>
        )}

        <Link
          to="/transactions"
          preload="intent"
          className="w-full flex items-center justify-center rounded-full h-11 border border-border/70 bg-secondary/50 text-foreground font-medium text-xs hover:bg-secondary active:scale-[0.98] transition-all touch-manipulation cursor-pointer"
        >
          Back to Activity
        </Link>
      </div>
    </div>
  );
}

/* ─── Mobile-Safe Detail Row ─── */

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
    <div className="flex items-start justify-between gap-3 py-2.5 min-w-0">
      <span
        className={cn(
          "text-muted-foreground shrink-0 text-xs mt-0.5",
          muted && "text-muted-foreground/70",
        )}
      >
        {label}
      </span>
      <div
        className={cn(
          "text-right break-words break-all min-w-0 flex-1 text-xs",
          mono && "font-mono",
          bold ? "font-semibold text-foreground" : "font-medium text-foreground",
          emerald && "text-emerald-600 dark:text-emerald-400 font-bold",
          muted && "text-muted-foreground",
        )}
      >
        {children}
      </div>
    </div>
  );
}
