// supabase/functions/send-transactional-email/index.ts
// Authoritative Supabase Edge Function for real transactional email delivery via Resend

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import {
  generateEmailHtml,
  getEmailSubject,
  type EmailEventType,
  type TransactionEmailData,
} from "./templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestBody {
  eventType: EmailEventType;
  transactionId?: string;
  withdrawalId?: string;
  recipientUserId?: string; // Optional: used by internal server functions for cross-user notifications
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
  const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "Moonlight <onboarding@resend.dev>";
  const appUrl = Deno.env.get("APP_URL") || "https://moonlight-wallet.lovable.app";

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(
      "[EmailService] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment",
    );
    return new Response(
      JSON.stringify({
        error: "Edge function server configuration error: missing Supabase credentials.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Authoritative admin client (bypasses RLS for secure lookups and delivery recording)
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    // 1. Authenticate the caller
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing or invalid Authorization header." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();
    let authenticatedUserId: string | null = null;
    let isServiceRole = false;

    if (token === supabaseServiceKey) {
      isServiceRole = true;
    } else {
      const { data: authUserData, error: authUserErr } = await supabaseAdmin.auth.getUser(token);
      if (authUserErr || !authUserData?.user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: Invalid Supabase auth token." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      authenticatedUserId = authUserData.user.id;
    }

    // 2. Parse and validate payload
    const body: RequestBody = await req.json();
    const { eventType, transactionId, withdrawalId, recipientUserId } = body;

    const validEvents: EmailEventType[] = [
      "transfer_sent",
      "payment_received",
      "withdrawal_requested",
      "withdrawal_processing",
      "withdrawal_completed",
      "withdrawal_failed",
    ];

    if (!validEvents.includes(eventType)) {
      return new Response(JSON.stringify({ error: `Invalid eventType: ${eventType}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!transactionId && !withdrawalId) {
      return new Response(
        JSON.stringify({ error: "Either transactionId or withdrawalId must be provided." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.info(
      `[EmailService] Processing event='${eventType}', tx='${transactionId || "N/A"}', wd='${withdrawalId || "N/A"}', caller='${authenticatedUserId || "service_role"}'`,
    );

    // 3. Authoritative Database Lookups & Verification
    let targetUserId: string | null = null;
    let emailData: TransactionEmailData | null = null;
    let recordTxId: string | null = transactionId || null;
    let recordWdId: string | null = withdrawalId || null;

    if (eventType.startsWith("withdrawal")) {
      // Look up withdrawal record
      let wdQuery = supabaseAdmin.from("withdrawals").select("*");
      if (withdrawalId) {
        wdQuery = wdQuery.eq("id", withdrawalId);
      } else if (transactionId) {
        wdQuery = wdQuery.or(`id.eq.${transactionId},transaction_id.eq.${transactionId}`);
      }

      const { data: wd, error: wdErr } = await wdQuery.maybeSingle();

      if (wdErr || !wd) {
        return new Response(
          JSON.stringify({ error: "Authoritative withdrawal record not found." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      recordWdId = wd.id;
      recordTxId = wd.transaction_id || recordTxId;

      // Ownership security check
      if (!isServiceRole && authenticatedUserId && wd.user_id !== authenticatedUserId) {
        return new Response(
          JSON.stringify({
            error: "Forbidden: This withdrawal does not belong to the authenticated user.",
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      targetUserId = wd.user_id;

      // Calculate settlement timeframe (5–7 business days)
      const createdDate = new Date(wd.created_at);
      let count = 0;
      const targetArrival = new Date(createdDate);
      while (count < 7) {
        targetArrival.setDate(targetArrival.getDate() + 1);
        if (targetArrival.getDay() !== 0 && targetArrival.getDay() !== 6) count++;
      }
      const arrivalFormatted = `5–7 business days (est. ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(targetArrival)})`;

      const feeAmt = Number(wd.fee ?? Number(wd.amount) * 0.1);
      const netPayout = Number(wd.recipient_amount ?? Number(wd.amount) - feeAmt);

      emailData = {
        eventType,
        recipientEmail: "", // Will be filled from auth account
        amount: Number(wd.amount),
        currency: wd.currency || "USD",
        fee: feeAmt,
        netCredited: netPayout,
        paymentMethod: wd.method || wd.provider || "Corridor Rail",
        counterparty: wd.full_name,
        counterpartyCode: wd.upi_id || undefined,
        referenceId: wd.reference || wd.reference_code || `WD-${wd.id.slice(0, 8).toUpperCase()}`,
        dateStr: wd.created_at,
        statusText: wd.status,
        failureReason: wd.reason || undefined,
        actionUrl: `${appUrl}/withdrawals/${wd.id}`,
        settlementInfo: {
          currentStep:
            eventType === "withdrawal_processing"
              ? "Withdrawal is being processed"
              : eventType === "withdrawal_completed"
                ? "Final settlement & credited"
                : "Withdrawal request received",
          nextStep:
            eventType === "withdrawal_processing"
              ? "Settlement verification"
              : eventType === "withdrawal_completed"
                ? "Settled to beneficiary"
                : "Interbank transmission",
          estimatedArrival: arrivalFormatted,
        },
      };
    } else {
      // Transaction events: transfer_sent or payment_received
      const { data: tx, error: txErr } = await supabaseAdmin
        .from("transactions")
        .select("*")
        .eq("id", transactionId!)
        .maybeSingle();

      if (txErr || !tx) {
        return new Response(
          JSON.stringify({ error: "Authoritative transaction record not found." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Fetch wallet associations
      const [senderWalletRes, recipientWalletRes] = await Promise.all([
        tx.sender_wallet_id
          ? supabaseAdmin
              .from("wallets")
              .select("user_id, wallet_code")
              .eq("id", tx.sender_wallet_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        tx.recipient_wallet_id
          ? supabaseAdmin
              .from("wallets")
              .select("user_id, wallet_code")
              .eq("id", tx.recipient_wallet_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      const senderUserId = senderWalletRes.data?.user_id;
      const recipientTargetUserId = recipientWalletRes.data?.user_id || recipientUserId;

      if (eventType === "transfer_sent") {
        if (!isServiceRole && authenticatedUserId && senderUserId !== authenticatedUserId) {
          return new Response(
            JSON.stringify({
              error: "Forbidden: This transfer does not originate from the authenticated user.",
            }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        targetUserId = senderUserId || authenticatedUserId;

        const totalDebited = Number(tx.sender_debit ?? Number(tx.amount) + Number(tx.fee || 0));

        emailData = {
          eventType: "transfer_sent",
          recipientEmail: "",
          amount: Number(tx.amount),
          currency: tx.currency,
          fee: Number(tx.fee || 0),
          totalDebited,
          paymentMethod: tx.method || "Moonlight Transfer",
          counterparty: tx.recipient_name || tx.recipient_wallet_code || "Beneficiary",
          counterpartyCode: tx.recipient_wallet_code || undefined,
          referenceId: tx.reference || `MLT-${tx.id.slice(0, 8).toUpperCase()}`,
          dateStr: tx.created_at,
          statusText: tx.status,
          note: tx.note || undefined,
          actionUrl: `${appUrl}/transactions/${tx.id}`,
        };
      } else if (eventType === "payment_received") {
        // Payment received
        if (
          !isServiceRole &&
          authenticatedUserId &&
          recipientTargetUserId !== authenticatedUserId
        ) {
          return new Response(
            JSON.stringify({ error: "Forbidden: You are not the recipient of this transaction." }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        targetUserId = recipientTargetUserId || authenticatedUserId;

        const creditedAmt = Number(tx.recipient_amount ?? tx.amount);
        const creditedCur = tx.recipient_currency ?? tx.currency;

        emailData = {
          eventType: "payment_received",
          recipientEmail: "",
          amount: creditedAmt,
          currency: creditedCur,
          netCredited: creditedAmt,
          paymentMethod: tx.method || "Moonlight Transfer",
          counterparty: tx.sender_name || tx.sender_wallet_code || "Moonlight Financial",
          counterpartyCode: tx.sender_wallet_code || undefined,
          referenceId: tx.reference || `MLT-${tx.id.slice(0, 8).toUpperCase()}`,
          dateStr: tx.created_at,
          statusText: tx.status,
          note: tx.note || undefined,
          actionUrl: `${appUrl}/transactions/${tx.id}`,
        };
      }
    }

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: "Could not determine recipient user account." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 4. Retrieve the authoritative email directly from Supabase Auth
    const { data: authUser, error: authUserErr } =
      await supabaseAdmin.auth.admin.getUserById(targetUserId);

    let realEmail = authUser?.user?.email?.trim();

    // Fallback to profiles table if auth record email is null
    if (!realEmail) {
      const { data: prof } = await supabaseAdmin
        .from("profiles")
        .select("email")
        .eq("id", targetUserId)
        .maybeSingle();
      if (prof?.email) realEmail = prof.email.trim();
    }

    if (!realEmail) {
      console.warn(
        `[EmailService] Target user ${targetUserId} has no email address. Skipping email.`,
      );
      await supabaseAdmin.from("email_delivery_records").insert({
        user_id: targetUserId,
        transaction_id: recordTxId,
        withdrawal_id: recordWdId,
        event_type: eventType,
        recipient_email: "unavailable@unknown",
        status: "skipped",
        error_message: "Authenticated Supabase user has no email address on file.",
      });

      return new Response(
        JSON.stringify({
          success: false,
          reason: "no_email",
          message: "User account has no valid email address.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    emailData!.recipientEmail = realEmail;

    // 5. Idempotency Check: Don't send if already successfully sent
    let idempQuery = supabaseAdmin
      .from("email_delivery_records")
      .select("id, status, provider_message_id")
      .eq("event_type", eventType)
      .eq("recipient_email", realEmail)
      .eq("status", "sent");

    if (recordWdId) {
      idempQuery = idempQuery.eq("withdrawal_id", recordWdId);
    } else if (recordTxId) {
      idempQuery = idempQuery.eq("transaction_id", recordTxId);
    }

    const { data: existingSent } = await idempQuery.maybeSingle();

    if (existingSent) {
      console.info(
        `[EmailService] Idempotency: Email for event '${eventType}' already successfully sent to ${realEmail} (msgId=${existingSent.provider_message_id}).`,
      );
      return new Response(
        JSON.stringify({
          success: true,
          duplicate: true,
          message: "Email has already been sent for this event.",
          messageId: existingSent.provider_message_id,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 6. Generate polished HTML and Subject
    const subject = getEmailSubject(emailData!);
    const htmlBody = generateEmailHtml(emailData!);

    // 7. Verify Resend API Key is configured
    if (!resendApiKey) {
      console.warn(
        "[EmailService] RESEND_API_KEY is not configured in Supabase secrets. Recording failure record.",
      );
      await supabaseAdmin.from("email_delivery_records").insert({
        user_id: targetUserId,
        transaction_id: recordTxId,
        withdrawal_id: recordWdId,
        event_type: eventType,
        recipient_email: realEmail,
        status: "failed",
        error_message: "RESEND_API_KEY is not configured in Supabase secrets.",
      });

      return new Response(
        JSON.stringify({
          success: false,
          reason: "missing_api_key",
          message: "Email delivery deferred: RESEND_API_KEY secret is not set in Supabase.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 8. Execute Resend API request
    console.info(`[EmailService] Delivering '${subject}' to ${realEmail} via Resend...`);

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: [realEmail],
        subject,
        html: htmlBody,
      }),
    });

    const resendJson = await resendResponse.json().catch(() => ({}));

    if (!resendResponse.ok) {
      const errorMsg = resendJson?.message || `Resend API HTTP ${resendResponse.status}`;
      console.error(`[EmailService] Resend API delivery failed: ${errorMsg}`);

      await supabaseAdmin.from("email_delivery_records").insert({
        user_id: targetUserId,
        transaction_id: recordTxId,
        withdrawal_id: recordWdId,
        event_type: eventType,
        recipient_email: realEmail,
        status: "failed",
        error_message: errorMsg,
        metadata: { resendStatus: resendResponse.status, error: resendJson },
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMsg,
          resendStatus: resendResponse.status,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const providerMessageId = resendJson.id || null;
    console.info(
      `[EmailService] Successfully sent transactional email! Provider ID: ${providerMessageId}`,
    );

    // 9. Record successful delivery
    await supabaseAdmin.from("email_delivery_records").insert({
      user_id: targetUserId,
      transaction_id: recordTxId,
      withdrawal_id: recordWdId,
      event_type: eventType,
      recipient_email: realEmail,
      status: "sent",
      provider: "resend",
      provider_message_id: providerMessageId,
      sent_at: new Date().toISOString(),
      metadata: { resendId: providerMessageId },
    });

    // 10. Also handle recipient notification if this was a transfer between users!
    if (eventType === "transfer_sent" && recordTxId) {
      // In background, check if recipient can also receive payment_received email
      const { data: txRecord } = await supabaseAdmin
        .from("transactions")
        .select("recipient_wallet_id")
        .eq("id", recordTxId)
        .maybeSingle();

      if (txRecord?.recipient_wallet_id) {
        const { data: rw } = await supabaseAdmin
          .from("wallets")
          .select("user_id")
          .eq("id", txRecord.recipient_wallet_id)
          .maybeSingle();

        if (rw?.user_id && rw.user_id !== targetUserId) {
          // Trigger recipient email via internal self-call with service role
          fetch(req.url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${supabaseServiceKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              eventType: "payment_received",
              transactionId: recordTxId,
              recipientUserId: rw.user_id,
            }),
          }).catch((err) =>
            console.warn("[EmailService] Background recipient notify warning:", err),
          );
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: providerMessageId,
        recipient: realEmail,
        event: eventType,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Internal server error";
    console.error("[EmailService] Unhandled error:", errorMsg);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
