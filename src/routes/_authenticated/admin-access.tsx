import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, ShieldAlert, KeyRound, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { verifyAdminCode } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin-access")({
  head: () => ({
    meta: [
      { title: "Terminal Authorization — Moonlight Internal" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminAccess,
});

function AdminAccess() {
  const navigate = useNavigate();
  const verify = useServerFn(verifyAdminCode);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    try {
      const res = await verify({ data: { code: code.trim() } });
      if (!res.ok) {
        toast.error(res.error || "Authentication failed.");
        return;
      }
      sessionStorage.setItem("ml_admin_token", res.token);
      toast.success("Authorized session established");
      navigate({ to: "/admin" });
    } catch {
      toast.error("Security verification timeout. Check server logs.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm pt-12 sm:pt-16 pb-12 animate-fade-up">
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
      </div>

      <div className="rounded-3xl border border-border/60 bg-card/80 p-7 sm:p-8 shadow-card text-center space-y-6 backdrop-blur-xl relative overflow-hidden">
        {/* Subtle security mesh glow */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-36 w-36 rounded-full bg-primary/10 blur-[50px]" />

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
          <KeyRound className="h-7 w-7" strokeWidth={1.75} />
        </div>

        <div>
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-gold tracking-widest uppercase mb-1">
            <ShieldAlert className="h-3.5 w-3.5 text-gold" />
            <span>RESTRICTED OPERATIONS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Administrative Access
          </h1>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            Enter the administrator access code to manage accounts, balances, and region settings.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              inputMode="numeric"
              autoFocus
              placeholder="••••••••"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-13 rounded-2xl text-center font-mono text-lg tracking-[0.4em] bg-background/60 border-border/60 focus:border-ring focus:ring-1 focus:ring-ring/20"
              maxLength={32}
            />
          </div>

          <button
            type="submit"
            disabled={busy || !code.trim()}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-xs font-bold tracking-wider uppercase text-primary-foreground transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-50 shadow-soft cursor-pointer touch-manipulation"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Authenticate Terminal"}
          </button>
        </form>

        <div className="pt-2 border-t border-border/40 text-[10px] text-muted-foreground/70 space-y-1">
          <p>HMAC-SHA256 Signed Session · Rate Limited</p>
          <p>All authentication attempts are recorded in the security audit log.</p>
        </div>
      </div>
    </div>
  );
}
