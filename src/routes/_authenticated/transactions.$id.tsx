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
  HelpCircle,
  ArrowDownToLine,
  Send,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWallet, useProfile } from "@/hooks/use-wallet";
import { formatMoney } from "@/lib/currency";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandAsset, GiftCardImage } from "@/components/AssetComponents";
import { GIFT_CARDS, PAYMENT_METHODS, UPI_PROVIDERS, INDIAN_BANKS } from "@/lib/assets";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/transactions/$id")({
  head: () => ({
    meta: [
      { title: "Transaction Receipt — Moonlight Wallet" },
      { name: "description", content: "Official Moonlight Wallet transaction details and receipt." },
      { property: "og:title", content: "Transaction Receipt — Moonlight Wallet" },
      { property: "og:description", content: "Transaction receipt and reference." },
    ],
  }),
  component: Receipt,
});

interface ResolvedPaymentAsset {
  type: "gift" | "bank" | "upi" | "method";
  id: string;
  label: string;
  subtitle: string;
  giftCard?: (typeof GIFT_CARDS)[0];
}

function resolvePaymentAsset(
  methodName?: string,
  upiId?: string,
  providerName?: string,
  currency?: string,
): ResolvedPaymentAsset {
  const m = (methodName || "").toLowerCase();
  const u = (upiId || "").toLowerCase();
  const p = (providerName || "").toLowerCase();
  const c = (currency || "").toUpperCase();

  // 1. Gift card match
  const matchedGift = GIFT_CARDS.find(
    (g) => m.includes(g.id) || m.includes(g.brand.toLowerCase()) || p.includes(g.id),
  );
  if (matchedGift) {
    return {
      type: "gift",
      id: matchedGift.id,
      label: `${matchedGift.brand} Gift Card`,
      subtitle: "Digital Voucher Redemption",
      giftCard: matchedGift,
    };
  }

  // 2. UPI Provider match
  const upiMatch = UPI_PROVIDERS.find(
    (prov) =>
      p.includes(prov.id) ||
      p.includes(prov.name.toLowerCase()) ||
      prov.handles.some((h) => u.includes(h)),
  );
  if (upiMatch) {
    return {
      type: "upi",
      id: upiMatch.id,
      label: upiMatch.name,
      subtitle: "UPI Instant Payout",
    };
  }

  // 3. Indian Bank match
  const bankMatch = INDIAN_BANKS.find(
    (b) => m.includes(b.id) || m.includes(b.name.toLowerCase()) || p.includes(b.id),
  );
  if (bankMatch) {
    return {
      type: "bank",
      id: bankMatch.id,
      label: bankMatch.name,
      subtitle: "Direct Bank Transfer (IMPS/NEFT)",
    };
  }

  // 4. Payment Rail match
  if (m.includes("gcash") || c === "PHP") {
    return {
      type: "method",
      id: "gcash",
      label: "GCash Wallet",
      subtitle: "Mobile Wallet Payout",
    };
  }
  if (m.includes("paynow") || c === "SGD") {
    return {
      type: "method",
      id: "paynow",
      label: "Singapore PayNow",
      subtitle: "National Instant Payout",
    };
  }
  if (m.includes("pix") || c === "BRL") {
    return {
      type: "method",
      id: "pix",
      label: "Pix Instant",
      subtitle: "Central Bank of Brazil Rail",
    };
  }
  if (m.includes("sepa") || c === "EUR") {
    return {
      type: "method",
      id: "sepa",
      label: "SEPA Instant",
      subtitle: "Eurozone Interbank Network",
    };
  }
  if (m.includes("faster") || c === "GBP") {
    return {
      type: "method",
      id: "faster-payments",
      label: "Faster Payments",
      subtitle: "UK Instant Bank Rail",
    };
  }
  if (m.includes("interac") || c === "CAD") {
    return {
      type: "method",
      id: "interac",
      label: "Interac e-Transfer",
      subtitle: "Canadian Electronic Clearing",
    };
  }
  if (m.includes("aani") || c === "AED") {
    return {
      type: "method",
      id: "aani",
      label: "Aani Instant",
      subtitle: "UAE National Payment Platform",
    };
  }
  if (m.includes("cz") || c === "CZK") {
    return {
      type: "method",
      id: "cz-bank",
      label: "Czech Bank Transfer",
      subtitle: "QR Platba / Local Clearing",
    };
  }
  if (m.includes("upi") || c === "INR" || u.length > 0) {
    return {
      type: "method",
      id: "upi",
      label: "UPI Direct",
      subtitle: "Unified Payments Interface",
    };
  }

  // Fallback match
  const pm = PAYMENT_METHODS.find(
    (item) => m.includes(item.id) || m.includes(item.name.toLowerCase()),
  );
  if (pm) {
    return {
      type: "method",
      id: pm.id,
      label: pm.name,
      subtitle: pm.description,
    };
  }

  return {
    type: "method",
    id: "sepa",
    label: methodName || "Moonlight Settlement Rail",
    subtitle: "Digital Transfer Network",
  };
}

