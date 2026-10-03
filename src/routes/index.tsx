import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Mail,
  ArrowRight,
  ShieldCheck,
  Globe,
  ArrowRightLeft,
  CheckCircle,
  ChevronRight,
  Send,
  Landmark,
  CreditCard,
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

export const Route = createFileRoute("/")(
  {
  head: () => ({
    meta: [
      { title: "Moonlight Wallet — Send, Receive & Manage Money" },
      {
        name: "description",
        content:
          "Send, receive, and manage multiple currencies in one account. Convert between 9 currencies with transparent exchange rates.",
      },
      {
        property: "og:title",
        content: "Moonlight Wallet — Send, Receive & Manage Money",
      },
      {
        property: "og:description",
        content:
          "Multi-currency digital wallet. Send money, receive payments, and convert currencies at mid-market rates.",
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

const PRODUCT_FEATURES = [
  {
    icon: Globe,
    title: "Multi-Currency Accounts",
    description:
      "Hold and manage EUR, USD, GBP, AED, SGD, JPY, AUD, INR, and PHP balances in one account. Convert between currencies at mid-market rates.",
  },
  {
    icon: Send,
    title: "Send & Receive Money",
    description:
      "Transfer money to other Moonlight accounts instantly. Receive payments from anyone with your wallet ID or QR code.",
  },
  {
    icon: Landmark,
    title: "Withdraw to Your Bank",
    description:
      "Withdraw to your bank account via UPI, bank transfer, or other local payment methods available in your country.",
  },
  {
    icon: CreditCard,
    title: "Digital Gift Cards",
    description:
      "Redeem your balance for gift cards from popular brands including Apple, Google Play, Amazon, and more.",
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
              <span className="text-[8px] font-semibold tracking-[0.16em] text-muted-foreground uppercase leading-none mt-0.5">
                Wallet
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
          <h1 className="text-display max-w-3xl animate-fade-up stagger-1 text-foreground">
            Send money. <span className="text-muted-foreground/60">Anywhere.</span>
          </h1>

          <p className="animate-fade-up stagger-2 max-w-lg text-[15px] text-muted-foreground leading-relaxed">
            Send, receive, and manage multiple currencies in one account. Convert between
            9 currencies at transparent mid-market rates.
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
              Free to open
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-success" />
              No minimum balance
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-success" />
              9 currencies
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
                  Currency Converter
                </span>
              </div>
              <span className="badge-primary">Mid-market rates</span>
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

        {/* ─── Section 3: Supported Currencies ─── */}
        <section
          className="w-full max-w-5xl py-12 border-t border-b border-border/40"
          aria-label="Supported currencies"
        >
          <p className="text-center text-label-caps text-muted-foreground/60 mb-8">
            Supported currencies
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
            {GLOBAL_CURRENCIES.map((c) => (
              <div key={c.code} className="flex items-center gap-2">
                <CountryFlag code={c.flag} size="sm" circle />
                <span className="text-sm font-semibold text-foreground">{c.code}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Section 4: Product Features ─── */}
        <section
          className="w-full max-w-5xl py-16 space-y-10"
          aria-label="Features"
        >
          <div className="text-center space-y-2">
            <h2 className="text-headline text-foreground">What you can do</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Everything you need to manage your money across currencies and countries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PRODUCT_FEATURES.map((cap, idx) => {
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
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 border-t border-border/40 bg-card/50 py-8 text-center">
        <div className="mx-auto max-w-4xl px-5 space-y-2">
          <p className="text-[13px] font-semibold text-foreground">Moonlight Wallet</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed max-w-lg mx-auto">
            A multi-currency digital wallet for sending, receiving, and managing money across
            9 currencies. This is a closed-loop simulation and does not connect to real banking
            or payment networks.
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
