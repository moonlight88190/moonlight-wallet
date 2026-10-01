import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, ArrowRight, ShieldCheck, Globe, Sparkles } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { GoogleIcon } from "@/components/AuthLayout";
import { supabase } from "@/integrations/supabase/client";
import { signInWithGoogle } from "@/lib/auth";
import { CountryFlag } from "@/components/AssetComponents";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Moonlight Wallet — Global Money, Beautifully Connected" },
      {
        name: "description",
        content:
          "A multi-currency wallet for sending, receiving, managing and moving money across borders. European-first digital wallet infrastructure.",
      },
      { property: "og:title", content: "Moonlight Wallet — Global Money, Beautifully Connected" },
      {
        property: "og:description",
        content:
          "European-first multi-currency wallet for sending, receiving and managing money globally.",
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

function Landing() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);

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
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground selection:bg-primary/10">
      {/* Background ambient gradient glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-full max-w-7xl bg-radial from-primary/10 via-primary/5 to-transparent blur-3xl opacity-70" />

      {/* Header */}
      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-3 group">
          <LogoMark className="h-9 w-9 group-hover:scale-105 transition-transform" />
          <div className="flex flex-col text-left">
            <span className="text-[13px] font-semibold tracking-[0.22em] text-foreground">
              MOONLIGHT
            </span>
            <span className="text-[9px] font-semibold tracking-[0.15em] text-muted-foreground uppercase -mt-0.5">
              European Fintech
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {signedIn ? (
            <Link
              to="/dashboard"
              className="rounded-full bg-primary px-5 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] shadow-soft"
            >
              Open Wallet
            </Link>
          ) : (
            <Link
              to="/login"
              className="rounded-full border border-border/80 bg-card/80 px-5 py-2.5 text-xs sm:text-sm font-medium hover:bg-accent hover:border-primary/40 transition-colors shadow-2xs"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12 sm:py-20 text-center">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 backdrop-blur-md shadow-2xs">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              EUROPEAN-FIRST DIGITAL WALLET
            </span>
          </div>

          <h1 className="mx-auto max-w-2xl text-3xl sm:text-5xl md:text-6xl font-semibold leading-[1.12] tracking-tight text-foreground">
            Global money, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
              beautifully connected.
            </span>
          </h1>

          <p className="mx-auto max-w-xl text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed px-2">
            A multi-currency wallet for sending, receiving, managing and moving money across
            borders.
          </p>

          {/* Global Connectivity Ticker / Currency Route */}
          <div className="pt-2 pb-4">
            <div className="mx-auto flex flex-wrap items-center justify-center gap-2 max-w-2xl px-1">
              {GLOBAL_CURRENCIES.map((c) => (
                <div
                  key={c.code}
                  className="flex items-center gap-1.5 rounded-full border border-border/50 bg-card/70 px-2.5 py-1.5 shadow-2xs text-xs font-semibold"
                >
                  <CountryFlag code={c.flag} circle size="xs" />
                  <span className="text-foreground">{c.code}</span>
                  <span className="text-muted-foreground text-[10px]">({c.symbol})</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] font-semibold text-muted-foreground/80 tracking-widest uppercase flex flex-wrap items-center justify-center gap-1.5 text-center px-2">
              <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
              Prague → London → New York → Dubai → Singapore → Tokyo → Sydney
            </p>
          </div>

          {/* CTAs */}
          <div className="mx-auto flex w-full max-w-sm flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {signedIn ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto h-12 text-base min-w-[200px] flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] shadow-soft"
              >
                Open your wallet <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <button
                  onClick={() => signInWithGoogle(() => navigate({ to: "/dashboard" }))}
                  className="w-full sm:w-auto h-12 text-base min-w-[190px] flex items-center justify-center gap-2.5 rounded-full border border-border/80 bg-card px-6 py-3 font-semibold transition-all hover:bg-accent hover:border-primary/40 shadow-2xs active:scale-[0.98] cursor-pointer touch-manipulation"
                >
                  <GoogleIcon /> Continue with Google
                </button>
                <Link
                  to="/login"
                  className="w-full sm:w-auto h-12 text-base min-w-[180px] flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-all hover:opacity-90 shadow-soft active:scale-[0.98] touch-manipulation"
                >
                  <Mail className="h-4 w-4" /> Get Started
                </Link>
              </>
            )}
            <Link
              to="/about"
              className="w-full sm:w-auto h-12 text-base flex items-center justify-center gap-1 px-5 py-3 font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Explore Moonlight
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-16 sm:mt-24 grid w-full max-w-4xl grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="rounded-3xl border border-border/60 bg-card/60 p-6 shadow-soft backdrop-blur-md space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Globe className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-foreground text-base">Multi-Currency Accounts</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Hold and convert balances in EUR, USD, GBP, CZK, JPY, INR, PHP and 10+ currencies at
              live ECB rates.
            </p>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/60 p-6 shadow-soft backdrop-blur-md space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-foreground text-base">Instant Global Payouts</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Direct payout rails including SEPA Instant, UK Faster Payments, UPI, GCash, PayNow and
              Pix.
            </p>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/60 p-6 shadow-soft backdrop-blur-md space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5 text-amber-500" />
            </div>
            <h3 className="font-semibold text-foreground text-base">
              Luxury &amp; Digital Vouchers
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Instantly redeem wallet balances into global brand digital vouchers and luxury fashion
              passes.
            </p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4 mx-auto w-full max-w-5xl px-6 py-8 text-xs text-muted-foreground border-t border-border/40">
        <div className="flex items-center gap-2">
          <LogoMark className="h-5 w-5" />
          <span className="font-semibold text-foreground">Moonlight Wallet</span>
          <span>· European Fintech Standard</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/about" className="hover:text-foreground transition-colors">
            About &amp; Access
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
