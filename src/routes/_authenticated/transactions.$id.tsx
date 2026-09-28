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
import { PaymentMethodIcon } from "@/components/AssetComponents";

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

      if (txData) return { type: "transaction" as const, data: txData };

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

  if (tx.isLoading) return <Skeleton className="mx-auto h-96 max-w-md rounded-3xl" />;
  if (!tx.data)
    return (
      <div className="mx-auto max-w-md text-center py-12 space-y-3">
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
    const wd = tx.data.data;
    const d = new Date(wd.created_at);

    const handleCopyRef = () => {
      navigator.clipboard.writeText(wd.reference);
      setCopied(true);
      toast.success("Reference code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    };

    const rows: [string, string][] = [
      ["Amount", formatMoney(Number(wd.amount), wd.currency)],
      ["Method", wd.method || "UPI Direct"],
      ...(wd.upi_id ? [["UPI ID / VPA", wd.upi_id] as [string, string]] : []),
      ...(wd.provider ? [["Provider", wd.provider] as [string, string]] : []),
      ["Name", wd.full_name],
      ["Email", wd.email],
      ...(wd.phone ? [["Phone", wd.phone] as [string, string]] : []),
      ...(wd.reason ? [["Reason", wd.reason] as [string, string]] : []),
      ["Date", d.toLocaleDateString(undefined, { dateStyle: "long" })],
      ["Time", d.toLocaleTimeString()],
      ["Status", wd.status],
      ["Reference", wd.reference],
    ];

    return (
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/transactions"
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Activity
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors cursor-pointer touch-manipulation"
          >
            <Printer className="h-3.5 w-3.5 text-muted-foreground" /> Print Receipt
          </button>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 sm:p-8 shadow-soft space-y-6 print:border-none print:shadow-none">
          {/* Header Branding */}
          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-foreground">
                MOONLIGHT WALLET
              </span>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Official European Settlement
            </span>
          </div>

          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Official European Ledger Record
            </div>
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-muted-foreground pt-0.5">
              {verified ? (
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Globe className="h-3.5 w-3.5 text-blue-500" />
              )}
              <span>{statusLabel}</span>
            </div>
            <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase pt-1">
              WITHDRAWAL / PAYOUT RECEIPT
            </p>
            <h1 className="tabular text-3xl sm:text-5xl font-semibold tracking-tight text-foreground">
              {formatMoney(Number(wd.amount), wd.currency)}
            </h1>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-2xl border border-border/50 bg-secondary/30 p-3 text-xs">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                Reference Code
              </p>
              <p className="font-mono text-xs font-semibold text-foreground truncate mt-0.5">
                {wd.reference}
              </p>
            </div>
            <button
              onClick={handleCopyRef}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 text-xs font-semibold text-foreground hover:bg-accent transition-colors shrink-0 cursor-pointer"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="divide-y border-t border-border/50 pt-2">
            {rows.map(([k, val]) => (
              <div
                key={k}
                className="flex justify-between items-center gap-3 py-3 text-xs sm:text-sm"
              >
                <span className="text-muted-foreground shrink-0">{k}</span>
                <span className="text-right font-semibold text-foreground break-all">{val}</span>
              </div>
            ))}
            <div className="flex justify-between items-center gap-3 py-3 text-xs sm:text-sm">
              <span className="text-muted-foreground shrink-0">Processing Timeframe</span>
              <span className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                Instant / Processing
              </span>
            </div>
          </div>

          <div className="border-t border-border/40 pt-4 text-center space-y-1">
            <div className="inline-flex items-center justify-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <FileCheck className="h-3.5 w-3.5 text-emerald-500" /> Verified Cryptographic Ledger
              Entry
            </div>
            <p className="text-[10px] font-semibold text-muted-foreground/80 tracking-widest uppercase">
              MOONLIGHT WALLET · EUROPEAN FINANCIAL INFRASTRUCTURE
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Normal Send Transfer Receipt
  const t = tx.data.data;
  const v = txView(t, wallet.data?.id);
  const d = new Date(t.created_at);

  const handleCopyReference = () => {
    if (!t.reference) return;
    navigator.clipboard.writeText(t.reference);
    setCopied(true);
    toast.success("Reference code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const rows: [string, string][] = [
    ["Transaction Type", "Transfer"],
    [
      "Sender",
      t.sender_wallet_code
        ? `${t.sender_name} (${t.sender_wallet_code})`
        : t.sender_name || "Moonlight Wallet",
    ],
    ["Recipient", `${t.recipient_name} (${t.recipient_wallet_code})`],
    ["Recipient Wallet ID", t.recipient_wallet_code],
    ["Amount Sent", formatMoney(Number(t.amount), t.currency)],
    ["Currency", t.currency],
    ...(Number(t.fee) > 0
      ? [["Transfer Fee (0.5%)", formatMoney(Number(t.fee), t.currency)] as [string, string]]
      : [["Transfer Fee", "Free (0.00)"] as [string, string]]),
    [
      "Recipient Receives",
      formatMoney(Number(t.recipient_amount ?? t.amount), t.recipient_currency ?? t.currency),
    ],
    ...(t.fx_rate && t.currency !== t.recipient_currency
      ? [
          [
            "Exchange Rate",
            `1 ${t.currency} ≈ ${Number(t.fx_rate).toFixed(4)} ${t.recipient_currency}`,
          ] as [string, string],
        ]
      : []),
    ["Payment / Transfer Method", t.method || "Moonlight Instant Network"],
    ["Date", d.toLocaleDateString(undefined, { dateStyle: "long" })],
    ["Time", d.toLocaleTimeString()],
    ["Status", t.status.toUpperCase()],
    ["Processing Timeframe", "Instant Settlement"],
    ["Reference Code", t.reference],
    ...(t.note ? [["Note", t.note] as [string, string]] : []),
  ];

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/transactions"
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Activity
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors cursor-pointer touch-manipulation"
        >
          <Printer className="h-3.5 w-3.5 text-muted-foreground" /> Print Receipt
        </button>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 sm:p-8 shadow-soft space-y-6 print:border-none print:shadow-none">
        {/* Header Branding */}
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-foreground">
              MOONLIGHT WALLET
            </span>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Official European Settlement
          </span>
        </div>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Official European Ledger Record
          </div>
          <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-muted-foreground pt-0.5">
            {verified ? (
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Globe className="h-3.5 w-3.5 text-blue-500" />
            )}
            <span>{statusLabel}</span>
          </div>
          <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase pt-1">
            {v.title}
          </p>
          <h1 className="tabular text-3xl sm:text-5xl font-semibold tracking-tight text-foreground">
            {formatMoney(v.amount, v.currency, { sign: true })}
          </h1>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-2xl border border-border/50 bg-secondary/30 p-3 text-xs">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase text-muted-foreground">
              Reference Code
            </p>
            <p className="font-mono text-xs font-semibold text-foreground truncate mt-0.5">
              {t.reference}
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

        <div className="divide-y border-t border-border/50 pt-2">
          {rows.map(([k, val]) => (
            <div
              key={k}
              className="flex justify-between items-center gap-3 py-3 text-xs sm:text-sm"
            >
              <span className="text-muted-foreground shrink-0">{k}</span>
              <span className="text-right font-semibold text-foreground break-all">{val}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-border/40 pt-4 text-center space-y-1">
          <div className="inline-flex items-center justify-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <FileCheck className="h-3.5 w-3.5 text-emerald-500" /> Verified Cryptographic Ledger
            Entry
          </div>
          <p className="text-[10px] font-semibold text-muted-foreground/80 tracking-widest uppercase">
            MOONLIGHT WALLET · EUROPEAN FINANCIAL INFRASTRUCTURE
          </p>
        </div>
      </div>
    </div>
  );
}
