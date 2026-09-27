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
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = z.string().trim().email().max(255).safeParse(email);
    if (!p.success) return toast.error("Enter a valid email");
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(p.data, { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (error) return toast.error(error.message);
    setSent(true);
  }
  return (
    <AuthLayout
      title={sent ? "Check your email" : "Forgot password"}
      subtitle={sent ? `If an account exists for ${email}, a reset link is on its way.` : "We'll email you a link to reset it."}
      footer={<Link to="/login" className="font-medium text-foreground">Back to sign in</Link>}
    >
      {!sent && (
        <form onSubmit={submit} className="space-y-3">
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" />
          <button disabled={busy} className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-[15px] font-medium text-primary-foreground disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
