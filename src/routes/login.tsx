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
      title="Welcome back"
      subtitle="Sign in to your wallet."
      footer={
        <>
          New to Moonlight?{" "}
          <Link to="/register" className="font-medium text-foreground">
            Create an account
          </Link>
        </>
      }
    >
      <button
        onClick={() => signInWithGoogle(() => navigate({ to: "/dashboard" }))}
        className="flex w-full items-center justify-center gap-2.5 rounded-full border bg-card px-6 py-3 text-[15px] font-medium transition-colors hover:bg-accent"
      >
        <GoogleIcon /> Continue with Google
      </button>
      <div className="my-8 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
      </div>
      <form onSubmit={submit} className="space-y-3">
        <Input
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 rounded-xl"
        />
        <Input
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 rounded-xl"
        />
        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Forgot password?
          </Link>
        </div>
        <button
          disabled={busy}
          className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-[15px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
        </button>
      </form>
    </AuthLayout>
  );
}
