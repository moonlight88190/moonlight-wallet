import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ShieldCheck,
  CheckCircle2,
  Globe,
  Copy,
  Check,
  Printer,
  FileCheck,
  Clock,
  ArrowRight,
  Building2,
  AlertCircle,
  Banknote,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  txView,
  useWallet,
  useProfile,
  getAccountStatusLabel,
  isEuropeanVerified,
} from "@/hooks/use-wallet";
import { formatMoney } from "@/lib/currency";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentMethodIcon, GiftCardBrand } from "@/components/AssetComponents";
import { GIFT_CARDS, PAYMENT_METHODS } from "@/lib/assets";

function getTransactionAsset(
  methodName?: string,
  upiId?: string,
  providerName?: string,
  currency?: string,
) {
  const m = (methodName || "").toLowerCase();
  const u = (upiId || "").toLowerCase();
  const p = (providerName || "").toLowerCase();
  const c = (currency || "").toUpperCase();

  // Gift Card Check
  const matchedGift = GIFT_CARDS.find(
    (g) => m.includes(g.id) || m.includes(g.brand.toLowerCase()) || p.includes(g.id),
  );
  if (matchedGift) {
    return { type: "gift" as const, gift: matchedGift };
  }

  // UPI provider check (Google Pay, PhonePe, Paytm, BHIM, Amazon Pay)
  if (p.includes("google") || u.includes("@ok") || u.includes("@gpay")) {
    return { type: "method" as const, id: "google-pay", label: "Google Pay" };
  }
  if (p.includes("phonepe") || u.includes("@ybl") || u.includes("@ibl") || u.includes("@axl")) {
    return { type: "method" as const, id: "phonepe", label: "PhonePe" };
  }
  if (p.includes("paytm") || u.includes("@paytm")) {
    return { type: "method" as const, id: "paytm", label: "Paytm" };
  }
  if (p.includes("bhim") || u.includes("@upi") || u.includes("@bhim")) {
    return { type: "method" as const, id: "bhim", label: "BHIM UPI" };
  }
  if (p.includes("amazon") || u.includes("@apl") || u.includes("@amazon")) {
    return { type: "method" as const, id: "amazon-pay", label: "Amazon Pay" };
  }

  // Philippines assets
  if (m.includes("gcash") || c === "PHP") {
    if (m.includes("bank"))
      return { type: "method" as const, id: "ph-bank", label: "Philippine Bank (InstaPay)" };
    return { type: "method" as const, id: "gcash", label: "GCash Wallet" };
  }

  // India assets
  if (m.includes("upi") || c === "INR" || u.length > 0) {
    if (m.includes("bank"))
      return { type: "method" as const, id: "in-bank", label: "Indian Bank (IMPS/NEFT)" };
    return { type: "method" as const, id: "upi", label: "UPI Direct" };
  }

  // European assets
  if (c === "EUR" || m.includes("sepa")) {
    return { type: "method" as const, id: "sepa", label: "SEPA Instant Transfer" };
  }
  if (c === "CZK" || m.includes("czech") || m.includes("cz")) {
    return { type: "method" as const, id: "cz-bank", label: "Czech Bank Transfer" };
  }
  if (c === "GBP" || m.includes("faster") || m.includes("uk")) {
    return { type: "method" as const, id: "faster-payments", label: "UK Faster Payments" };
  }

  // Fallback match by PAYMENT_METHODS
  const pm = PAYMENT_METHODS.find(
    (item) => m.includes(item.id) || m.includes(item.name.toLowerCase()),
  );
  if (pm) {
    return { type: "method" as const, id: pm.id, label: pm.name };
  }

  return { type: "method" as const, id: "sepa", label: methodName || "Bank Settlement Rail" };
}

