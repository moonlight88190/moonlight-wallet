import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
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
  List,
  Activity,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ArrowDownLeft,
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
  adminListTransactions,
  adminGlobalSearch,
  adminListAuditLogs,
} from "@/lib/admin.functions";
import { formatMoney } from "@/lib/currency";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Operations — Moonlight Wallet" },
      { name: "description", content: "Moonlight internal operations and ledger suite." },
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
const REGIONS = ["INDIA", "EUROPE", "PHILIPPINES", "GLOBAL"] as const;
type Section =
  | "overview"
  | "withdrawals"
  | "transactions"
  | "balance"
  | "users"
  | "controls"
  | "search"
  | "activity";

const NAV: { id: Section; label: string; icon: typeof LayoutGrid }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "withdrawals", label: "Withdrawals", icon: ArrowUpRight },
  { id: "transactions", label: "Transactions", icon: List },
  { id: "balance", label: "Balance Control", icon: Wallet },
  { id: "users", label: "Users", icon: Users },
  { id: "controls", label: "Account Controls", icon: ShieldCheck },
  { id: "search", label: "Global Search", icon: Search },
  { id: "activity", label: "Activity", icon: Activity },
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
  is_admin_region?: boolean;
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

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-1 overflow-x-auto border-t border-border bg-background/95 px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden scrollbar-none">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => setSection(n.id)}
            className={cn(
              "flex shrink-0 min-h-[46px] flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-medium transition-colors cursor-pointer",
              section === n.id
                ? "bg-secondary text-primary font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <n.icon className="h-4 w-4" strokeWidth={1.5} />
            <span className="whitespace-nowrap">{n.label}</span>
          </button>
        ))}
        <button
          onClick={exit}
          className="flex shrink-0 min-h-[46px] flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl text-[10px] text-muted-foreground hover:text-destructive cursor-pointer"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.5} />
          <span>Exit</span>
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
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border hover:bg-secondary cursor-pointer"
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
        {section === "transactions" && <TransactionsSection token={token} />}
        {section === "balance" && <BalanceSection token={token} users={users} onDone={refresh} />}
        {section === "users" && <UsersSection users={users} token={token} onDone={refresh} />}
        {section === "controls" && <ControlsSection token={token} users={users} onDone={refresh} />}
        {section === "search" && (
          <GlobalSearchSection
            token={token}
            onSelectUser={() => {
              setSection("balance");
            }}
          />
        )}
        {section === "activity" && <ActivitySection token={token} />}
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
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 font-medium text-xs",
                    u.is_admin_region
                      ? "border border-primary/30 bg-primary/10 text-primary"
                      : "bg-secondary text-secondary-foreground",
                  )}
                >
                  {u.region || "INDIA"}
                  {u.is_admin_region ? " • Admin Override" : ""}
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
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground">Account region</label>
              <span className="text-[11px] font-mono text-muted-foreground">
                Current: <span className="font-semibold text-foreground">{user.region || "INDIA"}</span>
                {user.is_admin_region ? " (Admin Override)" : " (Default: India)"}
              </span>
            </div>
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
                    "h-11 rounded-xl border text-sm capitalize flex items-center justify-center gap-1.5 font-medium cursor-pointer transition-all",
                    user.region === r
                      ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/30"
                      : "border-border hover:bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                >
                  {r === "INDIA" && "🇮🇳 "}
                  {r === "EUROPE" && "🇪🇺 "}
                  {r === "PHILIPPINES" && "🇵🇭 "}
                  {r === "GLOBAL" && "🌐 "}
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

/* ─── TRANSACTIONS SECTION ─── */

type AdminTxItem = {
  id: string;
  reference: string;
  kind: string;
  status: string;
  amount: number;
  currency: string;
  amount_usd: number;
  fee?: number | null;
  method?: string | null;
  sender_name?: string | null;
  recipient_name?: string | null;
  note?: string | null;
  created_at: string;
};

