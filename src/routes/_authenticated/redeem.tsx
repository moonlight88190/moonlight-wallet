import { createFileRoute } from "@tanstack/react-router";
import { Landmark, Smartphone, Gift } from "lucide-react";
import { PageTitle } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/redeem")({
  head: () => ({
    meta: [
      { title: "Redeem — Moonlight Wallet" },
      { name: "description", content: "Simulated redemption methods for India, the Philippines and international users." },
      { property: "og:title", content: "Redeem — Moonlight Wallet" },
      { property: "og:description", content: "Simulated redemption methods." },
    ],
  }),
  component: Redeem,
});

const GROUPS = [
  { region: "India", items: [["UPI", Smartphone], ["Bank transfer", Landmark], ["Gift cards", Gift]] },
  { region: "Philippines", items: [["GCash", Smartphone], ["Bank transfer", Landmark], ["Gift cards", Gift]] },
  { region: "International", items: [["Bank transfer", Landmark], ["Gift cards", Gift]] },
] as const;

function Redeem() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle eyebrow="REDEEM" title="Redeem">Redemption flows arrive in the next build. These are simulations and never move real money.</PageTitle>
      <div className="space-y-10">
        {GROUPS.map((g) => (
          <div key={g.region}>
            <p className="mb-3 text-xs font-medium text-muted-foreground">{g.region}</p>
            <div className="divide-y rounded-3xl border bg-card px-5">
              {g.items.map(([label, Icon]) => (
                <div key={label} className="flex items-center gap-4 py-4 text-muted-foreground">
                  <Icon className="h-5 w-5" strokeWidth={1.5} /><span className="flex-1 text-foreground">{label}</span><span className="text-xs">Next phase</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
