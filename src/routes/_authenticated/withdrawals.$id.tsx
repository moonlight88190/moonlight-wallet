import { useState, useMemo } from "react";
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
  ArrowDownLeft,
  Building2,
  ShieldCheck,
  ExternalLink,
  Mail,
  Sparkles,
  Layers,
  KeyRound,
  Camera,
  IdCard,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWallet, useProfile, useRates } from "@/hooks/use-wallet";
import { formatMoney, convert, getRate } from "@/lib/currency";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  find7DayBatchForWithdrawal,
  type ConsolidatedWithdrawalBatch,
} from "@/lib/withdrawal-consolidation";
import {
  BrandAsset,
  PaymentMethodIcon,
  BankLogo,
  UPIProviderLogo,
  CountryFlag,
} from "@/components/AssetComponents";
import { resolvePaymentAsset, INDIAN_BANKS } from "@/lib/assets";
import { LogoMark } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { getWithdrawalComplianceInfo, TIMELINE_SUMMARY_STEPS } from "@/lib/compliance";

export const Route = createFileRoute("/_authenticated/withdrawals/$id")({
  head: () => ({
    meta: [
      { title: "Payout Settlement — Moonlight Wallet" },
      {
        name: "description",
        content: "Authoritative settlement receipt and banking payout confirmation.",
      },
      { property: "og:title", content: "Banking Settlement Receipt — Moonlight Wallet" },
      { property: "og:description", content: "Authoritative payout record and compliance status." },
    ],
  }),
  component: WithdrawalReceipt,
});

