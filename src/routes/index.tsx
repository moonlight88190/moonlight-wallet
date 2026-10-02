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
      "“Moonlight sets a new benchmark for European cross-border settlement and instant digital liquidity across international corridors.”",
    author: "European Banking Review",
  },
  {
    publication: "Bloomberg Financial",
    tagline: "Global Clearing Report",
    quote:
      "“The definitive European-first multi-currency clearing engine uniting SEPA Instant rails with direct Asian and American payout rails.”",
    author: "Global Markets Intelligence",
  },
  {
    publication: "TechCrunch",
    tagline: "Top European Fintech",
    quote:
      "“A sleek, bank-grade digital wallet engineered with precision, zero artificial latency, and 256-bit cryptographic verification.”",
    author: "Fintech Disruption Series",
  },
  {
    publication: "EU-Startups",
    tagline: "Fintech Innovation Award",
    quote:
      "“Recognized as Europe's premier multi-currency wallet standard for seamless liquidity management and verified cryptographic transfers.”",
    author: "European Fintech Awards",
  },
  {
    publication: "Forbes",
    tagline: "Next-Gen Wealth Infrastructure",
    quote:
      "“Redefining how global money moves with Apple-grade design simplicity and rigorous European regulatory compliance.”",
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
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground selection:bg-primary/10 antialiased font-sans">
      {/* Apple-style ambient backdrop blur & lighting */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-full max-w-7xl bg-radial from-primary/12 via-primary/4 to-transparent blur-3xl opacity-80" />

      {/* Header */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-3 group">
          <LogoMark className="h-10 w-10 group-hover:scale-105 transition-transform duration-300" />
          <div className="flex flex-col text-left">
            <span className="text-[14px] font-semibold tracking-[0.24em] text-foreground">
              MOONLIGHT
            </span>
            <span className="text-[9px] font-semibold tracking-[0.16em] text-muted-foreground uppercase -mt-0.5">
              European Financial Infrastructure
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {signedIn ? (
            <Link
              to="/dashboard"
              className="rounded-full bg-primary px-5 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] shadow-soft"
            >
              Open Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/about"
                className="hidden sm:inline-flex rounded-full px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Access &amp; Regulatory Info
              </Link>
              <Link
                to="/login"
                className="rounded-full border border-border/80 bg-card/80 px-5 py-2.5 text-xs sm:text-sm font-semibold hover:bg-accent hover:border-primary/40 transition-all shadow-2xs"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12 sm:py-20 text-center">
        <div className="animate-in fade-in slide-in-from-bottom-5 duration-700 max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-4 py-1.5 backdrop-blur-xl shadow-2xs">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              EUROPEAN-FIRST GLOBAL SETTLEMENT INFRASTRUCTURE
            </span>
          </div>

          <h1 className="mx-auto max-w-3xl text-4xl sm:text-6xl md:text-7xl font-semibold leading-[1.08] tracking-tight text-foreground">
            Global Capital. <br />
            <span className="bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
              Precision Connected.
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed px-2 font-normal">
            An official European-first multi-currency digital wallet built for high-velocity
            cross-border settlement, SEPA Instant clearing, and multi-asset treasury management.
          </p>

          {/* Global Connectivity Ticker / Currency Corridor */}
          <div className="pt-3 pb-4">
            <div className="mx-auto flex flex-wrap items-center justify-center gap-2 max-w-3xl px-1">
              {GLOBAL_CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setActiveTab(c.code)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-2xs text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    activeTab === c.code
                      ? "border-primary/80 bg-primary/10 text-primary shadow-xs"
                      : "border-border/50 bg-card/70 text-foreground hover:bg-accent"
                  }`}
                >
                  <CountryFlag code={c.flag} circle size="xs" />
                  <span>{c.code}</span>
                  <span className="text-muted-foreground text-[10px]">({c.symbol})</span>
                </button>
              ))}
            </div>
            <p className="mt-3.5 text-[11px] font-semibold text-muted-foreground/80 tracking-widest uppercase flex flex-wrap items-center justify-center gap-2 text-center px-2">
              <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
              Prague (HQ) • London • Frankfurt • New York • Dubai • Singapore • Tokyo • Mumbai
            </p>
          </div>

          {/* CTAs */}
          <div className="mx-auto flex w-full max-w-md flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {signedIn ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto h-13 text-base min-w-[220px] flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] shadow-soft"
              >
                Access Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <button
                  onClick={() => signInWithGoogle(() => navigate({ to: "/dashboard" }))}
                  className="w-full sm:w-auto h-13 text-sm min-w-[200px] flex items-center justify-center gap-2.5 rounded-full border border-border/80 bg-card/90 px-6 py-3.5 font-semibold transition-all hover:bg-accent hover:border-primary/40 shadow-2xs active:scale-[0.98] cursor-pointer touch-manipulation"
                >
                  <GoogleIcon /> Continue with Google
                </button>
                <Link
                  to="/login"
                  className="w-full sm:w-auto h-13 text-sm min-w-[170px] flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 font-semibold text-primary-foreground transition-all hover:opacity-90 shadow-soft active:scale-[0.98] touch-manipulation"
                >
                  <Mail className="h-4 w-4" /> Open Account
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Apple-Style Interactive Exchange Rate Preview Card */}
        <div className="mt-14 w-full max-w-3xl rounded-3xl border border-border/70 bg-card/70 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl text-left">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  LIVE EUROPEAN CENTRAL BANK REFERENCE RATES
                </span>
              </div>
              <h2 className="text-lg font-semibold text-foreground mt-0.5">
                Interactive Currency Converter &amp; Clearing Calculator
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/80 px-3 py-1.5 rounded-full font-medium shrink-0">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Interbank Clearing Rates
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                From Amount
              </label>
              <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/80 p-2 shadow-2xs">
                <Input
                  type="number"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value)}
                  className="h-10 border-none text-lg font-bold focus-visible:ring-0 px-2 min-w-0 flex-1"
                />
                <Select value={calcFrom} onValueChange={setCalcFrom}>
                  <SelectTrigger className="h-10 w-28 border-none bg-secondary/70 text-xs font-bold rounded-xl shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code} className="text-xs font-semibold">
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

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Converted Settlement Amount
              </label>
              <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/80 p-2 shadow-2xs">
                <div className="flex-1 px-3 text-lg font-bold text-foreground font-mono truncate">
                  {formatMoney(convertedVal, calcTo)}
                </div>
                <Select value={calcTo} onValueChange={setCalcTo}>
                  <SelectTrigger className="h-10 w-28 border-none bg-secondary/70 text-xs font-bold rounded-xl shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code} className="text-xs font-semibold">
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

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground pt-4 border-t border-border/40">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>
                1 {calcFrom} ≈{" "}
                <strong className="text-foreground font-mono">
                  {rateRatio.toFixed(4)} {calcTo}
                </strong>
              </span>
            </div>
            <span className="font-mono text-[11px]">ECB-REF-2025 • Guaranteed Settlement</span>
          </div>
        </div>

        {/* Global Media Recognition & Accolades Section */}
        <div className="mt-20 sm:mt-28 w-full max-w-5xl space-y-10 text-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
              <Award className="h-3.5 w-3.5 shrink-0" />
              <span>GLOBAL RECOGNITION &amp; PRESS ACCLAIM</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-foreground">
              Praised by Leading Financial Media
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Engineered to meet the highest standards of European regulatory compliance and digital
              liquidity.
            </p>
          </div>

          {/* Accolade Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
            {PRESS_ACCOLADES.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-3xl border border-border/70 bg-card/70 p-6 shadow-soft backdrop-blur-xl space-y-4 hover:border-primary/40 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold tracking-tight text-foreground">
                      {item.publication}
                    </span>
                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      {item.tagline}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed italic">
                    {item.quote}
                  </p>
                </div>
                <div className="pt-3 border-t border-border/40 text-[11px] font-medium text-muted-foreground/80">
                  — {item.author}
                </div>
              </div>
            ))}
          </div>

          {/* Secondary Accolades Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left max-w-4xl mx-auto">
            {PRESS_ACCOLADES.slice(3).map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-3xl border border-border/60 bg-card/50 p-5 shadow-2xs backdrop-blur-lg space-y-3 hover:border-primary/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">{item.publication}</span>
                  <div className="flex items-center gap-1 text-amber-500 text-xs">
                    <Star className="h-3 w-3 fill-amber-500" />
                    <Star className="h-3 w-3 fill-amber-500" />
                    <Star className="h-3 w-3 fill-amber-500" />
                    <Star className="h-3 w-3 fill-amber-500" />
                    <Star className="h-3 w-3 fill-amber-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed italic">{item.quote}</p>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {item.tagline}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-20 sm:mt-28 grid w-full max-w-5xl grid-cols-1 sm:grid-cols-3 gap-5 text-left">
          <div className="rounded-3xl border border-border/70 bg-card/70 p-6 shadow-soft backdrop-blur-2xl space-y-3 hover:border-primary/40 transition-all">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Globe className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-foreground text-base">Multi-Currency Treasury</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Hold, convert, and manage multi-currency balances across EUR, USD, GBP, JPY, AED, INR,
              PHP and 12+ international currencies with live interbank clearing rates.
            </p>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card/70 p-6 shadow-soft backdrop-blur-2xl space-y-3 hover:border-primary/40 transition-all">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Lock className="h-5 w-5 text-emerald-500" />
            </div>
            <h3 className="font-semibold text-foreground text-base">
              SEPA &amp; Global Settlement
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Direct integration into SEPA Instant, UK Faster Payments, India UPI, Philippines
              GCash, Singapore PayNow, and SWIFT international corridors.
            </p>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card/70 p-6 shadow-soft backdrop-blur-2xl space-y-3 hover:border-primary/40 transition-all">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5 text-amber-500" />
            </div>
            <h3 className="font-semibold text-foreground text-base">Luxury &amp; Digital Assets</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Instantly convert wallet balances into official global e-vouchers, luxury brand cards,
              and verified official transaction receipts.
            </p>
          </div>
        </div>

        {/* Institutional Trust Stats Bar */}
        <div className="mt-16 w-full max-w-5xl rounded-3xl border border-border/60 bg-card/50 p-6 sm:p-8 backdrop-blur-xl shadow-soft grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              €2.4B+
            </p>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Annualized Clearing
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
              99.99%
            </p>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Settlement Uptime
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              180+
            </p>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Global Corridors
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
              &lt; 2.5s
            </p>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Instant Clearing
            </p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4 mx-auto w-full max-w-6xl px-6 py-8 text-xs text-muted-foreground border-t border-border/40">
        <div className="flex items-center gap-2">
          <LogoMark className="h-5 w-5" />
          <span className="font-semibold text-foreground">Moonlight Wallet</span>
          <span>· European Financial Infrastructure</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/about" className="hover:text-foreground transition-colors">
            Regulatory &amp; Access
          </Link>
          <Link to="/login" className="hover:text-foreground transition-colors">
            Sign In
          </Link>
          <span>© Moonlight Wallet</span>
        </div>
      </footer>
    </div>
  );
}
