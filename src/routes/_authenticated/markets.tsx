import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketIndices } from "@/components/MarketIndices";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/markets")({
  head: () => ({
    meta: [
      { title: "Markets — Moonlight Wallet" },
      {
        name: "description",
        content:
          "European, US, and Indian stock market indices, equity benchmarks and interactive charts.",
      },
      { property: "og:title", content: "Markets — Moonlight Wallet" },
      {
        property: "og:description",
        content: "Track global indices and equity benchmarks.",
      },
    ],
  }),
  component: MarketsPage,
});

function MarketsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-2 px-1 min-h-[44px] touch-manipulation"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          Markets
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          European, US and Indian equity indices. Daily close reference data.
        </p>
      </div>

      <MarketIndices compact={false} showHeader={false} />
    </div>
  );
}
