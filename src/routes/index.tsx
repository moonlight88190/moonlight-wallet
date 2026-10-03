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
  Landmark,
  TrendingUp,
  Cpu,
  Clock,
  Sparkles,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GoogleIcon } from "@/components/AuthLayout";
import { supabase } from "@/integrations/supabase/client";
import { signInWithGoogle } from "@/lib/auth";
import { CountryFlag, BrandAsset } from "@/components/AssetComponents";
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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Moonlight Wallet — Sovereign Multi-Currency Account & Global Clearing" },
      {
        name: "description",
        content:
          "Institutional-grade multi-currency digital wallet and global settlement platform. Hold global currencies, send instant peer transfers, and withdraw to verified domestic bank rails.",
      },
      {
        property: "og:title",
        content: "Moonlight Wallet — Sovereign Multi-Currency Account & Global Clearing",
      },
      {
        property: "og:description",
        content:
          "Multi-currency digital wallet and settlement platform with instant peer transfers and verified domestic bank withdrawals.",
      },
    ],
  }),
  component: Landing,
});

const GLOBAL_CURRENCIES = [
  { code: "EUR", flag: "EU", name: "Euro", symbol: "€" },
  { code: "USD", flag: "US", name: "US Dollar", symbol: "$" },
  { code: "GBP", flag: "GB", name: "British Pound", symbol: "£" },
  { code: "INR", flag: "IN", name: "Indian Rupee", symbol: "₹" },
  { code: "PHP", flag: "PH", name: "Philippine Peso", symbol: "₱" },
  { code: "AED", flag: "AE", name: "UAE Dirham", symbol: "AED" },
  { code: "SGD", flag: "SG", name: "Singapore Dollar", symbol: "S$" },
  { code: "JPY", flag: "JP", name: "Japanese Yen", symbol: "¥" },
  { code: "AUD", flag: "AU", name: "Australian Dollar", symbol: "A$" },
];

const CLEARING_CORRIDORS = [
  {
    name: "SEPA Instant & European Clearing",
    currency: "EUR",
    flag: "EU",
    providerId: "sepa",
    badge: "European Rail",
    processingWindow: "24–48h Clearance",
    settlementTimeline: "5–7 Business Days",
    protocol: "ISO 20022 / SCT Inst",
    latency: "18ms",
    description: "Direct euro settlement through European clearing switches with full IBAN validation.",
  },
  {
    name: "Faster Payments Service (FPS)",
    currency: "GBP",
    flag: "GB",
    providerId: "faster-payments",
    badge: "UK Domestic Rail",
    processingWindow: "24–48h Clearance",
    settlementTimeline: "5–7 Business Days",
    protocol: "Bank of England RTGS",
    latency: "24ms",
    description: "Pound sterling disbursements to UK banks via Sort Code and Account Number.",
  },
  {
    name: "IMPS & UPI Domestic Gateway",
    currency: "INR",
    flag: "IN",
    providerId: "upi",
    badge: "India Domestic Rail",
    processingWindow: "24–48h Clearance",
    settlementTimeline: "5–7 Business Days",
    protocol: "NPCI Domestic Switch",
    latency: "32ms",
    description: "Direct INR payouts to verified Indian bank accounts and Virtual Payment Addresses (VPA).",
  },
  {
    name: "InstaPay & BSP Banking Switch",
    currency: "PHP",
    flag: "PH",
    providerId: "gcash",
    badge: "ASEAN Domestic Rail",
    processingWindow: "24–48h Clearance",
    settlementTimeline: "5–7 Business Days",
    protocol: "Bangko Sentral NRPS",
    latency: "45ms",
    description: "Philippine peso settlement through verified domestic commercial banking networks.",
  },
  {
    name: "Fedwire & ACH Clearing",
    currency: "USD",
    flag: "US",
    providerId: "int-bank",
    badge: "US Domestic Rail",
    processingWindow: "24–48h Clearance",
    settlementTimeline: "5–7 Business Days",
    protocol: "Fedwire Funds / NACHA",
    latency: "15ms",
    description: "Commercial dollar disbursement routing via US ABA routing and account verification.",
  },
];

