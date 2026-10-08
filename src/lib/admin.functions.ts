import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TOKEN_TTL_MS = 30 * 60 * 1000;
const MAX_FAILURES = 5;

async function hmac(message: string) {
  const secret =
    process.env["ADMIN_SESSION_SECRET"] || "moonlight-admin-session-secret-default-32bytes";
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(a: string, b: string) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++)
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

async function verifyToken(token: string, userId: string) {
  const [uid, exp, sig] = token.split(".");
  if (!uid || !exp || !sig || uid !== userId || Number(exp) < Date.now()) return false;
  return safeEqual(sig, await hmac(`${uid}.${exp}`));
}

export const verifyAdminCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ code: z.string().trim().min(1).max(32) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("audit_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .eq("event", "admin_code_failed")
      .gte("created_at", since);
    if ((count ?? 0) >= MAX_FAILURES) {
      return { ok: false as const, error: "Too many attempts. Try again in 15 minutes." };
    }
    const expected = process.env["ADMIN_ACCESS_CODE"] || "4336";
    if (!safeEqual(data.code, expected)) {
      await supabaseAdmin
        .from("audit_logs")
        .insert({ user_id: context.userId, event: "admin_code_failed" });
      return { ok: false as const, error: "That code isn't valid." };
    }
    await supabaseAdmin
      .from("audit_logs")
      .insert({ user_id: context.userId, event: "admin_access_granted" });
    const exp = String(Date.now() + TOKEN_TTL_MS);
    const token = `${context.userId}.${exp}.${await hmac(`${context.userId}.${exp}`)}`;
    return { ok: true as const, token };
  });

export const checkAdminToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ token: z.string().max(300) }).parse(d))
  .handler(async ({ data, context }) => ({ ok: await verifyToken(data.token, context.userId) }));

export const adminAddBalance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        token: z.string().max(300),
        walletCode: z
          .string()
          .trim()
          .regex(/^ML-[A-Z0-9]{4}-[A-Z0-9]{4}$/i, "Enter a wallet ID like ML-7F82-29AX"),
        currency: z.enum(["USD", "EUR", "GBP", "INR", "PHP", "SGD", "AUD", "CAD", "JPY", "CHF"]),
        amount: z.number().positive().max(100_000_000),
        reason: z.string().trim().min(3).max(200),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    if (!(await verifyToken(data.token, context.userId))) {
      throw new Error("Admin session expired. Enter the access code again.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: txId, error } = await supabaseAdmin.rpc("admin_credit", {
      p_actor: context.userId,
      p_wallet_code: data.walletCode.toUpperCase(),
      p_amount: data.amount,
      p_currency: data.currency,
      p_reason: data.reason,
    });
    if (error) throw new Error(error.message);

    // Trigger authoritative transactional email to recipient
    import("./email.server")
      .then(({ dispatchTransactionalEmailServer }) => {
        dispatchTransactionalEmailServer({
          eventType: "payment_received",
          transactionId: txId as string,
          isServiceRole: true,
        });
      })
      .catch((err) => console.warn("[Admin] Background balance credit email notice:", err));

    return { transactionId: txId as string };
  });

export const adminRemoveBalance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        token: z.string().max(300),
        walletCode: z
          .string()
          .trim()
          .regex(/^ML-[A-Z0-9]{4}-[A-Z0-9]{4}$/i, "Enter a wallet ID like ML-7F82-29AX"),
        currency: z.enum(["USD", "EUR", "GBP", "INR", "PHP", "SGD", "AUD", "CAD", "JPY", "CHF"]),
        amount: z.number().positive().max(100_000_000),
        reason: z.string().trim().min(3).max(200),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    if (!(await verifyToken(data.token, context.userId))) {
      throw new Error("Admin session expired. Enter the access code again.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: txId, error } = await supabaseAdmin.rpc("admin_debit", {
      p_actor: context.userId,
      p_wallet_code: data.walletCode.toUpperCase(),
      p_amount: data.amount,
      p_currency: data.currency,
      p_reason: data.reason,
    });
    if (error) throw new Error(error.message);
    return { transactionId: txId as string };
  });

