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
    tx.kind === "withdrawal" ? tx.method || "Payout Rail" : tx.method || tx.recipient_name,
    tx.recipient_wallet_code?.includes("@") ? tx.recipient_wallet_code : undefined,
    undefined,
    tx.currency,
    tx.route,
    tx.kind,
  );
  const showBrand = paymentAsset.id !== "moonlight" && tx.kind !== "admin_credit";

  return (
    <Link
      to="/transactions/$id"
      params={{ id: tx.id }}
      className="flex items-center gap-3 sm:gap-4 py-3.5 px-3 sm:px-4 min-h-[52px] transition-opacity hover:opacity-70 touch-manipulation cursor-pointer"
    >
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary overflow-hidden">
        {showBrand ? (
          <BrandAsset id={paymentAsset.id} size="xs" />
        ) : (
          <Icon className="h-4 w-4" strokeWidth={1.5} />
        )}
        <div className="absolute -bottom-1 -right-1">
          <CountryFlag code={v.currency} circle size="xs" />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-medium">{v.title}</div>
        <div className="text-xs text-muted-foreground">
          {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ·{" "}
          {d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
          {tx.status !== "completed" && <span className="ml-2 capitalize">· {tx.status}</span>}
        </div>
      </div>
      <div
        className={cn(
          "tabular text-[15px] font-medium shrink-0 text-right",
          !v.outgoing && "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {formatMoney(v.amount, v.currency, { sign: true })}
      </div>
    </Link>
  );
}
