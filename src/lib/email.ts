// src/lib/email.ts
// Client-side transactional email trigger (asynchronous, non-blocking)

import { supabase } from "@/integrations/supabase/client";
import { sendTransactionalEmailServerFn } from "./email.functions";
import type { EmailEventType } from "./email-templates";

export interface TriggerEmailOptions {
  eventType: EmailEventType;
  transactionId?: string;
  withdrawalId?: string;
}

/**
 * Triggers an authoritative transactional email for an authenticated user's transaction/withdrawal.
 * Guaranteed non-blocking and safe: failures will be logged and recorded without breaking UI or financial flows.
 */
export async function triggerTransactionalEmail(opts: TriggerEmailOptions): Promise<void> {
  // Fire asynchronously in background
  Promise.resolve().then(async () => {
    try {
      // 1. Attempt Supabase Edge Function first
      const { data, error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          eventType: opts.eventType,
          transactionId: opts.transactionId,
          withdrawalId: opts.withdrawalId,
        },
      });

      if (!error && data?.success !== false) {
        // Successfully handled by Edge Function
        return;
      }

      // If Edge Function returned 404 (e.g. not deployed yet in current environment), fallback to server function
      const fallback = sendTransactionalEmailServerFn;
      await fallback({ data: opts });
    } catch (err) {
      console.warn("[TransactionalEmail] Non-blocking dispatch notice:", err);
    }
  });
}
