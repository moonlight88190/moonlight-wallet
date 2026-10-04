-- 0010_transactional_email_delivery_records.sql
-- Idempotent email delivery records for real transactional emails via Resend

CREATE TABLE IF NOT EXISTS public.email_delivery_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  withdrawal_id UUID REFERENCES public.withdrawals(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'transfer_sent',
    'payment_received',
    'withdrawal_requested',
    'withdrawal_processing',
    'withdrawal_completed',
    'withdrawal_failed'
  )),
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  provider TEXT NOT NULL DEFAULT 'resend',
  provider_message_id TEXT,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_delivery_tx_event_unique 
  ON public.email_delivery_records (transaction_id, event_type, recipient_email) 
  WHERE transaction_id IS NOT NULL AND status = 'sent';

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_delivery_wd_event_unique 
  ON public.email_delivery_records (withdrawal_id, event_type, recipient_email) 
  WHERE withdrawal_id IS NOT NULL AND status = 'sent';

CREATE INDEX IF NOT EXISTS idx_email_delivery_user_id ON public.email_delivery_records (user_id);
CREATE INDEX IF NOT EXISTS idx_email_delivery_tx_id ON public.email_delivery_records (transaction_id);
CREATE INDEX IF NOT EXISTS idx_email_delivery_wd_id ON public.email_delivery_records (withdrawal_id);

ALTER TABLE public.email_delivery_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own email delivery records" ON public.email_delivery_records;
CREATE POLICY "Users can view their own email delivery records"
  ON public.email_delivery_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT ON public.email_delivery_records TO authenticated;
GRANT ALL ON public.email_delivery_records TO service_role;
