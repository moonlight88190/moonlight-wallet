import { createFileRoute, Link } from "@tanstack/react-router";
import { LogoFull } from "@/components/Logo";
import { CountryFlag, PaymentMethodIcon } from "@/components/AssetComponents";

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
    "Make moving money between people and countries feel simple, clear and effortless across Europe and global corridors.",
  ],
  [
    "Global Wallet",
    "Every Moonlight account has its own wallet ID and QR code, with balances displayed in the currency you prefer.",
  ],
  [
    "European & Global Networks",
    "Seamless integration with European SEPA Instant, Czech banking rails, Indian NPCI UPI, Philippine InstaPay & GCash.",
  ],
  [
    "Security & Ledger Integrity",
    "Moonlight is built around protected account access, double-entry ledger verification, and server-enforced balances.",
  ],
  [
    "Private Wealth Standard",
    "Explore transfers, withdrawals, market indexes, and instant digital voucher redemption from one unified platform.",
  ],
];

const FEATURED_COUNTRIES = [
  "CZ",
  "DE",
  "FR",
  "IT",
  "ES",
  "NL",
  "IN",
  "PH",
  "US",
  "GB",
  "AE",
  "SG",
  "JP",
];

function About() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <LogoFull className="mx-auto h-48 w-48" />
      <h1 className="mt-8 text-center text-5xl font-semibold tracking-tight">MOONLIGHT</h1>
      <p className="mt-4 text-center text-xl text-muted-foreground">
        European precision for international payments.
      </p>

      {/* Flag corridor bar */}
      <div className="mt-10 flex items-center justify-center gap-2 flex-wrap rounded-full border bg-card/60 p-3 shadow-soft">
        {FEATURED_COUNTRIES.map((c) => (
          <CountryFlag key={c} code={c} circle size="sm" />
        ))}
      </div>

      <div className="mt-16 space-y-12">
        {SECTIONS.map(([t, b]) => (
          <section key={t} className="rounded-3xl border bg-card/40 p-6 shadow-xs">
            <h2 className="text-xl font-semibold tracking-tight">{t}</h2>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">{b}</p>
          </section>
        ))}
      </div>

      {/* Payment rail logos */}
      <div className="mt-14 text-center space-y-4 border-t pt-10">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Supported Financial Infrastructure
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <PaymentMethodIcon id="sepa" size="sm" />
          <PaymentMethodIcon id="cz-bank" size="sm" />
          <PaymentMethodIcon id="upi" size="sm" />
          <PaymentMethodIcon id="gcash" size="sm" />
          <PaymentMethodIcon id="int-bank" size="sm" />
        </div>
      </div>

      <div className="mt-16 flex items-center justify-between border-t pt-8 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground font-medium">
          Moonlight Wallet
        </Link>
        <Link to="/admin-access" className="opacity-50 hover:opacity-100 font-mono">
          Authorized Access
        </Link>
      </div>
    </div>
  );
}
