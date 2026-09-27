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
      { name: "description", content: "Create your Moonlight Wallet and get your own wallet ID and QR code." },
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
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = schema.safeParse(form);
    if (!p.success) return toast.error(p.error.issues[0].message);
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: p.data.email,
      password: p.data.password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { full_name: p.data.fullName } },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (data.session) navigate({ to: "/dashboard" });
    else setSent(true);
  }

  if (sent) {
    return (
      <AuthLayout title="Check your email" subtitle={`We sent a confirmation link to ${form.email}.`} footer={<Link to="/login" className="font-medium text-foreground">Back to sign in</Link>}>
        <div className="flex justify-center"><MailCheck className="h-10 w-10 text-muted-foreground" strokeWidth={1.25} /></div>
        <p className="mt-6 text-center text-sm text-muted-foreground">Once confirmed, your wallet ID and QR code will be ready on your dashboard.</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create your wallet" subtitle="It takes less than a minute." footer={<>Already have an account? <Link to="/login" className="font-medium text-foreground">Sign in</Link></>}>
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
        <Input placeholder="Full name" autoComplete="name" value={form.fullName} onChange={set("fullName")} className="h-12 rounded-xl" />
        <Input type="email" placeholder="Email" autoComplete="email" value={form.email} onChange={set("email")} className="h-12 rounded-xl" />
        <Input type="password" placeholder="Password" autoComplete="new-password" value={form.password} onChange={set("password")} className="h-12 rounded-xl" />
        <Input type="password" placeholder="Confirm password" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} className="h-12 rounded-xl" />
        <button disabled={busy} className="mt-2 flex h-12 w-full items-center justify-center rounded-full bg-primary text-[15px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