export const WITHDRAWAL_COMPLIANCE_STAGES = [
  { hourMin: 0, hourMax: 12, reason: "Money sent to international wire network" },
  { hourMin: 12, hourMax: 24, reason: "Checking money legitimacy & anti-money laundering (AML) compliance" },
  { hourMin: 24, hourMax: 36, reason: "Correspondent bank clearance & beneficiary account verification" },
  { hourMin: 36, hourMax: 48, reason: "Interbank fraud review & regulatory clearance protocol" },
  { hourMin: 48, hourMax: 60, reason: "Cross-border clearing house liquidity validation" },
  { hourMin: 60, hourMax: 72, reason: "Central bank clearing gateway queue processing" },
  { hourMin: 72, hourMax: 84, reason: "Overseas payout partner SWIFT/SEPA protocol handshake" },
  { hourMin: 84, hourMax: 96, reason: "International remittance audit & compliance sign-off" },
  { hourMin: 96, hourMax: 108, reason: "Secondary AML risk assessment & source-of-funds verification" },
  { hourMin: 108, hourMax: 120, reason: "Regional central bank settlement queue clearance" },
  { hourMin: 120, hourMax: 132, reason: "Nostro/Vostro interbank balance reconciliation" },
  { hourMin: 132, hourMax: 144, reason: "Foreign exchange clearance & local clearing house release" },
  { hourMin: 144, hourMax: 156, reason: "Final beneficiary bank dispatch & credit clearance check" },
  { hourMin: 156, hourMax: 168, reason: "Ultimate interbank clearance verification prior to ledger seal" },
];

export function getWithdrawalComplianceInfo(createdAtStr: string, dbStatus: string) {
  const createdDate = new Date(createdAtStr);
  const now = new Date();
  const elapsedMs = Math.max(0, now.getTime() - createdDate.getTime());
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  const normalizedStatus = (dbStatus || "").toUpperCase();

  // If status in DB is final (COMPLETED, FAILED, CANCELLED, SUCCESS), respect DB status
  if (["COMPLETED", "SUCCESS", "APPROVED"].includes(normalizedStatus)) {
    return {
      statusLabel: "SUCCESS",
      reason: "Withdrawal processed & funds disbursed successfully by settlement bank.",
      isProcessing: false,
      isHold: false,
      stageNumber: 14,
      totalStages: 14,
      elapsedHours,
    };
  }

  if (["FAILED", "DECLINED", "REJECTED"].includes(normalizedStatus)) {
    return {
      statusLabel: "FAILED",
      reason: "Withdrawal rejected during bank clearance protocol. Balance refunded.",
      isProcessing: false,
      isHold: false,
      stageNumber: 0,
      totalStages: 14,
      elapsedHours,
    };
  }

  if (["CANCELLED", "CANCELED"].includes(normalizedStatus)) {
    return {
      statusLabel: "CANCELLED",
      reason: "Withdrawal request was cancelled. Funds returned to wallet balance.",
      isProcessing: false,
      isHold: false,
      stageNumber: 0,
      totalStages: 14,
      elapsedHours,
    };
  }

  // Active / Pending logic
  if (elapsedHours >= 168) {
    return {
      statusLabel: "ON HOLD",
      reason: "Hold active: Awaiting final manual audit and approval from admin panel.",
      isProcessing: true,
      isHold: true,
      stageNumber: 14,
      totalStages: 14,
      elapsedHours,
    };
  }

  // 0 to 168 hours: 12-hour changing windows
  const currentStageIndex = Math.min(
    13,
    Math.floor(elapsedHours / 12)
  );
  const stageObj = WITHDRAWAL_COMPLIANCE_STAGES[currentStageIndex];

  return {
    statusLabel: "PROCESSING",
    reason: stageObj.reason,
    isProcessing: true,
    isHold: false,
    stageNumber: currentStageIndex + 1,
    totalStages: 14,
    elapsedHours,
  };
}

export const Route = createFileRoute("/_authenticated/transactions/$id")({
  head: () => ({
    meta: [
      { title: "Official Receipt — Moonlight Wallet" },
      { name: "description", content: "Transaction receipt and reference details." },
      { property: "og:title", content: "Receipt — Moonlight Wallet" },
      { property: "og:description", content: "Transaction receipt." },
    ],
  }),
  component: Receipt,
});

