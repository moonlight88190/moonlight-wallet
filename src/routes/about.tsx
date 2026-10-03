import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Globe, ShieldCheck, Zap, Lock, Building2 } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { CountryFlag, PaymentMethodIcon } from "@/components/AssetComponents";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Moonlight Wallet" },
      {
        name: "description",
        content:
          "Moonlight Wallet is a multi-currency digital wallet for sending, receiving, and managing money across 9 currencies.",
      },
      { property: "og:title", content: "About Moonlight Wallet" },
      { property: "og:description", content: "Multi-currency wallet for sending and receiving money." },
    ],
  }),
  component: About,
});

const SECTIONS = [
  {
    icon: Globe,
    title: "Multi-Currency Accounts",
    body: "Hold and manage EUR, USD, GBP, AED, SGD, JPY, AUD, INR, and PHP balances in one place. Convert between currencies at transparent mid-market exchange rates updated daily.",
  },
  {
    icon: Building2,
    title: "Send & Receive",
    body: "Transfer money to other Moonlight accounts instantly using wallet IDs or QR codes. Receive payments from anyone on the platform with no transfer fees between accounts.",
  },
  {
    icon: Zap,
    title: "Withdraw to Your Bank",
    body: "Withdraw funds to your bank account through UPI, bank transfer, Faster Payments, GCash, Pix, or SEPA — depending on your country and available payment methods.",
  },
  {
    icon: ShieldCheck,
    title: "Account Security",
    body: "Your account is protected with authentication, session management, and a 48-hour waiting period on new accounts before withdrawals are enabled.",
  },
  {
    icon: Lock,
    title: "How It Works",
    body: "Moonlight Wallet operates as a closed-loop simulation. Balances, transfers, and withdrawals are processed within the platform and do not connect to external banking networks or payment processors.",
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
          Back
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
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Moonlight Wallet
          </h1>
          <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            A multi-currency digital wallet for sending, receiving, and managing money across 9 currencies.
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

      {/* Payment methods */}
      <div className="mt-14 text-center space-y-4 border-t border-border/40 pt-10">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Available Payment Methods
        </p>
        <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
          <PaymentMethodIcon id="sepa" size="md" />
          <PaymentMethodIcon id="upi" size="md" />
          <PaymentMethodIcon id="gcash" size="md" />
          <PaymentMethodIcon id="faster-payments" size="md" />
          <PaymentMethodIcon id="pix" size="md" />
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
          Admin
        </Link>
      </div>
    </div>
  );
}
