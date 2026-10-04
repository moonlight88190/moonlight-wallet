// src/lib/email.functions.ts
// TanStack Start server functions for transactional email dispatch

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const sendTransactionalEmailServerFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        eventType: z.enum([
          "transfer_sent",
          "payment_received",
          "withdrawal_requested",
          "withdrawal_processing",
          "withdrawal_completed",
          "withdrawal_failed",
        ]),
        transactionId: z.string().uuid().optional(),
        withdrawalId: z.string().uuid().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { dispatchTransactionalEmailServer } = await import("./email.server");
    const result = await dispatchTransactionalEmailServer({
      eventType: data.eventType,
      transactionId: data.transactionId,
      withdrawalId: data.withdrawalId,
      authenticatedUserId: context.userId,
    });
    return result;
  });
