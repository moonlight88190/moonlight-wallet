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
    <div className="mx-auto max-w-2xl">
      <PageTitle eyebrow="HISTORY" title="Activity" />
      {txs.isLoading ? (
        <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : txs.error ? (
        <p className="text-destructive">Couldn't load your activity.</p>
      ) : !txs.data?.length ? (
        <p className="rounded-3xl border border-dashed py-16 text-center text-muted-foreground">No transactions yet.</p>
      ) : (
        groupByPeriod(txs.data).map((g) => (
          <div key={g.label} className="mb-8">
            <p className="text-xs font-medium text-muted-foreground">{g.label}</p>
            <div className="divide-y">{g.items.map((t) => <TxRow key={t.id} tx={t} walletId={wallet.data?.id} />)}</div>
          </div>
        ))
      )}
    </div>
  );
}
