import { createFileRoute } from "@tanstack/react-router";
import { useTransactions, useWallet } from "@/hooks/use-wallet";
import { TxRow } from "@/components/TxRow";
import { groupByPeriod } from "@/lib/compliance";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTitle } from "@/components/AppShell";
import { Receipt } from "lucide-react";

export const Route = createFileRoute("/_authenticated/transactions/")({
  head: () => ({
    meta: [
      { title: "Activity — Moonlight Wallet" },
      { name: "description", content: "Your full Moonlight Wallet transaction history." },
      { property: "og:title", content: "Activity — Moonlight Wallet" },
      { property: "og:description", content: "Your transaction history." },
    ],
  }),
  component: History,
});

function History() {
  const wallet = useWallet();
  const txs = useTransactions(200);
  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-16 animate-in fade-in duration-200">
      <PageTitle eyebrow="TRANSACTION LEDGER" title="Activity">
        Full record of your transfers, payouts, withdrawals and voucher redemptions.
      </PageTitle>

      {txs.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 rounded-2xl bg-card/60" />
          ))}
        </div>
      ) : txs.error ? (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
          <p className="text-xs font-semibold text-rose-500">Could not load your activity ledger.</p>
        </div>
      ) : !txs.data?.length ? (
        <div className="rounded-3xl border border-dashed border-border/60 bg-card/40 p-12 text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center">
            <Receipt className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">No transactions yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your transfers, payout activity, and redemptions will appear here.
            </p>
          </div>
        </div>
      ) : (
        groupByPeriod(txs.data).map((g) => (
          <div key={g.label} className="space-y-2.5">
            <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase px-1">
              {g.label}
            </p>
            <div className="divide-y divide-border/40 rounded-3xl border border-border/60 bg-card/60 overflow-hidden shadow-soft">
              {g.items.map((t) => (
                <TxRow key={t.id} tx={t} walletId={wallet.data?.id} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