function Receipt() {
  const { id } = Route.useParams();
  const wallet = useWallet();
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
      <div className="mx-auto max-w-lg space-y-4 px-3 py-6">
        <Skeleton className="h-8 w-32 rounded-lg" />
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

  const rawStatus = (rawData.status || "COMPLETED").toUpperCase();
  const isCompleted = ["COMPLETED", "SUCCESS", "APPROVED"].includes(rawStatus);
  const isFailed = ["FAILED", "CANCELLED", "REJECTED"].includes(rawStatus);
  const isProcessing = !isCompleted && !isFailed;

  const referenceCode = (rawData.reference_code || rawData.reference || `ML-${rawData.id?.substring(0, 8)}`).toUpperCase();

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

  // Payment asset resolution
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
  const netAmount = rawData.recipient_amount ? Number(rawData.recipient_amount) : grossAmount;
  const recipientCurrency = (rawData.recipient_currency as string) || currency;

  return (
    <div className="mx-auto max-w-lg px-2 sm:px-4 space-y-4 pb-20 sm:pb-12 animate-in fade-in duration-300">
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

      {/* Main Digital Statement Paper Card */}
      <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-border/70 bg-card p-5 sm:p-7 shadow-lg space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border/50 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest text-primary uppercase">
                Moonlight Wallet
              </span>
              <span className="text-muted-foreground/40">•</span>
              <span className="text-[10px] font-semibold text-muted-foreground">
                Digital Record
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight mt-0.5">
              {isWithdrawal ? "Withdrawal Confirmation" : "Transaction Details"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formattedDate} at {formattedTime}
            </p>
          </div>

          {/* Status Badge */}
          <div className="text-right shrink-0">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider",
                isCompleted
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : isFailed
                    ? "bg-destructive/10 text-destructive border border-destructive/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse",
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : isFailed ? (
                <AlertCircle className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              {isCompleted ? "Settled" : isFailed ? "Failed" : "Processing"}
            </span>
          </div>
        </div>

        {/* Primary Hero Amount */}
        <div className="text-center py-2 sm:py-3">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">
            {isWithdrawal ? "Disbursed Amount" : "Transferred Amount"}
          </div>
          <div className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {formatMoney(grossAmount, currency)}
          </div>
          {currency !== recipientCurrency && rawData.fx_rate && (
            <p className="font-mono text-xs text-muted-foreground mt-1">
              ≈ {formatMoney(netAmount, recipientCurrency)} (Rate: {Number(rawData.fx_rate).toFixed(4)})
            </p>
          )}
        </div>

        {/* Status Timeline */}
        <div className="rounded-xl border border-border/50 bg-secondary/30 p-3 sm:p-4 space-y-3">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Settlement Timeline
          </div>

          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
            {/* Step 1: Submitted */}
            <div className="relative text-xs">
              <div className="absolute -left-6 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check className="h-2.5 w-2.5 stroke-[3]" />
              </div>
              <div className="font-semibold text-foreground">Transaction Initiated</div>
              <div className="text-[11px] text-muted-foreground">
                Recorded on {formattedDate} · {formattedTime}
              </div>
            </div>

            {/* Step 2: Processing / Rail Handshake */}
            <div className="relative text-xs">
              <div
                className={cn(
                  "absolute -left-6 top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-white",
                  isCompleted
                    ? "bg-emerald-500"
                    : isFailed
                      ? "bg-destructive"
                      : "bg-amber-500 ring-2 ring-amber-500/20",
                )}
              >
                {isCompleted ? (
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                ) : isFailed ? (
                  <AlertCircle className="h-2.5 w-2.5 stroke-[3]" />
                ) : (
                  <div className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                )}
              </div>
              <div className="font-semibold text-foreground">
                {isWithdrawal ? "Payout Channel Dispatch" : "Ledger Routing & Clearance"}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {paymentAsset.label} ({paymentAsset.subtitle})
              </div>
            </div>

            {/* Step 3: Settled / Delivered */}
            <div className="relative text-xs">
              <div
                className={cn(
                  "absolute -left-6 top-0.5 flex h-4 w-4 items-center justify-center rounded-full",
                  isCompleted
                    ? "bg-emerald-500 text-white"
                    : isFailed
                      ? "bg-muted text-muted-foreground"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {isCompleted ? (
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                ) : (
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                )}
              </div>
              <div
                className={cn(
                  "font-semibold",
                  isCompleted ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {isFailed
                  ? "Transaction Cancelled"
                  : isCompleted
                    ? "Settlement Confirmed"
                    : "Final Settlement Pending"}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {isCompleted
                  ? "Funds verified and delivered"
                  : isFailed
                    ? "Funds returned to balance"
                    : "Estimated completion: within standard corridor window"}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method / Brand Row (Natural Logo Sizing, No White Box) */}
        <div className="flex items-center gap-3.5 rounded-xl border border-border/60 bg-secondary/20 p-3.5">
          {paymentAsset.type === "gift" && paymentAsset.giftCard ? (
            <div className="w-16 shrink-0">
              <GiftCardImage imageUrl={paymentAsset.giftCard.imageUrl} alt={paymentAsset.giftCard.brand} />
            </div>
          ) : (
            <BrandAsset id={paymentAsset.id} size="md" />
          )}

          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {isWithdrawal ? "Payout Rail" : "Transfer Rail"}
            </div>
            <div className="font-semibold text-foreground text-sm truncate">
              {paymentAsset.label}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {rawData.upi_id ? `VPA: ${rawData.upi_id}` : paymentAsset.subtitle}
            </div>
          </div>
        </div>

        {/* Structured 2-Column Details Table */}
        <div className="divide-y divide-border/40 border-t border-b border-border/50 text-xs">
          {/* Reference row */}
          <div className="flex items-center justify-between py-2.5">
            <span className="text-muted-foreground">Reference Code</span>
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
          <div className="flex items-center justify-between py-2.5">
            <span className="text-muted-foreground">Source</span>
            <span className="font-medium text-foreground text-right truncate max-w-[200px]">
              {rawData.sender_name || profile.data?.full_name || "Moonlight Wallet"}
            </span>
          </div>

          {/* Destination */}
          <div className="flex items-center justify-between py-2.5">
            <span className="text-muted-foreground">Beneficiary</span>
            <span className="font-medium text-foreground text-right truncate max-w-[200px]">
              {rawData.full_name || rawData.recipient_name || rawData.email || "Valued Customer"}
            </span>
          </div>

          {/* Destination Account/Email/VPA if present */}
          {rawData.email && (
            <div className="flex items-center justify-between py-2.5">
              <span className="text-muted-foreground">Recipient Contact</span>
              <span className="font-mono text-foreground text-right truncate max-w-[200px]">
                {rawData.email}
              </span>
            </div>
          )}

          {/* Gross Amount */}
          <div className="flex items-center justify-between py-2.5">
            <span className="text-muted-foreground">Gross Amount</span>
            <span className="font-mono font-semibold text-foreground">
              {formatMoney(grossAmount, currency)}
            </span>
          </div>

          {/* Fee */}
          {feeAmount > 0 && (
            <div className="flex items-center justify-between py-2.5 text-muted-foreground">
              <span>Network &amp; Service Fee (10%)</span>
              <span className="font-mono">{formatMoney(feeAmount, currency)}</span>
            </div>
          )}

          {/* Net Amount */}
          <div className="flex items-center justify-between py-2.5 font-semibold text-foreground">
            <span>Net Settled Amount</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">
              {formatMoney(netAmount, recipientCurrency)}
            </span>
          </div>

          {/* Reason / Note */}
          {rawData.reason && (
            <div className="flex items-center justify-between py-2.5">
              <span className="text-muted-foreground">Note / Purpose</span>
              <span className="text-right text-muted-foreground truncate max-w-[220px]">
                {rawData.reason}
              </span>
            </div>
          )}
        </div>

        {/* Footer Audit Information */}
        <div className="pt-2 text-center space-y-2 border-t border-border/40">
          <div className="inline-flex items-center justify-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Verified Moonlight Wallet Ledger Record
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed px-2">
            This digital statement confirms recorded balance movements on the Moonlight Wallet platform.
            Transactions are cryptographically verified and bound by account terms.
          </p>
        </div>
      </div>

      {/* Done Action */}
      <div className="pt-2">
        <Link
          to="/transactions"
          className="w-full flex items-center justify-center rounded-xl h-11 bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:opacity-95 active:scale-[0.98] transition-transform"
        >
          Done &amp; Return to Activity
        </Link>
      </div>
    </div>
  );
}
