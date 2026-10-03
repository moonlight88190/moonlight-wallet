import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Globe, ShieldCheck, Zap, Lock, Building2 } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { CountryFlag, PaymentMethodIcon } from "@/components/AssetComponents";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Moonlight — Digital Wallet & Payments" },
      {
        name: "description",
        content:
          "Moonlight Wallet provides secure multi-currency balance management, instant peer-to-peer transfers, and direct global payout corridors.",
      },
      { property: "og:title", content: "About Moonlight Wallet" },
      { property: "og:description", content: "Modern digital payments and global money transfers." },
    ],
  }),
  component: About,
});

const SECTIONS = [
  {
    icon: Globe,
    title: "Our Mission",
    body: "Making money movement across borders simple, fast, and transparent. Moonlight provides customers with reliable digital wallet accounts, direct clearing connections, and clear, upfront exchange rates.",
  },
  {
    icon: Building2,
    title: "Multi-Currency Balance Management",
    body: "Hold, manage, and track balances across major global currencies including EUR, USD, GBP, INR, and more. Rates are updated daily against official market references with transparent conversion previews.",
  },
  {
    icon: Zap,
    title: "Local Clearing & Payout Corridors",
    body: "Withdraw funds directly to domestic banking and instant payment networks worldwide, including European SEPA, UK Faster Payments, Indian UPI and IMPS, and regional mobile wallets.",
  },
  {
    icon: ShieldCheck,
    title: "Bank-Grade Account Security",
    body: "Protected by end-to-end data encryption, session verification, automated fraud anomaly detection, and operational security safeguards to keep your funds safe at all times.",
  },
  {
    icon: Lock,
    title: "Auditable Transaction Records",
    body: "Every payment, transfer, and payout generates an immutable reference confirmation with full itemized details, verifiable timestamps, and downloadable receipts.",
  },
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

/**
 * Renders the public Moonlight introduction, capabilities, and supported payment methods.
 */
function About() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 sm:py-20 animate-fade-up">
      {/* Back button */}
      <div className="mb-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-2 px-1 min-h-[44px] touch-manipulation"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Overview
        </Link>
      </div>

      {/* Brand Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-950 p-2 shadow-card border border-border/40">
          <img
            src="/assets/brand/moonlight-logo.png"
            alt="Moonlight Wallet"
            className="h-full w-full object-contain rounded-2xl"
          />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-[10px] font-bold text-gold tracking-widest uppercase mb-2">
            <span>DIGITAL PAYMENTS &amp; TRANSFERS</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            MOONLIGHT
          </h1>
          <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            European engineering and modern payment architecture for secure multi-currency transfers and digital wallet balances.
          </p>
        </div>
      </div>

      {/* Flag corridor bar */}
      <div className="mt-10 flex items-center justify-center gap-2.5 flex-wrap rounded-full border border-border/40 bg-card/60 p-3 shadow-soft backdrop-blur-md">
        {FEATURED_COUNTRIES.map((c) => (
          <CountryFlag key={c} code={c} circle size="sm" />
        ))}
      </div>

      {/* Structured Sections */}
      <div className="mt-14 space-y-4 sm:space-y-6">
        {SECTIONS.map((s) => (
          <section
            key={s.title}
            className="flex flex-col sm:flex-row items-start gap-4 rounded-3xl border border-border/50 bg-card/60 p-6 sm:p-7 shadow-xs backdrop-blur-sm transition-all hover:border-border hover:bg-card/80"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
              <s.icon className="h-5 w-5" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
                {s.title}
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          </section>
        ))}
      </div>

      {/* Payment rail logos */}
      <div className="mt-14 text-center space-y-4 border-t border-border/40 pt-10">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Supported Financial Corridors &amp; Clearing Rails
        </p>
        <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
          <PaymentMethodIcon id="sepa" size="md" />
          <PaymentMethodIcon id="cz-bank" size="md" />
          <PaymentMethodIcon id="upi" size="md" />
          <PaymentMethodIcon id="gcash" size="md" />
          <PaymentMethodIcon id="int-bank" size="md" />
        </div>
      </div>

      {/* Footer navigation */}
      <div className="mt-16 flex items-center justify-between border-t border-border/40 pt-8 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground font-semibold">
          Moonlight Wallet
        </Link>
        <Link
          to="/admin-access"
          className="opacity-40 hover:opacity-100 font-mono text-[11px] transition-opacity"
        >
          Authorized Access
        </Link>
      </div>
    </div>
  );
}
