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
  Globe,
  MessageSquare,
  Plus,
  FileText,
  CreditCard,
  History,
  Mail,
  Copy,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmailTemplateButton } from "@/components/EmailTemplateModal";
import { supabase } from "@/integrations/supabase/client";
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
  adminUpdateWithdrawalNote,
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

export const COUNTRY_REGION_OPTIONS = [
  {
    region: "INDIA" as const,
    countryCode: "IN",
    preferredCurrency: "INR",
    flag: "🇮🇳",
    label: "India",
    methods: "UPI, IMPS, NetBanking",
  },
  {
    region: "EUROPE" as const,
    countryCode: "DE",
    preferredCurrency: "EUR",
    flag: "🇩🇪",
    label: "Germany / Europe",
    methods: "SEPA Instant, IBAN Bank Transfer",
  },
  {
    region: "EUROPE" as const,
    countryCode: "FR",
    preferredCurrency: "EUR",
    flag: "🇫🇷",
    label: "France / Eurozone",
    methods: "SEPA Instant, Eurozone Rails",
  },
  {
    region: "GLOBAL" as const,
    countryCode: "GB",
    preferredCurrency: "GBP",
    flag: "🇬🇧",
    label: "United Kingdom",
    methods: "Faster Payments, Sort Code",
  },
  {
    region: "GLOBAL" as const,
    countryCode: "US",
    preferredCurrency: "USD",
    flag: "🇺🇸",
    label: "United States",
    methods: "ACH, Fedwire, Domestic Routing",
  },
  {
    region: "PHILIPPINES" as const,
    countryCode: "PH",
    preferredCurrency: "PHP",
    flag: "🇵🇭",
    label: "Philippines",
    methods: "GCash, Maya, InstaPay",
  },
  {
    region: "GLOBAL" as const,
    countryCode: "GL",
    preferredCurrency: "USD",
    flag: "🌐",
    label: "Global / International",
    methods: "SWIFT, Multi-currency Wire",
  },
] as const;

type Section =
  | "overview"
  | "withdrawals"
  | "transactions"
  | "balance"
  | "users"
  | "controls"
  | "search"
  | "activity"
  | "emails";