function WithdrawalReceipt() {
  const { id } = Route.useParams();
  const profile = useProfile();
  const wallet = useWallet();
  const rates = useRates();
  const [copied, setCopied] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [keySubmitted, setKeySubmitted] = useState(() => {
    return typeof window !== "undefined" && Boolean(localStorage.getItem(`keybox_wd_${id}`));
  });

  const wdQuery = useQuery({
    queryKey: ["withdrawal-detail", id],
    queryFn: async () => {
      // 1. Fetch from withdrawals table by id or reference
      const { data: wd, error: wdErr } = await supabase
        .from("withdrawals")
        .select("*, wallets(wallet_code, balance_usd)")
        .or(`id.eq.${id},reference.eq.${id}`)
        .maybeSingle();

      if (wd) return wd;

      // 2. Fallback: check if id belongs to transactions table
      const { data: tx } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (tx && tx.kind === "withdrawal") {
        return {
          id: tx.id,
          reference: tx.reference || `MLW-${tx.id.substring(0, 8).toUpperCase()}`,
          amount: Number(tx.amount),
          currency: tx.currency,
          amount_usd: Number(tx.amount_usd),
          fee: Number(tx.fee || 0),
          fee_usd: Number(tx.fee_usd || 0),
          method: tx.method || "Payout Rail",
          route: tx.route || "upi",
          recipient_amount: tx.recipient_amount
            ? Number(tx.recipient_amount)
            : Number(tx.amount) - Number(tx.fee || 0),
          recipient_currency: tx.recipient_currency || tx.currency,
          full_name: tx.recipient_name || "Beneficiary",
          email: tx.recipient_wallet_code || "",
          phone: null,
          upi_id: tx.method?.toLowerCase().includes("upi") ? tx.recipient_wallet_code : null,
          provider: tx.method || "Payout Provider",
          reason: tx.note,
          status: tx.status || "PROCESSING",
          created_at: tx.created_at,
          updated_at: tx.created_at,
          transaction_id: tx.id,
          user_id: "",
          wallet_id: tx.sender_wallet_id || "",
        };
      }

      if (wdErr) throw wdErr;
      return null;
    },
  });

  const wd = wdQuery.data;

  // Query all customer withdrawals to identify 7-day consolidation cluster
  const relatedWdsQuery = useQuery({
    queryKey: ["withdrawal-related-7d", wd?.user_id, wd?.wallet_id, wd?.email, wd?.upi_id],
    enabled: !!wd,
    queryFn: async () => {
      if (!wd) return [];
      let query = supabase.from("withdrawals").select("*");
      if (wd.user_id) {
        query = query.eq("user_id", wd.user_id);
      } else if (wd.wallet_id) {
        query = query.eq("wallet_id", wd.wallet_id);
      } else if (wd.email) {
        query = query.eq("email", wd.email);
      } else if (wd.upi_id) {
        query = query.eq("upi_id", wd.upi_id);
      } else {
        return [wd];
      }
      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        return [wd];
      }
      return data;
    },
  });

  const batch = useMemo(() => {
    if (!wd) return null;
    const allWds =
      relatedWdsQuery.data && relatedWdsQuery.data.length > 0 ? relatedWdsQuery.data : [wd];
    return find7DayBatchForWithdrawal(wd, allWds);
  }, [wd, relatedWdsQuery.data]);

  const isConsolidated = !!batch && batch.count > 1;

  const copyRef = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Reference copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!wd) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Moonlight Payout Record: ${wd.reference}`,
          text: `Settlement record for ${formatMoney(wd.amount, wd.currency)} (${wd.status})`,
          url: window.location.href,
        });
      } catch {
        // Ignored if cancelled
      }
    } else {
      copyRef(window.location.href);
    }
  };

  if (wdQuery.isLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-8 px-4">
        <Skeleton className="h-8 w-40 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!wd) {
    return (
      <div className="mx-auto max-w-lg py-16 px-4 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/80 border border-border/40">
          <AlertCircle className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-semibold">Settlement Record Not Found</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The requested withdrawal or payout reference does not exist or has been archived.
        </p>
        <Link
          to="/transactions"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Activity
        </Link>
      </div>
    );
  }

  const statusUpper = (wd.status || "PROCESSING").toUpperCase().replace(/_/g, " ");

  const isUPI =
    wd.method?.toLowerCase().includes("upi") || wd.route?.toLowerCase() === "upi" || !!wd.upi_id;
  const isIndianBank =
    wd.method?.toLowerCase().includes("bank") ||
    wd.method?.toLowerCase().includes("imps") ||
    wd.route?.toLowerCase() === "in-bank";

  const compliance = getWithdrawalComplianceInfo(wd.created_at, wd.status, {
    isUPI,
    method: wd.method,
    route: wd.route,
  });

  // Fee and settlement economics
  const rawGross = Number(wd.amount);
  const rawFee = Number(wd.fee ?? Math.round(rawGross * 0.1));
  const rawNet = Number(wd.recipient_amount ?? rawGross - rawFee);
  const payoutCurrency = wd.recipient_currency || wd.currency;

  const ratesMap = rates.data?.rates;
  const isIndianRail = isUPI || isIndianBank;
  const displayCurrency =
    isIndianRail && (wd.currency === "EUR" || wd.currency === "USD") ? "INR" : wd.currency;
  const displayFlag = isIndianRail ? "IN" : displayCurrency;
  const displayPayoutCurrency =
    isIndianRail && (payoutCurrency === "EUR" || payoutCurrency === "USD")
      ? "INR"
      : payoutCurrency;

  const grossAmount =
    displayCurrency !== wd.currency
      ? convert(rawGross, wd.currency, displayCurrency, ratesMap)
      : rawGross;
  const feeAmount = grossAmount * 0.1;
  const netSettlement = grossAmount - feeAmount;

  // Batch consolidated economics (taking 10% charge on every transaction of the 7 days)
  const batchRawGross = isConsolidated ? batch.totalAmount : rawGross;
  const batchRawFee = isConsolidated ? batch.totalFee : feeAmount;
  const batchRawNet = batchRawGross - batchRawFee;

  const effectiveGross =
    displayCurrency !== wd.currency
      ? convert(batchRawGross, wd.currency, displayCurrency, ratesMap)
      : batchRawGross;
  const effectiveFee =
    displayCurrency !== wd.currency
      ? effectiveGross * 0.1
      : batchRawFee;
  const effectiveNet = effectiveGross - effectiveFee;

  const displayMethod =
    isUPI &&
      (wd.upi_id?.includes("@upi") || wd.upi_id?.includes("@bhim")) &&
      wd.method?.includes("Google Pay")
      ? "BHIM UPI (UPI)"
      : wd.method;

  const paymentAsset = resolvePaymentAsset(
    wd.provider || displayMethod,
    wd.upi_id || undefined,
    undefined,
    displayCurrency,
    wd.route,
    "withdrawal",
  );

  const formattedDate = new Date(wd.created_at).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="mx-auto max-w-lg space-y-5 px-3 sm:px-4 py-4 sm:py-6 pb-2 animate-in fade-in duration-200">
      {/* ─── Top Bar: Back & Utility Actions ─── */}
      <div className="flex items-center justify-between">
        <Link
          to="/transactions"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-2 touch-manipulation"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Activity</span>
        </Link>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share receipt"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/80 border border-border/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            aria-label="Print record"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/80 border border-border/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ─── Main Settlement Slip Card ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-card space-y-6">
        {/* Subtle accent highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />

        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-7 w-7" />
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-[0.2em] text-foreground uppercase">
                Moonlight
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Payout & Settlement Record
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <CountryFlag code={displayFlag} circle size="sm" />
            <span className="text-xs font-mono font-semibold text-muted-foreground">
              {displayCurrency}
            </span>
          </div>
        </div>

        {/* Payout Status Banner */}
        <div
          className={cn(
            "flex items-center justify-between rounded-2xl px-4 py-3 border text-xs font-semibold tracking-wide",
            compliance.isSuccess
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400"
              : statusUpper === "FAILED" || statusUpper === "CANCELLED"
                ? "bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-400"
                : compliance.isKeyBoxRequired
                  ? "bg-amber-500/15 border-amber-500/35 text-amber-800 dark:text-amber-300 shadow-2xs"
                  : compliance.isKycRequired
                    ? "bg-amber-500/15 border-amber-500/35 text-amber-800 dark:text-amber-300 shadow-2xs"
                    : compliance.isHold
                      ? "bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-400"
                      : "bg-blue-500/10 border-blue-500/25 text-blue-700 dark:text-blue-400",
          )}
        >
          <div className="flex items-center gap-2">
            {compliance.isSuccess ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : compliance.isKeyBoxRequired ? (
              <KeyRound className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-pulse" />
            ) : compliance.isKycRequired ? (
              <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-pulse" />
            ) : compliance.isHold ? (
              <Lock className="h-4 w-4" />
            ) : statusUpper === "FAILED" || statusUpper === "CANCELLED" ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <Clock className="h-4 w-4 animate-spin-slow" />
            )}
            <span className="uppercase">
              {compliance.isKeyBoxRequired
                ? "KEYBOX VERIFICATION REQUIRED"
                : compliance.isKycRequired
                  ? "ON HOLD · KYC VERIFICATION REQUIRED"
                  : statusUpper}
            </span>
          </div>
          <span className="text-[11px] font-medium opacity-90">
            {compliance.isSuccess
              ? "Settled"
              : compliance.isKeyBoxRequired || compliance.isKycRequired
                ? "Action Required"
                : compliance.estimatedDaysText}
          </span>
        </div>

        {/* ─── 7-Day Consolidation Batch Banner (When multiple withdrawals in 7 days) ─── */}
        {isConsolidated && (
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3.5 sm:p-4 space-y-2">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <Layers className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-foreground">
                    Combined 7-Day Settlement Batch
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-primary text-primary-foreground rounded-full font-bold">
                    {batch.count} Payouts Combined
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  All {batch.count} withdrawals initiated within a 7-day period have been unified into this single settlement ID (<span className="font-mono font-semibold text-foreground">{batch.primaryReference}</span>). Total payments are added together so you receive one consolidated settlement and receipt.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─── Mandatory KYC Verification Action Card (When Admin Puts On Hold) ─── */}
        {compliance.isKycRequired && !compliance.isKeyBoxRequired && (
          <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-b from-amber-500/15 via-amber-500/10 to-amber-500/5 p-4 sm:p-5 space-y-4 shadow-md">
            {/* Amber Hold Alert Banner */}
            <div className="flex items-center justify-between gap-2 rounded-xl bg-amber-500/20 border border-amber-500/40 px-3 py-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Outbound Clearing On Hold · KYC Verification Required</span>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500/30 text-amber-900 dark:text-amber-200">
                Action Required
              </span>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-300 shrink-0 mt-0.5">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm tracking-tight">
                  Identity Verification (KYC) Required
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Outbound payout clearing could not be completed automatically and has been placed on hold by Moonlight Compliance. In accordance with statutory financial regulations, your payout requires identity verification before funds can be released to your destination account.
                </p>
              </div>
            </div>

            {/* Required Documents Checklist */}
            <div className="rounded-xl bg-card border border-border/70 p-3.5 space-y-2.5 text-xs">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Required Verification Documents:
              </span>
              <ul className="space-y-2 text-[11px] text-muted-foreground list-none pl-0">
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-foreground">Live Photo / Selfie:</strong>
                    <p className="text-muted-foreground">
                      A clear front-facing live selfie photo taken right now in a well-lit area matching your ID document.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-foreground">Matching ID Document:</strong>
                    <p className="text-muted-foreground">
                      Any valid ID matching the live selfie (School ID, College ID, Library ID, Aadhaar Card, PAN Card, or Driving Licence).
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="text-foreground">Payout Reference ID:</strong>
                    <p className="text-muted-foreground">
                      Quote reference <span className="font-mono font-semibold text-foreground">{wd.reference}</span> in your submission.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Primary Action Button: Link to Complete KYC Online */}
            <div className="space-y-2 pt-1">
              <Link
                to="/kyc"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-3 shadow-md transition-colors cursor-pointer"
              >
                <Camera className="h-4 w-4" />
                <span>Complete KYC Online (Upload Photo & ID)</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>

              {/* Alternative: Submit KYC via Email */}
              <a
                href={`mailto:moonlightwealthmanagement@gmail.com?subject=${encodeURIComponent(`KYC Verification Documents - Payout Ref: ${wd.reference}`)}&body=${encodeURIComponent(`Hello Moonlight Compliance Desk,\n\nI am submitting my KYC verification documents for my held withdrawal.\n\nWithdrawal Reference: ${wd.reference}\nBeneficiary Name: ${wd.full_name}\nAmount: ${formatMoney(grossAmount, displayCurrency)}\nPayout Method: ${displayMethod}\nDestination: ${wd.upi_id || wd.phone || displayMethod}\n\nI have attached:\n1. Live selfie photo\n2. Matching ID document (School ID / College ID / Aadhaar / PAN)\n\nPlease review and approve my KYC so I can proceed to enter the sender clearance key.\n\nThank you,\n${wd.full_name}`)}`}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-card hover:bg-secondary text-foreground font-semibold text-xs py-2.5 transition-colors cursor-pointer"
              >
                <Mail className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>Submit Documents via Email Instead</span>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            </div>

            {/* Direct Email Display and Copy */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-card border border-border/70 text-xs">
              <span className="font-mono font-bold text-xs text-foreground truncate select-all">
                moonlightwealthmanagement@gmail.com
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText("moonlightwealthmanagement@gmail.com");
                  toast.success("Compliance email copied to clipboard");
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline shrink-0 cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Email</span>
              </button>
            </div>

            {/* Reassurance Footer */}
            <div className="border-t border-amber-500/20 pt-2.5 text-[11px] text-muted-foreground flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                As soon as your KYC documents are reviewed and approved by Moonlight Compliance, your withdrawal will be approved and you will be asked to enter the sender clearance key. When both keys are put and verified, funds will be released immediately without any extra verification.
              </span>
            </div>
          </div>
        )}

        {/* ─── Mandatory KeyBox Verification Action Card (When Admin Approves) ─── */}
        {compliance.isKeyBoxRequired && (
          <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-b from-amber-500/15 via-amber-500/10 to-amber-500/5 p-4 sm:p-5 space-y-3.5 shadow-md">
            {/* KYC Completed Success Banner */}
            <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/35 px-3 py-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>KYC Verification Completed &amp; Approved</span>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/25 text-emerald-800 dark:text-emerald-200">
                Step 1 Done
              </span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-300 shrink-0">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm tracking-tight flex items-center gap-2">
                    <span>Action Required: Enter KeyBox Verification Key</span>
                    <span className="bg-amber-500/25 text-amber-800 dark:text-amber-200 text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold">
                      Final Step
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Your KYC identity verification is <strong>complete and approved</strong>! To release your payout funds to your account, you now need to enter the 5-digit verification key provided by the sender.
                  </p>
                </div>
              </div>
            </div>

            {/* Critical Dual Key & Sender Tab Instructions Notice */}
            <div className="rounded-xl border border-amber-500/35 bg-card/90 p-3.5 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
                <KeyRound className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Dual Key Entry &amp; Sender Tab Confirmation Required:</span>
              </div>
              <div className="space-y-2 text-[11px] text-muted-foreground leading-relaxed">
                <p>
                  1. <strong>On Website:</strong> If you haven't entered the key on the website yet,{" "}
                  <Link to="/kyc" className="text-primary font-semibold underline">
                    enter it on the website (KYC &amp; Security Tab)
                  </Link>.
                </p>
                <p>
                  2. <strong>In Withdrawal Tab:</strong> Also enter the key below in this withdrawal tab.
                </p>
                {/* MANDATORY SENDER TAB ACTION NOTICE */}
                <div className="rounded-lg bg-amber-500/15 border border-amber-500/35 p-2.5 text-amber-900 dark:text-amber-200">
                  <p className="font-bold text-xs text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-1">
                    <span>⚠️ Important: You Must Inform the Sender Too</span>
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    You have to inform the sender as well to put the verification key in their tab, <strong>or else the payout will not succeed</strong>. Both sides must register their keys for the clearance loop to validate.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const msg = `Hi, please enter the 5-digit verification key in your Moonlight tab too for withdrawal ${wd.reference}, or else the payout cannot succeed. Once both keys are entered, it releases immediately without extra verification!`;
                        navigator.clipboard.writeText(msg);
                        toast.success("Copied reminder message for sender!");
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 dark:text-amber-100 text-[11px] font-semibold transition-colors cursor-pointer border border-amber-500/30"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Copy Reminder to Send to Sender</span>
                    </button>
                  </div>
                </div>
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/25 p-2.5 text-emerald-900 dark:text-emerald-300">
                  <p className="font-semibold text-[11px] leading-relaxed">
                    ⚡ <strong>Automatic Release Guarantee:</strong> When both keys are put (on the website and in the withdrawal tab, with the sender confirming in their tab) and you have sent the correct key, the money will be out for release without any extra verification.
                  </p>
                </div>
              </div>
            </div>

            {/* Email Notification Notice */}
            <div className="rounded-xl bg-card/85 border border-amber-500/25 p-3 flex items-start gap-2.5 text-xs">
              <Mail className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold text-foreground">
                  Verification Confirmation via Email
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Once your key is entered and the sender inputs their key, key matching begins immediately. You will receive an official confirmation email from Moonlight Financial once verified.
                </p>
              </div>
            </div>

            {/* Interactive KeyBox Key Submission Box */}
            <div className="rounded-xl bg-card border border-border/70 p-3.5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Verification Key Entry (Withdrawal Tab)
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                  {keySubmitted ? "Key Registered" : "Awaiting Key"}
                </span>
              </div>

              {keySubmitted ? (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-800 dark:text-emerald-300 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Key Submitted in Withdrawal Tab · Verification in Progress</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Your verification key has been received in this withdrawal tab. Make sure you also entered it on the website, and remember to <strong>inform the sender too to put the key in their tab, or else it will not succeed</strong>. When both keys are put and the correct key is verified, the money will be out for release without any extra verification.
                  </p>
                  <div className="pt-1 flex items-center justify-between flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setKeySubmitted(false)}
                      className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                    >
                      Change or re-enter key
                    </button>
                    <Link
                      to="/kyc"
                      className="text-[10px] text-primary hover:underline font-semibold inline-flex items-center gap-1"
                    >
                      <span>Also enter / verify key on Website</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Input
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      placeholder="Enter 5-digit verification key"
                      className="h-10 sm:h-9 text-xs font-mono tracking-wider uppercase bg-secondary/50 flex-1 min-w-0"
                    />
                    <button
                      type="button"
                      disabled={!keyInput.trim()}
                      onClick={() => {
                        if (!keyInput.trim()) return;
                        localStorage.setItem(`keybox_wd_${id}`, keyInput.trim());
                        localStorage.setItem("keybox_kyc_key", keyInput.trim());
                        setKeySubmitted(true);
                        toast.success(
                          "Verification key submitted in withdrawal tab! When both keys are put and verified, money will be out for release without extra verification.",
                        );
                      }}
                      className="h-10 sm:h-9 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shrink-0 disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      <span>Submit Key</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Enter the 5-digit verification key provided by the sender. Make sure to enter it here in the withdrawal tab and on the website as well.
                  </p>
                </div>
              )}
            </div>

            {/* Direct Email Submission Alternative */}
            <div className="rounded-xl bg-card border border-border/70 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Or Submit Key Via Email:
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Official Compliance Desk
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-secondary/60 border border-border/50">
                <span className="font-mono font-bold text-xs text-foreground truncate select-all">
                  moonlightwealthmanagement@gmail.com
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText("moonlightwealthmanagement@gmail.com");
                    toast.success("Compliance email copied to clipboard");
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline shrink-0 cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Email</span>
                </button>
              </div>

              {/* Action: Open Email Client */}
              <a
                href={`mailto:moonlightwealthmanagement@gmail.com?subject=${encodeURIComponent(`KeyBox Verification Key - Payout Ref: ${wd.reference}`)}&body=${encodeURIComponent(`Hello Moonlight Compliance Team,\n\nI am submitting my KeyBox verification key for my withdrawal payout.\n\nWithdrawal Reference: ${wd.reference}\nFull Name: ${wd.full_name}\nAmount: ${formatMoney(grossAmount, displayCurrency)}\nPayout Method: ${displayMethod}\nDestination: ${wd.upi_id || wd.phone || displayMethod}\n\nMy Verification Key: [ENTER YOUR KEY HERE]\n\nThank you,\n${wd.full_name}`)}`}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600/90 hover:bg-amber-700 text-white font-semibold text-xs py-2.5 shadow-sm transition-colors cursor-pointer"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Submit Verification Key via Email</span>
                <ExternalLink className="h-3 w-3 opacity-70" />
              </a>
            </div>

            {/* Steps to add key */}
            <div className="space-y-1.5 text-xs pt-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Steps to Complete Settlement:
              </span>
              <ul className="space-y-1.5 text-[11px] text-muted-foreground list-none pl-0">
                <li className="flex items-center gap-2">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                    ✓
                  </span>
                  <span>
                    <strong className="text-emerald-600 dark:text-emerald-400">KYC Completed:</strong> Your selfie and ID document have been reviewed and approved
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                    2
                  </span>
                  <span>
                    <strong className="text-foreground">Enter Keys:</strong> Put the 5-digit verification key both on the website and in this withdrawal tab
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                    3
                  </span>
                  <span>
                    <strong className="text-foreground">Immediate Release:</strong> When both keys are put and correct, money is out for release without extra verification
                  </span>
                </li>
              </ul>
            </div>

            {/* Reassurance Footer */}
            <div className="border-t border-amber-500/20 pt-2.5 text-[11px] text-foreground font-medium flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                When both keys are put and the correct key has been sent, the money will be out for release without any extra verification.
              </span>
            </div>
          </div>
        )}

        {/* Primary Amount & Method Visual */}
        <div className="text-center py-2 space-y-1">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {isConsolidated ? `Total Withdrawn (Combined ${batch.count} Requests)` : "Total Withdrawn"}
          </p>
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-mono">
            {formatMoney(effectiveGross, displayCurrency)}
          </div>
          {isConsolidated && (
            <p className="text-[11px] text-primary font-medium">
              ⚡ Combined 7-day sum of {batch.count} payouts (This request: {formatMoney(grossAmount, displayCurrency)})
            </p>
          )}
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary/70 border border-border/50 px-3 py-1 mt-2">
            <PaymentMethodIcon id={paymentAsset.id} size="xs" />
            <span className="text-xs font-medium text-foreground">{displayMethod}</span>
          </div>
        </div>

        {/* Settlement Breakdown */}
        <div className="rounded-2xl bg-muted/40 border border-border/50 p-4 space-y-2.5 text-xs">
          <div className="flex justify-between items-center pb-1 border-b border-border/30">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {isConsolidated ? `Settlement Breakdown (${batch.count} Combined)` : "Settlement Breakdown"}
            </span>
            {isConsolidated && (
              <span className="text-[10px] font-mono font-bold text-primary">
                Combined 7-Day Total
              </span>
            )}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">
              {isConsolidated ? `Requested Payouts (${batch.count} total)` : "Requested Payout"}
            </span>
            <span className="font-mono font-medium text-foreground">
              {formatMoney(effectiveGross, displayCurrency)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">
              {isConsolidated
                ? `10% Fee (${batch.count} Payouts × 10% Each)`
                : "Processing Fee (10% standard)"}
            </span>
            <span className="font-mono font-medium text-rose-500 dark:text-rose-400">
              -{formatMoney(effectiveFee, displayCurrency)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border/30">
            <span className="font-semibold text-foreground">Net Dispatched Amount</span>
            <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
              {formatMoney(effectiveNet, displayPayoutCurrency)}
            </span>
          </div>
        </div>

        {/* Beneficiary & Rail Details */}
        <div className="space-y-3 text-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Beneficiary & Rail Details
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
              <span className="text-[10px] text-muted-foreground uppercase">Beneficiary</span>
              <p className="font-semibold text-foreground truncate mt-0.5">{wd.full_name}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
              <span className="text-[10px] text-muted-foreground uppercase">Payout Rail</span>
              <p className="font-semibold text-foreground truncate mt-0.5">
                {wd.provider || wd.method}
              </p>
            </div>
            {wd.upi_id && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border/40 col-span-2">
                <span className="text-[10px] text-muted-foreground uppercase">
                  Virtual Payment Address (UPI)
                </span>
                <p className="font-mono font-semibold text-foreground break-all mt-0.5">
                  {wd.upi_id}
                </p>
              </div>
            )}
            {wd.phone && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                <span className="text-[10px] text-muted-foreground uppercase">
                  Registered Phone
                </span>
                <p className="font-mono font-medium text-foreground mt-0.5">{wd.phone}</p>
              </div>
            )}
            <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
              <span className="text-[10px] text-muted-foreground uppercase">Submission Date</span>
              <p className="font-medium text-foreground mt-0.5 text-[11px]">{formattedDate}</p>
            </div>
          </div>
        </div>

        {/* Itemized 7-Day Withdrawals Breakdown (When Consolidated) */}
        {isConsolidated && (
          <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-foreground">
                  Itemized 7-Day Withdrawals ({batch.count})
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">
                Combined into 1 Payment
              </span>
            </div>
            <div className="space-y-2">
              {batch.withdrawals.map((item, idx) => {
                const isCurrent = item.id === wd.id || item.reference === wd.reference;
                const isPrimary =
                  item.reference === batch.primaryReference || item.id === batch.primaryReference;
                const itemGross = Number(item.amount);
                const itemDisplayAmt =
                  displayCurrency !== item.currency
                    ? convert(itemGross, item.currency, displayCurrency, ratesMap)
                    : itemGross;

                return (
                  <div
                    key={item.id || item.reference || idx}
                    className={cn(
                      "p-3 rounded-xl border text-xs flex items-center justify-between gap-3 transition-colors",
                      isCurrent
                        ? "bg-primary/10 border-primary/40 ring-1 ring-primary/30"
                        : "bg-muted/30 border-border/40 hover:bg-muted/50",
                    )}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-semibold text-foreground text-[11px] truncate">
                          {item.reference || `WD-${item.id?.slice(0, 8)}`}
                        </span>
                        {isPrimary && (
                          <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.2 rounded font-bold uppercase">
                            Primary ID
                          </span>
                        )}
                        {isCurrent && !isPrimary && (
                          <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.2 rounded font-semibold uppercase">
                            This Record
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <div className="font-mono font-bold text-foreground text-xs">
                        {formatMoney(itemDisplayAmt, displayCurrency)}
                      </div>
                      <div className="text-[10px] font-mono text-rose-500 dark:text-rose-400">
                        10% Fee: -{formatMoney(itemDisplayAmt * 0.1, displayCurrency)}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                        Net: {formatMoney(itemDisplayAmt * 0.9, displayCurrency)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="pt-2.5 border-t border-border/30 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Combined Gross ({batch.count} Payouts):</span>
                <span className="font-mono font-bold text-foreground">
                  {formatMoney(effectiveGross, displayCurrency)}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Total 10% Fee (10% on every transaction):</span>
                <span className="font-mono font-semibold text-rose-500 dark:text-rose-400">
                  -{formatMoney(effectiveFee, displayCurrency)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border/20 font-bold">
                <span className="text-emerald-700 dark:text-emerald-400">Net Combined Settlement:</span>
                <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400">
                  {formatMoney(effectiveNet, displayPayoutCurrency)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Indian Bank & UPI Rail Strip (When Applicable) */}
        {(isUPI || isIndianBank) && (
          <div className="rounded-2xl border border-border/50 bg-muted/30 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span>National Unified Payment Network</span>
              <span className="text-[10px] text-primary font-mono">IMPS / NPCI UPI</span>
            </div>
            <div className="flex items-center justify-between gap-1 overflow-x-auto py-1 scrollbar-none">
              {INDIAN_BANKS.slice(0, 5).map((bank) => (
                <div
                  key={bank.id}
                  className="flex items-center justify-center p-2 rounded-xl bg-card border border-border/40 shrink-0 shadow-sm"
                  title={bank.name}
                >
                  <BankLogo bankId={bank.id} size="xs" />
                </div>
              ))}
              <div className="flex items-center justify-center px-2 py-1 rounded-xl bg-card border border-border/40 shrink-0 text-[10px] font-bold text-muted-foreground shadow-sm">
                UPI
              </div>
            </div>
          </div>
        )}

        {/* Payout Progress & 2–5 Business Days Timeline */}
        <div className="rounded-2xl border border-border/50 bg-muted/30 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              <span>Payout Timeline</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/25">
              2–5 Business Days
            </span>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  compliance.isSuccess
                    ? "bg-emerald-500"
                    : compliance.isFailed
                      ? "bg-rose-500"
                      : compliance.isKeyBoxRequired || compliance.isKycRequired
                        ? "bg-amber-500"
                        : "bg-primary",
                )}
                style={{ width: `${compliance.progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium pt-0.5">
              <span>Initiated</span>
              <span className="font-semibold text-foreground">
                {compliance.isKeyBoxRequired || compliance.isKycRequired
                  ? "Action Required"
                  : `Expected: ${compliance.estimatedArrivalDate}`}
              </span>
              <span>Credited</span>
            </div>
          </div>

          {/* Clearance Schedule Summary */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Clearance & Settlement Milestones
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                Concludes Day 5
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {TIMELINE_SUMMARY_STEPS.map((step) => {
                const isPassed = compliance.stageNumber > step.stepNum;
                const isCurrent = compliance.stageNumber === step.stepNum;
                const isActionRequired =
                  (isCurrent && compliance.isKeyBoxRequired && step.stepNum === 4) ||
                  (isCurrent && compliance.isKycRequired && step.stepNum === 2);

                return (
                  <div
                    key={step.stepNum}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-xl text-xs transition-colors",
                      isCurrent
                        ? isActionRequired
                          ? "bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-semibold"
                          : "bg-primary/10 border border-primary/25 text-primary font-semibold"
                        : isPassed
                          ? "bg-muted/30 text-muted-foreground"
                          : "opacity-45 text-muted-foreground",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold",
                          isPassed
                            ? "bg-emerald-500 text-white"
                            : isCurrent
                              ? isActionRequired
                                ? "bg-amber-500 text-white"
                                : "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        {isPassed ? "✓" : step.stepNum}
                      </div>
                      <span className="text-[11px]">
                        {step.label}
                        {step.stepNum === 2 && compliance.isKycRequired ? " (Action Required)" : ""}
                        {step.stepNum === 4 && compliance.isKeyBoxRequired ? " (Action Required)" : ""}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] opacity-80">{step.timeWindow}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground pt-1 leading-relaxed">
              * Interbank transfers typically credit between 2–5 business days. The full clearing and compliance window concludes on Day 5.
            </p>
          </div>

          {/* Current Step and Next Expected Step Cards */}
          <div className="space-y-2.5 pt-1">
            {/* Current Step */}
            <div className={cn(
              "rounded-xl border p-3 space-y-1",
              compliance.isKeyBoxRequired || compliance.isKycRequired
                ? "border-amber-500/30 bg-amber-500/5"
                : "border-border/40 bg-card"
            )}>
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider",
                  compliance.isKeyBoxRequired || compliance.isKycRequired
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-primary"
                )}>
                  Current Step
                </span>
                <span className={cn(
                  "text-[10px]",
                  compliance.isKeyBoxRequired || compliance.isKycRequired
                    ? "font-bold text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground"
                )}>
                  {compliance.isKeyBoxRequired || compliance.isKycRequired ? "Action Required" : "In Progress"}
                </span>
              </div>
              <p className="text-xs font-semibold text-foreground">{compliance.currentStep}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {compliance.currentStepDescription}
              </p>
            </div>

            {/* Next Expected Step */}
            {!compliance.isSuccess && !compliance.isFailed && (
              <div className="rounded-xl border border-border/30 bg-muted/40 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Next Expected Step
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {compliance.nextReviewHours > 0 ? `~${compliance.nextReviewHours}h` : "Queued"}
                  </span>
                </div>
                <p className="text-xs font-medium text-foreground">{compliance.nextStep}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {compliance.nextStepDescription}
                </p>
              </div>
            )}

            {/* Estimated Completion Time Banner */}
            <div className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/15 px-3 py-2 text-xs">
              <span className="text-[11px] font-medium text-muted-foreground">
                Estimated Delivery Window
              </span>
              <span className="font-semibold text-primary text-[11px]">
                {compliance.isKeyBoxRequired
                  ? "Upon Key Matching & Verification"
                  : compliance.isKycRequired
                    ? "Upon KYC Review & Key Clearance"
                    : compliance.estimatedArrivalDate}
              </span>
            </div>
          </div>
        </div>

        {/* Reference Code & Verification */}
        <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {isConsolidated ? "Combined Settlement Reference ID" : "Settlement Reference"}
            </span>
            <div className="flex items-center gap-2">
              <p className="font-mono font-semibold text-foreground text-xs">
                {isConsolidated ? batch.primaryReference : wd.reference}
              </p>
              {isConsolidated && (
                <span className="text-[9px] bg-primary/15 text-primary px-1.5 py-0.2 rounded font-bold uppercase">
                  Primary ID
                </span>
              )}
            </div>
            {isConsolidated && wd.reference !== batch.primaryReference && (
              <p className="text-[10px] text-muted-foreground font-mono">
                Individual record ref: {wd.reference}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => copyRef(isConsolidated ? batch.primaryReference : wd.reference)}
            className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* ─── Action Buttons ─── */}
      <div className="flex gap-3 pt-1 no-print">
        <Link
          to="/transactions"
          className="flex-1 inline-flex items-center justify-center rounded-2xl bg-secondary border border-border/40 h-11 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
        >
          Back to Activity
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-primary h-11 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Download Record</span>
        </button>
      </div>
    </div>
  );
}
