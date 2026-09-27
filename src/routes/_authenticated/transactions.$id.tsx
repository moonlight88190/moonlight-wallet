import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { txView, useWallet } from "@/hooks/use-wallet";
import { formatMoney } from "@/lib/currency";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/transactions/$id")({
  head: () => ({
    meta: [
      { title: "Receipt — Moonlight Wallet" },
      { name: "description", content: "Transaction receipt." },
      { property: "og:title", content: "Receipt — Moonlight Wallet" },
      { property: "og:description", content: "Transaction receipt." },
    ],
  }),
  component: Receipt,
});

function Receipt() {
  const { id } = Route.useParams();
  const wallet = useWallet();
  const tx = useQuery({
    queryKey: ["transaction", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("transactions").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  if (tx.isLoading) return <Skeleton className="mx-auto h-96 max-w-md rounded-3xl" />;
  if (!tx.data) return <p className="text-center text-muted-foreground">Transaction not found.</p>;
  const t = tx.data;
  const v = txView(t, wallet.data?.id);
  const d = new Date(t.created_at);
  const rows: [string, string][] = [
    ["From", t.sender_wallet_code ? `${t.sender_name} · ${t.sender_wallet_code}` : t.sender_name || "Moonlight"],
    ["To", `${t.recipient_name} · ${t.recipient_wallet_code}`],
    ["Amount sent", formatMoney(Number(t.amount), t.currency)],
    ...(Number(t.fee) > 0 ? [["Fee", formatMoney(Number(t.fee), t.currency)] as [string, string]] : []),
    ["Recipient received", formatMoney(Number(t.recipient_amount ?? t.amount), t.recipient_currency ?? t.currency)],
    ...(t.fx_rate && t.currency !== t.recipient_currency ? [["Exchange rate", `1 ${t.currency} = ${Number(t.fx_rate)} ${t.recipient_currency}`] as [string, string]] : []),
    ["Date", d.toLocaleDateString(undefined, { dateStyle: "long" })],
    ["Time", d.toLocaleTimeString()],
    ["Method", t.method],
    ["Status", t.status.charAt(0).toUpperCase() + t.status.slice(1)],
    ["Transaction ID", t.reference],
    ...(t.note ? [["Note", t.note] as [string, string]] : []),
  ];
  return (
    <div className="mx-auto max-w-md">
      <Link to="/transactions" className="mb-8 flex items-center text-sm text-muted-foreground"><ChevronLeft className="h-4 w-4" /> Activity</Link>
      <div className="rounded-[2rem] border bg-card p-8 shadow-soft">
        <p className="text-center text-sm text-muted-foreground">{v.title}</p>
        <p className="tabular mt-2 text-center text-5xl font-semibold tracking-tight">{formatMoney(v.amount, v.currency, { sign: true })}</p>
        <div className="mt-8 divide-y">
          {rows.map(([k, val]) => (
            <div key={k} className="flex justify-between gap-4 py-3.5 text-sm"><span className="text-muted-foreground">{k}</span><span className="text-right font-medium break-all">{val}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}
