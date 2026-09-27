import { createFileRoute, Link } from "@tanstack/react-router";
import { LogoFull } from "@/components/Logo";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Moonlight Wallet" },
      {
        name: "description",
        content:
          "Moonlight Wallet is a calm international wallet. Our mission, global features, security and technology.",
      },
      { property: "og:title", content: "About Moonlight Wallet" },
      { property: "og:description", content: "Move money without the complexity." },
    ],
  }),
  component: About,
});

const SECTIONS = [
  [
    "Our Mission",
    "Make moving money between people and countries feel simple, clear and effortless.",
  ],
  [
    "Global Wallet",
    "Every Moonlight account has its own wallet ID and QR code, with balances displayed in the currency you prefer.",
  ],
  [
    "Security",
    "Moonlight is built around protected account access, secure data handling and server-side financial records.",
  ],
  [
    "Technology",
    "Moonlight combines modern web technology, secure infrastructure and continuously updated financial data.",
  ],
  [
    "Wealth Management",
    "Explore transfers, withdrawals, market information and wealth-management tools from one place.",
  ],
];

function About() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <LogoFull className="mx-auto h-56 w-56" />
      <h1 className="mt-12 text-center text-5xl font-semibold tracking-tight">MOONLIGHT</h1>
      <p className="mt-4 text-center text-xl text-muted-foreground">
        Move money without the complexity.
      </p>
      <div className="mt-20 space-y-14">
        {SECTIONS.map(([t, b]) => (
          <section key={t}>
            <h2 className="text-2xl font-semibold tracking-tight">{t}</h2>
            <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{b}</p>
          </section>
        ))}
      </div>
      <div className="mt-24 flex items-center justify-between border-t pt-8 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Moonlight Wallet
        </Link>
        <Link to="/admin-access" className="opacity-50 hover:opacity-100">
          Authorized Access
        </Link>
      </div>
    </div>
  );
}