export const adminSetFreeze = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        token: z.string().max(300),
        walletCode: z.string().trim(),
        freeze: z.boolean(),
        reason: z.string().trim().max(200).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    if (!(await verifyToken(data.token, context.userId))) {
      throw new Error("Admin session expired.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("admin_set_wallet_freeze", {
      p_actor: context.userId,
      p_wallet_code: data.walletCode.toUpperCase(),
      p_freeze: data.freeze,
      p_reason: data.reason || "",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Sets a wallet owner's region after validating the authenticated admin session.
 * Also attempts to update the profile country code and geography timestamp.
 * Throws when the admin token is invalid or the region update RPC fails.
 */
export const adminSetRegion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        token: z.string().max(300),
        walletCode: z.string().trim(),
        region: z.enum(["GLOBAL", "EUROPE", "INDIA", "PHILIPPINES"]),
        countryCode: z.string().trim().max(10).optional(),
        preferredCurrency: z.string().trim().max(10).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    if (!(await verifyToken(data.token, context.userId))) {
      throw new Error("Admin session expired.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("admin_set_profile_region", {
      p_actor: context.userId,
      p_wallet_code: data.walletCode.toUpperCase(),
      p_region: data.region,
    });
    if (error) throw new Error(error.message);

    // Also update country_code directly so the override takes immediate effect
    const countryCode =
      data.countryCode?.toUpperCase() ||
      (data.region === "INDIA"
        ? "IN"
        : data.region === "EUROPE"
          ? "DE"
          : data.region === "PHILIPPINES"
            ? "PH"
            : "IN");

    const preferredCurrency =
      data.preferredCurrency?.toUpperCase() ||
      (data.region === "INDIA"
        ? "INR"
        : data.region === "EUROPE"
          ? "EUR"
          : data.region === "PHILIPPINES"
            ? "PHP"
            : "USD");

    const { data: w } = await supabaseAdmin
      .from("wallets")
      .select("user_id")
      .eq("wallet_code", data.walletCode.toUpperCase())
      .maybeSingle();

    if (w?.user_id) {
      await supabaseAdmin
        .from("profiles")
        .update({
          region: data.region,
          country_code: countryCode,
          preferred_currency: preferredCurrency,
          admin_region_override: true,
          geography_updated_at: new Date().toISOString(),
        })
        .eq("id", w.user_id);
    }

    return { ok: true, region: data.region, country_code: countryCode };
  });

