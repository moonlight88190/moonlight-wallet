import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Loader2,
  LayoutGrid,
  Wallet,
  Users,
  ShieldCheck,
  LogOut,
  Search,
  Snowflake,
  Sun,
  RefreshCw,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  checkAdminToken,
  adminOverview,
  adminAddBalance,
  adminRemoveBalance,
  adminSetFreeze,
  adminSetRegion,
  adminListUsers,
  adminListWithdrawals,
  adminUpdateWithdrawalStatus,
  adminSetAccountAge,
} from "@/lib/admin.functions";
import { formatMoney } from "@/lib/currency";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Moonlight" },
      { name: "description", content: "Moonlight internal operations dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const ADMIN_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "INR",
  "PHP",
  "SGD",
  "AUD",
  "CAD",
  "JPY",
  "CHF",
] as const;
const REGIONS = ["GLOBAL", "EUROPE", "INDIA", "PHILIPPINES"] as const;
type Section = "overview" | "withdrawals" | "balance" | "users" | "controls";
const NAV: { id: Section; label: string; icon: typeof LayoutGrid }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "withdrawals", label: "Withdrawals", icon: ArrowUpRight },
  { id: "balance", label: "Balance Control", icon: Wallet },
  { id: "users", label: "Users", icon: Users },
  { id: "controls", label: "Account Controls", icon: ShieldCheck },
];

type AdminUser = {
  id: string;
  user_id: string;
  wallet_code: string;
  balance_usd: number;
  status: string;
  is_frozen: boolean;
  full_name: string;
  email: string;
  region: string;
  created_at: string;
  account_age_hours: number;
  account_age_days: number;
  activity_count: number;
};

type WithdrawalItem = {
  id: string;
  reference: string;
  user_id: string;
  wallet_id: string;
  amount: number;
  currency: string;
  amount_usd: number;
  fee: number;
  fee_usd: number;
  method: string;
  upi_id: string | null;
  provider: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  reason: string | null;
  status: string;
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
};

type Overview = Awaited<ReturnType<typeof adminOverview>>;

