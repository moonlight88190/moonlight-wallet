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
  ArrowDownLeft,
  Building2,
  ShieldCheck,
  ExternalLink,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWallet, useProfile, useRates } from "@/hooks/use-wallet";
import { formatMoney, convert, getRate } from "@/lib/currency";
import { Skeleton } from "@/components/ui/skeleton";
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
  const feeAmount =
    displayCurrency !== wd.currency
      ? grossAmount * 0.1
      : rawFee;
  const netSettlement =
    displayPayoutCurrency !== payoutCurrency
      ? convert(rawNet, payoutCurrency, displayPayoutCurrency, ratesMap)
      : rawNet;
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
            ) : compliance.isKycRequired ? (
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-pulse" />
            ) : compliance.isHold ? (
              <Lock className="h-4 w-4" />
            ) : statusUpper === "FAILED" || statusUpper === "CANCELLED" ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <Clock className="h-4 w-4 animate-spin-slow" />
            )}
            <span className="uppercase">
              {compliance.isKycRequired ? "KYC VERIFICATION REQUIRED" : statusUpper}
            </span>
          </div>
          <span className="text-[11px] font-medium opacity-90">
            {compliance.isSuccess
              ? "Settled"
              : compliance.isKycRequired
                ? "Action Required"
                : compliance.estimatedDaysText}
          </span>
        </div>

        {/* ─── Mandatory KYC Verification Action Card ─── */}
        {compliance.isKycRequired && (
          <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-b from-amber-500/15 via-amber-500/10 to-amber-500/5 p-4 sm:p-5 space-y-3.5 shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-300 shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm tracking-tight flex items-center gap-2">
                    <span>Mandatory KYC Verification Required</span>
                    <span className="bg-amber-500/25 text-amber-800 dark:text-amber-200 text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold">
                      Pending Action
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Outbound clearing could not be completed automatically. In strict accordance with statutory financial regulations, your payout requires identity verification before funds can be released to your bank account.
                  </p>
                </div>
              </div>
            </div>

            {/* Email Notification Notice */}
            <div className="rounded-xl bg-card/85 border border-amber-500/25 p-3 flex items-start gap-2.5 text-xs">
              <Mail className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold text-foreground">
                  Check Your Registered Email
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  You will receive an email from Moonlight Financial with instructions to complete KYC. You can also send your documents directly to the compliance desk below.
                </p>
              </div>
            </div>

            {/* Direct Email Submission Box */}
            <div className="rounded-xl bg-card border border-border/70 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Submit Documents To:
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
                    toast.success("KYC email copied to clipboard");
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline shrink-0 cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Email</span>
                </button>
              </div>

              <Link
                to="/kyc"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-card font-semibold text-xs py-2.5 min-h-[44px]"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Complete KYC</span>
              </Link>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Upload your live or recent photo and ID in Complete KYC, and also email the same photos to the address above.
              </p>
              {/* Action: Open Email Client */}
              <a
                href={`mailto:moonlightwealthmanagement@gmail.com?subject=${encodeURIComponent(`KYC Verification Documents - Payout Ref: ${wd.reference}`)}&body=${encodeURIComponent(`Hello Moonlight Compliance Team,\n\nPlease find attached my identity verification (KYC) documents for my withdrawal payout.\n\nWithdrawal Reference: ${wd.reference}\nFull Name: ${wd.full_name}\nAmount: ${formatMoney(grossAmount, displayCurrency)}\nPayout Method: ${displayMethod}\nDestination: ${wd.upi_id || wd.phone || displayMethod}\n\nAttached Documents:\n1. Live or recent photo matching the document below\n2. ID document (School ID / College ID / Library ID / Aadhaar / PAN / Driving Licence)\n\nThank you,\n${wd.full_name}`)}`}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs py-2.5 shadow-sm transition-colors cursor-pointer"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Send KYC Documents via Email</span>
                <ExternalLink className="h-3 w-3 opacity-70" />
              </a>
            </div>

            {/* Checklist of required items */}
            <div className="space-y-1.5 text-xs pt-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Required Verification Documents:
              </span>
              <ul className="space-y-1 text-[11px] text-muted-foreground list-none pl-0">
                <li className="flex items-center gap-2">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold">1</span>
                  <span>Valid Government Photo ID (Passport / National ID / Driving License)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold">2</span>
                  <span>Bank Statement / Passbook matching beneficiary name ({wd.full_name})</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold">3</span>
                  <span>Payout Reference ID: <strong className="font-mono text-foreground">{wd.reference}</strong></span>
                </li>
              </ul>
            </div>

            {/* Reassurance Footer */}
            <div className="border-t border-amber-500/20 pt-2.5 text-[11px] text-foreground font-medium flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                As soon as your KYC is completed and verified by our compliance team, the withdrawal amount will reflect in your bank account.
              </span>
            </div>
          </div>
        )}

        {/* Primary Amount & Method Visual */}
        <div className="text-center py-2 space-y-1">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Total Withdrawn
          </p>
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-mono">
            {formatMoney(grossAmount, displayCurrency)}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary/70 border border-border/50 px-3 py-1 mt-2">
            <PaymentMethodIcon id={paymentAsset.id} size="xs" />
            <span className="text-xs font-medium text-foreground">{displayMethod}</span>
          </div>
        </div>

        {/* Settlement Breakdown */}
        <div className="rounded-2xl bg-muted/40 border border-border/50 p-4 space-y-2.5 text-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pb-1 border-b border-border/30">
            Settlement Breakdown
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Requested Payout</span>
            <span className="font-mono font-medium text-foreground">
              {formatMoney(grossAmount, displayCurrency)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Processing Fee (10% standard)</span>
            <span className="font-mono font-medium text-muted-foreground">
              -{formatMoney(feeAmount, displayCurrency)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border/30">
            <span className="font-semibold text-foreground">Net Dispatched Amount</span>
            <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
              {formatMoney(netSettlement, displayPayoutCurrency)}
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
                      : compliance.isKycRequired
                        ? "bg-amber-500"
                        : "bg-primary",
                )}
                style={{ width: `${compliance.progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium pt-0.5">
              <span>Initiated</span>
              <span className="font-semibold text-foreground">
                {compliance.isKycRequired ? "Action Required" : `Expected: ${compliance.estimatedArrivalDate}`}
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
                return (
                  <div
                    key={step.stepNum}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-xl text-xs transition-colors",
                      isCurrent
                        ? compliance.isKycRequired
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
                              ? compliance.isKycRequired
                                ? "bg-amber-500 text-white"
                                : "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        {isPassed ? "✓" : step.stepNum}
                      </div>
                      <span className="text-[11px]">
                        {step.label}
                        {step.stepNum === 4 && compliance.isKycRequired ? " (Action Required)" : ""}
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
              compliance.isKycRequired
                ? "border-amber-500/30 bg-amber-500/5"
                : "border-border/40 bg-card"
            )}>
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider",
                  compliance.isKycRequired ? "text-amber-600 dark:text-amber-400" : "text-primary"
                )}>
                  Current Step
                </span>
                <span className={cn(
                  "text-[10px]",
                  compliance.isKycRequired ? "font-bold text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                )}>
                  {compliance.isKycRequired ? "Action Required" : "In Progress"}
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
                {compliance.isKycRequired ? "Upon KYC Verification" : compliance.estimatedArrivalDate}
              </span>
            </div>
          </div>
        </div>

        {/* Reference Code & Verification */}
        <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Settlement Reference
            </span>
            <p className="font-mono font-semibold text-foreground text-xs">{wd.reference}</p>
          </div>
          <button
            type="button"
            onClick={() => copyRef(wd.reference)}
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
