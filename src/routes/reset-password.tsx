import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set New Password — Moonlight Wallet" },
      { name: "description", content: "Choose a new password for your Moonlight Wallet." },
      { property: "og:title", content: "Set New Password — Moonlight Wallet" },
      { property: "og:description", content: "Choose a new password." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (pw.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (pw !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated successfully");
    navigate({ to: "/dashboard" });
  }

  return (
    <AuthLayout
      title="Create New Password"
      subtitle="Choose a strong, 8+ character password to secure your Moonlight account."
    >
      <form onSubmit={submit} className="space-y-3">
        <Input
          type="password"
          placeholder="New password (min 8 chars)"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className="h-12 rounded-xl bg-background/60 px-4 text-base border-border/50 focus:border-ring focus:ring-1 focus:ring-ring/20 transition-all placeholder:text-muted-foreground/50"
          autoFocus
        />
        <Input
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="h-12 rounded-xl bg-background/60 px-4 text-base border-border/50 focus:border-ring focus:ring-1 focus:ring-ring/20 transition-all placeholder:text-muted-foreground/50"
        />
        <button
          disabled={busy || !pw || !confirm}
          className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 shadow-soft cursor-pointer touch-manipulation mt-2"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password & Continue"}
        </button>
      </form>
    </AuthLayout>
  );
}