function Admin() {
  const navigate = useNavigate();
  const check = useServerFn(checkAdminToken);
  const overviewFn = useServerFn(adminOverview);
  const listFn = useServerFn(adminListUsers);
  const listWithdrawalsFn = useServerFn(adminListWithdrawals);
  const [token, setToken] = useState<string | null>(null);
  const [section, setSection] = useState<Section>("overview");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = sessionStorage.getItem("ml_admin_token");
    if (!t) {
      navigate({ to: "/admin-access" });
      return;
    }
    check({ data: { token: t } })
      .then((r) => {
        if (r.ok) setToken(t);
        else {
          sessionStorage.removeItem("ml_admin_token");
          navigate({ to: "/admin-access" });
        }
      })
      .catch(() => navigate({ to: "/admin-access" }));
  }, [check, navigate]);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [oRes, lRes, wRes] = await Promise.allSettled([
        overviewFn({ data: { token } }),
        listFn({ data: { token } }),
        listWithdrawalsFn({ data: { token } }),
      ]);

      if (oRes.status === "fulfilled") setOverview(oRes.value);
      if (lRes.status === "fulfilled") setUsers(lRes.value.users as AdminUser[]);
      if (wRes.status === "fulfilled") setWithdrawals(wRes.value.withdrawals as WithdrawalItem[]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, overviewFn, listFn, listWithdrawalsFn]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function exit() {
    sessionStorage.removeItem("ml_admin_token");
    navigate({ to: "/dashboard" });
  }

  if (!token) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-24 md:flex-row md:pb-8">
      <aside className="hidden w-56 shrink-0 md:block">
        <div className="sticky top-6 space-y-1">
          <p className="px-3 pb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Operations
          </p>
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setSection(n.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                section === n.id
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60",
              )}
            >
              <n.icon className="h-4 w-4" strokeWidth={1.5} />
              {n.label}
            </button>
          ))}
          <button
            onClick={exit}
            className="mt-6 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary/60"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} /> Exit admin
          </button>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => setSection(n.id)}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 text-[10px]",
              section === n.id ? "text-primary" : "text-muted-foreground",
            )}
          >
            <n.icon className="h-5 w-5" strokeWidth={1.5} />
            {n.label.split(" ")[0]}
          </button>
        ))}
        <button
          onClick={exit}
          className="flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] text-muted-foreground"
        >
          <LogOut className="h-5 w-5" strokeWidth={1.5} /> Exit
        </button>
      </nav>

      <main className="min-w-0 flex-1">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Admin</p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {NAV.find((n) => n.id === section)?.label}
            </h1>
          </div>
          <button
            onClick={refresh}
            aria-label="Refresh"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border hover:bg-secondary"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>

        {section === "overview" && (
          <OverviewSection data={overview} users={users} withdrawals={withdrawals} />
        )}
        {section === "withdrawals" && (
          <WithdrawalsSection token={token} withdrawals={withdrawals} onDone={refresh} />
        )}
        {section === "balance" && <BalanceSection token={token} users={users} onDone={refresh} />}
        {section === "users" && <UsersSection users={users} token={token} onDone={refresh} />}
        {section === "controls" && <ControlsSection token={token} users={users} onDone={refresh} />}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function OverviewSection({
  data,
  users,
  withdrawals,
}: {
  data: Overview | null;
  users: AdminUser[];
  withdrawals: WithdrawalItem[];
}) {
  if (!data) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  const recent = [...users].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6);
  const pendingWdCount = withdrawals.filter((w) => w.status === "PROCESSING").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Total users" value={data.totalUsers} />
        <Stat label="New signups (7d)" value={data.newSignups} />
        <Stat label="Total wallet balance" value={formatMoney(data.totalBalanceUsd, "USD")} />
        <Stat label="Total transactions" value={data.totalTransactions} />
        <Stat label="Total withdrawals" value={data.totalWithdrawals ?? withdrawals.length} />
        <Stat label="Pending withdrawals" value={data.pendingWithdrawals ?? pendingWdCount} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Recent users">
          {recent.map((u) => (
            <Row
              key={u.id}
              left={u.full_name}
              sub={u.wallet_code}
              right={formatMoney(Number(u.balance_usd), "USD")}
            />
          ))}
        </Panel>
        <Panel title="Recent transactions">
          {data.recentTransactions.map((t) => (
            <Row
              key={t.id}
              left={`${t.sender_name ?? "Moonlight"} → ${t.recipient_name ?? "Moonlight"}`}
              sub={`${t.kind.replace("_", " ")} · ${new Date(t.created_at).toLocaleString()}`}
              right={formatMoney(Number(t.amount), t.currency)}
            />
          ))}
        </Panel>
      </div>
      <Panel title="Admin activity">
        {data.recentActions.length === 0 && (
          <p className="py-4 text-sm text-muted-foreground">No admin actions yet.</p>
        )}
        {data.recentActions.map((a) => (
          <Row
            key={a.id}
            left={a.action.replace("_", " ")}
            sub={new Date(a.created_at).toLocaleString()}
            right={(a.details as { reason?: string })?.reason ?? ""}
          />
        ))}
      </Panel>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card">
      <h2 className="border-b border-border px-4 py-3 text-sm font-medium">{title}</h2>
      <div className="divide-y divide-border px-4">{children}</div>
    </section>
  );
}

function Row({ left, sub, right }: { left: string; sub?: string; right?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm capitalize">{left}</p>
        {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
      </div>
      {right && <p className="shrink-0 text-sm tabular-nums">{right}</p>}
    </div>
  );
}

function WalletPicker({
  users,
  value,
  onChange,
}: {
  users: AdminUser[];
  value: string;
  onChange: (v: string) => void;
}) {
  const match = users.find((u) => u.wallet_code.toUpperCase() === value.trim().toUpperCase());
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground">Wallet ID</label>
      <Input
        list="admin-wallets"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ML-XXXX-XXXX"
        className="h-12 rounded-xl font-mono uppercase"
      />
      <datalist id="admin-wallets">
        {users.map((u) => (
          <option key={u.id} value={u.wallet_code}>
            {u.full_name} · {u.email}
          </option>
        ))}
      </datalist>
      {match && (
        <p className="text-xs text-muted-foreground">
          {match.full_name} · {formatMoney(Number(match.balance_usd), "USD")} ·{" "}
          {match.is_frozen ? "Frozen" : "Active"}
        </p>
      )}
    </div>
  );
}