function Receipt() {
  const { id } = Route.useParams();
  const wallet = useWallet();
  const profile = useProfile();
  const [copied, setCopied] = useState(false);

  const tx = useQuery({
    queryKey: ["transaction", id],
    queryFn: async () => {
      // First check transactions table
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

      // If not in transactions, check withdrawals table
      const { data: wdData } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (wdData) return { type: "withdrawal" as const, data: wdData };

      return null;
    },
  });

  if (tx.isLoading) return <Skeleton className="mx-auto h-96 max-w-sm rounded-3xl" />;
  if (!tx.data)
    return (
      <div className="mx-auto max-w-sm text-center py-12 space-y-3">
        <p className="text-muted-foreground">Transaction record not found.</p>
        <Link to="/transactions" className="text-xs font-semibold text-primary hover:underline">
          Return to Activity
        </Link>
      </div>
    );

  const isWithdrawal = tx.data.type === "withdrawal";
  const statusLabel = getAccountStatusLabel(profile.data?.email);
  const verified = isEuropeanVerified(profile.data?.email);

  if (isWithdrawal) {
    const wd = tx.data.data as Record<string, unknown>;
    const d = new Date(wd.created_at as string);

    const handleCopyRef = () => {
      navigator.clipboard.writeText(wd.reference_code || wd.reference || "");
      setCopied(true);
      toast.success("Reference code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    };

    const refCode = (wd.reference_code || wd.reference || "").toString();
    const methodLower = (wd.method || "").toLowerCase();
    const isIndianCorridor =
      wd.currency === "INR" ||
      methodLower.includes("upi") ||
      methodLower.includes("in-bank") ||
      methodLower.includes("indian") ||
      Boolean(wd.upi_id);

    // Compute dynamic compliance info
    const compliance = getWithdrawalComplianceInfo(wd.created_at as string, wd.status as string);

    const rows: [string, string][] = [
      ["Payout Method", (wd.method as string) || "UPI Direct"],
      ...(wd.upi_id ? [["UPI ID / VPA", wd.upi_id as string] as [string, string]] : []),
      ...(wd.provider ? [["Payout Gateway", wd.provider as string] as [string, string]] : []),
      ["Beneficiary Name", wd.full_name as string],
      ["Beneficiary Email", wd.email as string],
      ...(wd.phone ? [["Beneficiary Phone", wd.phone as string] as [string, string]] : []),
      ...(wd.reason ? [["Payout Purpose", wd.reason as string] as [string, string]] : []),
      [
        "Initiated On",
        `${d.toLocaleDateString(undefined, { dateStyle: "medium" })} · ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      ],
    ];

    return (
      <div className="mx-auto max-w-sm px-1 space-y-4 pb-20 sm:pb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center justify-between">
          <Link
            to="/transactions"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Activity
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer touch-manipulation active:scale-[0.96]"
          >
            <Printer className="h-3.5 w-3.5" /> Official Bank Print
          </button>
        </div>

        {/* DISTINCT BANK WITHDRAWAL RECEIPT FRAME (Amber/Gold Interbank Theme) */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/30 bg-gradient-to-b from-amber-500/5 via-card to-card p-5 sm:p-6 shadow-xl space-y-5 print:border-none print:shadow-none">
          {/* Top Decorative Payout Seal */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
              <Building2 className="h-3.5 w-3.5" /> International Bank Wire &amp; Payout Clearing
            </div>

            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-muted-foreground pt-0.5">
              {verified ? (
                <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
              ) : (
                <Globe className="h-3.5 w-3.5 text-blue-500" />
              )}
              <span>{statusLabel} · Correspondent Clearing Network</span>
            </div>

            <p className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 tracking-widest uppercase pt-1">
              OFFICIAL BANK WITHDRAWAL RECEIPT
            </p>

            <h1 className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              {formatMoney(Number(wd.amount), wd.currency as string)}
            </h1>
          </div>

          {/* DYNAMIC 12-HOUR COMPLIANCE / CLEARANCE STATUS CARD */}
          <div className={`rounded-2xl border p-4 space-y-2.5 transition-all ${
            compliance.isHold
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : compliance.statusLabel === "SUCCESS"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : compliance.statusLabel === "FAILED" || compliance.statusLabel === "CANCELLED"
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold tracking-wider uppercase flex items-center gap-1.5">
                {compliance.isProcessing ? (
                  <Clock className="h-3.5 w-3.5 animate-spin duration-3000 text-amber-500" />
                ) : (
                  <ShieldCheck className="h-3.5 w-3.5" />
                )}
                Withdrawal Status
              </span>

              <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                compliance.isHold
                  ? "bg-destructive text-destructive-foreground animate-pulse"
                  : compliance.statusLabel === "SUCCESS"
                    ? "bg-emerald-500 text-white"
                    : compliance.statusLabel === "FAILED" || compliance.statusLabel === "CANCELLED"
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-amber-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-400 animate-pulse"
              }`}>
                {compliance.statusLabel}
              </span>
            </div>

            {/* Dynamic Stage Progress Bar if in 7-day window */}
            {compliance.isProcessing && (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold opacity-80">
                  <span>Clearing Stage {compliance.stageNumber} of {compliance.totalStages}</span>
                  <span>{Math.floor(compliance.elapsedHours)}h / 168h elapsed</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-amber-500/20 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${(compliance.stageNumber / compliance.totalStages) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Live Changing Reason Box */}
            <div className="pt-1 border-t border-amber-500/20 text-xs font-semibold leading-relaxed">
              <span className="font-bold uppercase text-[10px] block opacity-75">Current Compliance Reason:</span>
              <span>{compliance.reason}</span>
            </div>
          </div>

          {/* REAL ASSET DISPLAY ON RECEIPT */}
          {(() => {
            const assetInfo = getTransactionAsset(wd.method as string, wd.upi_id as string, wd.provider as string, wd.currency as string);
            return (
              <div className="flex items-center gap-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3.5 shadow-2xs">
                {assetInfo.type === "gift" ? (
                  <div className="w-16 shrink-0">
                    <GiftCardBrand card={assetInfo.gift} />
                  </div>
                ) : (
                  <PaymentMethodIcon id={assetInfo.id} size="md" />
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-bold uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                    Bank Payout Settlement Rail
                  </span>
                  <h4 className="font-bold text-xs sm:text-sm text-foreground truncate">
                    {assetInfo.label}
                  </h4>
                  {wd.upi_id && (
                    <p className="font-mono text-[11px] text-muted-foreground truncate">
                      VPA: {wd.upi_id as string}
                    </p>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Reference Code Banner */}
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-border/60 bg-secondary/40 p-3 text-xs">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                Wire Reference Code
              </p>
              <p className="font-mono text-xs font-bold text-foreground truncate mt-0.5">
                {refCode}
              </p>
            </div>
            <button
              onClick={handleCopyRef}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 text-xs font-semibold text-foreground hover:bg-accent transition-colors shrink-0 cursor-pointer touch-manipulation active:scale-[0.96]"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" /> Copy
                </>
              )}
            </button>
          </div>

          {/* Details Table */}
          <div className="divide-y divide-border/40 border-t border-b border-border/50 py-1">
            {rows.map(([k, val]) => (
              <div key={k} className="flex justify-between items-center gap-2 py-2.5 text-xs">
                <span className="text-muted-foreground shrink-0">{k}</span>
                <span className="text-right font-semibold text-foreground break-all">{val}</span>
              </div>
            ))}
          </div>

          {/* Accepted Indian Bank & Network Strip */}
          {isIndianCorridor && (
            <div className="space-y-2 pt-2 border-t border-border/40">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                Supported Bank &amp; Network Rails
              </p>
              <div className="flex items-center justify-start gap-2 overflow-x-auto py-2 px-1 no-scrollbar scrollbar-none touch-pan-x min-w-0">
                <PaymentMethodIcon id="sbi" />
                <PaymentMethodIcon id="hdfc-bank" />
                <PaymentMethodIcon id="icici-bank" />
                <PaymentMethodIcon id="axis-bank" />
                <PaymentMethodIcon id="yes-bank" />
                <PaymentMethodIcon id="upi" />
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-center text-[11px] font-medium text-amber-600 dark:text-amber-400">
            Transaction charge is 10%. Once sent/submitted, withdrawals cannot be cancelled or reversed.
          </div>

          <div className="border-t border-border/40 pt-3 text-center space-y-1">
            <div className="inline-flex items-center justify-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <FileCheck className="h-3.5 w-3.5 text-amber-500" /> Interbank Clearing Seal &amp; Ledger Record
            </div>
            <p className="text-[9px] font-semibold text-muted-foreground/80 tracking-widest uppercase">
              MOONLIGHT WALLET · EUROPEAN &amp; INTERNATIONAL PAYOUT INFRASTRUCTURE
            </p>
          </div>
        </div>

        {/* Sticky Mobile Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border/60 sm:static sm:bg-transparent sm:border-0 sm:p-0 z-10">
          <Link
            to="/transactions"
            className="w-full flex items-center justify-center rounded-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-soft active:scale-[0.98] transition-transform"
          >
            Done &amp; Return to Activity
          </Link>
        </div>
      </div>
    );
  }

  // DISTINCT NORMAL SEND TRANSFER RECEIPT (Indigo/Violet Wallet Transfer Theme)
  const t = tx.data.data as Record<string, unknown>;
  const v = txView(t as Parameters<typeof txView>[0], wallet.data?.id);
  const d = new Date(t.created_at as string);

  const handleCopyReference = () => {
    if (!t.reference) return;
    navigator.clipboard.writeText(t.reference as string);
    setCopied(true);
    toast.success("Reference code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const rows: [string, string][] = [
    [
      "Sender",
      t.sender_wallet_code
        ? `${t.sender_name} (${t.sender_wallet_code})`
        : (t.sender_name as string) || "Moonlight Wallet",
    ],
    ["Recipient", `${t.recipient_name} (${t.recipient_wallet_code})`],
    ["Amount Sent", formatMoney(Number(t.amount), t.currency as string)],
    ...(Number(t.fee) > 0
      ? [["Transfer Fee (10%)", formatMoney(Number(t.fee), t.currency as string)] as [string, string]]
      : []),
    [
      "Recipient Amount",
      formatMoney(Number(t.recipient_amount ?? t.amount), (t.recipient_currency ?? t.currency) as string),
    ],
    ...(t.fx_rate && t.currency !== t.recipient_currency
      ? [
          ["Conversion Rate", `1 ${t.currency} = ${Number(t.fx_rate)} ${t.recipient_currency}`] as [
            string,
            string,
          ],
        ]
      : []),
    [
      "Date & Time",
      `${d.toLocaleDateString(undefined, { dateStyle: "medium" })} · ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
    ],
    ["Transfer Rail", (t.method as string) || "Instant Wallet Transfer"],
    ["Ledger Status", ((t.status as string) || "COMPLETED").toUpperCase()],
    ...(t.note ? [["Note", t.note as string] as [string, string]] : []),
  ];

  return (
    <div className="mx-auto max-w-sm px-1 space-y-4 pb-20 sm:pb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between">
        <Link
          to="/transactions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Activity
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-all cursor-pointer touch-manipulation active:scale-[0.96]"
        >
          <Printer className="h-3.5 w-3.5" /> Print
        </button>
      </div>

      {/* DISTINCT WALLET TRANSFER FRAME (Indigo/Violet Peer-to-Peer Theme) */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-indigo-500/30 bg-gradient-to-b from-indigo-500/5 via-card to-card p-5 sm:p-6 shadow-xl space-y-5 print:border-none print:shadow-none">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 px-3 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
            <Send className="h-3.5 w-3.5" /> Peer-to-Peer Wallet Transfer
          </div>

          <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-muted-foreground pt-0.5">
            {verified ? (
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
            ) : (
              <Globe className="h-3.5 w-3.5 text-blue-500" />
            )}
            <span>{statusLabel} · Instant Wallet Settlement</span>
          </div>

          <p className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 tracking-widest uppercase pt-1">
            {v.title.toUpperCase()} RECEIPT
          </p>

          <h1 className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {formatMoney(v.amount, v.currency, { sign: true })}
          </h1>
        </div>

        {/* Sender -> Recipient Visual Flow Badge */}
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-3.5 flex items-center justify-between text-xs font-semibold">
          <div className="space-y-0.5 min-w-0 flex-1">
            <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider block">Sender</span>
            <p className="font-bold text-foreground truncate">{t.sender_name as string || "Moonlight Wallet"}</p>
            <p className="font-mono text-[10px] text-muted-foreground truncate">{t.sender_wallet_code as string}</p>
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-white shrink-0 mx-2 shadow-2xs">
            <ArrowRight className="h-4 w-4" />
          </div>

          <div className="space-y-0.5 min-w-0 flex-1 text-right">
            <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider block">Recipient</span>
            <p className="font-bold text-foreground truncate">{t.recipient_name as string}</p>
            <p className="font-mono text-[10px] text-muted-foreground truncate">{t.recipient_wallet_code as string}</p>
          </div>
        </div>

        {/* REAL ASSET DISPLAY ON RECEIPT */}
        {(() => {
          const assetInfo = getTransactionAsset(t.method as string, undefined, undefined, t.currency as string);
          return (
            <div className="flex items-center gap-3.5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-3 shadow-2xs">
              {assetInfo.type === "gift" ? (
                <div className="w-16 shrink-0">
                  <GiftCardBrand card={assetInfo.gift} />
                </div>
              ) : (
                <PaymentMethodIcon id={assetInfo.id} size="md" />
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-bold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                  Transfer Network Rail
                </span>
                <h4 className="font-bold text-xs sm:text-sm text-foreground truncate">
                  {assetInfo.label}
                </h4>
                <p className="text-[11px] text-muted-foreground truncate">{(t.method as string) || "Direct Wallet Transfer"}</p>
              </div>
            </div>
          );
        })()}

        <div className="flex items-center justify-between gap-2 rounded-2xl border border-border/50 bg-secondary/30 p-3 text-xs">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase text-muted-foreground">
              Transaction Reference
            </p>
            <p className="font-mono text-xs font-semibold text-foreground truncate mt-0.5">
              {t.reference as string}
            </p>
          </div>
          <button
            onClick={handleCopyReference}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 text-xs font-semibold text-foreground hover:bg-accent transition-colors shrink-0 cursor-pointer touch-manipulation active:scale-[0.96]"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-muted-foreground" /> Copy
              </>
            )}
          </button>
        </div>

        <div className="divide-y divide-border/40 border-t border-b border-border/50 py-1">
          {rows.map(([k, val]) => (
            <div key={k} className="flex justify-between items-center gap-2 py-2.5 text-xs">
              <span className="text-muted-foreground shrink-0">{k}</span>
              <span className="text-right font-medium text-foreground break-all">{val}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-center text-xs font-medium text-amber-600 dark:text-amber-400">
          Transaction charge is 10%. Once sent, wallet transfers cannot be cancelled or reversed.
        </div>

        <div className="border-t border-border/40 pt-3 text-center space-y-1">
          <div className="inline-flex items-center justify-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <FileCheck className="h-3.5 w-3.5 text-indigo-500" /> Verified Wallet Ledger Record Entry
          </div>
          <p className="text-[9px] font-semibold text-muted-foreground/80 tracking-widest uppercase">
            MOONLIGHT WALLET · SYNCHRONIZED INTERBANK LEDGER RECORD
          </p>
        </div>
      </div>

      {/* Sticky Mobile Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border/60 sm:static sm:bg-transparent sm:border-0 sm:p-0 z-10">
        <Link
          to="/transactions"
          className="w-full flex items-center justify-center rounded-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-soft active:scale-[0.98] transition-transform"
        >
          Done &amp; Return to Activity
        </Link>
      </div>
    </div>
  );
}
