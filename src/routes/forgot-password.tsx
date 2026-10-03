import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Moonlight Wallet" },
      { name: "description", content: "Reset your Moonlight Wallet password." },
      { property: "og:title", content: "Reset password — Moonlight Wallet" },
      { property: "og:description", content: "Reset your Moonlight Wallet password." },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const p = z.string().trim().email().max(255).safeParse(email);
    if (!p.success) {
      toast.error("Enter a valid email");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(p.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  }
  return (
    <AuthLayout
      title={sent ? "Check your email" : "Forgot password"}
      subtitle={
        sent
          ? `If an account exists for ${email}, a reset link is on its way.`
          : "We\u2019ll email you a link to reset it."
      }
      footer={
        <Link to="/login" className="font-semibold text-foreground hover:underline underline-offset-2">
          Back to sign in
        </Link>
      }
    >
      {!sent && (
        <form onSubmit={submit} className="space-y-3">
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-xl bg-background/60 px-4 text-[13px] border-border/50 focus:border-ring focus:ring-1 focus:ring-ring/20 transition-all placeholder:text-muted-foreground/50"
          />
          <button
            disabled={busy}
            className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 shadow-soft cursor-pointer touch-manipulation"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