function BalanceSection({
  token,
  users,
  onDone,
}: {
  token: string;
  users: AdminUser[];
  onDone: () => void;
}) {
  const add = useServerFn(adminAddBalance);
  const remove = useServerFn(adminRemoveBalance);
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [walletCode, setWalletCode] = useState("");
  const [currency, setCurrency] = useState<(typeof ADMIN_CURRENCIES)[number]>("USD");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!(amt > 0)) {
      toast.error("Enter a valid amount.");
      return;
    }
    if (reason.trim().length < 3) {
      toast.error("Add a short reason.");
      return;
    }
    setBusy(true);
    try {
      const fn = mode === "add" ? add : remove;
      await fn({ data: { token, walletCode: walletCode.trim(), currency, amount: amt, reason } });
      toast.success(mode === "add" ? "Balance added." : "Balance removed.");
      setAmount("");
      setReason("");
      onDone();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="max-w-lg space-y-4 rounded-2xl border border-border bg-card p-5"
    >
      <div className="grid grid-cols-2 gap-1 rounded-full bg-secondary p-1">
        {(["add", "remove"] as const).map((m) => (
          <button
            type="button"
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "h-10 rounded-full text-sm transition-colors",
              mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
            )}
          >
            {m === "add" ? "Add balance" : "Remove balance"}
          </button>
        ))}
      </div>
      <WalletPicker users={users} value={walletCode} onChange={setWalletCode} />
      <div className="grid grid-cols-[1fr_7rem] gap-2">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Amount</label>
          <Input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="h-12 rounded-xl tabular-nums"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as typeof currency)}
            className="h-12 w-full rounded-xl border border-input bg-background px-3 text-sm"
          >
            {ADMIN_CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Reason (logged)</label>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={200}
          placeholder="e.g. Promotional credit"
          className="h-12 rounded-xl"
        />
      </div>
      <button
        disabled={busy || !walletCode || !amount}
        className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-[15px] font-medium text-primary-foreground disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : mode === "add" ? (
          "Add balance"
        ) : (
          "Remove balance"
        )}
      </button>
    </form>
  );
}

