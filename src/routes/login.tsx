import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Globe2 } from "lucide-react";
import { AuthLayout, GoogleIcon } from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { signInWithGoogle } from "@/lib/auth";
import { CURRENCIES, FALLBACK_RATES, convert, formatMoney } from "@/lib/currency";
import { CountryFlag } from "@/components/AssetComponents";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRates } from "@/hooks/use-wallet";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Moonlight Wallet" },
      { name: "description", content: "Sign in to your Moonlight Wallet." },
      { property: "og:title", content: "Sign in — Moonlight Wallet" },
      { property: "og:description", content: "Sign in to your Moonlight Wallet." },
    ],
  }),
  component: Login,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
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
  const [busy, setBusy] = useState(false);

  const [previewAmount, setPreviewAmount] = useState<string>("100");
  const [fromCurr, setFromCurr] = useState<string>("USD");
  const [toCurr, setToCurr] = useState<string>("INR");

  const numAmt = Number(previewAmount) || 0;
  const convertedVal = convert(numAmt, fromCurr, toCurr, rates);
  const rateRatio = convert(1, fromCurr, toCurr, rates);

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
      toast.error(parsed.error.issues[0]?.message ?? "Check your details");
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

  return (
    <AuthLayout
      title="Access Your Account"
      subtitle="Sign in to your secure Moonlight account."
      footer={
        <>
          New to Moonlight?{" "}
          <Link
            to="/register"
            className="font-semibold text-foreground hover:underline underline-offset-2 transition-colors"
          >
            Open an Account
          </Link>
        </>
      }
    >
      {/* Google sign-in */}
      <button
        onClick={() => signInWithGoogle(() => navigate({ to: "/dashboard" }))}
        className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-border/60 bg-card/60 px-6 py-3.5 text-[13px] font-semibold transition-all hover:bg-accent hover:border-border active:scale-[0.99] cursor-pointer touch-manipulation shadow-soft"
      >
        <GoogleIcon /> Continue with Google
      </button>

      {/* Divider */}
      <div className="my-7 flex items-center gap-4 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.2em]">
        <div className="h-px flex-1 bg-border/50" /> or email{" "}
        <div className="h-px flex-1 bg-border/50" />
      </div>

      {/* Email/Password form */}
      <form onSubmit={submit} className="space-y-3">
        <Input
          type="email"
          autoComplete="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 rounded-xl bg-background/60 px-4 text-[13px] border-border/50 focus:border-ring focus:ring-1 focus:ring-ring/20 transition-all placeholder:text-muted-foreground/50"
        />
        <Input
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 rounded-xl bg-background/60 px-4 text-[13px] border-border/50 focus:border-ring focus:ring-1 focus:ring-ring/20 transition-all placeholder:text-muted-foreground/50"
        />
        <div className="flex justify-end pt-0.5">
          <Link
            to="/forgot-password"
            className="text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <button
          disabled={busy}
          className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 shadow-soft cursor-pointer touch-manipulation mt-1"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
        </button>
      </form>

      {import.meta.env.DEV && (
        <div className="mt-6 p-3.5 rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-amber-500 dark:text-amber-400">
              Local Dev Helper
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">DEV MODE ONLY</span>
          </div>
          <p className="text-muted-foreground text-[11px]">
            Prefill or sign in with development test credentials:
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail(DEV_DEFAULT_EMAIL);
                setPassword(DEV_DEFAULT_PASSWORD);
              }}
              className="flex-1 py-2 px-3 rounded-xl border border-border/80 bg-card hover:bg-accent font-medium text-center transition-colors cursor-pointer text-[12px]"
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
              className="flex-1 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-300 font-semibold text-center transition-colors cursor-pointer text-[12px]"
            >
              1-Tap Dev Sign In
            </button>
          </div>
        </div>
      )}

      {/* Live Currency & FX Preview Box */}
      <div className="mt-7 rounded-2xl border border-border/40 bg-accent/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <Globe2 className="h-3.5 w-3.5 text-primary" />
            <span>Live FX Preview</span>
          </div>
          <span className="text-[9px] font-semibold text-muted-foreground/70 uppercase tracking-wider bg-background/60 px-2 py-0.5 rounded-full border border-border/30">
            Real-time
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase text-muted-foreground/70 tracking-wider">
              From
            </label>
            <div className="flex items-center gap-1.5 rounded-xl border border-border/40 bg-card/60 p-1.5">
              <Input
                type="number"
                value={previewAmount}
                onChange={(e) => setPreviewAmount(e.target.value)}
                className="h-8 border-none text-[13px] font-semibold focus-visible:ring-0 p-1 min-w-0"
              />
              <Select value={fromCurr} onValueChange={setFromCurr}>
                <SelectTrigger className="h-8 w-24 border-none bg-secondary/50 text-[11px] font-bold rounded-lg shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code} className="text-[11px] font-semibold">
                      <div className="flex items-center gap-1.5">
                        <CountryFlag code={c.code} circle size="xs" />
                        <span>{c.code}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase text-muted-foreground/70 tracking-wider">
              To
            </label>
            <div className="flex items-center gap-1.5 rounded-xl border border-border/40 bg-card/60 p-1.5">
              <div className="flex-1 px-2 text-[13px] font-bold text-foreground font-mono truncate">
                {formatMoney(convertedVal, toCurr)}
              </div>
              <Select value={toCurr} onValueChange={setToCurr}>
                <SelectTrigger className="h-8 w-24 border-none bg-secondary/50 text-[11px] font-bold rounded-lg shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code} className="text-[11px] font-semibold">
                      <div className="flex items-center gap-1.5">
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

        <div className="flex items-center justify-between text-[10px] text-muted-foreground/70 pt-2 border-t border-border/30">
          <span>Corridor Rate:</span>
          <span className="font-mono font-semibold text-foreground/80">
            1 {fromCurr} ≈ {rateRatio.toFixed(4)} {toCurr}
          </span>
        </div>
      </div>
    </AuthLayout>
  );
}
