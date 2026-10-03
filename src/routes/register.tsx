import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";
import { AuthLayout, GoogleIcon } from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { signInWithGoogle } from "@/lib/auth";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — Moonlight Wallet" },
      {
        name: "description",
        content: "Create your Moonlight Wallet and get your own wallet ID and QR code.",
      },
      { property: "og:title", content: "Create account — Moonlight Wallet" },
      { property: "og:description", content: "Your own wallet ID and QR code in seconds." },
    ],
  }),
  component: Register,
});

const schema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(100),
    email: z.string().trim().email("Enter a valid email").max(255),
    password: z.string().min(8, "Password must be at least 8 characters").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] });

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const p = schema.safeParse(form);
    if (!p.success) {
      toast.error(p.error.issues[0]?.message ?? "Check your details");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: p.data.email,
      password: p.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: p.data.fullName },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) navigate({ to: "/dashboard" });
    else setSent(true);
  }

  if (sent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle={`We sent a confirmation link to ${form.email}.`}
        footer={
          <Link
            to="/login"
            className="font-semibold text-foreground hover:underline underline-offset-2"
          >
            Back to sign in
          </Link>
        }
      >
        <div className="flex justify-center py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/8">
            <MailCheck className="h-8 w-8 text-success" strokeWidth={1.25} />
          </div>
        </div>
        <p className="mt-4 text-center text-[13px] text-muted-foreground leading-relaxed">
          Once confirmed, your wallet ID and QR code will be ready on your dashboard.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your wallet"
      subtitle="It takes less than a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-foreground hover:underline underline-offset-2"
          >
            Sign in
          </Link>
        </>
      }
    >
      {/* Google */}
      <button
        onClick={() => signInWithGoogle(() => navigate({ to: "/dashboard" }))}
        className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-border/60 bg-card/60 px-6 py-3.5 text-[13px] font-semibold transition-all hover:bg-accent hover:border-border active:scale-[0.99] cursor-pointer touch-manipulation shadow-soft"
      >
        <GoogleIcon /> Continue with Google
      </button>

      {/* Divider */}
      <div className="my-7 flex items-center gap-4 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.2em]">
        <div className="h-px flex-1 bg-border/50" /> or <div className="h-px flex-1 bg-border/50" />
      </div>

      {/* Form */}
      <form onSubmit={submit} className="space-y-3">
        <Input
          placeholder="Full name"
          autoComplete="name"
          value={form.fullName}
          onChange={set("fullName")}
          className="h-12 rounded-xl bg-background/60 px-4 text-base border-border/50 focus:border-ring focus:ring-1 focus:ring-ring/20 transition-all placeholder:text-muted-foreground/50"
        />
        <Input
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={form.email}
          onChange={set("email")}
          className="h-12 rounded-xl bg-background/60 px-4 text-base border-border/50 focus:border-ring focus:ring-1 focus:ring-ring/20 transition-all placeholder:text-muted-foreground/50"
        />
        <Input
          type="password"
          placeholder="Password (min 8 chars)"
          autoComplete="new-password"
          value={form.password}
          onChange={set("password")}
          className="h-12 rounded-xl bg-background/60 px-4 text-base border-border/50 focus:border-ring focus:ring-1 focus:ring-ring/20 transition-all placeholder:text-muted-foreground/50"
        />
        <Input
          type="password"
          placeholder="Confirm password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={set("confirm")}
          className="h-12 rounded-xl bg-background/60 px-4 text-base border-border/50 focus:border-ring focus:ring-1 focus:ring-ring/20 transition-all placeholder:text-muted-foreground/50"
        />
        <button
          disabled={busy}
          className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 shadow-soft cursor-pointer touch-manipulation mt-1"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