export const adminListUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ token: z.string().max(300) }).parse(d))
  .handler(async ({ data, context }) => {
    if (!(await verifyToken(data.token, context.userId))) {
      throw new Error("Admin session expired.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: wallets, error: wErr } = await supabaseAdmin
      .from("wallets")
      .select("id, wallet_code, balance_usd, status, created_at, user_id");
    if (wErr) throw new Error(wErr.message);

    const { data: profiles, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, region, country_code, preferred_currency, created_at, admin_region_override");
    if (pErr) throw new Error(pErr.message);

    const { data: txs } = await supabaseAdmin
      .from("transactions")
      .select("sender_wallet_id, recipient_wallet_id");

    const merged = (wallets || []).map((w) => {
      const p = (profiles || []).find((prof) => prof.id === w.user_id);
      const userTxs = (txs || []).filter(
        (t) => t.sender_wallet_id === w.id || t.recipient_wallet_id === w.id,
      ).length;

      const userCreatedAt = p?.created_at || w.created_at;
      const ageMs = Date.now() - new Date(userCreatedAt).getTime();
      const ageHours = Math.max(0, Math.floor(ageMs / (1000 * 60 * 60)));
      const ageDays = Math.floor(ageHours / 24);

      const isExplicitOverride = Boolean(
        (p as { admin_region_override?: boolean | null } | null)?.admin_region_override,
      );
      const displayRegion = isExplicitOverride ? p?.region || "INDIA" : "INDIA";

      return {
        id: w.id,
        user_id: w.user_id,
        wallet_code: w.wallet_code,
        balance_usd: w.balance_usd,
        status: w.status,
        is_frozen: w.status === "frozen",
        full_name: p?.full_name || "N/A",
        email: p?.email || "N/A",
        region: displayRegion,
        country_code: p?.country_code || (displayRegion === "EUROPE" ? "DE" : displayRegion === "PHILIPPINES" ? "PH" : "IN"),
        preferred_currency: p?.preferred_currency || (displayRegion === "EUROPE" ? "EUR" : displayRegion === "PHILIPPINES" ? "PHP" : "INR"),
        is_admin_region: isExplicitOverride,
        created_at: userCreatedAt,
        account_age_hours: ageHours,
        account_age_days: ageDays,
        activity_count: userTxs,
      };
    });

    return { users: merged };
  });

export const adminSetAccountAge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        token: z.string().max(300),
        userId: z.string().uuid(),
        createdAtISO: z.string(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    if (!(await verifyToken(data.token, context.userId))) {
      throw new Error("Admin session expired.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const newCreatedAt = new Date(data.createdAtISO).toISOString();

    const { error: pErr } = await supabaseAdmin
      .from("profiles")
      .update({ created_at: newCreatedAt })
      .eq("id", data.userId);

    if (pErr) throw new Error(pErr.message);

    await supabaseAdmin
      .from("wallets")
      .update({ created_at: newCreatedAt })
      .eq("user_id", data.userId);

    await supabaseAdmin.from("audit_logs").insert({
      user_id: context.userId,
      event: "admin_set_account_age",
      details: { target_user_id: data.userId, new_created_at: newCreatedAt },
    });

    return { ok: true, created_at: newCreatedAt };
  });

export const adminListWithdrawals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ token: z.string().max(300) }).parse(d))
  .handler(async ({ data, context }) => {
    if (!(await verifyToken(data.token, context.userId))) {
      throw new Error("Admin session expired.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: withdrawals, error } = await supabaseAdmin
      .from("withdrawals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("adminListWithdrawals warning:", error.message);
      return { withdrawals: [] };
    }
    return { withdrawals: withdrawals || [] };
  });

export const adminUpdateWithdrawalStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        token: z.string().max(300),
        withdrawalId: z.string().uuid(),
        newStatus: z.enum([
          "PROCESSING",
          "SUCCESSFUL",
          "FAILED",
          "ON HOLD",
          "UNDER REVIEW",
          "CANCELLED",
        ]),
        reason: z.string().trim().max(200).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    if (!(await verifyToken(data.token, context.userId))) {
      throw new Error("Admin session expired.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await supabaseAdmin.rpc("admin_update_withdrawal_status", {
      p_actor: context.userId,
      p_withdrawal_id: data.withdrawalId,
      p_new_status: data.newStatus,
      p_reason: data.reason || "",
    });

    if (error) throw new Error(error.message);

    // Persist custom note / reason directly to withdrawals and linked transaction
    if (data.reason !== undefined) {
      const cleanReason = data.reason.trim() || null;
      await supabaseAdmin
        .from("withdrawals")
        .update({ reason: cleanReason, updated_at: new Date().toISOString() })
        .eq("id", data.withdrawalId);

      const { data: wd } = await supabaseAdmin
        .from("withdrawals")
        .select("transaction_id")
        .eq("id", data.withdrawalId)
        .maybeSingle();

      if (wd?.transaction_id) {
        await supabaseAdmin
          .from("transactions")
          .update({ note: cleanReason })
          .eq("id", wd.transaction_id);
      }
    }

    // Trigger authoritative transactional email based on updated status
    let eventType:
      | "withdrawal_processing"
      | "withdrawal_completed"
      | "withdrawal_failed"
      | "withdrawal_kyc_required"
      | null = null;
    if (data.newStatus === "PROCESSING") {
      eventType = "withdrawal_processing";
    } else if (data.newStatus === "SUCCESSFUL") {
      eventType = "withdrawal_completed";
    } else if (data.newStatus === "FAILED" || data.newStatus === "CANCELLED") {
      eventType = "withdrawal_failed";
    } else if (data.newStatus === "ON HOLD" || data.newStatus === "UNDER REVIEW") {
      eventType = "withdrawal_kyc_required";
    }

    if (eventType) {
      import("./email.server")
        .then(({ dispatchTransactionalEmailServer }) => {
          dispatchTransactionalEmailServer({
            eventType,
            withdrawalId: data.withdrawalId,
            isServiceRole: true,
          });
        })
        .catch((err) => console.warn("[Admin] Background withdrawal status email notice:", err));
    }

    return { ok: true, result };
  });

export const adminUpdateWithdrawalNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        token: z.string().max(300),
        withdrawalId: z.string().uuid(),
        note: z.string().trim().max(300),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    if (!(await verifyToken(data.token, context.userId))) {
      throw new Error("Admin session expired.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cleanNote = data.note.trim() || null;

    await supabaseAdmin
      .from("withdrawals")
      .update({ reason: cleanNote, updated_at: new Date().toISOString() })
      .eq("id", data.withdrawalId);

    const { data: wd } = await supabaseAdmin
      .from("withdrawals")
      .select("transaction_id, wallet_id")
      .eq("id", data.withdrawalId)
      .maybeSingle();

    if (wd?.transaction_id) {
      await supabaseAdmin
        .from("transactions")
        .update({ note: cleanNote })
        .eq("id", wd.transaction_id);
    }

    await supabaseAdmin.from("admin_actions").insert({
      actor_user_id: context.userId,
      action: "withdrawal_custom_note",
      target_wallet_id: wd?.wallet_id || null,
      transaction_id: wd?.transaction_id || null,
      details: { withdrawal_id: data.withdrawalId, note: cleanNote },
    });

    return { ok: true, note: cleanNote };
  });

export const adminOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ token: z.string().max(300) }).parse(d))
  .handler(async ({ data, context }) => {
    if (!(await verifyToken(data.token, context.userId))) throw new Error("Admin session expired.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
    const [w, u, n, t, recentTx, acts, wdTotal, wdProc] = await Promise.all([
      supabaseAdmin.from("wallets").select("balance_usd, status"),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekAgo),
      supabaseAdmin.from("transactions").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("transactions")
        .select("id, reference, kind, sender_name, recipient_name, amount, currency, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
      supabaseAdmin
        .from("admin_actions")
        .select("id, action, details, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
      supabaseAdmin.from("withdrawals").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("withdrawals")
        .select("id", { count: "exact", head: true })
        .eq("status", "PROCESSING"),
    ]);
    const wallets = w.data || [];
    return {
      totalUsers: u.count ?? 0,
      newSignups: n.count ?? 0,
      totalBalanceUsd: wallets.reduce((a, x) => a + Number(x.balance_usd), 0),
      frozen: wallets.filter((x) => x.status === "frozen").length,
      totalTransactions: t.count ?? 0,
      totalWithdrawals: wdTotal.error ? 0 : (wdTotal.count ?? 0),
      pendingWithdrawals: wdProc.error ? 0 : (wdProc.count ?? 0),
      recentTransactions: recentTx.data || [],
      recentActions: acts.data || [],
    };
  });

export const adminListTransactions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        token: z.string().max(300),
        kind: z.string().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(25),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    if (!(await verifyToken(data.token, context.userId))) {
      throw new Error("Admin session expired.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let query = supabaseAdmin
      .from("transactions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (data.kind && data.kind !== "all") {
      query = query.eq("kind", data.kind);
    }
    if (data.status && data.status !== "all") {
      query = query.eq("status", data.status);
    }
    if (data.search && data.search.trim()) {
      const q = `%${data.search.trim()}%`;
      query = query.or(
        `reference.ilike.${q},sender_name.ilike.${q},recipient_name.ilike.${q},note.ilike.${q},recipient_wallet_code.ilike.${q}`,
      );
    }

    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    const { data: rows, count, error } = await query.range(from, to);

    if (error) {
      console.warn("adminListTransactions error:", error.message);
      return { transactions: [], count: 0 };
    }

    return { transactions: rows || [], count: count ?? 0 };
  });

export const adminGlobalSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        token: z.string().max(300),
        query: z.string().trim().min(1).max(100),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    if (!(await verifyToken(data.token, context.userId))) {
      throw new Error("Admin session expired.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const raw = data.query.trim();
    const pattern = `%${raw}%`;

    const [profilesRes, walletsRes, withdrawalsRes, transactionsRes] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, full_name, email, preferred_currency, region, created_at")
        .or(`full_name.ilike.${pattern},email.ilike.${pattern}`)
        .limit(10),
      supabaseAdmin
        .from("wallets")
        .select("id, user_id, wallet_code, balance_usd, status")
        .ilike("wallet_code", pattern)
        .limit(10),
      supabaseAdmin
        .from("withdrawals")
        .select("*")
        .or(
          `reference.ilike.${pattern},full_name.ilike.${pattern},upi_id.ilike.${pattern},email.ilike.${pattern}`,
        )
        .order("created_at", { ascending: false })
        .limit(10),
      supabaseAdmin
        .from("transactions")
        .select("*")
        .or(
          `reference.ilike.${pattern},recipient_name.ilike.${pattern},sender_name.ilike.${pattern},note.ilike.${pattern}`,
        )
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    type SearchUser = {
      id: string;
      full_name?: string;
      email?: string;
      preferred_currency?: string;
      region?: string;
      created_at?: string;
      wallet_code?: string;
      balance_usd?: number;
      status?: string;
    };

    const userMap = new Map<string, SearchUser>();
    (profilesRes.data || []).forEach((p) => {
      userMap.set(p.id, { ...p });
    });
    (walletsRes.data || []).forEach((w) => {
      const existing = userMap.get(w.user_id);
      if (!existing) {
        userMap.set(w.user_id, {
          id: w.user_id,
          wallet_code: w.wallet_code,
          balance_usd: w.balance_usd,
          status: w.status,
        });
      } else {
        userMap.set(w.user_id, {
          ...existing,
          wallet_code: w.wallet_code,
          balance_usd: w.balance_usd,
          status: w.status,
        });
      }
    });

    return {
      users: Array.from(userMap.values()),
      withdrawals: withdrawalsRes.data || [],
      transactions: transactionsRes.data || [],
    };
  });

export const adminListAuditLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        token: z.string().max(300),
        limit: z.number().int().min(1).max(200).default(50),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    if (!(await verifyToken(data.token, context.userId))) {
      throw new Error("Admin session expired.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [auditRes, adminActionsRes] = await Promise.all([
      supabaseAdmin
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(data.limit),
      supabaseAdmin
        .from("admin_actions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(data.limit),
    ]);

    return {
      auditLogs: auditRes.data || [],
      adminActions: adminActionsRes.data || [],
    };
  });

export const adminListKyc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ token: z.string().max(300) }).parse(d))
  .handler(async ({ data, context }) => {
    if (!(await verifyToken(data.token, context.userId))) throw new Error("Admin session expired.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("kyc_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    const ids = [...new Set((rows ?? []).map((r) => r.user_id))];
    const { data: profs } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, full_name, email").in("id", ids)
      : { data: [] };
    const pm = new Map((profs ?? []).map((p) => [p.id, p]));
    const items = await Promise.all(
      (rows ?? []).map(async (r) => {
        const [s, d] = await Promise.all([
          supabaseAdmin.storage.from("kyc").createSignedUrl(r.selfie_path, 600),
          supabaseAdmin.storage.from("kyc").createSignedUrl(r.doc_path, 600),
        ]);
        const p = pm.get(r.user_id);
        return {
          ...r,
          full_name: p?.full_name ?? "",
          email: p?.email ?? "",
          selfie_url: s.data?.signedUrl ?? null,
          doc_url: d.data?.signedUrl ?? null,
        };
      }),
    );
    return { items };
  });

export const adminReviewKyc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        token: z.string().max(300),
        id: z.string().uuid(),
        decision: z.enum(["approved", "rejected"]),
        note: z.string().trim().max(300).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    if (!(await verifyToken(data.token, context.userId))) throw new Error("Admin session expired.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("kyc_submissions")
      .update({ status: data.decision, review_note: data.note || null, reviewed_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("admin_actions").insert({
      actor_user_id: context.userId,
      action: `kyc_${data.decision}`,
      details: { kyc_id: data.id, note: data.note ?? null },
    });
    return { ok: true };
  });
