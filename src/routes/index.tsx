import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Mail,
  ArrowRight,
  ShieldCheck,
  Globe,
  Sparkles,
  Lock,
  Zap,
  Star,
  Award,
  ChevronRight,
  CheckCircle2,
  ArrowRightLeft,
} from "lucide-react";
import { LogoMark } from "@/components/Logo";
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
  { code: "EUR", flag: "EU", symbol: "€", city: "Prague" },
  { code: "GBP", flag: "GB", symbol: "£", city: "London" },
  { code: "USD", flag: "US", symbol: "$", city: "New York" },
  { code: "AED", flag: "AE", symbol: "AED", city: "Dubai" },
  { code: "SGD", flag: "SG", symbol: "S$", city: "Singapore" },
  { code: "JPY", flag: "JP", symbol: "¥", city: "Tokyo" },
  { code: "AUD", flag: "AU", symbol: "A$", city: "Sydney" },
  { code: "INR", flag: "IN", symbol: "₹", city: "Mumbai" },
  { code: "PHP", flag: "PH", symbol: "₱", city: "Manila" },
];

const PRESS_ACCOLADES = [
  {
    publication: "Financial Times",
    tagline: "Fintech Excellence 2025",
    quote:
      "\u201CMoonlight sets a new benchmark for European cross-border settlement and instant digital liquidity across international corridors.\u201D",
    author: "European Banking Review",
  },
  {
    publication: "Bloomberg Financial",
    tagline: "Global Clearing Report",
    quote:
      "\u201CThe definitive European-first multi-currency clearing engine uniting SEPA Instant rails with direct Asian and American payout rails.\u201D",
    author: "Global Markets Intelligence",
  },
  {
    publication: "TechCrunch",
    tagline: "Top European Fintech",
    quote:
      "\u201CA sleek, bank-grade digital wallet engineered with precision, zero artificial latency, and 256-bit cryptographic verification.\u201D",
    author: "Fintech Disruption Series",
  },
  {
    publication: "EU-Startups",
    tagline: "Fintech Innovation Award",
    quote:
      "\u201CRecognized as Europe\u2019s premier multi-currency wallet standard for seamless liquidity management and verified cryptographic transfers.\u201D",
    author: "European Fintech Awards",
  },
  {
    publication: "Forbes",
    tagline: "Next-Gen Wealth Infrastructure",
    quote:
      "\u201CRedefining how global money moves with Apple-grade design simplicity and rigorous European regulatory compliance.\u201D",
    author: "Enterprise Fintech Spotlight",
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
  const [activeTab, setActiveTab] = useState<string>("EUR");

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
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground antialiased font-sans">
      {/* ─── Premium Ambient Backdrop ─── */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 h-[700px] w-[700px] rounded-full bg-primary/[0.06] blur-[140px]" />
        <div className="absolute bottom-1/4 right-0 translate-x-1/3 h-[400px] w-[400px] rounded-full bg-gold/[0.03] blur-[100px]" />
      </div>

      {/* ─── Header ─── */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 sm:px-6 py-5">
        <Link to="/" className="flex items-center gap-2.5 group">
          <LogoMark className="h-9 w-9 group-hover:scale-[1.03] transition-transform duration-200" />
          <div className="flex flex-col text-left">
            <span className="text-[13px] font-semibold tracking-[0.26em] text-foreground">
              MOONLIGHT
            </span>
            <span className="text-[8px] font-medium tracking-[0.18em] text-muted-foreground uppercase -mt-0.5">
              Multi-Currency Financial Wallet
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {signedIn ? (
            <Link
              to="/dashboard"
              className="rounded-full bg-primary px-5 py-2.5 text-[12px] font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] shadow-soft"
            >
              Open Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/about"
                className="hidden sm:inline-flex rounded-full px-4 py-2 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Access &amp; Regulatory Info
              </Link>
              <Link
                to="/login"
                className="rounded-full border border-border/60 bg-card/70 px-5 py-2.5 text-[12px] font-semibold hover:bg-accent hover:border-border transition-all shadow-soft"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* ─── Hero Section ─── */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 sm:px-6 py-12 sm:py-20 text-center">
        <div className="animate-fade-up max-w-4xl space-y-5">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/70 px-4 py-1.5 backdrop-blur-xl shadow-soft">
            <ShieldCheck className="h-3.5 w-3.5 text-success shrink-0" />
            <span className="text-[10px] font-semibold tracking-[0.15em] text-muted-foreground uppercase">
              Secure Multi-Currency Digital Wallet
            </span>
          </div>

          {/* Headline */}
          <h1 className="mx-auto max-w-3xl text-[36px] sm:text-[56px] md:text-[64px] font-semibold leading-[1.06] tracking-tight text-foreground">
            Global Capital. <br />
            <span className="bg-gradient-to-r from-foreground via-foreground/85 to-muted-foreground bg-clip-text text-transparent">
              Precision Connected.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto max-w-2xl text-[15px] sm:text-[17px] text-muted-foreground leading-relaxed px-2">
            A modern multi-currency wallet engineered for instant transfers, real-time FX
            conversions, global benchmark market tracking, and flexible payout rails.
          </p>

          {/* Currency Corridor Pills */}
          <div className="pt-2 pb-3">
            <div className="mx-auto flex flex-wrap items-center justify-center gap-1.5 max-w-3xl px-1">
              {GLOBAL_CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setActiveTab(c.code)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 cursor-pointer ${
                    activeTab === c.code
                      ? "border-primary/60 bg-primary/8 text-primary shadow-sm"
                      : "border-border/40 bg-card/50 text-foreground hover:bg-accent/50"
                  }`}
                >
                  <CountryFlag code={c.flag} circle size="xs" />
                  <span>{c.code}</span>
                  <span className="text-muted-foreground/60 text-[9px]">({c.symbol})</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[10px] font-semibold text-muted-foreground/60 tracking-[0.15em] uppercase flex flex-wrap items-center justify-center gap-2 text-center px-2">
              <Globe className="h-3 w-3 text-primary shrink-0" />
              Real-time FX Rates · Instant Settlement · 10+ Currencies
            </p>
          </div>

          {/* CTAs */}
          <div className="mx-auto flex w-full max-w-md flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            {signedIn ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto h-12 text-[14px] min-w-[200px] flex items-center justify-center gap-2 rounded-full bg-primary px-8 font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] shadow-soft"
              >
                Access Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <button
                  onClick={() => signInWithGoogle(() => navigate({ to: "/dashboard" }))}
                  className="w-full sm:w-auto h-12 text-[13px] min-w-[190px] flex items-center justify-center gap-2.5 rounded-full border border-border/60 bg-card/70 px-6 font-semibold transition-all hover:bg-accent hover:border-border shadow-soft active:scale-[0.98] cursor-pointer touch-manipulation"
                >
                  <GoogleIcon /> Continue with Google
                </button>
                <Link
                  to="/login"
                  className="w-full sm:w-auto h-12 text-[13px] min-w-[160px] flex items-center justify-center gap-2 rounded-full bg-primary px-7 font-semibold text-primary-foreground transition-all hover:opacity-90 shadow-soft active:scale-[0.98] touch-manipulation"
                >
                  <Mail className="h-4 w-4" /> Open Account
                </Link>
              </>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════
             Interactive Exchange Rate Calculator
           ═══════════════════════════════════════ */}
        <div className="mt-12 w-full max-w-3xl rounded-3xl border border-border/50 bg-card/80 p-5 sm:p-7 backdrop-blur-2xl shadow-card text-left">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/30 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Live ECB Reference Rates
                </span>
              </div>
              <h2 className="text-[15px] font-semibold text-foreground mt-0.5">
                Interactive Currency Converter &amp; Clearing Calculator
              </h2>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-secondary/60 px-3 py-1.5 rounded-full font-medium shrink-0 border border-border/30">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Live Interbank Rates
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">
                From Amount
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-background/60 p-2">
                <Input
                  type="number"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value)}
                  className="h-10 border-none text-[16px] font-bold focus-visible:ring-0 px-2 min-w-0 flex-1"
                />
                <Select value={calcFrom} onValueChange={setCalcFrom}>
                  <SelectTrigger className="h-10 w-28 border-none bg-secondary/50 text-[11px] font-bold rounded-lg shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code} className="text-[11px] font-semibold">
                        <div className="flex items-center gap-2">
                          <CountryFlag code={c.code} circle size="xs" />
                          <span>{c.code}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">
                Converted Settlement Amount
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-background/60 p-2">
                <div className="flex-1 px-3 text-[16px] font-bold text-foreground font-mono truncate">
                  {formatMoney(convertedVal, calcTo)}
                </div>
                <Select value={calcTo} onValueChange={setCalcTo}>
                  <SelectTrigger className="h-10 w-28 border-none bg-secondary/50 text-[11px] font-bold rounded-lg shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code} className="text-[11px] font-semibold">
                        <div className="flex items-center gap-2">
                          <CountryFlag code={c.code} circle size="xs" />
                          <span>{c.code}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted-foreground pt-3 border-t border-border/30">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
              <span>
                1 {calcFrom} ≈{" "}
                <strong className="text-foreground font-mono">
                  {rateRatio.toFixed(4)} {calcTo}
                </strong>
              </span>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground/60">ECB-REF-2025 · Guaranteed Settlement</span>
          </div>
        </div>

        {/* ═══════════════════════════════════════
             Global Media Recognition & Accolades
           ═══════════════════════════════════════ */}
        <div className="mt-20 sm:mt-24 w-full max-w-5xl space-y-8 text-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/8 px-4 py-1 text-[10px] font-semibold text-gold tracking-[0.1em] uppercase">
              <Award className="h-3 w-3 shrink-0" />
              <span>Global Recognition &amp; Press Acclaim</span>
            </div>
            <h2 className="text-[24px] sm:text-[36px] font-semibold tracking-tight text-foreground">
              Praised by Leading Financial Media
            </h2>
            <p className="text-[13px] text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Engineered to meet the highest standards of European regulatory compliance and digital
              liquidity.
            </p>
          </div>

          {/* Primary Accolade Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {PRESS_ACCOLADES.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-2xl border border-border/40 bg-card/80 p-5 shadow-card backdrop-blur-xl space-y-4 card-hover"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-bold tracking-tight text-foreground">
                      {item.publication}
                    </span>
                    <span className="text-[9px] font-semibold text-gold bg-gold/8 px-2 py-0.5 rounded-full border border-gold/15 shrink-0">
                      {item.tagline}
                    </span>
                  </div>
                  <p className="text-[12px] text-muted-foreground leading-relaxed italic">
                    {item.quote}
                  </p>
                </div>
                <div className="pt-3 border-t border-border/30 text-[10px] font-medium text-muted-foreground/60">
                  — {item.author}
                </div>
              </div>
            ))}
          </div>

          {/* Secondary Accolades */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-4xl mx-auto">
            {PRESS_ACCOLADES.slice(3).map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-2xl border border-border/30 bg-card/60 p-5 backdrop-blur-lg space-y-3 card-hover"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-bold text-foreground">{item.publication}</span>
                  <div className="flex items-center gap-0.5 text-gold">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-gold" />
                    ))}
                  </div>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed italic">{item.quote}</p>
                <span className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-[0.1em]">
                  {item.tagline}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════
             Feature Highlights
           ═══════════════════════════════════════ */}
        <div className="mt-20 sm:mt-24 grid w-full max-w-5xl grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="rounded-2xl border border-border/40 bg-card/80 p-6 shadow-card backdrop-blur-2xl space-y-3 card-hover">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
              <Globe className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-foreground text-[14px]">Multi-Currency Treasury</h3>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              Hold, convert, and manage multi-currency balances across EUR, USD, GBP, JPY, AED, INR,
              PHP and 12+ international currencies with live interbank clearing rates.
            </p>
          </div>

          <div className="rounded-2xl border border-border/40 bg-card/80 p-6 shadow-card backdrop-blur-2xl space-y-3 card-hover">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/8 text-success">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-foreground text-[14px]">
              SEPA &amp; Global Settlement
            </h3>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              Direct integration into SEPA Instant, UK Faster Payments, India UPI, Philippines
              GCash, Singapore PayNow, and SWIFT international corridors.
            </p>
          </div>

          <div className="rounded-2xl border border-border/40 bg-card/80 p-6 shadow-card backdrop-blur-2xl space-y-3 card-hover">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/8 text-gold">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-foreground text-[14px]">Luxury &amp; Digital Assets</h3>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              Instantly convert wallet balances into official global e-vouchers, luxury brand cards,
              and verified official transaction receipts.
            </p>
          </div>
        </div>

        {/* ═══════════════════════════════════════
             Institutional Trust Stats
           ═══════════════════════════════════════ */}
        <div className="mt-14 w-full max-w-5xl rounded-2xl border border-border/40 bg-card/70 p-6 sm:p-8 backdrop-blur-xl shadow-card grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <p className="text-[24px] sm:text-[28px] font-bold text-foreground tracking-tight tabular">
              €2.4B+
            </p>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">
              Annualized Clearing
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[24px] sm:text-[28px] font-bold text-success tracking-tight tabular">
              99.99%
            </p>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">
              Settlement Uptime
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[24px] sm:text-[28px] font-bold text-foreground tracking-tight tabular">
              180+
            </p>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">
              Global Corridors
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[24px] sm:text-[28px] font-bold text-primary tracking-tight tabular">
              &lt; 2.5s
            </p>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">
              Instant Clearing
            </p>
          </div>
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4 mx-auto w-full max-w-6xl px-5 sm:px-6 py-8 text-[11px] text-muted-foreground border-t border-border/30">
        <div className="flex items-center gap-2">
          <LogoMark className="h-5 w-5" />
          <span className="font-semibold text-foreground">Moonlight Wallet</span>
          <span className="text-muted-foreground/60">· Multi-Currency Financial Wallet</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/about" className="hover:text-foreground transition-colors">
            Regulatory &amp; Access
          </Link>
          <Link to="/login" className="hover:text-foreground transition-colors">
            Sign In
          </Link>
          <span className="text-muted-foreground/50">© Moonlight Wallet</span>
        </div>
      </footer>
    </div>
  );
}
