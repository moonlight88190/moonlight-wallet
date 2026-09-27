import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { verifyAdminCode } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin-access")({
  head: () => ({ meta: [{ title: "Authorized Access — Moonlight" }, { name: "robots", content: "noindex" }] }),
  component: AdminAccess,
});

function AdminAccess() {
  const navigate = useNavigate();
  const verify = useServerFn(verifyAdminCode);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await verify({ data: { code } });
      if (!res.ok) { toast.error(res.error); return; }
      sessionStorage.setItem("ml_admin_token", res.token);
      navigate({ to: "/admin" });
    } catch {
      toast.error("Couldn't verify the code.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto max-w-xs pt-16 text-center">
      <Lock className="mx-auto h-8 w-8 text-muted-foreground" strokeWidth={1.25} />
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Authorized Access</h1>
      <form onSubmit={submit} className="mt-8 space-y-3">
        <Input type="password" inputMode="numeric" autoFocus placeholder="Access code" value={code} onChange={(e) => setCode(e.target.value)} className="h-12 rounded-xl text-center tracking-[0.5em]" maxLength={32} />
        <button disabled={busy || !code} className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-[15px] font-medium text-primary-foreground disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
        </button>
      </form>
    </div>
  );
}
