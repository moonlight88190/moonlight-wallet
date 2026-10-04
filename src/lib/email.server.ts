// src/lib/email.server.ts
// Server-side authoritative email delivery handler and Resend integration

import type { EmailEventType, TransactionEmailData } from "./email-templates";
import { generateEmailHtml, getEmailSubject } from "./email-templates";

interface DispatchEmailParams {
  eventType: EmailEventType;
  transactionId?: string | undefined;
  withdrawalId?: string | undefined;
  recipientUserId?: string | undefined;
  authenticatedUserId?: string | undefined;
  isServiceRole?: boolean | undefined;
}

export async function dispatchTransactionalEmailServer(params: DispatchEmailParams) {
  const {
    eventType,
    transactionId,
    withdrawalId,
    recipientUserId,
    authenticatedUserId,
    isServiceRole,
  } = params;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const resendApiKey = process.env["RESEND_API_KEY"] || "";
  const resendFromEmail = process.env["RESEND_FROM_EMAIL"] || "Moonlight <onboarding@resend.dev>";
  const appUrl =
    process.env["APP_URL"] ||
    process.env["VITE_SITE_URL"] ||
    "https://moonlight-wallet.lovable.app";

  try {
    let targetUserId: string | null = recipientUserId || null;
    let emailData: TransactionEmailData | null = null;
    let recordTxId: string | null = transactionId || null;
    let recordWdId: string | null = withdrawalId || null;

    if (eventType.startsWith("withdrawal")) {
      let wdQuery = supabaseAdmin.from("withdrawals").select("*");
      if (withdrawalId) {
        wdQuery = wdQuery.eq("id", withdrawalId);
      } else if (transactionId) {
        wdQuery = wdQuery.or(`id.eq.${transactionId},transaction_id.eq.${transactionId}`);
      }

      const { data: wd, error: wdErr } = await wdQuery.maybeSingle();
      if (wdErr || !wd) {
        console.warn(
          "[EmailServer] Withdrawal record not found for email dispatch:",
          withdrawalId || transactionId,
        );
        return { success: false, error: "Withdrawal record not found" };
      }

      recordWdId = wd.id;
      recordTxId = wd.transaction_id || recordTxId;

      if (!isServiceRole && authenticatedUserId && wd.user_id !== authenticatedUserId) {
        console.error(
          "[EmailServer] Unauthorized attempt to access another user's withdrawal email",
        );
        return { success: false, error: "Forbidden: user mismatch" };
      }

      targetUserId = wd.user_id;

      // Settlement timeframe (5–7 business days)
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
        recipientEmail: "",
        amount: Number(wd.amount),
        currency: wd.currency || "USD",
        fee: feeAmt,
        netCredited: netPayout,
        paymentMethod: wd.method || wd.provider || "Corridor Rail",
        counterparty: wd.full_name,
        counterpartyCode: wd.upi_id || undefined,
        referenceId: wd.reference || `WD-${wd.id.slice(0, 8).toUpperCase()}`,
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
        console.warn(
          "[EmailServer] Transaction record not found for email dispatch:",
          transactionId,
        );
        return { success: false, error: "Transaction record not found" };
      }

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
          return { success: false, error: "Forbidden: transfer sender mismatch" };
        }
        targetUserId = senderUserId || authenticatedUserId || null;

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
        if (
          !isServiceRole &&
          authenticatedUserId &&
          recipientTargetUserId !== authenticatedUserId
        ) {
          return { success: false, error: "Forbidden: recipient mismatch" };
        }
        targetUserId = recipientTargetUserId || authenticatedUserId || null;

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
      console.warn("[EmailServer] Could not determine target user ID for email.");
      return { success: false, error: "Target user ID not resolved" };
    }

    // Authoritative lookup of user email from Supabase Auth
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
    let realEmail = authUser?.user?.email?.trim();

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
        `[EmailServer] Target user ${targetUserId} has no email address. Skipping email.`,
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
      return { success: false, reason: "no_email" };
    }

    emailData!.recipientEmail = realEmail;

    // Idempotency verification: Do NOT send duplicate if already sent
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
        `[EmailServer] Idempotency: Event '${eventType}' already delivered to ${realEmail} (msgId=${existingSent.provider_message_id}).`,
      );
      return {
        success: true,
        duplicate: true,
        message: "Email already sent",
        messageId: existingSent.provider_message_id,
      };
    }

    const subject = getEmailSubject(emailData!);
    const htmlBody = generateEmailHtml(emailData!);

    if (!resendApiKey) {
      console.warn(
        "[EmailServer] RESEND_API_KEY is not configured in server environment. Recording delivery deferral.",
      );
      await supabaseAdmin.from("email_delivery_records").insert({
        user_id: targetUserId,
        transaction_id: recordTxId,
        withdrawal_id: recordWdId,
        event_type: eventType,
        recipient_email: realEmail,
        status: "failed",
        error_message: "RESEND_API_KEY environment variable is not configured.",
      });
      return { success: false, reason: "missing_api_key" };
    }

    // Deliver via Resend
    console.info(`[EmailServer] Sending '${subject}' to ${realEmail} via Resend...`);

    const resendRes = await fetch("https://api.resend.com/emails", {
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

    const resendJson = (await resendRes.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
    };

    if (!resendRes.ok) {
      const errorMsg = resendJson.message || `Resend API returned status ${resendRes.status}`;
      console.error(`[EmailServer] Resend delivery failed: ${errorMsg}`);
      await supabaseAdmin.from("email_delivery_records").insert({
        user_id: targetUserId,
        transaction_id: recordTxId,
        withdrawal_id: recordWdId,
        event_type: eventType,
        recipient_email: realEmail,
        status: "failed",
        error_message: errorMsg,
        metadata: { status: resendRes.status, error: resendJson },
      });
      return { success: false, error: errorMsg };
    }

    const providerMessageId = resendJson.id || null;
    console.info(
      `[EmailServer] Email delivered successfully! Provider Message ID: ${providerMessageId}`,
    );

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

    // If transfer_sent, notify recipient too
    if (eventType === "transfer_sent" && recordTxId) {
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
          dispatchTransactionalEmailServer({
            eventType: "payment_received",
            transactionId: recordTxId,
            recipientUserId: rw.user_id,
            isServiceRole: true,
          }).catch((err) =>
            console.warn("[EmailServer] Background recipient notify warning:", err),
          );
        }
      }
    }

    return {
      success: true,
      messageId: providerMessageId,
      recipient: realEmail,
      event: eventType,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal error";
    console.error("[EmailServer] Unexpected error in dispatchTransactionalEmailServer:", err);
    return { success: false, error: errorMsg };
  }
}
