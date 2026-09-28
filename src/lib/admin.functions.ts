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
  .validator((d) => z.object({ code: z.string().trim().min(1).max(32) }).parse(d))
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
    if (!expected || !safeEqual(data.code, expected)) {
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
  .validator((d) => z.object({ token: z.string().max(300) }).parse(d))
  .handler(async ({ data, context }) => ({ ok: await verifyToken(data.token, context.userId) }));

export const adminAddBalance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
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
    return { transactionId: txId as string };
  });

export const adminRemoveBalance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
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
  .validator((d) =>
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

export const adminSetRegion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        token: z.string().max(300),
        walletCode: z.string().trim(),
        region: z.enum(["GLOBAL", "EUROPE", "INDIA", "PHILIPPINES"]),
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
    return { ok: true };
  });

export const adminUpdateWithdrawalStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        token: z.string().max(300),
        withdrawalId: z.string().uuid(),
        status: z.enum([
          "PROCESSING",
          "SUCCESSFUL",
          "FAILED",
          "ON HOLD",
          "UNDER REVIEW",
          "CANCELLED",
        ]),
        reason: z.string().trim().min(3).max(200),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    if (!(await verifyToken(data.token, context.userId))) {
      throw new Error("Admin session expired.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("admin_update_withdrawal_status", {
      p_actor: context.userId,
      p_withdrawal_id: data.withdrawalId,
      p_new_status: data.status,
      p_reason: data.reason,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
