import { createFileRoute } from "@tanstack/react-router";
import { Landmark, Smartphone, Gift, ChevronRight } from "lucide-react";
import { PageTitle } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/withdraw")({
  head: () => ({
    meta: [
      { title: "Withdraw — Moonlight Wallet" },
      {
        name: "description",
        content:
          "Withdraw your available Moonlight Wallet balance via UPI, GCash, Bank Transfer, or Gift Cards.",
      },
      { property: "og:title", content: "Withdraw — Moonlight Wallet" },
      {
        property: "og:description",
        content: "Choose how you would like to withdraw your available balance.",
      },
    ],
  }),
  component: Withdraw,
});

const GROUPS = [
  {
    region: "India",
    items: [
      ["UPI", Smartphone],
      ["Bank Transfer", Landmark],
      ["Gift Cards", Gift],
    ],
  },
  {
    region: "Philippines",
    items: [
      ["GCash", Smartphone],
      ["Bank Transfer", Landmark],
      ["Gift Cards", Gift],
    ],
  },
  {
    region: "International",
    items: [
      ["Bank Transfer", Landmark],
      ["Gift Cards", Gift],
    ],
  },
] as const;

function Withdraw() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle eyebrow="WITHDRAW" title="Withdraw">
        Choose how you would like to withdraw your available balance.
      </PageTitle>
      <div className="space-y-10">
        {GROUPS.map((g) => (
          <div key={g.region}>
            <p className="mb-3 text-xs font-medium text-muted-foreground">{g.region}</p>
            <div className="divide-y rounded-3xl border bg-card px-5">
              {g.items.map(([label, Icon]) => (
                <div
                  key={label}
                  className="flex items-center gap-4 py-4 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                  <span className="flex-1 font-medium text-foreground">{label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
