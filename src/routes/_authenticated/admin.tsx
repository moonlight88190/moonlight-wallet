import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminAddBalance, checkAdminToken } from "@/lib/admin.functions";
import { CURRENCIES, type CurrencyCode } from "@/lib/currency";
import { PageTitle } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Moonlight" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

function Admin() {
  const navigate = useNavigate();
  const check = useServerFn(checkAdminToken);
  const add = useServerFn(adminAddBalance);
  const [ok, setOk] = useState<boolean | null>(null);
  const [f, setF] = useState({
    walletCode: "",
    currency: "USD" as CurrencyCode,
    amount: "",
    reason: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("ml_admin_token") ?? "";
    check({ data: { token } })
      .then((r) => (r.ok ? setOk(true) : navigate({ to: "/admin-access" })))
      .catch(() => navigate({ to: "/admin-access" }));
  }, [check, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await add({
        data: {
          token: sessionStorage.getItem("ml_admin_token") ?? "",
          walletCode: f.walletCode,
          currency: f.currency,
          amount: Number(f.amount),
          reason: f.reason,
        },
      });
      toast.success(`Added ${f.amount} ${f.currency} to ${f.walletCode.toUpperCase()}`);
      setF({ ...f, walletCode: "", amount: "", reason: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message.slice(0, 160) : "Couldn't add balance");
    } finally {
      setBusy(false);
    }
  }

  if (!ok)
    return (
      <div className="flex justify-center pt-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  return (
    <div className="mx-auto max-w-md">
      <PageTitle eyebrow="ADMIN" title="Add balance">
        Every adjustment is written to the ledger and audit log.
      </PageTitle>
      <form onSubmit={submit} className="space-y-3">
        <Input
          placeholder="Wallet ID (ML-XXXX-XXXX)"
          value={f.walletCode}
          onChange={(e) => setF({ ...f, walletCode: e.target.value })}
          className="h-12 rounded-xl font-mono"
        />
        <div className="flex gap-2">
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount"
            value={f.amount}
            onChange={(e) => setF({ ...f, amount: e.target.value })}
            className="h-12 rounded-xl"
          />
          <Select
            value={f.currency}
            onValueChange={(v) => setF({ ...f, currency: v as CurrencyCode })}
          >
            <SelectTrigger className="h-12 w-28 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          placeholder="Reason"
          maxLength={200}
          value={f.reason}
          onChange={(e) => setF({ ...f, reason: e.target.value })}
          className="h-12 rounded-xl"
        />
        <button
          disabled={busy}
          className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-[15px] font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
        </button>
      </form>
    </div>
  );
}
