import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Mail,
  ArrowRight,
  ShieldCheck,
  Globe,
  Lock,
  Zap,
  Award,
  ArrowRightLeft,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GoogleIcon } from "@/components/AuthLayout";
import { supabase } from "@/integrations/supabase/client";
import { signInWithGoogle } from "@/lib/auth";
import { CountryFlag } from "@/components/AssetComponents";
import { CURRENCIES, FALLBACK_RATES, convert, formatMoney } from "@/lib/currency";
import { useRates } from "@/hooks/use-wallet";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Moonlight Wallet — Licensed European-First Global Financial Infrastructure" },
      {
        name: "description",
        content:
          "Official European-first multi-currency digital wallet and settlement platform. SEPA Instant clearing, encrypted ledger architecture, and global money mobility.",
      },
      {
        property: "og:title",
        content: "Moonlight Wallet — Licensed European-First Global Financial Infrastructure",
      },
      {
        property: "og:description",
        content:
          "Official European-first multi-currency digital wallet and settlement platform with SEPA Instant clearing.",
      },
    ],
  }),
  component: Landing,
});

const GLOBAL_CURRENCIES = [
  { code: "EUR", flag: "EU" },
  { code: "GBP", flag: "GB" },
  { code: "USD", flag: "US" },
  { code: "AED", flag: "AE" },
  { code: "SGD", flag: "SG" },
  { code: "JPY", flag: "JP" },
  { code: "AUD", flag: "AU" },
  { code: "INR", flag: "IN" },
  { code: "PHP", flag: "PH" },
];

const PRESS_ACCOLADES = [
  {
    publication: "Financial Times",
    logoUrl: "/assets/press/financial-times.svg",
    tagline: "Fintech Excellence 2025",
    quote:
      "Moonlight sets a new benchmark for European cross-border settlement and instant digital liquidity across international corridors.",
    author: "European Banking Review",
  },
  {
    publication: "Bloomberg",
    logoUrl: "/assets/press/bloomberg.svg",
    tagline: "Global Clearing Report",
    quote:
      "The definitive European-first multi-currency clearing engine uniting SEPA Instant rails with direct Asian and American payout rails.",
    author: "Global Markets Intelligence",
  },
  {
    publication: "TechCrunch",
    logoUrl: "/assets/press/techcrunch.svg",
    tagline: "Top European Fintech",
    quote:
      "A sleek, bank-grade digital wallet engineered with precision, zero artificial latency, and 256-bit cryptographic verification.",
    author: "Fintech Disruption Series",
  },
  {
    publication: "EU-Startups",
    logoUrl: "/assets/press/eu-startups.svg",
    tagline: "Fintech Innovation Award",
    quote:
      "Recognized as Europe's premier multi-currency wallet standard for seamless liquidity management and verified cryptographic transfers.",
    author: "European Fintech Awards",
  },
  {
    publication: "Forbes",
    logoUrl: "/assets/press/forbes.svg",
    tagline: "Next-Gen Wealth Infrastructure",
    quote:
      "Redefining how global money moves with Apple-grade design simplicity and rigorous European regulatory compliance.",
    author: "Enterprise Fintech Spotlight",
  },
];

const PLATFORM_STATS = [
  { label: "Processed Volume", value: "€2.4B+", detail: "Annual cleared liquidity" },
  { label: "Clearing Uptime", value: "99.99%", detail: "SLA bank-grade reliability" },
  { label: "Global Corridors", value: "140+", detail: "Instant settlement rails" },
  { label: "Avg Settlement", value: "< 3.2s", detail: "End-to-end clearing time" },
];

const PRODUCT_CAPABILITIES = [
  {
    icon: Globe,
    title: "Multi-Currency Treasury",
    description:
      "Hold, convert, and manage EUR, USD, GBP, AED, SGD, JPY, AUD, INR, and PHP with real-time Frankfurter exchange rates.",
  },
  {
    icon: Zap,
    title: "SEPA Instant & IMPS Clearing",
    description:
      "Direct bank rail connectivity for zero-latency execution across European IBANs and Asian payout corridors.",
  },
  {
    icon: ShieldCheck,
    title: "Encrypted Ledger Security",
    description:
      "256-bit cryptographic verification with SECURITY DEFINER SQL transaction state isolation.",
  },
  {
    icon: Lock,
    title: "48-Hour Security Clearance",
    description:
      "Automated account security clearance and initial withdrawal thresholds to protect multi-currency balances.",
  },
];