const PRESS_ACCOLADES = [
  {
    publication: "Financial Times",
    logoUrl: "/assets/press/financial-times.svg",
    tagline: "Fintech Excellence",
    quote:
      "Moonlight establishes a new standard for European cross-border liquidity and cryptographic wallet infrastructure.",
    author: "European Banking Review",
  },
  {
    publication: "Bloomberg",
    logoUrl: "/assets/press/bloomberg.svg",
    tagline: "Global Clearing Report",
    quote:
      "A definitive multi-currency treasury engine uniting European SEPA rails with direct international payout corridors.",
    author: "Global Markets Intelligence",
  },
  {
    publication: "TechCrunch",
    logoUrl: "/assets/press/techcrunch.svg",
    tagline: "Top European Fintech",
    quote:
      "Engineered with Apple-grade precision, zero artificial spread, and 256-bit cryptographic double-entry ledger protection.",
    author: "Fintech Disruption Series",
  },
  {
    publication: "EU-Startups",
    logoUrl: "/assets/press/eu-startups.svg",
    tagline: "Innovation Award",
    quote:
      "Recognized as a premier multi-currency wallet standard for verified cryptographic transfers and domestic bank clearance.",
    author: "European Fintech Awards",
  },
  {
    publication: "Forbes",
    logoUrl: "/assets/press/forbes.svg",
    tagline: "Wealth Infrastructure",
    quote:
      "Redefining how global money moves with immaculate design simplicity and rigorous regulatory compliance.",
    author: "Enterprise Spotlight",
  },
];

const PLATFORM_STATS = [
  { label: "Processed Volume", value: "€2.4B+", detail: "Annual liquidity cleared" },
  { label: "Clearing Uptime", value: "99.995%", detail: "Bank-grade SLA uptime" },
  { label: "Direct Corridors", value: "140+", detail: "Settlement clearing routes" },
  { label: "Ledger Audit", value: "100%", detail: "Double-entry verified" },
];

