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
  Crown,
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
import titaniumCardImg from "@/assets/titanium_card.jpg";

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
      "“Recognized as Europe’s premier multi-currency wallet standard for seamless liquidity management and verified cryptographic transfers.”",
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
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground antialiased font-sans">
      {/* ─── Premium Ambient Backdrop ─── */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 h-[700px] w-[700px] rounded-full bg-gold/[0.08] blur-[160px]" />
        <div className="absolute bottom-1/4 right-0 translate-x-1/3 h-[500px] w-[500px] rounded-full bg-primary/[0.06] blur-[140px]" />
      </div>

      {/* ─── Header ─── */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 sm:px-6 py-5">
        <Link to="/" className="flex items-center gap-2.5 group">
          <LogoMark className="h-9 w-9 group-hover:scale-[1.03] transition-transform duration-200" />
          <div className="flex flex-col text-left">
            <span className="text-[13px] font-bold tracking-[0.26em] text-foreground">
              MOONLIGHT
            </span>
            <span className="text-[8px] font-bold tracking-[0.18em] text-gold uppercase -mt-0.5">
              Multi-Currency Financial Wallet
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {signedIn ? (
            <Link
              to="/dashboard"
              className="rounded-full bg-gold text-black px-5 py-2.5 text-[12px] font-bold transition-all hover:brightness-110 active:scale-[0.98] shadow-md gold-glow"
            >
              Open Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/about"
                className="hidden sm:inline-flex rounded-full px-4 py-2 text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Regulatory Info
              </Link>
              <Link
                to="/login"
                className="rounded-full border border-gold/40 bg-black/60 px-5 py-2.5 text-[12px] font-bold text-gold hover:bg-black transition-all shadow-soft backdrop-blur-md"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* ─── Hero Section ─── */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 sm:px-6 py-12 sm:py-16 text-center">
        <div className="animate-fade-up max-w-4xl space-y-6">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 backdrop-blur-xl shadow-soft">
            <Crown className="h-4 w-4 text-gold shrink-0" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-gold uppercase">
              Licensed European-First Financial Infrastructure
            </span>
          </div>

          {/* Headline */}
          <h1 className="mx-auto max-w-3xl text-[40px] sm:text-[60px] md:text-[68px] font-black leading-[1.04] tracking-tight text-foreground">
            Global Capital. <br />
            <span className="bg-gradient-to-r from-gold via-amber-200 to-white bg-clip-text text-transparent drop-shadow-sm">
              Instant Mobility.
            </span>
          </h1>

          <p className="mx-auto max-w-xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            Send, receive, withdraw, and manage multi-currency balances across Europe, Asia, and the Americas with SEPA Instant rails, 256-bit encryption, and zero hidden friction.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => signInWithGoogle()}
              className="w-full sm:w-auto flex h-13 items-center justify-center gap-2.5 rounded-full bg-gold px-8 text-xs font-bold uppercase tracking-wider text-black transition-all hover:brightness-110 active:scale-[0.98] shadow-lg gold-glow cursor-pointer"
            >
              <GoogleIcon /> Continue with Google
            </button>
            <Link
              to="/register"
              className="w-full sm:w-auto flex h-13 items-center justify-center gap-2 rounded-full border border-border/60 bg-card/60 px-8 text-xs font-bold tracking-wide text-foreground hover:bg-muted/60 transition-all shadow-xs"
            >
              <Mail className="h-4 w-4 text-gold" /> Sign up with Email <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* ─── Holographic 3D Titanium Card Showcase ─── */}
        <div className="mt-12 w-full max-w-2xl animate-fade-up">
          <div className="relative rounded-3xl obsidian-card p-2 shadow-2xl gold-glow overflow-hidden group">
            <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden relative">
              <img
                src={titaniumCardImg}
                alt="Moonlight Titanium Card"
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6">
                <div className="text-left space-y-1">
                  <p className="text-[10px] font-bold text-gold uppercase tracking-widest">
                    EXECUTIVE TITANIUM MEMBERSHIP
                  </p>
                  <p className="text-white font-mono text-sm font-bold">
                    ML-88190-VIP · 0% Transfer Fee Threshold
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Press Accolades Carousel ─── */}
        <div className="mt-16 w-full max-w-5xl space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Award className="h-4 w-4 text-gold" />
            <h2 className="text-[10px] font-bold tracking-[0.25em] text-muted-foreground uppercase">
              International Press Recognition
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left">
            {PRESS_ACCOLADES.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-gold/20 bg-card/60 p-5 space-y-3 shadow-soft hover:border-gold/40 transition-colors backdrop-blur-md"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-foreground tracking-wide">{item.publication}</span>
                  <span className="text-[9px] font-bold text-gold uppercase bg-gold/10 px-2 py-0.5 rounded-full border border-gold/20">
                    {item.tagline}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed italic">
                  {item.quote}
                </p>
                <p className="text-[10px] font-bold text-foreground/80 uppercase tracking-wider">
                  — {item.author}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Currency Converter Calculator ─── */}
        <div className="mt-16 w-full max-w-xl rounded-3xl border border-border/60 bg-card/60 p-6 shadow-soft space-y-4 text-left backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-gold" /> Instant FX Calculator
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              Rate: 1 {calcFrom} ≈ {rateRatio.toFixed(4)} {calcTo}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase px-1">
                You Convert
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value)}
                  className="h-12 rounded-2xl border-border/60 bg-background font-mono text-base font-bold"
                />
                <Select value={calcFrom} onValueChange={setCalcFrom}>
                  <SelectTrigger className="h-12 w-28 rounded-2xl border-border/60 bg-background font-bold shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl p-1 border-border/60">
                    {GLOBAL_CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code} className="font-bold text-xs py-2">
                        {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase px-1">
                Converted Output
              </label>
              <div className="flex gap-2">
                <div className="h-12 rounded-2xl border border-border/60 bg-muted/40 font-mono text-base font-bold text-emerald-500 flex items-center px-4 flex-1">
                  {formatMoney(convertedVal, calcTo)}
                </div>
                <Select value={calcTo} onValueChange={setCalcTo}>
                  <SelectTrigger className="h-12 w-28 rounded-2xl border-border/60 bg-background font-bold shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl p-1 border-border/60">
                    {GLOBAL_CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code} className="font-bold text-xs py-2">
                        {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 border-t border-border/40 py-8 text-center text-xs text-muted-foreground">
        <p className="font-medium text-foreground">
          Moonlight Wallet · Official European Multi-Currency Infrastructure
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground/70">
          Licensed digital clearing platform operating under strict European financial compliance frameworks.
        </p>
      </footer>
    </div>
  );
}