function WithdrawalsSection({
  token,
  withdrawals,
  onDone,
}: {
  token: string;
  withdrawals: WithdrawalItem[];
  onDone: () => void;
}) {
  const updateStatusFn = useServerFn(adminUpdateWithdrawalStatus);
  const [filter, setFilter] = useState<string>("ALL");
  const [q, setQ] = useState<string>("");
  const [selectedWd, setSelectedWd] = useState<WithdrawalItem | null>(null);
  type WithdrawalStatus =
    "PROCESSING" | "SUCCESSFUL" | "FAILED" | "ON HOLD" | "UNDER REVIEW" | "CANCELLED";

  const [newStatus, setNewStatus] = useState<WithdrawalStatus>("SUCCESSFUL");
  const [statusReason, setStatusReason] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);

  const statuses = [
    "ALL",
    "PROCESSING",
    "SUCCESSFUL",
    "FAILED",
    "ON HOLD",
    "UNDER REVIEW",
    "CANCELLED",
  ];

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return withdrawals.filter((w) => {
      const matchesFilter = filter === "ALL" || w.status === filter;
      const matchesQuery =
        !s ||
        [w.reference, w.full_name, w.email, w.method, w.upi_id || "", w.provider || ""].some((v) =>
          v.toLowerCase().includes(s),
        );
      return matchesFilter && matchesQuery;
    });
  }, [withdrawals, filter, q]);

  async function handleUpdateStatus() {
    if (!selectedWd) return;
    setBusy(true);
    try {
      await updateStatusFn({
        data: {
          token,
          withdrawalId: selectedWd.id,
          newStatus,
          reason: statusReason.trim() || undefined,
        },
      });
      toast.success(`Withdrawal status updated to ${newStatus}`);
      setSelectedWd(null);
      setStatusReason("");
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reference, name, email or UPI/account..."
            className="h-11 rounded-xl pl-11"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {statuses.map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium shrink-0 transition-colors cursor-pointer",
                filter === st
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-border rounded-2xl border border-border bg-card">
        {filtered.map((w) => (
          <div key={w.id} className="p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-xs bg-secondary px-2.5 py-1 rounded-md">
                  {w.reference}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase",
                    w.status === "PROCESSING" &&
                      "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                    w.status === "SUCCESSFUL" &&
                      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                    (w.status === "FAILED" || w.status === "CANCELLED") &&
                      "bg-destructive/15 text-destructive",
                    (w.status === "ON HOLD" || w.status === "UNDER REVIEW") &&
                      "bg-purple-500/15 text-purple-600 dark:text-purple-400",
                  )}
                >
                  {w.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(w.created_at).toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <p className="text-base font-bold tabular-nums">
                  {formatMoney(Number(w.amount), w.currency)}
                </p>
                <p className="text-[11px] text-muted-foreground tabular-nums">
                  USD {formatMoney(Number(w.amount_usd), "USD")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-secondary/30 p-3 rounded-xl">
              <div>
                <p className="text-muted-foreground">User Name / Email:</p>
                <p className="font-semibold text-foreground truncate">{w.full_name}</p>
                <p className="text-muted-foreground truncate">{w.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Payout Channel:</p>
                <p className="font-semibold text-foreground">{w.method}</p>
                {w.provider && <p className="text-primary font-medium">{w.provider}</p>}
              </div>
              <div>
                <p className="text-muted-foreground">Destination Account / UPI:</p>
                <p className="font-mono font-semibold text-foreground truncate">
                  {w.upi_id || w.email || "N/A"}
                </p>
                {w.reason && (
                  <p className="text-muted-foreground italic truncate">Note: {w.reason}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => {
                  setSelectedWd(w);
                  setNewStatus(
                    w.status === "PROCESSING" ? "SUCCESSFUL" : (w.status as WithdrawalStatus),
                  );
                  setStatusReason(w.reason || "");
                }}
                className="h-9 px-4 rounded-xl border border-border bg-secondary/80 hover:bg-secondary text-xs font-semibold text-foreground transition-colors cursor-pointer"
              >
                Update Status
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            No withdrawal records found.
          </p>
        )}
      </div>

      {selectedWd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 space-y-4 shadow-lg">
            <div className="space-y-1">
              <h3 className="font-semibold text-base">Update Withdrawal Status</h3>
              <p className="text-xs text-muted-foreground">
                Ref:{" "}
                <span className="font-mono font-bold text-foreground">{selectedWd.reference}</span>{" "}
                · {selectedWd.full_name} (
                {formatMoney(Number(selectedWd.amount), selectedWd.currency)})
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Target Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as WithdrawalStatus)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-medium"
              >
                {["PROCESSING", "SUCCESSFUL", "FAILED", "ON HOLD", "UNDER REVIEW", "CANCELLED"].map(
                  (st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ),
                )}
              </select>
            </div>

            {(newStatus === "FAILED" || newStatus === "CANCELLED") && (
              <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-xl">
                ⚠️ Transitioning to FAILED or CANCELLED will automatically refund{" "}
                {formatMoney(Number(selectedWd.amount_usd), "USD")} back to the user's wallet!
              </p>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Reason / Admin Note</label>
              <Input
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="e.g. Verified by bank / Invalid UPI handle"
                className="h-11 rounded-xl text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedWd(null)}
                className="flex-1 h-11 rounded-xl border border-border text-xs font-semibold hover:bg-secondary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={busy}
                onClick={handleUpdateStatus}
                className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Save Status"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UsersSection({
  users,
  token,
  onDone,
}: {
  users: AdminUser[];
  token: string;
  onDone: () => void;
}) {
  const setAgeFn = useServerFn(adminSetAccountAge);
  const [q, setQ] = useState("");
  const [selectedUserForAge, setSelectedUserForAge] = useState<AdminUser | null>(null);
  const [busy, setBusy] = useState(false);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return users
      .filter(
        (u) => !s || [u.full_name, u.email, u.wallet_code].some((v) => v.toLowerCase().includes(s)),
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [users, q]);

  async function handleSetAge(userId: string, hoursOld: number) {
    setBusy(true);
    try {
      const targetDate = new Date(Date.now() - hoursOld * 60 * 60 * 1000).toISOString();
      await setAgeFn({
        data: {
          token,
          userId,
          createdAtISO: targetDate,
        },
      });
      toast.success(
        hoursOld >= 48
          ? "Account age updated to 48+ hours (Withdrawals Unlocked)."
          : "Account age updated to under 48 hours (Withdrawals Locked).",
      );
      setSelectedUserForAge(null);
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email or wallet ID"
          className="h-12 rounded-xl pl-11"
        />
      </div>
      <div className="divide-y divide-border rounded-2xl border border-border bg-card">
        {list.map((u) => {
          const is48hEligible = u.account_age_hours >= 48;
          return (
            <div
              key={u.id}
              className="flex flex-col gap-2 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold">{u.full_name}</p>
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.2 rounded-full",
                      is48hEligible
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                    )}
                  >
                    {is48hEligible ? "48h+ Eligible" : "Locked (<48h)"}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">{u.wallet_code}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:justify-end">
                <span className="rounded-full bg-secondary px-2.5 py-1 font-medium">
                  {u.region}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 font-medium",
                    u.is_frozen
                      ? "bg-destructive/15 text-destructive"
                      : "bg-primary/15 text-primary",
                  )}
                >
                  {u.is_frozen ? "Frozen" : "Active"}
                </span>
                <button
                  onClick={() => setSelectedUserForAge(u)}
                  className="inline-flex items-center gap-1 rounded-full border bg-secondary/60 hover:bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground transition-colors cursor-pointer"
                >
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  {u.account_age_hours}h ({u.account_age_days}d)
                </button>
                <span className="w-full text-right text-sm font-bold tabular-nums sm:w-auto pl-2">
                  {formatMoney(Number(u.balance_usd), "USD")}
                </span>
              </div>
            </div>
          );
        })}
        {list.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">No users found.</p>
        )}
      </div>

      {selectedUserForAge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 space-y-4 shadow-lg">
            <div className="space-y-1">
              <h3 className="font-semibold text-base">Adjust Account Creation Date</h3>
              <p className="text-xs text-muted-foreground">
                Target User:{" "}
                <span className="font-semibold text-foreground">
                  {selectedUserForAge.full_name}
                </span>{" "}
                ({selectedUserForAge.email})
              </p>
              <p className="text-xs text-muted-foreground">
                Current Age:{" "}
                <span className="font-bold text-foreground">
                  {selectedUserForAge.account_age_hours} hours
                </span>
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                disabled={busy}
                onClick={() => handleSetAge(selectedUserForAge.user_id, 72)}
                className="w-full h-11 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-colors cursor-pointer text-left px-3.5 flex items-center justify-between"
              >
                <span>Unlock Withdrawals (Set Age to 72 hours)</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </button>
              <button
                disabled={busy}
                onClick={() => handleSetAge(selectedUserForAge.user_id, 1)}
                className="w-full h-11 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-bold transition-colors cursor-pointer text-left px-3.5 flex items-center justify-between"
              >
                <span>Lock Withdrawals (Reset Age to 1 hour old)</span>
                <Clock className="h-4 w-4 text-amber-500" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSelectedUserForAge(null)}
              className="w-full h-10 rounded-xl border border-border text-xs font-semibold hover:bg-secondary transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ControlsSection({
  token,
  users,
  onDone,
}: {
  token: string;
  users: AdminUser[];
  onDone: () => void;
}) {
  const freezeFn = useServerFn(adminSetFreeze);
  const regionFn = useServerFn(adminSetRegion);
  const [walletCode, setWalletCode] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const user = users.find((u) => u.wallet_code.toUpperCase() === walletCode.trim().toUpperCase());

  async function run(fn: () => Promise<unknown>, msg: string) {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-lg space-y-4 rounded-2xl border border-border bg-card p-5">
      <WalletPicker users={users} value={walletCode} onChange={setWalletCode} />
      {user && (
        <>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Reason (optional)</label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              className="h-12 rounded-xl"
            />
          </div>
          <button
            disabled={busy}
            onClick={() =>
              run(
                () =>
                  freezeFn({
                    data: { token, walletCode: user.wallet_code, freeze: !user.is_frozen, reason },
                  }),
                user.is_frozen ? "Wallet unfrozen." : "Wallet frozen.",
              )
            }
            className={cn(
              "flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-medium disabled:opacity-50",
              user.is_frozen
                ? "bg-primary text-primary-foreground"
                : "bg-destructive text-destructive-foreground",
            )}
          >
            {user.is_frozen ? <Sun className="h-4 w-4" /> : <Snowflake className="h-4 w-4" />}
            {user.is_frozen ? "Unfreeze wallet" : "Freeze wallet"}
          </button>
          <div className="space-y-1.5 pt-2">
            <label className="text-xs text-muted-foreground">Account region</label>
            <div className="grid grid-cols-2 gap-2">
              {REGIONS.map((r) => (
                <button
                  key={r}
                  disabled={busy || user.region === r}
                  onClick={() =>
                    run(
                      () => regionFn({ data: { token, walletCode: user.wallet_code, region: r } }),
                      `Region set to ${r}.`,
                    )
                  }
                  className={cn(
                    "h-11 rounded-xl border text-sm capitalize",
                    user.region === r
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-secondary",
                  )}
                >
                  {r.toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