function TransactionsSection({ token }: { token: string }) {
  const listFn = useServerFn(adminListTransactions);
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ transactions: AdminTxItem[]; count: number }>({
    transactions: [],
    count: 0,
  });

  const fetchTxs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await listFn({
        data: {
          token,
          kind: kind === "all" ? undefined : kind,
          status: status === "all" ? undefined : status,
          search: search.trim() || undefined,
          page,
          pageSize: 20,
        },
      });
      setData(res);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, kind, status, search, page, listFn]);

  useEffect(() => {
    fetchTxs();
  }, [fetchTxs]);

  const totalPages = Math.max(1, Math.ceil(data.count / 20));

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {["all", "transfer", "withdrawal", "admin_credit", "redemption"].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setKind(k);
                setPage(1);
              }}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors cursor-pointer",
                kind === k
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {k.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search ref, note, name..."
            className="h-9 w-full sm:w-48 text-xs rounded-xl"
          />
          <button
            type="button"
            onClick={fetchTxs}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border/50">
        {loading && data.transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
            Loading transactions...
          </div>
        ) : data.transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No transactions matched the criteria.
          </div>
        ) : (
          data.transactions.map((tx) => {
            const isWd = tx.kind === "withdrawal";
            const dateStr = new Date(tx.created_at).toLocaleString(undefined, {
              dateStyle: "short",
              timeStyle: "short",
            });
            const statusUpper = (tx.status || "COMPLETED").toUpperCase();

            return (
              <div
                key={tx.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-secondary/20 transition-colors"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground truncate">
                      {tx.sender_name || tx.recipient_name || tx.method || "Transaction"}
                    </span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase",
                        statusUpper === "COMPLETED" || statusUpper === "SUCCESSFUL"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : statusUpper === "FAILED" || statusUpper === "CANCELLED"
                            ? "bg-rose-500/10 text-rose-400"
                            : "bg-blue-500/10 text-blue-400",
                      )}
                    >
                      {statusUpper}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase bg-secondary/80 px-2 py-0.5 rounded-md font-mono">
                      {tx.kind}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span>{dateStr}</span>
                    <span>·</span>
                    <span className="font-mono">{tx.reference}</span>
                    {tx.note && (
                      <>
                        <span>·</span>
                        <span className="truncate max-w-[200px] italic">{tx.note}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="text-right">
                    <div className="font-mono font-bold text-sm text-foreground">
                      {formatMoney(Number(tx.amount), tx.currency)}
                    </div>
                    {tx.currency !== "USD" && (
                      <div className="font-mono text-[10px] text-muted-foreground">
                        ~{formatMoney(Number(tx.amount_usd), "USD")}
                      </div>
                    )}
                  </div>

                  <Link
                    to={isWd ? "/withdrawals/$id" : "/transactions/$id"}
                    params={{ id: tx.id }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-accent text-xs font-medium cursor-pointer"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span>
            Page {page} of {totalPages} ({data.count} total)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-border bg-card disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-border bg-card disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── GLOBAL SEARCH SECTION ─── */

type GlobalSearchUser = {
  id: string;
  full_name?: string;
  email?: string;
  wallet_code: string;
  balance_usd?: number;
};

type GlobalSearchWithdrawal = {
  id: string;
  reference: string;
  full_name: string;
  method: string;
  upi_id?: string | null;
  status: string;
  amount: number;
  currency: string;
};

type GlobalSearchTransaction = {
  id: string;
  reference: string;
  kind: string;
  sender_name?: string | null;
  recipient_name?: string | null;
  note?: string | null;
  amount: number;
  currency: string;
};

type AdminActivityItem = {
  id: string | number | undefined;
  type: "audit" | "action";
  title: string;
  user_id: string | null | undefined;
  details: unknown;
  created_at: string;
};

function GlobalSearchSection({
  token,
  onSelectUser,
}: {
  token: string;
  onSelectUser: (walletCode: string) => void;
}) {
  const searchFn = useServerFn(adminGlobalSearch);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    users: GlobalSearchUser[];
    withdrawals: GlobalSearchWithdrawal[];
    transactions: GlobalSearchTransaction[];
  } | null>(null);

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    try {
      const res = await searchFn({ data: { token, query: q } });
      setResults(
        res as {
          users: GlobalSearchUser[];
          withdrawals: GlobalSearchWithdrawal[];
          transactions: GlobalSearchTransaction[];
        },
      );
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, wallet ID, withdrawal ref, UPI ID..."
            className="pl-9 h-11 rounded-xl text-xs sm:text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </button>
      </form>

      {results && (
        <div className="space-y-6">
          {/* Users Results */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Users ({results.users.length})
            </h2>
            {results.users.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No users matched.</p>
            ) : (
              <div className="rounded-2xl border border-border bg-card divide-y divide-border/50 overflow-hidden">
                {results.users.map((u) => (
                  <div key={u.id} className="p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-foreground">{u.full_name || "N/A"}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {u.email} · {u.wallet_code}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-foreground">
                        {formatMoney(Number(u.balance_usd || 0), "USD")}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectUser(u.wallet_code)}
                        className="px-2.5 py-1 rounded-lg bg-secondary text-primary font-medium hover:bg-accent text-xs cursor-pointer"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Withdrawals Results */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Withdrawals ({results.withdrawals.length})
            </h2>
            {results.withdrawals.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No withdrawals matched.</p>
            ) : (
              <div className="rounded-2xl border border-border bg-card divide-y divide-border/50 overflow-hidden">
                {results.withdrawals.map((w) => (
                  <div key={w.id} className="p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-foreground">
                        {w.full_name} · {w.reference}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {w.method} {w.upi_id ? `(${w.upi_id})` : ""} · {w.status}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-foreground">
                        {formatMoney(Number(w.amount), w.currency)}
                      </span>
                      <Link
                        to="/withdrawals/$id"
                        params={{ id: w.id }}
                        className="px-2.5 py-1 rounded-lg bg-secondary text-foreground hover:bg-accent text-xs font-medium cursor-pointer"
                      >
                        Inspect
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transactions Results */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Transactions ({results.transactions.length})
            </h2>
            {results.transactions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No transactions matched.</p>
            ) : (
              <div className="rounded-2xl border border-border bg-card divide-y divide-border/50 overflow-hidden">
                {results.transactions.map((t) => (
                  <div key={t.id} className="p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-foreground">
                        {t.reference} · {t.kind}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {t.sender_name || t.recipient_name || t.note || "Transfer"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-foreground">
                        {formatMoney(Number(t.amount), t.currency)}
                      </span>
                      <Link
                        to={t.kind === "withdrawal" ? "/withdrawals/$id" : "/transactions/$id"}
                        params={{ id: t.id }}
                        className="px-2.5 py-1 rounded-lg bg-secondary text-foreground hover:bg-accent text-xs font-medium cursor-pointer"
                      >
                        Inspect
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── ACTIVITY & AUDIT LOG SECTION ─── */

function ActivitySection({ token }: { token: string }) {
  const auditFn = useServerFn(adminListAuditLogs);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AdminActivityItem[]>([]);

  const loadLogs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await auditFn({ data: { token, limit: 100 } });
      const combined: AdminActivityItem[] = [
        ...(res.auditLogs || []).map(
          (l: {
            id?: number | string;
            event: string;
            user_id?: string | null;
            details?: unknown;
            created_at: string;
          }) => ({
            id: l.id,
            type: "audit" as const,
            title: l.event,
            user_id: l.user_id,
            details: l.details,
            created_at: l.created_at,
          }),
        ),
        ...(res.adminActions || []).map(
          (a: {
            id?: string | number;
            action: string;
            actor_user_id?: string | null;
            details?: unknown;
            created_at: string;
          }) => ({
            id: a.id,
            type: "action" as const,
            title: a.action,
            user_id: a.actor_user_id,
            details: a.details,
            created_at: a.created_at,
          }),
        ),
      ].sort((a, b) => b.created_at.localeCompare(a.created_at));
      setItems(combined);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, auditFn]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Real-time platform audit log and operational security events.
        </p>
        <button
          type="button"
          onClick={loadLogs}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card hover:bg-secondary cursor-pointer"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card divide-y divide-border/50 overflow-hidden">
        {loading && items.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
            Loading audit stream...
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No audit records found.
          </div>
        ) : (
          items.map((item, idx) => {
            const dateStr = new Date(item.created_at).toLocaleString(undefined, {
              dateStyle: "short",
              timeStyle: "medium",
            });

            return (
              <div key={item.id || idx} className="p-4 space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase font-mono",
                        item.type === "action"
                          ? "bg-purple-500/10 text-purple-400"
                          : "bg-blue-500/10 text-blue-400",
                      )}
                    >
                      {item.title}
                    </span>
                    {item.user_id && (
                      <span className="text-[11px] font-mono text-muted-foreground">
                        UID: {item.user_id.substring(0, 8)}...
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground">{dateStr}</span>
                </div>

                {item.details != null && (
                  <pre className="p-2 rounded-xl bg-secondary/50 font-mono text-[10px] text-muted-foreground overflow-x-auto whitespace-pre-wrap max-h-32">
                    {typeof item.details === "string"
                      ? item.details
                      : JSON.stringify(item.details, null, 2)}
                  </pre>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
