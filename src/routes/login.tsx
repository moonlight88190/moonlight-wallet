import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AuthLayout, GoogleIcon } from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { signInWithGoogle } from "@/lib/auth";

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

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
          <Link to="/register" className="font-semibold text-foreground hover:underline">
            Open an Account
          </Link>
        </>
      }
    >
      <button
        onClick={() => signInWithGoogle(() => navigate({ to: "/dashboard" }))}
        className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-border/80 bg-card/80 px-6 py-3.5 text-sm font-semibold transition-all hover:bg-accent hover:border-primary/40 shadow-2xs active:scale-[0.99] cursor-pointer touch-manipulation"
      >
        <GoogleIcon /> Continue with Google
      </button>
      <div className="my-6 flex items-center gap-4 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
        <div className="h-px flex-1 bg-border/60" /> OR EMAIL{" "}
        <div className="h-px flex-1 bg-border/60" />
      </div>
      <form onSubmit={submit} className="space-y-3.5">
        <Input
          type="email"
          autoComplete="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 rounded-2xl bg-card/50 px-4 text-sm border-border/70 focus:border-primary transition-all"
        />
        <Input
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 rounded-2xl bg-card/50 px-4 text-sm border-border/70 focus:border-primary transition-all"
        />
        <div className="flex justify-end pt-0.5">
          <Link
            to="/forgot-password"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <button
          disabled={busy}
          className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 shadow-soft cursor-pointer touch-manipulation"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
        </button>
      </form>
    </AuthLayout>
  );
}
