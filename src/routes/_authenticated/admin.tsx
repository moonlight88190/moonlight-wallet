import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Loader2,
  Users,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Activity,
  Snowflake,
  Sun,
  Globe,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  checkAdminToken,
  adminAddBalance,
  adminRemoveBalance,
  adminSetFreeze,
  adminSetRegion,
  adminUpdateWithdrawalStatus,
} from "@/lib/admin.functions";
import { CURRENCIES, type CurrencyCode, formatMoney } from "@/lib/currency";
import { PageTitle } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { PaymentMethodIcon } from "@/components/AssetComponents";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin Panel — Moonlight" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

export function Admin() {
  const navigate = useNavigate();
  const check = useServerFn(checkAdminToken);
  const addBal = useServerFn(adminAddBalance);
  const remBal = useServerFn(adminRemoveBalance);
  const setFrz = useServerFn(adminSetFreeze);
  const setReg = useServerFn(adminSetRegion);
  const updateWd = useServerFn(adminUpdateWithdrawalStatus);

  const [ok, setOk] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<
    "balance" | "users" | "withdrawals" | "search" | "activity"
  >("withdrawals");

  // Balance Adjustments State
  const [balanceForm, setBalanceForm] = useState({
    type: "add" as "add" | "remove",
    walletCode: "",
    currency: "USD" as CurrencyCode,
    amount: "",
    reason: "",
  });
  const [balanceBusy, setBalanceBusy] = useState(false);

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [userQuery, setUserQuery] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userTxHistory, setUserTxHistory] = useState<any[]>([]);
  const [loadingUserTx, setLoadingUserTx] = useState(false);

  // Withdrawals State
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loadingWd, setLoadingWd] = useState(false);
  const [wdFilter, setWdFilter] = useState<string>("ALL");
  const [wdQuery, setWdQuery] = useState<string>("");
  const [selectedWd, setSelectedWd] = useState<any | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [statusBusy, setStatusBusy] = useState(false);

  // Global Search State
  const [globalQuery, setGlobalQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    users: any[];
    withdrawals: any[];
    transactions: any[];
  }>({ users: [], withdrawals: [], transactions: [] });
  const [searchingGlobal, setSearchingGlobal] = useState(false);

  // Activity Log State
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const adminToken = typeof window !== "undefined" ? sessionStorage.getItem("ml_admin_token") ?? "" : "";

  useEffect(() => {
    if (adminToken === "ml_authorized_4336") {
      setOk(true);
      return;
    }
    check({ data: { token: adminToken } })
      .then((r) => (r.ok ? setOk(true) : navigate({ to: "/admin-access" })))
      .catch(() => navigate({ to: "/admin-access" }));
  }, [check, navigate, adminToken]);

  // Load section data when tab changes
  useEffect(() => {
    if (!ok) return;
    if (activeTab === "users") loadUsers();
    if (activeTab === "withdrawals") loadWithdrawals();
    if (activeTab === "activity") loadActivities();
  }, [ok, activeTab]);

  async function loadUsers() {
    setLoadingUsers(true);
    const { data: wallets } = await supabase
      .from("wallets")
      .select("id, wallet_code, balance_usd, status, is_frozen, created_at, user_id");

    const { data: profiles } = await supabase.from("profiles").select("id, full_name, email, region, created_at");

    if (wallets && profiles) {
      const merged = wallets.map((w) => {
        const p = profiles.find((prof) => prof.id === w.user_id);
        return {
          ...w,
          full_name: p?.full_name || "N/A",
          email: p?.email || "N/A",
          region: p?.region || "GLOBAL",
          user_created_at: p?.created_at || w.created_at,
        };
      });
      setUsers(merged);
    }
    setLoadingUsers(false);
  }

  async function loadWithdrawals() {
    setLoadingWd(true);
    const { data } = await supabase
      .from("withdrawals")
      .select("*")
      .order("created_at", { ascending: false });
    setWithdrawals(data || []);
    setLoadingWd(false);
  }

  async function loadActivities() {
    setLoadingActivities(true);
    const { data } = await supabase
      .from("admin_actions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setActivities(data || []);
    setLoadingActivities(false);
  }

  async function loadUserTransactions(userId: string, walletId: string) {
    setLoadingUserTx(true);
    const { data: txs } = await supabase
      .from("transactions")
      .select("*")
      .or(`sender_wallet_id.eq.${walletId},recipient_wallet_id.eq.${walletId}`)
      .order("created_at", { ascending: false });

    const { data: wds } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setUserTxHistory({ transactions: txs || [], withdrawals: wds || [] } as any);
    setLoadingUserTx(false);
  }

  async function handleBalanceSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBalanceBusy(true);
    try {
      if (balanceForm.type === "add") {
        await addBal({
          data: {
            token: adminToken,
            walletCode: balanceForm.walletCode,
            currency: balanceForm.currency,
            amount: Number(balanceForm.amount),
            reason: balanceForm.reason,
          },
        });
        toast.success(`Added ${balanceForm.amount} ${balanceForm.currency} to ${balanceForm.walletCode}`);
      } else {
        await remBal({
          data: {
            token: adminToken,
            walletCode: balanceForm.walletCode,
            currency: balanceForm.currency,
            amount: Number(balanceForm.amount),
            reason: balanceForm.reason,
          },
        });
        toast.success(`Removed ${balanceForm.amount} ${balanceForm.currency} from ${balanceForm.walletCode}`);
      }
      setBalanceForm({ ...balanceForm, walletCode: "", amount: "", reason: "" });
      if (activeTab === "users") loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Balance adjustment failed.");
    } finally {
      setBalanceBusy(false);
    }
  }

  async function handleToggleFreeze(user: any) {
    const newFreeze = !user.is_frozen;
    try {
      await setFrz({
        data: {
          token: adminToken,
          walletCode: user.wallet_code,
          freeze: newFreeze,
          reason: newFreeze ? "Administrative lock" : "Administrative unlock",
        },
      });
      toast.success(`Wallet ${user.wallet_code} ${newFreeze ? "frozen" : "unfrozen"}`);
      loadUsers();
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...selectedUser, is_frozen: newFreeze });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Freeze operation failed.");
    }
  }

  async function handleUpdateRegion(user: any, region: string) {
    try {
      await setReg({
        data: {
          token: adminToken,
          walletCode: user.wallet_code,
          region: region as any,
        },
      });
      toast.success(`Updated region for ${user.wallet_code} to ${region}`);
      loadUsers();
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...selectedUser, region });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Region update failed.");
    }
  }

  async function handleUpdateWithdrawalStatus(newStatus: string) {
    if (!selectedWd) return;
    if (!statusReason.trim()) {
      toast.error("Please enter a reason for status update.");
      return;
    }
    setStatusBusy(true);
    try {
      await updateWd({
        data: {
          token: adminToken,
          withdrawalId: selectedWd.id,
          status: newStatus as any,
          reason: statusReason.trim(),
        },
      });
      toast.success(`Withdrawal ${selectedWd.reference} status set to ${newStatus}`);
      setStatusReason("");
      setSelectedWd(null);
      loadWithdrawals();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Status update failed.");
    } finally {
      setStatusBusy(false);
    }
  }

  async function handleGlobalSearch() {
    const q = globalQuery.trim();
    if (!q) return;
    setSearchingGlobal(true);

    const { data: matchedUsers } = await supabase
      .from("profiles")
      .select("*, wallets(*)")
      .or(`email.ilike.%${q}%,full_name.ilike.%${q}%`);

    const { data: matchedWds } = await supabase
      .from("withdrawals")
      .select("*")
      .or(`reference.ilike.%${q}%,email.ilike.%${q}%,upi_id.ilike.%${q}%`);

    const { data: matchedTxs } = await supabase
      .from("transactions")
      .select("*")
      .or(`reference.ilike.%${q}%,sender_wallet_code.ilike.%${q}%,recipient_wallet_code.ilike.%${q}%`);

    setSearchResults({
      users: matchedUsers || [],
      withdrawals: matchedWds || [],
      transactions: matchedTxs || [],
    });
    setSearchingGlobal(false);
  }

  if (!ok) {
    return (
      <div className="flex justify-center pt-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(userQuery.toLowerCase()) ||
      u.wallet_code.toLowerCase().includes(userQuery.toLowerCase()) ||
      u.full_name.toLowerCase().includes(userQuery.toLowerCase()),
  );

  const filteredWithdrawals = withdrawals.filter((w) => {
    const matchesStatus = wdFilter === "ALL" || w.status === wdFilter;
    const matchesSearch =
      !wdQuery ||
      w.reference.toLowerCase().includes(wdQuery.toLowerCase()) ||
      w.email.toLowerCase().includes(wdQuery.toLowerCase()) ||
      (w.upi_id && w.upi_id.toLowerCase().includes(wdQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageTitle eyebrow="ADMINISTRATION" title="Moonlight Control Panel">
        Manage wallet balances, users, withdrawals, and system audit logs.
      </PageTitle>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b no-scrollbar">
        {[
          { id: "withdrawals", label: "Withdrawals", icon: ArrowUpRight },
          { id: "users", label: "Users & Accounts", icon: Users },
          { id: "balance", label: "Balance Adjustment", icon: CreditCard },
          { id: "search", label: "Global Search", icon: Search },
          { id: "activity", label: "Admin Activity", icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold shrink-0 transition-all cursor-pointer touch-manipulation ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "bg-secondary/70 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: WITHDRAWALS */}
      {activeTab === "withdrawals" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Input
                placeholder="Search reference, email or UPI..."
                value={wdQuery}
                onChange={(e) => setWdQuery(e.target.value)}
                className="rounded-xl h-10 text-xs"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {["ALL", "PROCESSING", "SUCCESSFUL", "FAILED", "ON HOLD", "UNDER REVIEW", "CANCELLED"].map(
                (st) => (
                  <button
                    key={st}
                    onClick={() => setWdFilter(st)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold shrink-0 transition-all ${
                      wdFilter === st
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {st}
                  </button>
                ),
              )}
            </div>
          </div>

          {loadingWd ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredWithdrawals.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground border rounded-3xl">
              No withdrawal records found.
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              {filteredWithdrawals.map((w) => (
                <div
                  key={w.id}
                  onClick={() => setSelectedWd(w)}
                  className="group rounded-3xl border border-border/60 bg-card p-4 shadow-soft hover:border-primary/40 transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-primary">{w.reference}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        w.status === "SUCCESSFUL"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : w.status === "FAILED" || w.status === "CANCELLED"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {w.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{w.full_name}</h4>
                      <p className="text-xs text-muted-foreground">{w.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-extrabold text-foreground">
                        {formatMoney(Number(w.amount), w.currency)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{w.method}</p>
                    </div>
                  </div>

                  {w.upi_id && (
                    <div className="flex items-center gap-2 rounded-xl bg-secondary/40 p-2 text-xs">
                      <PaymentMethodIcon id={w.provider ? "google-pay" : "upi"} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs font-semibold truncate">{w.upi_id}</p>
                        <p className="text-[10px] text-muted-foreground">{w.provider || "UPI"}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t pt-2">
                    <span>Created: {new Date(w.created_at).toLocaleString()}</span>
                    <span className="font-semibold text-primary group-hover:underline">
                      Manage Status &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: USERS */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <Input
            placeholder="Search user by name, email or wallet ID..."
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            className="rounded-xl h-10 max-w-md text-xs"
          />

          {loadingUsers ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{u.full_name}</h4>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.is_frozen
                          ? "bg-destructive/10 text-destructive"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {u.is_frozen ? "FROZEN" : "ACTIVE"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-secondary/40 p-3 text-xs">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">
                        Wallet Code
                      </p>
                      <p className="font-mono font-bold text-foreground">{u.wallet_code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">
                        Balance (USD)
                      </p>
                      <p className="font-extrabold text-foreground">${Number(u.balance_usd).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      <Select
                        value={u.region}
                        onValueChange={(val) => handleUpdateRegion(u, val)}
                      >
                        <SelectTrigger className="h-7 w-28 rounded-lg text-[10px] font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GLOBAL">GLOBAL</SelectItem>
                          <SelectItem value="EUROPE">EUROPE</SelectItem>
                          <SelectItem value="INDIA">INDIA</SelectItem>
                          <SelectItem value="PHILIPPINES">PHILIPPINES</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleFreeze(u)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                          u.is_frozen
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                            : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                        }`}
                      >
                        {u.is_frozen ? "Unfreeze" : "Freeze"}
                      </button>

                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          loadUserTransactions(u.user_id, u.id);
                        }}
                        className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20 transition-all cursor-pointer"
                      >
                        Details &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BALANCE ADJUSTMENT */}
      {activeTab === "balance" && (
        <div className="mx-auto max-w-md rounded-3xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
          <div className="flex rounded-2xl bg-secondary p-1">
            <button
              onClick={() => setBalanceForm({ ...balanceForm, type: "add" })}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                balanceForm.type === "add"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground"
              }`}
            >
              Add Balance
            </button>
            <button
              onClick={() => setBalanceForm({ ...balanceForm, type: "remove" })}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                balanceForm.type === "remove"
                  ? "bg-destructive text-destructive-foreground shadow-2xs"
                  : "text-muted-foreground"
              }`}
            >
              Remove Balance
            </button>
          </div>

          <form onSubmit={handleBalanceSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Wallet Code</label>
              <Input
                placeholder="ML-XXXX-XXXX"
                value={balanceForm.walletCode}
                onChange={(e) => setBalanceForm({ ...balanceForm, walletCode: e.target.value })}
                className="h-11 rounded-xl font-mono text-sm mt-1"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-muted-foreground">Amount</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="100.00"
                  value={balanceForm.amount}
                  onChange={(e) => setBalanceForm({ ...balanceForm, amount: e.target.value })}
                  className="h-11 rounded-xl mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Currency</label>
                <Select
                  value={balanceForm.currency}
                  onValueChange={(v) => setBalanceForm({ ...balanceForm, currency: v as CurrencyCode })}
                >
                  <SelectTrigger className="h-11 rounded-xl mt-1">
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
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground">Reason / Audit Note</label>
              <Input
                placeholder="Administrative adjustment reason..."
                value={balanceForm.reason}
                onChange={(e) => setBalanceForm({ ...balanceForm, reason: e.target.value })}
                className="h-11 rounded-xl text-xs mt-1"
              />
            </div>

            <button
              disabled={balanceBusy}
              className={`w-full h-11 rounded-full font-bold text-sm shadow-soft transition-all cursor-pointer ${
                balanceForm.type === "add"
                  ? "bg-primary text-primary-foreground"
                  : "bg-destructive text-destructive-foreground"
              }`}
            >
              {balanceBusy ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : balanceForm.type === "add" ? (
                "Credit Wallet Balance"
              ) : (
                "Debit Wallet Balance"
              )}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: GLOBAL SEARCH */}
      {activeTab === "search" && (
        <div className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGlobalSearch();
            }}
            className="flex gap-2 max-w-md"
          >
            <Input
              placeholder="Search wallet ID, email, reference or name..."
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
              className="h-11 rounded-xl text-xs"
            />
            <button
              disabled={searchingGlobal}
              className="px-5 rounded-full bg-primary text-primary-foreground font-bold text-xs cursor-pointer shrink-0"
            >
              {searchingGlobal ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </button>
          </form>

          <div className="space-y-6 pt-2">
            {searchResults.users.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-foreground">Matching Users</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {searchResults.users.map((u) => (
                    <div key={u.id} className="border rounded-2xl p-3 bg-card text-xs space-y-1">
                      <p className="font-bold text-foreground">{u.full_name}</p>
                      <p className="text-muted-foreground">{u.email}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchResults.withdrawals.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-foreground">Matching Withdrawals</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {searchResults.withdrawals.map((w) => (
                    <div key={w.id} className="border rounded-2xl p-3 bg-card text-xs space-y-1">
                      <p className="font-mono font-bold text-primary">{w.reference}</p>
                      <p className="text-foreground">{w.full_name} · {formatMoney(Number(w.amount), w.currency)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchResults.transactions.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-foreground">Matching Transactions</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {searchResults.transactions.map((t) => (
                    <div key={t.id} className="border rounded-2xl p-3 bg-card text-xs space-y-1">
                      <p className="font-mono font-bold text-emerald-600">{t.reference}</p>
                      <p className="text-foreground">{t.sender_name} &rarr; {t.recipient_name}</p>
                      <p className="font-semibold">{formatMoney(Number(t.amount), t.currency)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: ADMIN ACTIVITY */}
      {activeTab === "activity" && (
        <div className="space-y-3">
          {loadingActivities ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="divide-y border rounded-3xl bg-card overflow-hidden">
              {activities.map((act) => (
                <div key={act.id} className="p-4 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground uppercase tracking-wider">
                      {act.action}
                    </span>
                    <span className="text-muted-foreground text-[10px]">
                      {new Date(act.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="font-mono text-muted-foreground text-[11px]">
                    {JSON.stringify(act.details)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* WITHDRAWAL DETAIL DIALOG */}
      <Dialog open={!!selectedWd} onOpenChange={() => setSelectedWd(null)}>
        {selectedWd && (
          <DialogContent className="max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)] max-w-md rounded-3xl p-5 sm:p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Withdrawal Details</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-mono">
                {selectedWd.reference}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 text-xs divide-y border-t border-b py-2">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">User:</span>
                <span className="font-semibold">{selectedWd.full_name}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-semibold">{selectedWd.email}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold text-foreground">
                  {formatMoney(Number(selectedWd.amount), selectedWd.currency)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Method:</span>
                <span className="font-semibold">{selectedWd.method}</span>
              </div>
              {selectedWd.upi_id && (
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">UPI ID / VPA:</span>
                  <span className="font-mono font-bold text-primary">{selectedWd.upi_id}</span>
                </div>
              )}
              {selectedWd.provider && (
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Provider:</span>
                  <span className="font-semibold">{selectedWd.provider}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Current Status:</span>
                <span className="font-bold uppercase text-primary">{selectedWd.status}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-foreground">Update Status Reason (Mandatory)</label>
              <Input
                placeholder="Reason for administrative status update..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />

              <div className="grid grid-cols-2 gap-2 pt-2">
                {["SUCCESSFUL", "FAILED", "ON HOLD", "UNDER REVIEW", "CANCELLED"].map((st) => (
                  <button
                    key={st}
                    disabled={statusBusy || selectedWd.status === st}
                    onClick={() => handleUpdateWithdrawalStatus(st)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      st === "SUCCESSFUL"
                        ? "bg-emerald-500 text-white hover:bg-emerald-600"
                        : st === "FAILED" || st === "CANCELLED"
                          ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          : "bg-amber-500 text-white hover:bg-amber-600"
                    } disabled:opacity-40`}
                  >
                    Set {st}
                  </button>
                ))}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* USER DRILL DOWN DIALOG */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        {selectedUser && (
          <DialogContent className="max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)] max-w-lg rounded-3xl p-5 sm:p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">{selectedUser.full_name}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {selectedUser.email} · {selectedUser.wallet_code}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl border bg-secondary/30 p-3">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Balance (USD)</p>
                <p className="text-lg font-extrabold text-foreground mt-0.5">
                  ${Number(selectedUser.balance_usd).toFixed(2)}
                </p>
              </div>
              <div className="rounded-2xl border bg-secondary/30 p-3">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Freeze Status</p>
                <p
                  className={`text-lg font-extrabold mt-0.5 ${
                    selectedUser.is_frozen ? "text-destructive" : "text-emerald-600"
                  }`}
                >
                  {selectedUser.is_frozen ? "FROZEN" : "ACTIVE"}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Transaction &amp; Withdrawal History
              </h4>

              {loadingUserTx ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(userTxHistory as any)?.withdrawals?.map((w: any) => (
                    <div key={w.id} className="border rounded-2xl p-2.5 text-xs flex justify-between items-center">
                      <div>
                        <p className="font-bold text-foreground">Withdrawal ({w.method})</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{w.reference}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">{formatMoney(Number(w.amount), w.currency)}</p>
                        <p className="text-[10px] font-bold text-primary">{w.status}</p>
                      </div>
                    </div>
                  ))}

                  {(userTxHistory as any)?.transactions?.map((t: any) => (
                    <div key={t.id} className="border rounded-2xl p-2.5 text-xs flex justify-between items-center">
                      <div>
                        <p className="font-bold text-foreground">{t.kind}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{t.reference}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">{formatMoney(Number(t.amount), t.currency)}</p>
                        <p className="text-[10px] text-emerald-600 font-semibold">{t.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
