import { createFileRoute, Link } from "@tanstack/react-router";
import { PageTitle } from "@/components/AppShell";
import { MarketIndices } from "@/components/MarketIndices";
import { ArrowLeft, TrendingUp, ShieldCheck, Globe } from "lucide-react";
import { useProfile, getAccountStatusLabel, isEuropeanVerified } from "@/hooks/use-wallet";

export const Route = createFileRoute("/_authenticated/markets")({
  head: () => ({
    meta: [
      { title: "Stock Markets & Global Indices — Moonlight Wallet" },
      {
        name: "description",
        content:
          "Live European, US, and Indian stock market indices, major equity benchmarks, interactive charts and daily close movements.",
      },
      { property: "og:title", content: "Stock Markets — Moonlight Wallet" },
      {
        property: "og:description",
        content: "Track global indices and stock equity benchmarks in your preferred currency.",
      },
    ],
  }),
  component: MarketsPage,
});

function MarketsPage() {
  const profile = useProfile();
  const isVerified = isEuropeanVerified(profile.data?.email);
  const statusLabel = getAccountStatusLabel(profile.data?.email);

  return (
    <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-2 px-1 min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-secondary/80 px-3 py-1 rounded-full border border-border/40">
          {isVerified ? (
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Globe className="h-3.5 w-3.5 text-blue-500" />
          )}
          <span>{statusLabel}</span>
        </div>
      </div>

      <PageTitle eyebrow="GLOBAL ASSET INTELLIGENCE" title="Stock Markets & Indices">
        Track key European, US, and Indian equity indices and flagship corporate stocks. Prices and
        returns are refreshed once daily and converted to your preferred currency.
      </PageTitle>

      <MarketIndices compact={false} showHeader={false} />
    </div>
  );
}
