import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  Loader2,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Cpu,
  CheckCircle2,
} from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GoogleIcon } from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { signInWithGoogle } from "@/lib/auth";
import { FALLBACK_RATES, convert } from "@/lib/currency";
import { CountryFlag } from "@/components/AssetComponents";
import { useRates } from "@/hooks/use-wallet";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Moonlight Wallet Institutional Console" },
      { name: "description", content: "Sign in to your secure Moonlight Wallet account." },
      { property: "og:title", content: "Sign in — Moonlight Wallet" },
      { property: "og:description", content: "Institutional digital multi-currency wallet." },
    ],
  }),
  component: Login,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(1, "Enter your password"),
});

const DEV_DEFAULT_EMAIL = import.meta.env["VITE_DEV_LOGIN_EMAIL"] || "lucianfereldenlord@gmail.com";
const DEV_DEFAULT_PASSWORD = import.meta.env["VITE_DEV_LOGIN_PASSWORD"] || "12345678";

function Login() {
  const navigate = useNavigate();
  const ratesQuery = useRates();
  const rates = ratesQuery.data?.rates ?? FALLBACK_RATES;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate({ to: "/dashboard" });
      }
    });
  }, [navigate]);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your credentials");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        toast.error("Please verify your email address before signing in.");
      } else if (error.message === "Invalid login credentials") {
        toast.error("Email or password is incorrect.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    if (data?.session) {
      toast.success("Signed in successfully");
      navigate({ to: "/dashboard" });
      return;
    }
  }

  // Real-time rates for showcase ticker
  const eurUsd = convert(1, "EUR", "USD", rates);
  const gbpUsd = convert(1, "GBP", "USD", rates);
  const usdInr = convert(1, "USD", "INR", rates);
  const usdPhp = convert(1, "USD", "PHP", rates);

  return (
    <div className="relative min-h-[100dvh] w-full bg-background text-foreground flex flex-col lg:grid lg:grid-cols-12 overflow-x-hidden antialiased">
      {/* ─── LEFT SHOWCASE (Desktop Only) ─── */}
      <div className="hidden lg:col-span-5 lg:flex flex-col justify-between border-r border-border/60 bg-card/60 p-12 relative overflow-hidden">
        {/* Specular Ambient Backing */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-[140px]" />

        {/* Top: Brand Wordmark */}
        <div className="relative z-10 space-y-6">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <LogoMark className="h-10 w-10 transition-transform duration-300 group-hover:scale-105" />
            <div>
              <span className="text-[13px] font-bold tracking-[0.32em] text-foreground block leading-none">
                MOONLIGHT
              </span>
              <span className="text-[9px] font-semibold tracking-[0.2em] text-gold uppercase block mt-1 leading-none">
                Financial Systems
              </span>
            </div>
          </Link>

          <div className="space-y-2 pt-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              All Clearing Corridors Online
            </div>
            <h2 className="text-2xl xl:text-3xl font-bold tracking-tight text-foreground leading-tight">
              Sovereign Liquidity. <br />
              Institutional Settlement.
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              Bank-grade multi-currency accounts, real-time clearing corridors, and audited double-entry ledger security.
            </p>
          </div>
        </div>

        {/* Middle: Live Market Ticker & Corridor Latencies */}
        <div className="relative z-10 space-y-3 py-8">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70 flex items-center justify-between">
            <span>Wholesale Exchange Feed</span>
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
              <TrendingUp className="h-3 w-3" /> Live mid-market
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="rounded-xl border border-border/50 bg-background/50 p-2.5 space-y-1">
              <div className="flex items-center gap-1.5">
                <CountryFlag code="EU" size="xs" circle />
                <span className="text-[10px] font-bold text-muted-foreground">EUR / USD</span>
              </div>
              <div className="text-[13px] font-bold text-foreground tabular-nums">
                {eurUsd.toFixed(4)}
              </div>
            </div>

            <div className="rounded-xl border border-border/50 bg-background/50 p-2.5 space-y-1">
              <div className="flex items-center gap-1.5">
                <CountryFlag code="GB" size="xs" circle />
                <span className="text-[10px] font-bold text-muted-foreground">GBP / USD</span>
              </div>
              <div className="text-[13px] font-bold text-foreground tabular-nums">
                {gbpUsd.toFixed(4)}
              </div>
            </div>

            <div className="rounded-xl border border-border/50 bg-background/50 p-2.5 space-y-1">
              <div className="flex items-center gap-1.5">
                <CountryFlag code="IN" size="xs" circle />
                <span className="text-[10px] font-bold text-muted-foreground">USD / INR</span>
              </div>
              <div className="text-[13px] font-bold text-foreground tabular-nums">
                {usdInr.toFixed(2)}
              </div>
            </div>

            <div className="rounded-xl border border-border/50 bg-background/50 p-2.5 space-y-1">
              <div className="flex items-center gap-1.5">
                <CountryFlag code="PH" size="xs" circle />
                <span className="text-[10px] font-bold text-muted-foreground">USD / PHP</span>
              </div>
              <div className="text-[13px] font-bold text-foreground tabular-nums">
                {usdPhp.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Institutional Assurance */}
        <div className="relative z-10 border-t border-border/40 pt-6 space-y-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>256-Bit Hardware Security & TLS 1.3 Certified</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Cpu className="h-4 w-4 text-primary shrink-0" />
            <span>Cryptographic Double-Entry Ledger Protection</span>
          </div>
          <div className="text-[10px] text-muted-foreground/60 font-mono pt-2">
            Moonlight Financial Corp. · Operating Under European Clearing Standards
          </div>
        </div>
      </div>

      {/* ─── RIGHT CONSOLE (Auth Form) ─── */}
      <div className="flex-1 lg:col-span-7 flex flex-col justify-between p-5 sm:p-10 lg:p-12 relative">
        {/* Top Bar: Nav / Theme */}
        <div className="w-full flex items-center justify-between pb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Return to Overview</span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Main Centered Login Card */}
        <div className="mx-auto w-full max-w-[420px] py-4 sm:py-8 space-y-7">
          {/* Header */}
          <div className="text-center space-y-2">
            <Link to="/" className="lg:hidden mx-auto mb-4 flex w-fit items-center gap-2.5">
              <LogoMark className="h-9 w-9" />
              <span className="text-[13px] font-bold tracking-[0.25em] text-foreground">
                MOONLIGHT
              </span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Sign In to Console
            </h1>
            <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
              Access your multi-currency accounts and domestic payout rails.
            </p>
          </div>

          {/* Google 1-Tap SSO */}
          <button
            type="button"
            onClick={() => signInWithGoogle(() => navigate({ to: "/dashboard" }))}
            className="w-full flex h-12 items-center justify-center gap-3 rounded-2xl border border-border/80 bg-card px-5 text-sm font-semibold text-foreground transition-all hover:bg-muted active:scale-[0.99] cursor-pointer shadow-soft touch-manipulation"
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60" />
            </div>
            <span className="relative bg-background px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
              or email credentials
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1 block">
                Email Address
              </label>
              <Input
                type="email"
                autoComplete="email"
                required
                placeholder="name@institution.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl bg-card border-border/70 px-4 text-base focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl bg-card border-border/70 px-4 pr-11 text-base focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full flex h-12 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-50 shadow-soft cursor-pointer touch-manipulation mt-2"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Local Dev Helper (Strictly compliant with AGENTS.md) */}
          {import.meta.env.DEV && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Local Dev Helper
                </span>
                <span className="text-[9px] font-mono text-muted-foreground bg-background/80 px-2 py-0.5 rounded border border-border/40">
                  DEV MODE ONLY
                </span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Automated test and development credentials panel:
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail(DEV_DEFAULT_EMAIL);
                    setPassword(DEV_DEFAULT_PASSWORD);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl border border-border/80 bg-card hover:bg-accent font-medium text-center transition-colors cursor-pointer text-xs"
                >
                  Fill Dev Credentials
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setEmail(DEV_DEFAULT_EMAIL);
                    setPassword(DEV_DEFAULT_PASSWORD);
                    setBusy(true);
                    const { data, error } = await supabase.auth.signInWithPassword({
                      email: DEV_DEFAULT_EMAIL,
                      password: DEV_DEFAULT_PASSWORD,
                    });
                    setBusy(false);
                    if (error) {
                      toast.error(error.message);
                    } else if (data?.session) {
                      toast.success("Signed in as Dev User");
                      navigate({ to: "/dashboard" });
                    }
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 font-semibold text-center transition-colors cursor-pointer text-xs"
                >
                  1-Tap Dev Sign In
                </button>
              </div>
            </div>
          )}

          {/* New to Moonlight */}
          <div className="text-center text-xs text-muted-foreground pt-2">
            New to Moonlight?{" "}
            <Link
              to="/register"
              className="font-semibold text-foreground hover:underline underline-offset-4 transition-colors"
            >
              Open an Account
            </Link>
          </div>
        </div>

        {/* Footer Security Badges */}
        <div className="w-full flex flex-wrap items-center justify-center gap-3 pt-6 text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider border-t border-border/30">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            TLS 1.3 Certified
          </span>
          <span className="text-border">·</span>
          <span>Double-Entry Ledger</span>
          <span className="text-border">·</span>
          <span>Zero Client Liability</span>
        </div>
      </div>
    </div>
  );
}