const NAV: { id: Section; label: string; icon: typeof LayoutGrid }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "withdrawals", label: "Withdrawals", icon: ArrowUpRight },
  { id: "users", label: "Users & Wallets", icon: Users },
  { id: "balance", label: "Balance Control", icon: Wallet },
  { id: "transactions", label: "Transactions", icon: List },
  { id: "controls", label: "Account Controls", icon: ShieldCheck },
  { id: "search", label: "Global Search", icon: Search },
  { id: "activity", label: "Security & Audit", icon: Activity },
  { id: "emails", label: "Email Templates", icon: Mail },
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
  country_code?: string;
  preferred_currency?: string;
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

  const pendingWdCount = withdrawals.filter((w) => w.status === "PROCESSING").length;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-20 animate-fade-in">
      {/* Top Admin Master Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Operational Master Terminal</span>
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Security Clearance Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Moonlight Control Center
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Institutional management of wallets, balances, clearing rails, payouts, and compliance logs.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-card hover:bg-secondary text-xs font-semibold text-foreground transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            <span>Refresh</span>
          </button>
          <button
            onClick={exit}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-destructive/20 bg-destructive/10 hover:bg-destructive/20 text-xs font-semibold text-destructive transition-colors cursor-pointer shadow-xs"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Exit Terminal</span>
          </button>
        </div>
      </div>

      {/* Primary Top Tab Navigation Bar */}
      <div className="border-b border-border/60 pb-1">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {NAV.map((n) => {
            const Icon = n.icon;
            const isActive = section === n.id;
            const badgeCount =
              n.id === "withdrawals"
                ? pendingWdCount
                : n.id === "users"
                  ? users.length
                  : undefined;

            return (
              <button
                key={n.id}
                onClick={() => setSection(n.id)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer touch-manipulation whitespace-nowrap shrink-0",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card/80 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary/70",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={isActive ? 2 : 1.75} />
                <span>{n.label}</span>
                {badgeCount !== undefined && badgeCount > 0 && (
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none",
                      isActive
                        ? "bg-white/25 text-white"
                        : n.id === "withdrawals"
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-secondary text-foreground",
                    )}
                  >
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab View */}
      <main className="w-full">
        {section === "overview" && (
          <OverviewSection
            data={overview}
            users={users}
            withdrawals={withdrawals}
            onSelectTab={setSection}
          />
        )}
        {section === "withdrawals" && (
          <WithdrawalsSection token={token} withdrawals={withdrawals} onDone={refresh} />
        )}
        {section === "transactions" && <TransactionsSection token={token} />}
        {section === "balance" && <BalanceSection token={token} users={users} onDone={refresh} />}
        {section === "users" && <UsersSection users={users} token={token} onDone={refresh} />}
        {section === "controls" && (
          <ControlsSection
            token={token}
            users={users}
            onDone={refresh}
            onSelectTab={setSection}
          />
        )}
        {section === "search" && (
          <GlobalSearchSection
            token={token}
            onSelectUser={() => {
              setSection("balance");
            }}
          />
        )}
        {section === "activity" && <ActivitySection token={token} />}
        {section === "emails" && <EmailTemplatesSection />}
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
  onSelectTab,
}: {
  data: Overview | null;
  users: AdminUser[];
  withdrawals: WithdrawalItem[];
  onSelectTab?: (s: Section) => void;
}) {
  if (!data) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  const recent = [...users].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6);
  const pendingWdCount = withdrawals.filter((w) => w.status === "PROCESSING").length;

  return (
    <div className="space-y-6">
      {/* Quick Launchpad */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onSelectTab?.("balance")}
          className="p-3.5 rounded-2xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all text-left flex items-center justify-between group cursor-pointer shadow-xs"
        >
          <div>
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Balance Console</p>
            <p className="text-xs text-foreground font-semibold mt-0.5">+ Credit / − Debit</p>
          </div>
          <Wallet className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
        </button>

        <button
          onClick={() => onSelectTab?.("withdrawals")}
          className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-all text-left flex items-center justify-between group cursor-pointer shadow-xs"
        >
          <div>
            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending Payouts</p>
            <p className="text-xs text-foreground font-semibold mt-0.5">{pendingWdCount} Awaiting Review</p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
        </button>

        <button
          onClick={() => onSelectTab?.("controls")}
          className="p-3.5 rounded-2xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 transition-all text-left flex items-center justify-between group cursor-pointer shadow-xs"
        >
          <div>
            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Account Policies</p>
            <p className="text-xs text-foreground font-semibold mt-0.5">Regions &amp; Freeze</p>
          </div>
          <ShieldCheck className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
        </button>

        <button
          onClick={() => onSelectTab?.("users")}
          className="p-3.5 rounded-2xl border border-border bg-card hover:bg-secondary/70 transition-all text-left flex items-center justify-between group cursor-pointer shadow-xs"
        >
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">User Directory</p>
            <p className="text-xs text-foreground font-semibold mt-0.5">{users.length} Registered</p>
          </div>
          <Users className="h-4 w-4 text-muted-foreground group-hover:scale-110 transition-transform" />
        </button>
      </div>

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
            <div key={t.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium capitalize text-foreground">
                  {`${t.sender_name ?? "Moonlight"} → ${t.recipient_name ?? "Moonlight"}`}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {`${t.kind.replace("_", " ")} · ${new Date(t.created_at).toLocaleString()}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {formatMoney(Number(t.amount), t.currency)}
                </span>
                <EmailTemplateButton
                  data={{
                    type: t.kind === "withdrawal" ? "withdrawal" : "money_received",
                    recipientName: t.recipient_name || "Valued Customer",
                    senderName: t.sender_name || "Moonlight Financial",
                    amount: t.amount,
                    currency: t.currency,
                    reference: t.reference,
                    date: new Date(t.created_at).toLocaleString(),
                    status: "COMPLETED",
                  }}
                  variant="compact"
                  label="Email"
                />
              </div>
            </div>
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
      {/* Quick Preset Amounts */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          Quick Preset Amounts
        </label>
        <div className="flex flex-wrap gap-1.5">
          {["10", "50", "100", "500", "1000", "5000"].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(preset)}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-border bg-secondary/60 hover:bg-secondary text-foreground transition-colors cursor-pointer"
            >
              +{preset}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Reason (logged in audit trail)</label>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={200}
          placeholder="e.g. Promotional credit"
          className="h-12 rounded-xl"
        />
        {/* Quick Reason Chips */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {["Promotional Credit", "Manual Settlement Correction", "KYC Clearance Reward", "Account Balance Adjustment"].map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setReason(chip)}
              className="text-[10px] rounded-lg border border-border bg-secondary/60 hover:bg-secondary px-2 py-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              + {chip}
            </button>
          ))}
        </div>
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
  const updateNoteFn = useServerFn(adminUpdateWithdrawalNote);
  const [filter, setFilter] = useState<string>("ALL");
  const [q, setQ] = useState<string>("");
  const [selectedWd, setSelectedWd] = useState<WithdrawalItem | null>(null);
  type WithdrawalStatus =
    | "PROCESSING"
    | "SUCCESSFUL"
    | "FAILED"
    | "ON HOLD"
    | "UNDER REVIEW"
    | "CANCELLED";

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
        [
          w.reference,
          w.full_name,
          w.email,
          w.method,
          w.upi_id || "",
          w.provider || "",
          w.reason || "",
        ].some((v) => v.toLowerCase().includes(s));
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
      toast.success(`Withdrawal status updated to ${newStatus} & note saved.`);
      setSelectedWd(null);
      setStatusReason("");
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdateNoteOnly() {
    if (!selectedWd) return;
    setBusy(true);
    try {
      await updateNoteFn({
        data: {
          token,
          withdrawalId: selectedWd.id,
          note: statusReason.trim(),
        },
      });
      toast.success("Moonlight custom note saved to user receipt.");
      setSelectedWd(null);
      setStatusReason("");
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleQuickStatus(w: WithdrawalItem, status: WithdrawalStatus) {
    setBusy(true);
    try {
      await updateStatusFn({
        data: {
          token,
          withdrawalId: w.id,
          newStatus: status,
          reason: w.reason || `Marked as ${status} via direct admin action.`,
        },
      });
      toast.success(`Withdrawal ${w.reference} marked as ${status}.`);
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
            placeholder="Search reference, name, email, UPI, or notes..."
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
                <p className="text-muted-foreground">Beneficiary / Email:</p>
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
              </div>
            </div>

            {/* Custom Moonlight Note on User Receipt */}
            {w.reason && (
              <div className="flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/8 p-3 text-xs">
                <MessageSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-primary block text-[11px] uppercase tracking-wider">
                    Moonlight Note on User Receipt:
                  </span>
                  <p className="text-foreground leading-relaxed mt-0.5">{w.reason}</p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40">
              <div className="flex items-center gap-1.5 flex-wrap">
                {w.status === "PROCESSING" && (
                  <>
                    <button
                      disabled={busy}
                      onClick={() => handleQuickStatus(w, "SUCCESSFUL")}
                      className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Approve</span>
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => handleQuickStatus(w, "UNDER REVIEW")}
                      className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-[11px] font-semibold text-purple-600 dark:text-purple-400 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Clock className="h-3 w-3" />
                      <span>Review</span>
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => handleQuickStatus(w, "ON HOLD")}
                      className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-[11px] font-semibold text-amber-600 dark:text-amber-400 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <AlertCircle className="h-3 w-3" />
                      <span>Hold</span>
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setSelectedWd(w);
                    setNewStatus(
                      w.status === "PROCESSING" ? "SUCCESSFUL" : (w.status as WithdrawalStatus),
                    );
                    setStatusReason(w.reason || "");
                  }}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-primary/40 bg-primary/10 hover:bg-primary/20 text-xs font-semibold text-primary transition-colors cursor-pointer shadow-2xs"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Modify Status &amp; Note</span>
                </button>

                <EmailTemplateButton
                  data={{
                    type:
                      w.status === "ON HOLD" || w.status === "UNDER REVIEW"
                        ? "kyc_hold"
                        : "withdrawal",
                    recipientName: w.full_name || w.email || "Valued Customer",
                    senderName: "Moonlight Settlement Desk",
                    amount: w.amount,
                    currency: w.currency,
                    reference: w.reference,
                    date: new Date(w.created_at).toLocaleString(),
                    status: w.status,
                    method: w.method || "Payout Rail",
                  }}
                  label="Email Template"
                />

                <Link
                  to="/withdrawals/$id"
                  params={{ id: w.id }}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-secondary/60 hover:bg-secondary text-xs font-medium text-foreground transition-colors cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Inspect</span>
                </Link>
              </div>
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
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="space-y-1">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span>Update Withdrawal Status &amp; Add Custom Note</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Ref:{" "}
                <span className="font-mono font-bold text-foreground">{selectedWd.reference}</span>{" "}
                · {selectedWd.full_name} (
                {formatMoney(Number(selectedWd.amount), selectedWd.currency)})
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Target Withdrawal Status</label>
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
              <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                ⚠️ Transitioning to FAILED or CANCELLED will automatically refund{" "}
                {formatMoney(Number(selectedWd.amount_usd), "USD")} back to the user's wallet balance!
              </p>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-primary" />
                  <span>Custom Note by Moonlight (Visible on User Receipt)</span>
                </label>
                <span className="text-[10px] text-muted-foreground">Live on receipt</span>
              </div>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Write custom instructions, compliance update, or payout clearance message..."
                rows={3}
                maxLength={300}
                className="w-full rounded-xl border border-input bg-background p-3 text-xs leading-relaxed focus:outline-hidden focus:ring-1 focus:ring-ring font-sans"
              />

              {/* Quick Template Buttons */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider block">
                  Quick Note Templates (Tap to insert):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {[
                    "Verified and settled via banking rail.",
                    "Interbank clearing review in progress. Delivery window: 2–5 business days (concludes Day 5).",
                    "Mandatory KYC verification required: Please email Government ID & Bank Statement to moonlightwealthmanagement@gmail.com.",
                    "KYC verified and approved. Payout scheduled for immediate reflection.",
                    "Destination rejected transfer. Amount refunded to wallet balance.",
                  ].map((tmpl) => (
                    <button
                      key={tmpl}
                      type="button"
                      onClick={() => setStatusReason(tmpl)}
                      className="text-[10px] rounded-lg border border-border/80 bg-secondary/60 hover:bg-secondary p-1.5 text-muted-foreground hover:text-foreground text-left transition-colors cursor-pointer"
                    >
                      + {tmpl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border/40">
              <button
                type="button"
                onClick={() => setSelectedWd(null)}
                className="h-11 px-4 rounded-xl border border-border text-xs font-semibold hover:bg-secondary transition-colors cursor-pointer sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || !statusReason.trim()}
                onClick={handleUpdateNoteOnly}
                className="flex-1 h-11 rounded-xl border border-primary/50 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Save Note Only"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleUpdateStatus}
                className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-soft"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Save Status & Note"}
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
  const addBalanceFn = useServerFn(adminAddBalance);
  const removeBalanceFn = useServerFn(adminRemoveBalance);
  const setFreezeFn = useServerFn(adminSetFreeze);
  const setRegionFn = useServerFn(adminSetRegion);
  const setAgeFn = useServerFn(adminSetAccountAge);

  const [q, setQ] = useState("");
  const [selectedUserForBalance, setSelectedUserForBalance] = useState<AdminUser | null>(null);
  const [balanceMode, setBalanceMode] = useState<"add" | "remove">("add");
  const [balanceCurrency, setBalanceCurrency] = useState<(typeof ADMIN_CURRENCIES)[number]>("USD");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceReason, setBalanceReason] = useState("");

  const [selectedUserForRegion, setSelectedUserForRegion] = useState<AdminUser | null>(null);
  const [selectedUserForAge, setSelectedUserForAge] = useState<AdminUser | null>(null);
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<AdminUser | null>(null);
  const [userHistoryLoading, setUserHistoryLoading] = useState(false);
  const [userHistoryData, setUserHistoryData] = useState<{
    transactions: any[];
    withdrawals: any[];
  }>({
    transactions: [],
    withdrawals: [],
  });
  const [busy, setBusy] = useState(false);

  async function handleOpenHistory(user: AdminUser) {
    setSelectedUserForHistory(user);
    setUserHistoryLoading(true);
    try {
      const [txRes, wdRes] = await Promise.all([
        supabase
          .from("transactions")
          .select("*")
          .or(`sender_wallet_id.eq.${user.id},recipient_wallet_id.eq.${user.id}`)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("withdrawals")
          .select("*")
          .eq("user_id", user.user_id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      setUserHistoryData({
        transactions: txRes.data || [],
        withdrawals: wdRes.data || [],
      });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUserHistoryLoading(false);
    }
  }

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return users
      .filter(
        (u) =>
          !s ||
          [u.full_name, u.email, u.wallet_code, u.region, u.country_code || ""].some((v) =>
            v.toLowerCase().includes(s),
          ),
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [users, q]);

  async function handleToggleFreeze(user: AdminUser) {
    setBusy(true);
    try {
      await setFreezeFn({
        data: {
          token,
          walletCode: user.wallet_code,
          freeze: !user.is_frozen,
          reason: user.is_frozen ? "Admin account reactivated" : "Admin security freeze",
        },
      });
      toast.success(user.is_frozen ? `Wallet ${user.wallet_code} unfrozen.` : `Wallet ${user.wallet_code} frozen.`);
      onDone();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAdjustBalance(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserForBalance) return;
    const amt = Number(balanceAmount);
    if (!(amt > 0)) {
      toast.error("Enter a valid positive amount.");
      return;
    }
    if (balanceReason.trim().length < 3) {
      toast.error("Please add a reason (min 3 characters).");
      return;
    }
    setBusy(true);
    try {
      const fn = balanceMode === "add" ? addBalanceFn : removeBalanceFn;
      await fn({
        data: {
          token,
          walletCode: selectedUserForBalance.wallet_code,
          currency: balanceCurrency,
          amount: amt,
          reason: balanceReason.trim(),
        },
      });
      toast.success(
        balanceMode === "add"
          ? `Credited ${formatMoney(amt, balanceCurrency)} to ${selectedUserForBalance.full_name}.`
          : `Debited ${formatMoney(amt, balanceCurrency)} from ${selectedUserForBalance.full_name}.`,
      );
      setSelectedUserForBalance(null);
      setBalanceAmount("");
      setBalanceReason("");
      onDone();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSetRegion(user: AdminUser, opt: (typeof COUNTRY_REGION_OPTIONS)[number]) {
    setBusy(true);
    try {
      await setRegionFn({
        data: {
          token,
          walletCode: user.wallet_code,
          region: opt.region,
          countryCode: opt.countryCode,
          preferredCurrency: opt.preferredCurrency,
        },
      });
      toast.success(`Country set to ${opt.label} (${opt.countryCode}) with currency ${opt.preferredCurrency}.`);
      setSelectedUserForRegion(null);
      onDone();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

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
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, wallet ID, or country..."
            className="h-12 rounded-xl pl-11"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono shrink-0 px-1">
          <span>{list.length} users</span>
          <span>·</span>
          <span className="text-destructive font-semibold">{users.filter((u) => u.is_frozen).length} frozen</span>
          <span>·</span>
          <span className="text-emerald-500 font-semibold">{users.filter((u) => u.account_age_hours >= 48).length} eligible</span>
        </div>
      </div>

      {/* Users Card List */}
      <div className="divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden">
        {list.map((u) => {
          const is48hEligible = u.account_age_hours >= 48;
          const countryOpt = COUNTRY_REGION_OPTIONS.find(
            (c) => c.countryCode === u.country_code || (c.region === u.region && c.countryCode === "IN"),
          );
          const flag = countryOpt?.flag || (u.region === "EUROPE" ? "🇪🇺" : u.region === "PHILIPPINES" ? "🇵🇭" : "🇮🇳");

          return (
            <div key={u.id} className="p-4 sm:p-5 flex flex-col gap-3">
              {/* Top row: User Identity, Status & Balance */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-foreground">{u.full_name}</p>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                        u.is_frozen
                          ? "bg-destructive/15 text-destructive border border-destructive/20"
                          : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
                      )}
                    >
                      {u.is_frozen ? "Frozen" : "Active"}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                        is48hEligible
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                      )}
                    >
                      {is48hEligible ? "48h+ Eligible" : "Locked (<48h)"}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    <span className="truncate">{u.email}</span>
                    <span>·</span>
                    <span className="font-mono text-foreground font-semibold">{u.wallet_code}</span>
                  </div>
                </div>

                {/* Balance & Country display */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="text-left sm:text-right">
                    <div className="text-base font-bold tabular-nums text-foreground">
                      {formatMoney(Number(u.balance_usd), "USD")}
                    </div>
                    <div className="flex items-center sm:justify-end gap-1 text-xs text-muted-foreground">
                      <span>{flag}</span>
                      <span className="font-semibold text-foreground">
                        {u.country_code || (u.region === "EUROPE" ? "DE" : u.region === "PHILIPPINES" ? "PH" : "IN")}
                      </span>
                      <span>({u.preferred_currency || (u.region === "EUROPE" ? "EUR" : u.region === "PHILIPPINES" ? "PHP" : "INR")})</span>
                      {u.is_admin_region && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-semibold ml-1">
                          Override
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Toolbar: 4 Direct Operations */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
                {/* 1. Adjust Balance */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserForBalance(u);
                    setBalanceMode("add");
                    setBalanceAmount("");
                    setBalanceReason("");
                    setBalanceCurrency(
                      (ADMIN_CURRENCIES.find((c) => c === u.preferred_currency) as typeof ADMIN_CURRENCIES[number]) ||
                        "USD",
                    );
                  }}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-primary/40 bg-primary/10 hover:bg-primary/20 text-xs font-semibold text-primary transition-colors cursor-pointer shadow-2xs"
                >
                  <Wallet className="h-3.5 w-3.5" />
                  <span>Adjust Balance</span>
                </button>

                {/* 2. Change Country / Region */}
                <button
                  type="button"
                  onClick={() => setSelectedUserForRegion(u)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-xs font-semibold text-blue-600 dark:text-blue-400 transition-colors cursor-pointer shadow-2xs"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>Change Country ({flag} {u.country_code || u.region})</span>
                </button>

                {/* 3. Freeze / Unfreeze */}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleToggleFreeze(u)}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs border",
                    u.is_frozen
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                      : "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20",
                  )}
                >
                  {u.is_frozen ? <Sun className="h-3.5 w-3.5" /> : <Snowflake className="h-3.5 w-3.5" />}
                  <span>{u.is_frozen ? "Unfreeze Account" : "Freeze Account"}</span>
                </button>

                {/* 4. 48h Security Hold */}
                <button
                  type="button"
                  onClick={() => setSelectedUserForAge(u)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border/80 bg-secondary/60 hover:bg-secondary text-xs font-semibold text-foreground transition-colors cursor-pointer"
                >
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>48h Age: {u.account_age_hours}h</span>
                </button>

                {/* 5. User Activity History */}
                <button
                  type="button"
                  onClick={() => handleOpenHistory(u)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border/80 bg-secondary/60 hover:bg-secondary text-xs font-semibold text-foreground transition-colors cursor-pointer"
                >
                  <History className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Activity History</span>
                </button>
              </div>
            </div>
          );
        })}

        {list.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">No matching users found.</p>
        )}
      </div>

      {/* MODAL 1: Adjust Balance */}
      {selectedUserForBalance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
          <form
            onSubmit={handleAdjustBalance}
            className="w-full max-w-md rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4 shadow-xl"
          >
            <div className="space-y-1">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" />
                <span>Adjust User Balance</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Target: <span className="font-bold text-foreground">{selectedUserForBalance.full_name}</span> ·{" "}
                <span className="font-mono">{selectedUserForBalance.wallet_code}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Current Balance:{" "}
                <span className="font-bold text-foreground">
                  {formatMoney(Number(selectedUserForBalance.balance_usd), "USD")}
                </span>
              </p>
            </div>

            {/* Mode toggle */}
            <div className="grid grid-cols-2 gap-1 rounded-full bg-secondary p-1">
              {(["add", "remove"] as const).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setBalanceMode(m)}
                  className={cn(
                    "h-9 rounded-full text-xs font-semibold transition-colors cursor-pointer",
                    balanceMode === m
                      ? m === "add"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-destructive text-destructive-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m === "add" ? "+ Credit / Increase" : "− Debit / Decrease"}
                </button>
              ))}
            </div>

            {/* Amount & Currency */}
            <div className="grid grid-cols-[1fr_6.5rem] gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Amount</label>
                <Input
                  inputMode="decimal"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder="0.00"
                  className="h-11 rounded-xl tabular-nums text-sm font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Currency</label>
                <select
                  value={balanceCurrency}
                  onChange={(e) => setBalanceCurrency(e.target.value as typeof balanceCurrency)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold"
                >
                  {ADMIN_CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Reason / Ledger Memo</label>
              <Input
                value={balanceReason}
                onChange={(e) => setBalanceReason(e.target.value)}
                maxLength={200}
                placeholder="e.g. Promotional credit, KYC bonus, or correction"
                className="h-11 rounded-xl text-xs"
              />
              {/* Quick reason chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["Promotional Credit", "Account Adjustment", "KYC Bonus", "Manual Correction"].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setBalanceReason(chip)}
                    className="text-[10px] rounded-lg border border-border bg-secondary/70 hover:bg-secondary px-2 py-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-2 border-t border-border/50">
              <button
                type="button"
                onClick={() => setSelectedUserForBalance(null)}
                className="flex-1 h-11 rounded-xl border border-border text-xs font-semibold hover:bg-secondary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy || !balanceAmount}
                className={cn(
                  "flex-1 h-11 rounded-xl text-xs font-semibold transition-opacity disabled:opacity-50 cursor-pointer shadow-soft flex items-center justify-center gap-1.5",
                  balanceMode === "add"
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "bg-destructive text-destructive-foreground hover:opacity-90",
                )}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : balanceMode === "add" ? (
                  "Confirm Credit"
                ) : (
                  "Confirm Debit"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: Change Country / Region */}
      {selectedUserForRegion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="space-y-1">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" />
                <span>Change User Country &amp; Banking Region</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Target: <span className="font-bold text-foreground">{selectedUserForRegion.full_name}</span> (
                {selectedUserForRegion.wallet_code})
              </p>
              <p className="text-xs text-muted-foreground">
                Current Setting:{" "}
                <span className="font-semibold text-foreground">
                  {selectedUserForRegion.country_code || selectedUserForRegion.region} (
                  {selectedUserForRegion.preferred_currency || "INR"})
                </span>
                {selectedUserForRegion.is_admin_region && " · Admin Override Active"}
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <label className="text-xs font-semibold text-foreground block">
                Select Destination Country &amp; Capabilities:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {COUNTRY_REGION_OPTIONS.map((opt) => {
                  const isCurrent =
                    selectedUserForRegion.country_code === opt.countryCode ||
                    (!selectedUserForRegion.country_code && selectedUserForRegion.region === opt.region);

                  return (
                    <button
                      key={`${opt.region}-${opt.countryCode}`}
                      type="button"
                      disabled={busy}
                      onClick={() => handleSetRegion(selectedUserForRegion, opt)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1",
                        isCurrent
                          ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/40 font-semibold"
                          : "border-border hover:border-border/80 bg-card hover:bg-secondary/60 text-foreground",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold flex items-center gap-1.5">
                          <span className="text-base">{opt.flag}</span>
                          <span>{opt.label}</span>
                        </span>
                        <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-secondary">
                          {opt.preferredCurrency}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">{opt.methods}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedUserForRegion(null)}
              className="w-full h-11 rounded-xl border border-border text-xs font-semibold hover:bg-secondary transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: 48h Age Security Hold */}
      {selectedUserForAge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 space-y-4 shadow-lg">
            <div className="space-y-1">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Adjust Account 48h Security Hold</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Target User: <span className="font-semibold text-foreground">{selectedUserForAge.full_name}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Current Age:{" "}
                <span className="font-bold text-foreground">
                  {selectedUserForAge.account_age_hours} hours ({selectedUserForAge.account_age_days} days)
                </span>
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                disabled={busy}
                onClick={() => handleSetAge(selectedUserForAge.user_id, 72)}
                className="w-full h-11 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-colors cursor-pointer text-left px-3.5 flex items-center justify-between border border-emerald-500/20"
              >
                <span>Unlock Withdrawals (Set Age to 72 hours)</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </button>
              <button
                disabled={busy}
                onClick={() => handleSetAge(selectedUserForAge.user_id, 1)}
                className="w-full h-11 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-bold transition-colors cursor-pointer text-left px-3.5 flex items-center justify-between border border-amber-500/20"
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

      {/* MODAL 4: User Activity History */}
      {selectedUserForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4 shadow-xl max-h-[85vh] flex flex-col">
            <div className="space-y-1">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <span>Financial Activity History</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Account: <span className="font-bold text-foreground">{selectedUserForHistory.full_name}</span> ·{" "}
                <span className="font-mono">{selectedUserForHistory.wallet_code}</span> ({selectedUserForHistory.email})
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {userHistoryLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Withdrawals &amp; Payouts ({userHistoryData.withdrawals.length})
                    </h4>
                    {userHistoryData.withdrawals.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No withdrawals recorded.</p>
                    ) : (
                      <div className="rounded-xl border border-border divide-y divide-border/60 overflow-hidden">
                        {userHistoryData.withdrawals.map((w: any) => (
                          <div key={w.id} className="p-3 text-xs flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-foreground">
                                {w.method} · <span className="font-mono text-[11px]">{w.reference}</span>
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(w.created_at).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-foreground">
                                {formatMoney(Number(w.amount), w.currency)}
                              </p>
                              <span className="text-[10px] font-bold text-primary">{w.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Transfers &amp; Credits ({userHistoryData.transactions.length})
                    </h4>
                    {userHistoryData.transactions.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No transactions recorded.</p>
                    ) : (
                      <div className="rounded-xl border border-border divide-y divide-border/60 overflow-hidden">
                        {userHistoryData.transactions.map((t: any) => (
                          <div key={t.id} className="p-3 text-xs flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-foreground">
                                {t.kind} · <span className="font-mono text-[11px]">{t.reference}</span>
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {t.note || "Transfer"} · {new Date(t.created_at).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-foreground">
                                {formatMoney(Number(t.amount), t.currency)}
                              </p>
                              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                {t.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="pt-2 border-t border-border/40 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedUserForHistory(null)}
                className="h-10 px-5 rounded-xl border border-border text-xs font-semibold hover:bg-secondary transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
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
  onSelectTab,
}: {
  token: string;
  users: AdminUser[];
  onDone: () => void;
  onSelectTab?: (s: Section) => void;
}) {
  const freezeFn = useServerFn(adminSetFreeze);
  const regionFn = useServerFn(adminSetRegion);
  const ageFn = useServerFn(adminSetAccountAge);
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
    <div className="max-w-xl space-y-4 rounded-2xl border border-border bg-card p-5">
      <div className="space-y-1">
        <h3 className="font-semibold text-base">Account Security &amp; Region Controls</h3>
        <p className="text-xs text-muted-foreground">
          Quickly inspect, freeze/unfreeze, or change the verified country of any Moonlight account by wallet ID.
        </p>
      </div>

      <WalletPicker users={users} value={walletCode} onChange={setWalletCode} />

      {user && (
        <>
          {/* User Info Card */}
          <div className="p-3.5 rounded-xl border border-border/80 bg-secondary/40 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-foreground">{user.full_name}</div>
                <div className="text-xs text-muted-foreground font-mono">{user.email}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm text-foreground">
                  {formatMoney(Number(user.balance_usd), "USD")}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                    user.is_frozen
                      ? "bg-destructive/15 text-destructive"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {user.is_frozen ? "Frozen" : "Active"}
                </span>
              </div>
            </div>
          </div>

          {/* Freeze / Unfreeze with Reason */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-semibold text-foreground">Security Action Memo (Optional)</label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. User requested freeze, compliance review, or cleared"
              maxLength={200}
              className="h-11 rounded-xl text-xs"
            />
            <button
              disabled={busy}
              onClick={() =>
                run(
                  () =>
                    freezeFn({
                      data: { token, walletCode: user.wallet_code, freeze: !user.is_frozen, reason },
                    }),
                  user.is_frozen ? "Wallet unfrozen successfully." : "Wallet frozen successfully.",
                )
              }
              className={cn(
                "flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold transition-opacity disabled:opacity-50 cursor-pointer shadow-soft",
                user.is_frozen
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
              )}
            >
              {user.is_frozen ? <Sun className="h-4 w-4" /> : <Snowflake className="h-4 w-4" />}
              {user.is_frozen ? "Unfreeze Wallet" : "Freeze Wallet"}
            </button>
          </div>

          {/* Country & Region Switcher */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">Verified Country &amp; Capabilities</label>
              <span className="text-[11px] font-mono text-muted-foreground">
                Current: <span className="font-bold text-foreground">{user.country_code || user.region}</span>
                {user.is_admin_region ? " (Override)" : " (Default)"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COUNTRY_REGION_OPTIONS.map((opt) => {
                const isCurrent =
                  user.country_code === opt.countryCode ||
                  (!user.country_code && user.region === opt.region);

                return (
                  <button
                    key={`${opt.region}-${opt.countryCode}`}
                    disabled={busy || isCurrent}
                    onClick={() =>
                      run(
                        () =>
                          regionFn({
                            data: {
                              token,
                              walletCode: user.wallet_code,
                              region: opt.region,
                              countryCode: opt.countryCode,
                              preferredCurrency: opt.preferredCurrency,
                            },
                          }),
                        `Country set to ${opt.label} (${opt.countryCode}).`,
                      )
                    }
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1",
                      isCurrent
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/40 font-semibold"
                        : "border-border hover:border-border/80 bg-card hover:bg-secondary/60 text-foreground",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <span>{opt.flag}</span>
                        <span>{opt.label}</span>
                      </span>
                      <span className="font-mono text-[10px] font-semibold px-1 py-0.5 rounded bg-secondary">
                        {opt.preferredCurrency}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{opt.methods}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 48h Security Age Window */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">Anti-Fraud 48h Security Clearance</label>
              <span className="text-[11px] font-mono text-muted-foreground">
                Current: <span className="font-bold text-foreground">{user.account_age_hours} hrs</span> ({user.account_age_days} days)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  const targetDate = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
                  run(
                    () => ageFn({ data: { token, userId: user.user_id, createdAtISO: targetDate } }),
                    "Account age updated to 72 hours (Withdrawals Unlocked)."
                  );
                }}
                className="h-10 px-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Unlock (Set 72h)</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  const targetDate = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
                  run(
                    () => ageFn({ data: { token, userId: user.user_id, createdAtISO: targetDate } }),
                    "Account age updated to 1 hour (Withdrawals Locked)."
                  );
                }}
                className="h-10 px-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Lock (Set 1h Old)</span>
              </button>
            </div>
          </div>

          {/* Quick Balance Adjustment Jump */}
          <div className="pt-2 border-t border-border/50 flex justify-end">
            <button
              type="button"
              onClick={() => onSelectTab?.("balance")}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-xs font-semibold text-primary transition-colors cursor-pointer"
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>Open Balance Console for this Wallet</span>
            </button>
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

                  <EmailTemplateButton
                    data={{
                      type: isWd
                        ? "withdrawal"
                        : statusUpper === "ON HOLD" || statusUpper === "UNDER REVIEW"
                          ? "kyc_hold"
                          : "money_received",
                      recipientName: tx.recipient_name || tx.sender_name || "Valued Customer",
                      senderName: tx.sender_name || "Moonlight Financial",
                      amount: tx.amount,
                      currency: tx.currency,
                      reference: tx.reference,
                      date: dateStr,
                      status: statusUpper,
                      method: tx.method || (isWd ? "Withdrawal" : "Transfer"),
                    }}
                    label="Email Template"
                  />

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

// ─────────────────────────────────────────────
// EMAIL TEMPLATES SECTION
// ─────────────────────────────────────────────

const LOGO_URL =
  "https://b17cedb7-4b7b-485c-807a-ccc6dd6383b9.lovableproject.com/__l5e/assets-v1/17db28e8-0752-4d7d-b01c-7f7f7fa7fdaa/moonlight-logo.png";
const SITE_URL = "https://moonlight.lovableproject.com";

function buildMoneyReceivedHtml(params: {
  recipientName: string;
  senderName: string;
  amount: string;
  currency: string;
  date: string;
  reference: string;
}) {
  const { recipientName, senderName, amount, currency, date, reference } = params;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Money Received — Moonlight Wallet</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#12121a;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
            <img src="${LOGO_URL}" alt="Moonlight" width="140" style="display:block;margin:0 auto 4px;" />
            <p style="margin:0;color:#ffffff80;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Moonlight Wallet</p>
          </td>
        </tr>

        <!-- Green bar -->
        <tr>
          <td style="background:#16a34a;padding:14px 40px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">✅ Money Received Successfully</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:40px;">
            <p style="margin:0 0 6px;font-size:15px;color:#1a1a2e;">Hello <strong>${recipientName}</strong>,</p>
            <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">Great news — a payment has been deposited into your Moonlight Wallet. Here are the details:</p>

            <!-- Amount box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:24px;text-align:center;">
                  <p style="margin:0 0 4px;font-size:13px;color:#16a34a;text-transform:uppercase;font-weight:600;letter-spacing:1px;">Amount Received</p>
                  <p style="margin:0;font-size:36px;font-weight:800;color:#15803d;letter-spacing:-1px;">${amount} <span style="font-size:18px;">${currency}</span></p>
                </td>
              </tr>
            </table>

            <!-- Detail rows -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:28px;">
              <tr style="background:#f9fafb;">
                <td style="padding:12px 16px;font-size:12px;color:#6b7280;width:40%;">From</td>
                <td style="padding:12px 16px;font-size:13px;color:#1a1a2e;font-weight:600;">${senderName}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;">Date</td>
                <td style="padding:12px 16px;font-size:13px;color:#1a1a2e;border-top:1px solid #e5e7eb;">${date}</td>
              </tr>
              <tr style="background:#f9fafb;">
                <td style="padding:12px 16px;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;">Reference</td>
                <td style="padding:12px 16px;font-size:13px;color:#1a1a2e;font-family:monospace;border-top:1px solid #e5e7eb;">${reference}</td>
              </tr>
            </table>

            <p style="margin:0 0 28px;font-size:13px;color:#6b7280;line-height:1.7;">The funds are now available in your Moonlight Wallet. You can view your updated balance, transfer funds, or withdraw at any time by logging into your account.</p>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
              <tr>
                <td style="background:#12121a;border-radius:50px;padding:14px 32px;text-align:center;">
                  <a href="${SITE_URL}/dashboard" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:0.5px;">View My Wallet →</a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">If you didn't expect this payment, please contact our support team immediately.</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Moonlight Financial. All rights reserved.</p>
            <p style="margin:0;font-size:11px;color:#d1d5db;">This is an automated notification. Please do not reply to this email.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildWithdrawalHtml(params: {
  recipientName: string;
  amount: string;
  currency: string;
  method: string;
  date: string;
  reference: string;
  status: string;
}) {
  const { recipientName, amount, currency, method, date, reference, status } = params;
  const statusColor = status === "SUCCESSFUL" ? "#16a34a" : status === "PROCESSING" ? "#d97706" : "#dc2626";
  const statusBg = status === "SUCCESSFUL" ? "#f0fdf4" : status === "PROCESSING" ? "#fffbeb" : "#fef2f2";
  const statusBorder = status === "SUCCESSFUL" ? "#bbf7d0" : status === "PROCESSING" ? "#fde68a" : "#fecaca";
  const statusIcon = status === "SUCCESSFUL" ? "✅" : status === "PROCESSING" ? "⏳" : "❌";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Withdrawal Update — Moonlight Wallet</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#12121a;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
            <img src="${LOGO_URL}" alt="Moonlight" width="140" style="display:block;margin:0 auto 4px;" />
            <p style="margin:0;color:#ffffff80;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Moonlight Wallet</p>
          </td>
        </tr>

        <!-- Status bar -->
        <tr>
          <td style="background:${statusColor};padding:14px 40px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">${statusIcon} Withdrawal ${status}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:40px;">
            <p style="margin:0 0 6px;font-size:15px;color:#1a1a2e;">Hello <strong>${recipientName}</strong>,</p>
            <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">Your withdrawal request has been updated. Please review the details below:</p>

            <!-- Amount box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:${statusBg};border:1px solid ${statusBorder};border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:24px;text-align:center;">
                  <p style="margin:0 0 4px;font-size:13px;color:${statusColor};text-transform:uppercase;font-weight:600;letter-spacing:1px;">Withdrawal Amount</p>
                  <p style="margin:0;font-size:36px;font-weight:800;color:${statusColor};letter-spacing:-1px;">${amount} <span style="font-size:18px;">${currency}</span></p>
                  <p style="margin:6px 0 0;font-size:12px;color:${statusColor};font-weight:600;">${status}</p>
                </td>
              </tr>
            </table>

            <!-- Detail rows -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:28px;">
              <tr style="background:#f9fafb;">
                <td style="padding:12px 16px;font-size:12px;color:#6b7280;width:40%;">Method</td>
                <td style="padding:12px 16px;font-size:13px;color:#1a1a2e;font-weight:600;">${method}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;">Date</td>
                <td style="padding:12px 16px;font-size:13px;color:#1a1a2e;border-top:1px solid #e5e7eb;">${date}</td>
              </tr>
              <tr style="background:#f9fafb;">
                <td style="padding:12px 16px;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;">Reference</td>
                <td style="padding:12px 16px;font-size:13px;color:#1a1a2e;font-family:monospace;border-top:1px solid #e5e7eb;">${reference}</td>
              </tr>
            </table>

            <p style="margin:0 0 28px;font-size:13px;color:#6b7280;line-height:1.7;">${status === "SUCCESSFUL" ? "Your funds have been sent to your chosen payment method. Please allow your bank 1–3 business days to process the transfer depending on your region and payment rail." : status === "PROCESSING" ? "Your withdrawal is currently being processed by our clearing team. You will receive another update as soon as it is completed." : "Unfortunately your withdrawal could not be completed at this time. Your funds have been returned to your Moonlight Wallet balance. Please contact support if you need assistance."}</p>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
              <tr>
                <td style="background:#12121a;border-radius:50px;padding:14px 32px;text-align:center;">
                  <a href="${SITE_URL}/dashboard" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:0.5px;">Go to Dashboard →</a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">Questions? Contact our support team at support@moonlightwallet.com</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Moonlight Financial. All rights reserved.</p>
            <p style="margin:0;font-size:11px;color:#d1d5db;">This is an automated notification. Please do not reply to this email.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildKycHoldHtml(params: {
  recipientName: string;
  amount: string;
  currency: string;
  senderName: string;
  reference: string;
  date: string;
}) {
  const { recipientName, amount, currency, senderName, reference, date } = params;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Action Required: KYC Verification — Moonlight Wallet</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#12121a;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
            <img src="${LOGO_URL}" alt="Moonlight" width="140" style="display:block;margin:0 auto 4px;" />
            <p style="margin:0;color:#ffffff80;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Moonlight Wallet</p>
          </td>
        </tr>

        <!-- Warning bar -->
        <tr>
          <td style="background:#7c3aed;padding:14px 40px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">⚠️ Action Required — Transaction On Hold</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:40px;">
            <p style="margin:0 0 6px;font-size:15px;color:#1a1a2e;">Hello <strong>${recipientName}</strong>,</p>
            <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">An incoming payment to your Moonlight Wallet has been placed on hold pending identity verification (KYC). Please review the details and take action below:</p>

            <!-- Amount box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf5ff;border:1px solid #ddd6fe;border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:24px;text-align:center;">
                  <p style="margin:0 0 4px;font-size:13px;color:#7c3aed;text-transform:uppercase;font-weight:600;letter-spacing:1px;">Amount On Hold</p>
                  <p style="margin:0;font-size:36px;font-weight:800;color:#6d28d9;letter-spacing:-1px;">${amount} <span style="font-size:18px;">${currency}</span></p>
                  <p style="margin:6px 0 0;font-size:12px;color:#7c3aed;font-weight:600;">From: ${senderName}</p>
                </td>
              </tr>
            </table>

            <!-- Detail rows -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:28px;">
              <tr style="background:#f9fafb;">
                <td style="padding:12px 16px;font-size:12px;color:#6b7280;width:40%;">Sender</td>
                <td style="padding:12px 16px;font-size:13px;color:#1a1a2e;font-weight:600;">${senderName}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;">Date</td>
                <td style="padding:12px 16px;font-size:13px;color:#1a1a2e;border-top:1px solid #e5e7eb;">${date}</td>
              </tr>
              <tr style="background:#f9fafb;">
                <td style="padding:12px 16px;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;">Reference</td>
                <td style="padding:12px 16px;font-size:13px;color:#1a1a2e;font-family:monospace;border-top:1px solid #e5e7eb;">${reference}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;">Status</td>
                <td style="padding:12px 16px;font-size:13px;font-weight:700;color:#7c3aed;border-top:1px solid #e5e7eb;">🔒 ON HOLD — KYC Required</td>
              </tr>
            </table>

            <!-- How it works box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:24px;">
                  <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#92400e;">📋 How to unlock your funds</p>
                  <p style="margin:0 0 10px;font-size:13px;color:#78350f;line-height:1.7;"><strong>Step 1:</strong> Complete your KYC (identity verification) inside your Moonlight Wallet account.</p>
                  <p style="margin:0 0 10px;font-size:13px;color:#78350f;line-height:1.7;"><strong>Step 2:</strong> Once your KYC is approved, Moonlight will issue a <strong>5-digit verification key</strong> to the person who sent you this payment (<strong>${senderName}</strong>).</p>
                  <p style="margin:0 0 10px;font-size:13px;color:#78350f;line-height:1.7;"><strong>Step 3:</strong> Contact <strong>${senderName}</strong> and ask them to share their 5-digit key with you.</p>
                  <p style="margin:0 0 10px;font-size:13px;color:#78350f;line-height:1.7;"><strong>Step 4:</strong> Submit the key to Moonlight so we can confirm both parties are correct. Once verified, your funds will be released instantly.</p>
                  <p style="margin:0;font-size:12px;color:#92400e;font-style:italic;">💡 If you have trouble reaching ${senderName}, Moonlight will also send you a separate key directly for additional verification.</p>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
              <tr>
                <td style="background:#7c3aed;border-radius:50px;padding:14px 32px;text-align:center;">
                  <a href="${SITE_URL}/dashboard" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:0.5px;">Complete KYC Now →</a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">Need help? Reach us at support@moonlightwallet.com — we're here 24/7.</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Moonlight Financial. All rights reserved.</p>
            <p style="margin:0;font-size:11px;color:#d1d5db;">This is an automated notification. Please do not reply to this email.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

type EmailTab = "received" | "withdrawal" | "kyc";

function CopyButton({ getText }: { getText: () => string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(getText()).then(() => {
      setCopied(true);
      toast.success("HTML email copied to clipboard — ready to paste!");
      setTimeout(() => setCopied(false), 2500);
    });
  }
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-primary text-primary-foreground text-xs font-bold tracking-wider uppercase shadow-soft hover:opacity-90 active:scale-[0.97] transition-all cursor-pointer touch-manipulation"
    >
      {copied ? (
        <><Check className="h-4 w-4" /> Copied!</>
      ) : (
        <><Copy className="h-4 w-4" /> Copy HTML Email</>
      )}
    </button>
  );
}

function EmailTemplatesSection() {
  const [tab, setTab] = useState<EmailTab>("received");

  // Editable fields — money received
  const [mrRecipient, setMrRecipient] = useState("[Customer Name]");
  const [mrSender, setMrSender] = useState("[Sender Name]");
  const [mrAmount, setMrAmount] = useState("0.00");
  const [mrCurrency, setMrCurrency] = useState("USD");
  const [mrDate, setMrDate] = useState(new Date().toLocaleString());
  const [mrRef, setMrRef] = useState("ML-XXXX-XXXX");

  // Editable fields — withdrawal
  const [wdRecipient, setWdRecipient] = useState("[Customer Name]");
  const [wdAmount, setWdAmount] = useState("0.00");
  const [wdCurrency, setWdCurrency] = useState("USD");
  const [wdMethod, setWdMethod] = useState("Bank Transfer");
  const [wdDate, setWdDate] = useState(new Date().toLocaleString());
  const [wdRef, setWdRef] = useState("ML-XXXX-XXXX");
  const [wdStatus, setWdStatus] = useState("SUCCESSFUL");

  // Editable fields — kyc hold
  const [kycRecipient, setKycRecipient] = useState("[Customer Name]");
  const [kycAmount, setKycAmount] = useState("0.00");
  const [kycCurrency, setKycCurrency] = useState("USD");
  const [kycSender, setKycSender] = useState("[Sender Name]");
  const [kycRef, setKycRef] = useState("ML-XXXX-XXXX");
  const [kycDate, setKycDate] = useState(new Date().toLocaleString());

  const tabs: { id: EmailTab; label: string; color: string }[] = [
    { id: "received", label: "💰 Money Received", color: "emerald" },
    { id: "withdrawal", label: "🏦 Withdrawal", color: "amber" },
    { id: "kyc", label: "🔒 KYC Hold", color: "purple" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-foreground">Email Templates</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fill in the fields, then click <strong>Copy HTML Email</strong> — paste directly into Gmail, Outlook, or any email client.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
          <Mail className="h-3 w-3" /> 3 Templates
        </span>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
        <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-foreground">💡 1-Tap Auto-Filled Email Templates Available on Every Row</p>
          <p className="text-muted-foreground leading-relaxed">
            You don't need to manually type customer details! An <span className="font-bold text-purple-600 dark:text-purple-400">"Email Template"</span> button is now placed directly next to every row in the <strong>Transactions</strong> and <strong>Withdrawals</strong> tabs. Clicking it opens the pre-filled email with that transaction's exact amount, currency, reference ID, and dates ready to copy in 1 tap.
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer",
              tab === t.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Money Received ─── */}
      {tab === "received" && (
        <div className="space-y-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/10 p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">💰 Money Received Email</p>
              <p className="text-[11px] text-muted-foreground">Sent when a customer successfully receives a payment into their wallet.</p>
            </div>
            <CopyButton
              getText={() =>
                buildMoneyReceivedHtml({
                  recipientName: mrRecipient,
                  senderName: mrSender,
                  amount: mrAmount,
                  currency: mrCurrency,
                  date: mrDate,
                  reference: mrRef,
                })
              }
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([
              ["Recipient Name", mrRecipient, setMrRecipient],
              ["Sender Name", mrSender, setMrSender],
              ["Amount", mrAmount, setMrAmount],
              ["Currency", mrCurrency, setMrCurrency],
              ["Date", mrDate, setMrDate],
              ["Reference", mrRef, setMrRef],
            ] as [string, string, (v: string) => void][]).map(([label, value, setter]) => (
              <div key={label} className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
                <input
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-background overflow-hidden">
            <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">HTML Preview (read-only)</p>
            <pre className="p-4 text-[10px] font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap max-h-48 leading-relaxed">{buildMoneyReceivedHtml({ recipientName: mrRecipient, senderName: mrSender, amount: mrAmount, currency: mrCurrency, date: mrDate, reference: mrRef })}</pre>
          </div>
        </div>
      )}

      {/* ─── Withdrawal ─── */}
      {tab === "withdrawal" && (
        <div className="space-y-4 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/10 p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">🏦 Withdrawal Email</p>
              <p className="text-[11px] text-muted-foreground">Sent to inform the customer of their withdrawal status update.</p>
            </div>
            <CopyButton
              getText={() =>
                buildWithdrawalHtml({
                  recipientName: wdRecipient,
                  amount: wdAmount,
                  currency: wdCurrency,
                  method: wdMethod,
                  date: wdDate,
                  reference: wdRef,
                  status: wdStatus,
                })
              }
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([
              ["Recipient Name", wdRecipient, setWdRecipient],
              ["Amount", wdAmount, setWdAmount],
              ["Currency", wdCurrency, setWdCurrency],
              ["Payment Method", wdMethod, setWdMethod],
              ["Date", wdDate, setWdDate],
              ["Reference", wdRef, setWdRef],
            ] as [string, string, (v: string) => void][]).map(([label, value, setter]) => (
              <div key={label} className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
                <input
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            ))}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
              <select
                value={wdStatus}
                onChange={(e) => setWdStatus(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option>SUCCESSFUL</option>
                <option>PROCESSING</option>
                <option>FAILED</option>
                <option>ON HOLD</option>
              </select>
            </div>
          </div>
          <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-background overflow-hidden">
            <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">HTML Preview (read-only)</p>
            <pre className="p-4 text-[10px] font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap max-h-48 leading-relaxed">{buildWithdrawalHtml({ recipientName: wdRecipient, amount: wdAmount, currency: wdCurrency, method: wdMethod, date: wdDate, reference: wdRef, status: wdStatus })}</pre>
          </div>
        </div>
      )}

      {/* ─── KYC Hold ─── */}
      {tab === "kyc" && (
        <div className="space-y-4 rounded-2xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/10 p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">🔒 KYC Transaction Hold Email</p>
              <p className="text-[11px] text-muted-foreground">Sent when a transaction is placed on hold pending KYC verification. Explains the 5-digit key process.</p>
            </div>
            <CopyButton
              getText={() =>
                buildKycHoldHtml({
                  recipientName: kycRecipient,
                  amount: kycAmount,
                  currency: kycCurrency,
                  senderName: kycSender,
                  reference: kycRef,
                  date: kycDate,
                })
              }
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([
              ["Recipient Name", kycRecipient, setKycRecipient],
              ["Sender Name", kycSender, setKycSender],
              ["Amount", kycAmount, setKycAmount],
              ["Currency", kycCurrency, setKycCurrency],
              ["Date", kycDate, setKycDate],
              ["Reference", kycRef, setKycRef],
            ] as [string, string, (v: string) => void][]).map(([label, value, setter]) => (
              <div key={label} className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
                <input
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            ))}
          </div>

          {/* KYC process info card */}
          <div className="rounded-xl border border-purple-200 dark:border-purple-800/40 bg-purple-50 dark:bg-purple-950/20 p-4 space-y-2">
            <p className="text-[11px] font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider">📋 What this email tells the customer</p>
            <ul className="space-y-1.5 text-[11px] text-purple-700 dark:text-purple-400">
              <li>1. Complete KYC inside Moonlight Wallet</li>
              <li>2. On approval → a 5-digit key is sent to the sender ({kycSender})</li>
              <li>3. Customer contacts sender to get their 5-digit key</li>
              <li>4. Submit key to Moonlight → funds released instantly</li>
              <li>5. If sender unreachable → Moonlight also provides a key directly</li>
            </ul>
          </div>

          <div className="rounded-xl border border-purple-200 dark:border-purple-900/40 bg-background overflow-hidden">
            <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">HTML Preview (read-only)</p>
            <pre className="p-4 text-[10px] font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap max-h-48 leading-relaxed">{buildKycHoldHtml({ recipientName: kycRecipient, amount: kycAmount, currency: kycCurrency, senderName: kycSender, reference: kycRef, date: kycDate })}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
