import { createFileRoute } from "@tanstack/react-router";
import { useTransactions, useWallet } from "@/hooks/use-wallet";
import { TxRow, groupByPeriod } from "@/components/TxRow";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTitle } from "@/components/AppShell";

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
    <div className="mx-auto max-w-2xl space-y-6">
      <PageTitle eyebrow="HISTORY" title="Activity">
        Full ledger record of transfers, payouts and conversions.
      </PageTitle>

      {txs.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : txs.error ? (
        <p className="text-destructive font-medium">Couldn't load your activity.</p>
      ) : !txs.data?.length ? (
        <div className="rounded-3xl border border-dashed p-10 text-center space-y-2">
          <p className="font-semibold text-foreground text-base">No transactions yet</p>
          <p className="text-xs text-muted-foreground">
            Your transfers and payout activity will appear here.
          </p>
        </div>
      ) : (
        groupByPeriod(txs.data).map((g) => (
          <div key={g.label} className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase px-1">
              {g.label}
            </p>
            <div className="divide-y rounded-2xl border border-border/60 bg-card overflow-hidden shadow-2xs">
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
