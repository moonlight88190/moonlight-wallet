import { Link } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { txView, type Tx } from "@/hooks/use-wallet";
import { cn } from "@/lib/utils";
import { CountryFlag, BrandAsset } from "@/components/AssetComponents";
import { resolvePaymentAsset } from "@/lib/assets";

export function TxRow({ tx, walletId }: { tx: Tx; walletId?: string | undefined }) {
  const v = txView(tx, walletId);
  const Icon = tx.kind === "admin_credit" ? Plus : v.outgoing ? ArrowUpRight : ArrowDownLeft;
  const d = new Date(tx.created_at);

  const paymentAsset = resolvePaymentAsset(
    tx.kind === "withdrawal"
      ? tx.method || "Payout Rail"
      : tx.method || tx.recipient_name || undefined,
    tx.recipient_wallet_code?.includes("@") ? tx.recipient_wallet_code : undefined,
    undefined,
    tx.currency,
    tx.route,
    tx.kind,
  );
  const showBrand = paymentAsset.id !== "moonlight" && tx.kind !== "admin_credit";

  return (
    <Link
      to={tx.kind === "withdrawal" ? "/withdrawals/$id" : "/transactions/$id"}
      params={{ id: tx.id }}
      className="flex items-center gap-3 py-3.5 px-3.5 sm:px-4 min-h-[56px] transition-colors hover:bg-accent/30 touch-manipulation cursor-pointer group"
    >
      {/* Transaction Icon */}
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/60 overflow-hidden border border-border/20">
        {showBrand ? (
          <BrandAsset id={paymentAsset.id} size="xs" />
        ) : (
          <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
        )}
        <div className="absolute -bottom-0.5 -right-0.5">
          <CountryFlag code={v.currency} circle size="xs" />
        </div>
      </div>

      {/* Transaction Details */}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium text-foreground">{v.title}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">
          {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ·{" "}
          {d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
          {tx.status !== "completed" && (
            <span className="ml-1.5 capitalize text-gold">· {tx.status}</span>
          )}
        </div>
      </div>

      {/* Amount */}
      <div
        className={cn(
          "tabular text-[13px] font-semibold shrink-0 text-right",
          !v.outgoing && "text-success",
        )}
      >
        {formatMoney(v.amount, v.currency, { sign: true })}
      </div>
    </Link>
  );
}
