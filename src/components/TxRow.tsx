import { Link } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { txView, type Tx } from "@/hooks/use-wallet";
import { cn } from "@/lib/utils";
import { CountryFlag } from "@/components/AssetComponents";

export function TxRow({ tx, walletId }: { tx: Tx; walletId?: string | undefined }) {
  const v = txView(tx, walletId);
  const Icon = tx.kind === "admin_credit" ? Plus : v.outgoing ? ArrowUpRight : ArrowDownLeft;
  const d = new Date(tx.created_at);
  return (
    <Link
      to="/transactions/$id"
      params={{ id: tx.id }}
      className="flex items-center gap-4 py-4 transition-opacity hover:opacity-70"
    >
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
        <Icon className="h-4 w-4" strokeWidth={1.5} />
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
          "tabular text-[15px] font-medium",
          !v.outgoing && "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {formatMoney(v.amount, v.currency, { sign: true })}
      </div>
    </Link>
  );
}

export function groupByPeriod(txs: Tx[]) {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startWeek = startToday - 6 * 86400000;
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const groups: { label: string; items: Tx[] }[] = [
    { label: "Today", items: [] },
    { label: "This week", items: [] },
    { label: "This month", items: [] },
    { label: "Earlier", items: [] },
  ];
  for (const t of txs) {
    const ts = new Date(t.created_at).getTime();
    const g = ts >= startToday ? 0 : ts >= startWeek ? 1 : ts >= startMonth ? 2 : 3;
    groups[g]!.items.push(t);
  }
  return groups.filter((g) => g.items.length);
}
