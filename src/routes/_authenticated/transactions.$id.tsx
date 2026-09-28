import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ShieldCheck, CheckCircle2, Clock, AlertTriangle, Globe } from "lucide-react";
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
  const tx = useQuery({
    queryKey: ["transaction", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
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
  const t = tx.data;
  const v = txView(t, wallet.data?.id);
  const d = new Date(t.created_at);
  const statusLabel = getAccountStatusLabel(profile.data?.email);
  const verified = isEuropeanVerified(profile.data?.email);

  const rows: [string, string][] = [
    [
      "From",
      t.sender_wallet_code
        ? `${t.sender_name} · ${t.sender_wallet_code}`
        : t.sender_name || "Moonlight Wallet",
    ],
    ["To", `${t.recipient_name} · ${t.recipient_wallet_code}`],
    ["Amount sent", formatMoney(Number(t.amount), t.currency)],
    ...(Number(t.fee) > 0
      ? [["Fee", formatMoney(Number(t.fee), t.currency)] as [string, string]]
      : []),
    [
      "Recipient received",
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
    ["Date", d.toLocaleDateString(undefined, { dateStyle: "long" })],
    ["Time", d.toLocaleTimeString()],
    ["Method", t.method],
    ["Status", t.status.charAt(0).toUpperCase() + t.status.slice(1)],
    ["Reference Code", t.reference],
    ...(t.note ? [["Note", t.note] as [string, string]] : []),
  ];

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link
        to="/transactions"
        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Activity
      </Link>

      <div className="rounded-3xl border border-border/60 bg-card p-6 sm:p-8 shadow-soft space-y-6">
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

        <div className="border-t border-border/40 pt-4 text-center">
          <p className="text-[10px] font-semibold text-muted-foreground/80 tracking-widest uppercase">
            MOONLIGHT WALLET · EUROPEAN FINANCIAL INFRASTRUCTURE
          </p>
        </div>
      </div>
    </div>
  );
}