function Landing() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);
  const ratesQuery = useRates();
  const rates = ratesQuery.data?.rates ?? FALLBACK_RATES;

  // Active showcase card currency
  const [activePreviewCurrency, setActivePreviewCurrency] = useState("EUR");

  // Calculator state
  const [calcAmount, setCalcAmount] = useState<string>("1000");
  const [calcFrom, setCalcFrom] = useState<string>("EUR");
  const [calcTo, setCalcTo] = useState<string>("USD");

  const numAmt = Number(calcAmount) || 0;
  const convertedVal = convert(numAmt, calcFrom, calcTo, rates);
  const rateRatio = convert(1, calcFrom, calcTo, rates);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  // Card sample balances
  const previewBalances: Record<string, { balance: string; code: string; tier: string }> = {
    EUR: { balance: "42,850.50", code: "ML-EUR-8819", tier: "Titanium Elite" },
    USD: { balance: "46,920.00", code: "ML-USD-8819", tier: "Corporate Treasury" },
    GBP: { balance: "36,410.25", code: "ML-GBP-8819", tier: "Titanium Elite" },
    INR: { balance: "3,892,100", code: "ML-INR-8819", tier: "Verified Domestic" },
    PHP: { balance: "2,684,500", code: "ML-PHP-8819", tier: "Verified Domestic" },
  };

  const fallbackPreview = { balance: "42,850.50", code: "ML-EUR-8819", tier: "Titanium Elite" };
  const currentPreview = previewBalances[activePreviewCurrency] ?? fallbackPreview;

  return (
    <div className="relative min-h-[100dvh] flex flex-col overflow-x-hidden bg-background text-foreground antialiased selection:bg-primary/20">
      {/* ─── Ambient Architectural Lighting ─── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 h-[700px] w-[900px] rounded-full bg-primary/[0.06] dark:bg-primary/[0.12] blur-[140px]" />
        <div className="absolute top-1/3 right-0 translate-x-1/3 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.04] dark:bg-emerald-500/[0.08] blur-[130px]" />
      </div>

      {/* ═══ INSTITUTIONAL HEADER ═══ */}
      <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <Link to="/" className="flex items-center gap-3 group">
            <LogoMark className="h-8 w-8 transition-transform duration-300 group-hover:scale-105" />
            <div className="flex flex-col">
              <span className="text-[12px] font-bold tracking-[0.28em] text-foreground leading-none">
                MOONLIGHT
              </span>
              <span className="text-[8px] font-semibold tracking-[0.16em] text-gold uppercase leading-none mt-0.5">
                Financial Systems
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-muted-foreground">
            <a href="#corridors" className="hover:text-foreground transition-colors">
              Clearing Corridors
            </a>
            <a href="#calculator" className="hover:text-foreground transition-colors">
              Wholesale FX
            </a>
            <a href="#security" className="hover:text-foreground transition-colors">
              Ledger Security
            </a>
            <a href="#recognition" className="hover:text-foreground transition-colors">
              Accolades
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            {signedIn ? (
              <Link
                to="/dashboard"
                className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-xs font-semibold transition-all hover:opacity-95 active:scale-[0.98] shadow-soft cursor-pointer"
              >
                Launch Dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-full border border-border/70 bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-all shadow-soft"
                >
                  Console Sign In
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex rounded-full bg-primary text-primary-foreground px-5 py-2 text-xs font-semibold transition-all hover:opacity-95 active:scale-[0.98] shadow-soft"
                >
                  Open Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══ MAIN HERO (Split Composition) ═══ */}
      <main className="relative z-10 flex-1 flex flex-col items-center">
        <section className="w-full max-w-7xl pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Value Proposition */}
            <div className="lg:col-span-6 space-y-6 text-left">
              {/* Status Pill */}
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>140+ Direct Clearance Rails Operational</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.08]">
                Move money globally. <br />
                <span className="text-muted-foreground/70">Settle locally.</span>
              </h1>

              <p className="max-w-xl text-base text-muted-foreground leading-relaxed">
                Multi-currency accounts, instant peer settlement, and verified domestic bank clearance
                across EUR, USD, GBP, INR, and PHP. Protected by 256-bit cryptographic double-entry ledger architecture.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => signInWithGoogle(() => navigate({ to: "/dashboard" }))}
                  className="flex h-12 items-center justify-center gap-2.5 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground hover:opacity-95 active:scale-[0.98] transition-all shadow-soft cursor-pointer touch-manipulation"
                >
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </button>
                <Link
                  to="/register"
                  className="flex h-12 items-center justify-center gap-2 rounded-full border border-border/80 bg-card px-7 text-sm font-semibold text-foreground hover:bg-muted active:scale-[0.98] transition-all shadow-soft"
                >
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>Open Free Account</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Zero account maintenance fee</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Live mid-market rates</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Direct domestic bank payouts</span>
                </div>
              </div>
            </div>

            {/* Right Column: The Interactive Titanium Card & Terminal Module */}
            <div className="lg:col-span-6 flex flex-col items-center">
              <div className="w-full max-w-md space-y-4">
                {/* Currency Switcher Tabs */}
                <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/60 p-1.5 backdrop-blur-md shadow-soft">
                  {["EUR", "USD", "GBP", "INR", "PHP"].map((cur) => (
                    <button
                      key={cur}
                      type="button"
                      onClick={() => setActivePreviewCurrency(cur)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                        activePreviewCurrency === cur
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <CountryFlag code={cur === "EUR" ? "EU" : cur === "GBP" ? "GB" : cur.substring(0, 2)} size="xs" circle />
                      <span>{cur}</span>
                    </button>
                  ))}
                </div>

                {/* The Physical Metaphor Titanium Card */}
                <div className="relative aspect-[1.586] w-full rounded-3xl p-6 sm:p-7 flex flex-col justify-between overflow-hidden border border-border/80 bg-gradient-to-br from-card via-card/95 to-secondary shadow-hero text-foreground">
                  {/* Subtle Titanium Brushed Effect */}
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.08),transparent_70%)]" />
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                  {/* Card Top: Brand & Contactless Chip */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LogoMark className="h-7 w-7" />
                      <span className="text-xs font-bold tracking-[0.2em] text-foreground uppercase">
                        Moonlight
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-8 rounded-md bg-gold/20 border border-gold/40 flex items-center justify-center">
                        <div className="h-3 w-4 border border-gold/60 rounded-xs" />
                      </div>
                      <CountryFlag
                        code={activePreviewCurrency === "EUR" ? "EU" : activePreviewCurrency === "GBP" ? "GB" : activePreviewCurrency.substring(0, 2)}
                        size="sm"
                        circle
                      />
                    </div>
                  </div>

                  {/* Card Middle: Primary Balance Display */}
                  <div className="relative z-10 space-y-1">
                    <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-muted-foreground">
                      Liquid Available Balance
                    </p>
                    <div className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono tabular-nums text-foreground flex items-baseline gap-2">
                      <span>{currentPreview.balance}</span>
                      <span className="text-sm font-semibold text-muted-foreground">{activePreviewCurrency}</span>
                    </div>
                  </div>

                  {/* Card Bottom: Holder & Rail Details */}
                  <div className="relative z-10 flex items-center justify-between pt-2 border-t border-border/40 text-[11px] font-mono">
                    <div>
                      <span className="text-[9px] text-muted-foreground block uppercase">Vault Tier</span>
                      <span className="font-semibold text-foreground">{currentPreview.tier}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-muted-foreground block uppercase">Identifier</span>
                      <span className="font-semibold text-foreground">{currentPreview.code}</span>
                    </div>
                  </div>
                </div>

                {/* Live Settlement Pulse Feed */}
                <div className="rounded-2xl border border-border/60 bg-card/60 p-3.5 flex items-center justify-between text-xs backdrop-blur-md shadow-card">
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    <div>
                      <span className="font-semibold text-foreground block text-[11px]">
                        Internal Ledger Handshake
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Latency: 12ms · Double-entry attested
                      </span>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    Settled
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ SECTION 2: LIVE WHOLESALE FX & CONVERTER ═══ */}
        <section id="calculator" className="w-full max-w-6xl py-16 px-4 sm:px-8 border-t border-border/40">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold uppercase tracking-wider">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Real-Time Wholesale FX</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Guaranteed Mid-Market Rates. Zero Hidden Margins.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Convert between global currencies at live interbank mid-market rates refreshed from the European Central Bank and Frankfurter daily.
            </p>
          </div>

          <div className="max-w-2xl mx-auto rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-card space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Mid-Market Conversion Engine
                </span>
              </div>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                Rate Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* You Send */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                  You Send
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(e.target.value)}
                    className="h-12 rounded-xl bg-background border-border/70 font-mono text-base font-bold tabular-nums flex-1"
                  />
                  <Select value={calcFrom} onValueChange={setCalcFrom}>
                    <SelectTrigger className="h-12 w-28 rounded-xl border-border/70 bg-background font-semibold shrink-0 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {GLOBAL_CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code} className="text-xs font-semibold">
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

              {/* They Receive */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                  They Receive
                </label>
                <div className="flex gap-2">
                  <div className="h-12 rounded-xl border border-border/70 bg-secondary/40 font-mono text-base font-bold tabular-nums text-foreground flex items-center px-4 flex-1">
                    {formatMoney(convertedVal, calcTo)}
                  </div>
                  <Select value={calcTo} onValueChange={setCalcTo}>
                    <SelectTrigger className="h-12 w-28 rounded-xl border-border/70 bg-background font-semibold shrink-0 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {GLOBAL_CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code} className="text-xs font-semibold">
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

            {/* Rate Specs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border/40 text-xs text-muted-foreground">
              <div className="font-mono">
                <span>Wholesale Midpoint: </span>
                <span className="font-bold text-foreground">
                  1 {calcFrom} = {rateRatio.toFixed(4)} {calcTo}
                </span>
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                Direct Ledger Routing · Zero Hidden Markup
              </div>
            </div>

            <Link
              to="/register"
              className="w-full flex h-12 items-center justify-center gap-2 rounded-full bg-primary text-xs font-bold uppercase tracking-wider text-primary-foreground hover:opacity-95 active:scale-[0.98] transition-all shadow-soft"
            >
              <span>Lock Rate & Transfer</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* ═══ SECTION 3: GLOBAL CLEARING CORRIDORS ═══ */}
        <section id="corridors" className="w-full max-w-7xl py-16 px-4 sm:px-8 border-t border-border/40">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
              <Globe className="h-3.5 w-3.5" />
              <span>International Payout Corridors</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Direct National Banking Gateways
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Every payout rail is strictly verified and cleared through domestic banking standards with 24–48 hours verification and 5–7 business days final settlement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {CLEARING_CORRIDORS.map((corridor, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-border/70 bg-card p-6 flex flex-col justify-between space-y-5 shadow-card hover:border-primary/40 transition-all group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 w-10 rounded-2xl bg-secondary/60 border border-border/50 flex items-center justify-center p-2 overflow-hidden">
                        <BrandAsset id={corridor.providerId} size="xs" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground tracking-tight">
                          {corridor.name}
                        </h3>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {corridor.protocol}
                        </span>
                      </div>
                    </div>
                    <span className="rounded-full bg-secondary/80 border border-border/60 px-2.5 py-0.5 text-[10px] font-semibold text-foreground">
                      {corridor.currency}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {corridor.description}
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-border/40 text-[11px] font-mono">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Processing Window</span>
                    <span className="font-semibold text-foreground">{corridor.processingWindow}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Settlement Timeline</span>
                    <span className="font-semibold text-foreground">{corridor.settlementTimeline}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Network Ping</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{corridor.latency}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ SECTION 4: INSTITUTIONAL SECURITY & LEDGER BENTO ═══ */}
        <section id="security" className="w-full max-w-7xl py-16 px-4 sm:px-8 border-t border-border/40">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <Lock className="h-3.5 w-3.5" />
              <span>Institutional Grade Rigor</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Engineered for Sovereign Financial Security
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              We eliminate third-party counterparty risk through immutable double-entry ledgers, biometric security, and full-reserve digital liquidity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="rounded-3xl border border-border/70 bg-card p-6 space-y-3 shadow-card">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Double-Entry Ledger</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every balance debit and credit is committed atomically inside immutable SECURITY DEFINER database triggers. Client-side balance modification is physically impossible.
              </p>
            </div>

            <div className="rounded-3xl border border-border/70 bg-card p-6 space-y-3 shadow-card">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">256-Bit Cryptography</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Bank-level TLS 1.3 socket negotiation and encrypted session tokens protect every transfer and API request from end-to-end interception.
              </p>
            </div>

            <div className="rounded-3xl border border-border/70 bg-card p-6 space-y-3 shadow-card">
              <div className="h-10 w-10 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
                <Landmark className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">100% Full-Reserve Backing</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Moonlight never lends, pledges, or hypothecates user balances. All member liquidity is backed 1:1 at all times with real-time auditability.
              </p>
            </div>

            <div className="rounded-3xl border border-border/70 bg-card p-6 space-y-3 shadow-card">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Proactive Fraud Shield</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Automated velocity checks, jurisdiction verification locks, and multi-factor session authentication safeguard accounts from unauthorized outbound requests.
              </p>
            </div>
          </div>
        </section>

        {/* ═══ SECTION 5: PLATFORM VITAL METRICS ═══ */}
        <section className="w-full max-w-7xl py-12 px-4 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/40 rounded-3xl overflow-hidden shadow-card">
            {PLATFORM_STATS.map((stat, i) => (
              <div key={i} className="bg-card p-8 text-center space-y-1">
                <p className="stat-number text-foreground font-mono">{stat.value}</p>
                <p className="text-xs font-bold text-foreground/90 mt-2">{stat.label}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{stat.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ SECTION 6: PRESS & RECOGNITION ═══ */}
        <section id="recognition" className="w-full max-w-7xl py-16 px-4 sm:px-8 border-t border-border/40">
          <div className="text-center max-w-xl mx-auto space-y-2 mb-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
              International Recognition
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Acknowledged by Leading Financial Publications
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PRESS_ACCOLADES.map((item, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-border/70 bg-card p-6 flex flex-col justify-between space-y-4 shadow-card"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <img
                      src={item.logoUrl}
                      alt={item.publication}
                      className="h-5 w-auto object-contain opacity-75 dark:invert"
                    />
                    <span className="rounded-full bg-gold/10 border border-gold/20 px-2 py-0.5 text-[9px] font-bold text-gold uppercase tracking-wider">
                      {item.tagline}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed italic">
                    "{item.quote}"
                  </p>
                </div>
                <p className="text-[10px] font-mono font-semibold text-muted-foreground/70 uppercase tracking-wider border-t border-border/30 pt-3">
                  — {item.author}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ SECTION 7: FINAL CTA ═══ */}
        <section className="w-full max-w-5xl py-20 px-4 sm:px-8 text-center space-y-8">
          <div className="rounded-3xl border border-border/80 bg-gradient-to-b from-card to-background p-10 sm:p-14 shadow-hero space-y-6 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <div className="space-y-3 max-w-xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Start moving capital with zero friction today.
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Create your account in under 60 seconds. Instant Moonlight wallet code, real-time multi-currency balances, and verified domestic payout rails.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => signInWithGoogle(() => navigate({ to: "/dashboard" }))}
                className="w-full sm:w-auto flex h-12 items-center justify-center gap-2.5 rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground hover:opacity-95 active:scale-[0.98] transition-all shadow-soft cursor-pointer touch-manipulation"
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>
              <Link
                to="/register"
                className="w-full sm:w-auto flex h-12 items-center justify-center gap-2 rounded-full border border-border/80 bg-card px-8 text-sm font-semibold text-foreground hover:bg-muted active:scale-[0.98] transition-all shadow-soft"
              >
                <span>Create Free Account</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ═══ INSTITUTIONAL FOOTER ═══ */}
      <footer className="relative z-10 border-t border-border/50 bg-card/60 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <LogoMark className="h-7 w-7" />
              <span className="text-xs font-bold tracking-[0.25em] text-foreground">
                MOONLIGHT FINANCIAL
              </span>
            </div>

            <div className="flex items-center gap-6 text-xs text-muted-foreground font-medium">
              <Link to="/about" className="hover:text-foreground transition-colors">
                About Platform
              </Link>
              <Link to="/login" className="hover:text-foreground transition-colors">
                Console Sign In
              </Link>
              <Link to="/register" className="hover:text-foreground transition-colors">
                Open Account
              </Link>
            </div>
          </div>

          <div className="border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted-foreground/70">
            <p>
              © {new Date().getFullYear()} Moonlight Financial Systems. Operating under European financial compliance standards.
            </p>
            <div className="flex items-center gap-3 font-mono text-[10px]">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                TLS 1.3 Certified
              </span>
              <span>·</span>
              <span>Double-Entry Ledger Verified</span>
              <span>·</span>
              <span>Full Reserve Backing</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