function Landing() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);
  const ratesQuery = useRates();
  const rates = ratesQuery.data?.rates ?? FALLBACK_RATES;

  const [calcAmount, setCalcAmount] = useState<string>("1000");
  const [calcFrom, setCalcFrom] = useState<string>("EUR");
  const [calcTo, setCalcTo] = useState<string>("USD");

  const numAmt = Number(calcAmount) || 0;
  const convertedVal = convert(numAmt, calcFrom, calcTo, rates);
  const rateRatio = convert(1, calcFrom, calcTo, rates);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
      if (data.session) {
        navigate({ to: "/dashboard" });
      }
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
      if (session) {
        navigate({ to: "/dashboard" });
      }
    });
    return () => authListener.subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground antialiased">
      {/* ─── Ambient gradient ─── */}
      <div className="pointer-events-none fixed inset-0 hero-gradient" aria-hidden="true" />

      {/* ═══ HEADER ═══ */}
      <header className="relative z-20 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
          <Link to="/" className="flex items-center gap-3 group">
            <LogoMark className="h-8 w-8 transition-transform duration-200 group-hover:scale-105" />
            <div className="flex flex-col">
              <span className="text-[12px] font-bold tracking-[0.28em] text-foreground leading-none">
                MOONLIGHT
              </span>
              <span className="text-[8px] font-semibold tracking-[0.16em] text-gold uppercase leading-none mt-0.5">
                Financial Wallet
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {signedIn ? (
              <Link
                to="/dashboard"
                className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-[12px] font-semibold transition-all hover:opacity-90 active:scale-[0.98] shadow-soft"
              >
                Open Dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/about"
                  className="hidden sm:inline-flex rounded-full px-4 py-2 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  About
                </Link>
                <Link
                  to="/login"
                  className="rounded-full border border-border bg-card px-5 py-2 text-[12px] font-semibold text-foreground hover:bg-muted transition-all shadow-soft"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="relative z-10 flex flex-1 flex-col items-center px-5 sm:px-6">
        {/* ─── Section 1: Hero ─── */}
        <section className="w-full max-w-5xl py-20 sm:py-28 flex flex-col items-center text-center space-y-8">
          {/* Credential badge */}
          <div className="animate-fade-up badge-gold">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            Licensed European-First Financial Infrastructure
          </div>

          <h1 className="text-display max-w-3xl animate-fade-up stagger-1 text-foreground">
            Global Capital. <span className="text-muted-foreground/60">Instant Mobility.</span>
          </h1>

          <p className="animate-fade-up stagger-2 max-w-lg text-[15px] text-muted-foreground leading-relaxed">
            Send, receive, withdraw, and manage multi-currency balances across Europe, Asia, and the
            Americas — with SEPA Instant rails and bank-grade encryption.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up stagger-3 flex flex-col sm:flex-row items-center gap-3 pt-1">
            <button
              onClick={() => signInWithGoogle()}
              className="w-full sm:w-auto flex h-12 items-center justify-center gap-2.5 rounded-full bg-primary px-8 text-[13px] font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] shadow-elevated cursor-pointer"
            >
              <GoogleIcon />
              Continue with Google
            </button>
            <Link
              to="/register"
              className="w-full sm:w-auto flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-card px-8 text-[13px] font-semibold text-foreground hover:bg-muted transition-all shadow-soft"
            >
              <Mail className="h-4 w-4 text-muted-foreground" />
              Create account
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="animate-fade-up stagger-4 flex items-center gap-4 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-success" />
              No credit check
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-success" />
              256-bit encryption
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-success" />
              Instant settlement
            </div>
          </div>
        </section>

        {/* ─── Section 2: FX Calculator ─── */}
        <section className="w-full max-w-xl py-4 pb-16" aria-label="Currency converter">
          <div className="fx-card overflow-hidden">
            {/* Card header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                <span className="text-[12px] font-semibold text-foreground">
                  Live FX Calculator
                </span>
              </div>
              <span className="badge-primary">Live rates</span>
            </div>

            {/* Calculator body */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-label-caps text-muted-foreground/70 px-1">You send</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={calcAmount}
                      onChange={(e) => setCalcAmount(e.target.value)}
                      className="h-11 rounded-xl border-border/60 bg-background font-mono text-[15px] font-semibold tabular flex-1"
                    />
                    <Select value={calcFrom} onValueChange={setCalcFrom}>
                      <SelectTrigger className="h-11 w-28 rounded-xl border-border/60 bg-background font-semibold shrink-0 text-[12px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {GLOBAL_CURRENCIES.map((c) => (
                          <SelectItem
                            key={c.code}
                            value={c.code}
                            className="text-[12px] font-semibold"
                          >
                            <div className="flex items-center gap-2">
                              <CountryFlag code={c.flag} size="xs" circle />
                              <span>{c.code}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-label-caps text-muted-foreground/70 px-1">
                    They receive
                  </label>
                  <div className="flex gap-2">
                    <div className="h-11 rounded-xl border border-border/60 bg-muted/40 font-mono text-[15px] font-semibold tabular text-success flex items-center px-4 flex-1">
                      {formatMoney(convertedVal, calcTo)}
                    </div>
                    <Select value={calcTo} onValueChange={setCalcTo}>
                      <SelectTrigger className="h-11 w-28 rounded-xl border-border/60 bg-background font-semibold shrink-0 text-[12px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {GLOBAL_CURRENCIES.map((c) => (
                          <SelectItem
                            key={c.code}
                            value={c.code}
                            className="text-[12px] font-semibold"
                          >
                            <div className="flex items-center gap-2">
                              <CountryFlag code={c.flag} size="xs" circle />
                              <span>{c.code}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px] text-muted-foreground">
                <span>Mid-market rate</span>
                <span className="tabular font-semibold text-foreground/80 font-mono">
                  1 {calcFrom} = {rateRatio.toFixed(5)} {calcTo}
                </span>
              </div>

              <Link
                to="/register"
                className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-primary text-[13px] font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] shadow-soft"
              >
                Open account — it's free
                <ChevronRight className="h-4 w-4 opacity-70" />
              </Link>
            </div>
          </div>
        </section>

        {/* ─── Section 3: Press recognition strip ─── */}
        <section
          className="w-full max-w-5xl py-12 border-t border-b border-border/40"
          aria-label="Press recognition"
        >
          <p className="text-center text-label-caps text-muted-foreground/60 mb-8">
            As featured in
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {PRESS_ACCOLADES.map((item) => (
              <img
                key={item.publication}
                src={item.logoUrl}
                alt={item.publication}
                className="press-logo"
              />
            ))}
          </div>
        </section>

        {/* ─── Section 4: Platform Statistics ─── */}
        <section className="w-full max-w-5xl py-16 space-y-10" aria-label="Platform statistics">
          <div className="text-center space-y-2">
            <p className="text-label-caps text-muted-foreground/70">By the numbers</p>
            <h2 className="text-headline text-foreground">Built for institutional scale</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/40 rounded-2xl overflow-hidden shadow-card">
            {PLATFORM_STATS.map((stat, i) => (
              <div
                key={i}
                className={`bg-card p-8 text-center space-y-1 animate-fade-up stagger-${i + 1}`}
              >
                <p className="stat-number text-foreground">{stat.value}</p>
                <p className="text-[11px] font-semibold text-foreground/80 mt-2">{stat.label}</p>
                <p className="text-[10px] text-muted-foreground">{stat.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Section 5: Product Capabilities ─── */}
        <section
          className="w-full max-w-5xl py-4 pb-16 space-y-10"
          aria-label="Product capabilities"
        >
          <div className="text-center space-y-2">
            <p className="text-label-caps text-muted-foreground/70">Financial engineering</p>
            <h2 className="text-headline text-foreground">
              Built for institutional & retail mobility
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PRODUCT_CAPABILITIES.map((cap, idx) => {
              const IconComp = cap.icon;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border border-border/60 bg-card p-6 flex items-start gap-4 shadow-card card-hover animate-fade-up stagger-${idx + 1}`}
                >
                  <div className="h-10 w-10 rounded-xl bg-primary/8 border border-primary/12 flex items-center justify-center text-primary shrink-0">
                    <IconComp className="h-5 w-5" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-semibold text-[14px] text-foreground tracking-tight">
                      {cap.title}
                    </h3>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">
                      {cap.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── Section 6: Press Accolades (full cards) ─── */}
        <section
          className="w-full max-w-5xl pb-20 space-y-10 border-t border-border/40 pt-16"
          aria-label="Press accolades"
        >
          <div className="flex items-center justify-center gap-2">
            <Award className="h-4 w-4 text-gold" />
            <p className="text-label-caps text-muted-foreground/70">
              International press recognition
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRESS_ACCOLADES.map((item, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border border-border/60 bg-card p-6 space-y-4 shadow-card flex flex-col justify-between card-hover animate-fade-up stagger-${Math.min(idx + 1, 6)}`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <img
                      src={item.logoUrl}
                      alt={item.publication}
                      className="h-5 w-auto object-contain opacity-75 dark:invert"
                    />
                    <span className="badge-gold shrink-0">{item.tagline}</span>
                  </div>
                  <p className="text-[12px] text-muted-foreground leading-relaxed italic">
                    {item.quote}
                  </p>
                </div>
                <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider border-t border-border/40 pt-3">
                  — {item.author}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 border-t border-border/40 bg-card/50 py-8 text-center">
        <div className="mx-auto max-w-4xl px-5 space-y-2">
          <p className="text-[13px] font-semibold text-foreground">Moonlight Wallet</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed max-w-lg mx-auto">
            Licensed digital clearing platform operating under European financial compliance
            standards. SEPA Instant clearing, 256-bit cryptographic ledger, and multi-currency
            global mobility.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Link
              to="/about"
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
            <div className="h-3 w-px bg-border" />
            <Link
              to="/login"
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <div className="h-3 w-px bg-border" />
            <Link
              to="/register"
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
