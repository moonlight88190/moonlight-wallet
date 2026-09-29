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
    const wd = tx.data.data;
    const d = new Date(wd.created_at);

    const handleCopyRef = () => {
      navigator.clipboard.writeText(wd.reference_code || wd.reference || "");
      setCopied(true);
      toast.success("Reference code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    };

    const refCode = wd.reference_code || wd.reference || "";

    const rows: [string, string][] = [
      ["Method", wd.method || "UPI Direct"],
      ...(wd.upi_id ? [["UPI ID / VPA", wd.upi_id] as [string, string]] : []),
      ...(wd.provider ? [["Provider", wd.provider] as [string, string]] : []),
      ["Recipient Name", wd.full_name],
      ["Email", wd.email],
      ...(wd.phone ? [["Phone", wd.phone] as [string, string]] : []),
      ...(wd.reason ? [["Reason", wd.reason] as [string, string]] : []),
      ["Date & Time", `${d.toLocaleDateString(undefined, { dateStyle: "medium" })} · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`],
      ["Status", wd.status.toUpperCase()],
    ];

    return (
      <div className="mx-auto max-w-sm px-1 space-y-4 pb-20 sm:pb-8">
        <div className="flex items-center justify-between">
          <Link
            to="/transactions"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Activity
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors cursor-pointer touch-manipulation active:scale-[0.96]"
          >
            <Printer className="h-3.5 w-3.5 text-muted-foreground" /> Print
          </button>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-5 sm:p-6 shadow-soft space-y-5 print:border-none print:shadow-none">
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Official Transaction Record
            </div>
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-muted-foreground pt-0.5">
              {verified ? (
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Globe className="h-3.5 w-3.5 text-blue-500" />
              )}
              <span>{statusLabel}</span>
            </div>
            <p className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase pt-1">
              WITHDRAWAL RECEIPT
            </p>
            <h1 className="font-mono text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
              {formatMoney(Number(wd.amount), wd.currency)}
            </h1>
          </div>

          {/* REAL ASSET DISPLAY ON RECEIPT */}
          {(() => {
            const assetInfo = getTransactionAsset(wd.method, wd.upi_id, wd.provider, wd.currency);
            return (
              <div className="flex items-center gap-3.5 rounded-2xl border border-primary/20 bg-primary/5 p-3 shadow-2xs">
                {assetInfo.type === "gift" ? (
                  <div className="w-16 shrink-0">
                    <GiftCardBrand card={assetInfo.gift} />
                  </div>
                ) : (
                  <PaymentMethodIcon id={assetInfo.id} size="md" />
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-bold uppercase text-primary tracking-wider">
                    Settlement Rail
                  </span>
                  <h4 className="font-bold text-xs sm:text-sm text-foreground truncate">{assetInfo.label}</h4>
                  {wd.upi_id && (
                    <p className="font-mono text-[11px] text-muted-foreground truncate">{wd.upi_id}</p>
                  )}
                </div>
              </div>
            );
          })()}

          <div className="flex items-center justify-between gap-2 rounded-2xl border border-border/50 bg-secondary/30 p-3 text-xs">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                Reference Code
              </p>
              <p className="font-mono text-xs font-semibold text-foreground truncate mt-0.5">
                {refCode}
              </p>
            </div>
            <button
              onClick={handleCopyRef}
              className="flex h-10 items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 text-xs font-semibold text-foreground hover:bg-accent transition-colors shrink-0 cursor-pointer touch-manipulation active:scale-[0.96]"
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
              <div
                key={k}
                className="flex justify-between items-center gap-2 py-2.5 text-xs"
              >
                <span className="text-muted-foreground shrink-0">{k}</span>
                <span className="text-right font-medium text-foreground break-all">{val}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border/40 pt-3 text-center space-y-1">
            <div className="inline-flex items-center justify-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <FileCheck className="h-3.5 w-3.5 text-emerald-500" /> Verified Ledger Record
            </div>
            <p className="text-[9px] font-semibold text-muted-foreground/80 tracking-widest uppercase">
              MOONLIGHT WALLET · GLOBAL FINANCIAL INFRASTRUCTURE
            </p>
          </div>
        </div>

        {/* Sticky Mobile Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border/60 sm:static sm:bg-transparent sm:border-0 sm:p-0 z-10">
          <Link
            to="/transactions"
            className="w-full flex items-center justify-center rounded-full h-12 bg-primary text-primary-foreground font-semibold text-sm shadow-soft active:scale-[0.98] transition-transform"
          >
            Done &amp; Return to Activity
          </Link>
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
    [
      "From",
      t.sender_wallet_code
        ? `${t.sender_name} (${t.sender_wallet_code})`
        : t.sender_name || "Moonlight Wallet",
    ],
    ["To", `${t.recipient_name} (${t.recipient_wallet_code})`],
    ["Amount sent", formatMoney(Number(t.amount), t.currency)],
    ...(Number(t.fee) > 0
      ? [["Fee", formatMoney(Number(t.fee), t.currency)] as [string, string]]
      : []),
    [
      "Recipient receives",
      formatMoney(Number(t.recipient_amount ?? t.amount), t.recipient_currency ?? t.currency),
    ],
    ...(t.fx_rate && t.currency !== t.recipient_currency
      ? [
          ["Exchange rate", `1 ${t.currency} = ${Number(t.fx_rate)} ${t.recipient_currency}`] as [
            string,
            string,
          ],
        ]
      : []),
    ["Date & Time", `${d.toLocaleDateString(undefined, { dateStyle: "medium" })} · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`],
    ["Method", t.method],
    ["Status", t.status.toUpperCase()],
    ...(t.note ? [["Note", t.note] as [string, string]] : []),
  ];

  return (
    <div className="mx-auto max-w-sm px-1 space-y-4 pb-20 sm:pb-8">
      <div className="flex items-center justify-between">
        <Link
          to="/transactions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Activity
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors cursor-pointer touch-manipulation active:scale-[0.96]"
        >
          <Printer className="h-3.5 w-3.5 text-muted-foreground" /> Print
        </button>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-5 sm:p-6 shadow-soft space-y-5 print:border-none print:shadow-none">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Official Transaction Record
          </div>
          <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-muted-foreground pt-0.5">
            {verified ? (
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Globe className="h-3.5 w-3.5 text-blue-500" />
            )}
            <span>{statusLabel}</span>
          </div>
          <p className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase pt-1">
            {v.title}
          </p>
          <h1 className="font-mono text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            {formatMoney(v.amount, v.currency, { sign: true })}
          </h1>
        </div>

        {/* REAL ASSET DISPLAY ON RECEIPT */}
        {(() => {
          const assetInfo = getTransactionAsset(t.method, undefined, undefined, t.currency);
          return (
            <div className="flex items-center gap-3.5 rounded-2xl border border-primary/20 bg-primary/5 p-3 shadow-2xs">
              {assetInfo.type === "gift" ? (
                <div className="w-16 shrink-0">
                  <GiftCardBrand card={assetInfo.gift} />
                </div>
              ) : (
                <PaymentMethodIcon id={assetInfo.id} size="md" />
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-bold uppercase text-primary tracking-wider">
                  Settlement Rail
                </span>
                <h4 className="font-bold text-xs sm:text-sm text-foreground truncate">{assetInfo.label}</h4>
                <p className="text-[11px] text-muted-foreground truncate">{t.method}</p>
              </div>
            </div>
          );
        })()}

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
            className="flex h-10 items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 text-xs font-semibold text-foreground hover:bg-accent transition-colors shrink-0 cursor-pointer touch-manipulation active:scale-[0.96]"
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
            <div
              key={k}
              className="flex justify-between items-center gap-2 py-2.5 text-xs"
            >
              <span className="text-muted-foreground shrink-0">{k}</span>
              <span className="text-right font-medium text-foreground break-all">{val}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-border/40 pt-3 text-center space-y-1">
          <div className="inline-flex items-center justify-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <FileCheck className="h-3.5 w-3.5 text-emerald-500" /> Verified Cryptographic Ledger
            Entry
          </div>
          <p className="text-[9px] font-semibold text-muted-foreground/80 tracking-widest uppercase">
            MOONLIGHT WALLET · GLOBAL FINANCIAL INFRASTRUCTURE
          </p>
        </div>
      </div>

      {/* Sticky Mobile Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border/60 sm:static sm:bg-transparent sm:border-0 sm:p-0 z-10">
        <Link
          to="/transactions"
          className="w-full flex items-center justify-center rounded-full h-12 bg-primary text-primary-foreground font-semibold text-sm shadow-soft active:scale-[0.98] transition-transform"
        >
          Done &amp; Return to Activity
        </Link>
      </div>
    </div>
  );
}
