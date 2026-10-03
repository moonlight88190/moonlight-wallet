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
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWallet, useProfile } from "@/hooks/use-wallet";
import { formatMoney } from "@/lib/currency";
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

  const compliance = getWithdrawalComplianceInfo(wd.created_at, wd.status);
  const statusUpper = (wd.status || "PROCESSING").toUpperCase().replace(/_/g, " ");

  // Fee and settlement economics
  const grossAmount = Number(wd.amount);
  const feeAmount = Number(wd.fee ?? Math.round(grossAmount * 0.1));
  const netSettlement = Number(wd.recipient_amount ?? grossAmount - feeAmount);
  const payoutCurrency = wd.recipient_currency || wd.currency;

  const isUPI =
    wd.method?.toLowerCase().includes("upi") || wd.route?.toLowerCase() === "upi" || !!wd.upi_id;
  const isIndianBank =
    wd.method?.toLowerCase().includes("bank") ||
    wd.method?.toLowerCase().includes("imps") ||
    wd.route?.toLowerCase() === "in-bank";

  const paymentAsset = resolvePaymentAsset(
    wd.provider || wd.method,
    wd.upi_id || undefined,
    undefined,
    wd.currency,
    wd.route,
    "withdrawal",
  );

  const formattedDate = new Date(wd.created_at).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="mx-auto max-w-lg space-y-5 px-3 sm:px-4 py-4 sm:py-6 pb-28 animate-in fade-in duration-200">
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
      <div className="relative overflow-hidden rounded-3xl border border-[#2A3241] bg-[#10141D] p-5 sm:p-6 shadow-xl space-y-6">
        {/* Specular lighting line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

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
            <CountryFlag code={wd.currency} circle size="sm" />
            <span className="text-xs font-mono font-semibold text-muted-foreground">
              {wd.currency}
            </span>
          </div>
        </div>

        {/* Payout Status Banner */}
        <div
          className={cn(
            "flex items-center justify-between rounded-2xl px-4 py-3 border text-xs font-semibold tracking-wide",
            compliance.isSuccess
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
              : statusUpper === "FAILED" || statusUpper === "CANCELLED"
                ? "bg-rose-500/10 border-rose-500/25 text-rose-400"
                : compliance.isHold
                  ? "bg-amber-500/10 border-amber-500/25 text-amber-400"
                  : "bg-blue-500/10 border-blue-500/25 text-blue-400",
          )}
        >
          <div className="flex items-center gap-2">
            {compliance.isSuccess ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : compliance.isHold ? (
              <Lock className="h-4 w-4" />
            ) : statusUpper === "FAILED" || statusUpper === "CANCELLED" ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <Clock className="h-4 w-4 animate-spin-slow" />
            )}
            <span className="uppercase">{statusUpper}</span>
          </div>
          <span className="text-[11px] opacity-80 font-normal">
            Stage {compliance.stageNumber} of {compliance.totalStages}
          </span>
        </div>

        {/* Primary Amount & Method Visual */}
        <div className="text-center py-2 space-y-1">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Total Withdrawn
          </p>
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-mono">
            {formatMoney(grossAmount, wd.currency)}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary/60 border border-border/40 px-3 py-1 mt-2">
            <PaymentMethodIcon id={paymentAsset.id} size="xs" />
            <span className="text-xs font-medium text-foreground">{wd.method}</span>
          </div>
        </div>

        {/* Authoritative Settlement Breakdown */}
        <div className="rounded-2xl bg-secondary/30 border border-border/40 p-4 space-y-2.5 text-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pb-1 border-b border-border/30">
            Authoritative Settlement Breakdown
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Requested Payout</span>
            <span className="font-mono font-medium text-foreground">
              {formatMoney(grossAmount, wd.currency)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Processing Fee (10% standard)</span>
            <span className="font-mono font-medium text-muted-foreground">
              -{formatMoney(feeAmount, wd.currency)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border/30">
            <span className="font-semibold text-foreground">Net Dispatched Amount</span>
            <span className="font-mono font-bold text-sm text-emerald-400">
              {formatMoney(netSettlement, payoutCurrency)}
            </span>
          </div>
        </div>

        {/* Beneficiary & Rail Details */}
        <div className="space-y-3 text-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Beneficiary & Rail Details
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-secondary/20 border border-border/30">
              <span className="text-[10px] text-muted-foreground uppercase">Beneficiary</span>
              <p className="font-semibold text-foreground truncate mt-0.5">{wd.full_name}</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/20 border border-border/30">
              <span className="text-[10px] text-muted-foreground uppercase">Payout Rail</span>
              <p className="font-semibold text-foreground truncate mt-0.5">
                {wd.provider || wd.method}
              </p>
            </div>
            {wd.upi_id && (
              <div className="p-3 rounded-xl bg-secondary/20 border border-border/30 col-span-2">
                <span className="text-[10px] text-muted-foreground uppercase">
                  Virtual Payment Address (UPI)
                </span>
                <p className="font-mono font-semibold text-foreground break-all mt-0.5">
                  {wd.upi_id}
                </p>
              </div>
            )}
            {wd.phone && (
              <div className="p-3 rounded-xl bg-secondary/20 border border-border/30">
                <span className="text-[10px] text-muted-foreground uppercase">
                  Registered Phone
                </span>
                <p className="font-mono font-medium text-foreground mt-0.5">{wd.phone}</p>
              </div>
            )}
            <div className="p-3 rounded-xl bg-secondary/20 border border-border/30">
              <span className="text-[10px] text-muted-foreground uppercase">Submission Date</span>
              <p className="font-medium text-foreground mt-0.5 text-[11px]">{formattedDate}</p>
            </div>
          </div>
        </div>

        {/* Indian Bank & UPI Rail Strip (When Applicable) */}
        {(isUPI || isIndianBank) && (
          <div className="rounded-2xl border border-border/40 bg-secondary/20 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span>National Unified Payment Network</span>
              <span className="text-[10px] text-primary font-mono">IMPS / NPCI UPI</span>
            </div>
            <div className="flex items-center justify-between gap-1 overflow-x-auto py-1 scrollbar-none">
              {INDIAN_BANKS.slice(0, 5).map((bank) => (
                <div
                  key={bank.id}
                  className="flex items-center justify-center p-2 rounded-xl bg-card/60 border border-border/30 shrink-0"
                  title={bank.name}
                >
                  <BankLogo bankId={bank.id} size="xs" />
                </div>
              ))}
              <div className="flex items-center justify-center px-2 py-1 rounded-xl bg-card/60 border border-border/30 shrink-0 text-[10px] font-bold text-muted-foreground">
                UPI
              </div>
            </div>
          </div>
        )}

        {/* Compliance & AML Settlement Timeline */}
        <div className="rounded-2xl border border-border/40 bg-secondary/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Compliance & FATF Review</span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">
              Stage {compliance.stageNumber} of 14
            </span>
          </div>

          {/* Progress track */}
          <div className="h-1.5 w-full rounded-full bg-secondary/60 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                compliance.isSuccess
                  ? "bg-emerald-500 w-full"
                  : compliance.isHold
                    ? "bg-amber-500 w-full"
                    : "bg-primary",
              )}
              style={{
                width:
                  compliance.isSuccess || compliance.isHold
                    ? "100%"
                    : `${Math.max(7, (compliance.stageNumber / 14) * 100)}%`,
              }}
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-foreground">{compliance.stageTitle}</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {compliance.description}
            </p>
          </div>

          {compliance.nextReviewHours > 0 && (
            <div className="pt-2 border-t border-border/30 flex justify-between items-center text-[10px] text-muted-foreground font-mono">
              <span>Next Window Check</span>
              <span>
                In ~{compliance.nextReviewHours} hour{compliance.nextReviewHours > 1 ? "s" : ""}
              </span>
            </div>
          )}
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
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* ─── Sticky Mobile Bottom Bar ─── */}
      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-border/40 bg-background/95 backdrop-blur-md p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-lg flex gap-3">
          <Link
            to="/transactions"
            className="flex-1 inline-flex items-center justify-center rounded-full bg-secondary border border-border/40 h-11 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
          >
            Back to Activity
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary h-11 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Download Record</span>
          </button>
        </div>
      </div>
    </div>
  );
}
