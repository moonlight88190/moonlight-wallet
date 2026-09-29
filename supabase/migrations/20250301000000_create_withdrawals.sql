-- 1. Create withdrawals table
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  amount NUMERIC(18, 4) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  amount_usd NUMERIC(18, 4) NOT NULL CHECK (amount_usd > 0),
  fee_usd NUMERIC(18, 4) NOT NULL DEFAULT 0,
  method TEXT NOT NULL,
  provider TEXT,
  upi_id TEXT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  reference_code TEXT NOT NULL UNIQUE DEFAULT ('WD-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8))),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Grants & RLS
GRANT SELECT, INSERT ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own withdrawals"
  ON public.withdrawals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own withdrawals"
  ON public.withdrawals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Security Definer RPC for creating withdrawals
CREATE OR REPLACE FUNCTION public.create_withdrawal(
  p_amount NUMERIC,
  p_currency TEXT,
  p_method TEXT,
  p_full_name TEXT,
  p_email TEXT,
  p_upi_id TEXT DEFAULT NULL,
  p_provider TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_wallet_id UUID;
  v_sender_name TEXT;
  v_sender_wallet_code TEXT;
  v_current_bal NUMERIC(18, 4);
  v_rate NUMERIC(18, 6) := 1.0;
  v_amount_usd NUMERIC(18, 4);
  v_withdrawal_id UUID;
  v_tx_id UUID;
  v_ref_code TEXT;
  v_account_created TIMESTAMPTZ;
  v_status TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify wallet and status
  SELECT id, wallet_code, balance_usd, status, created_at
  INTO v_wallet_id, v_sender_wallet_code, v_current_bal, v_status, v_account_created
  FROM public.wallets
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  -- Get sender name from profile
  SELECT full_name INTO v_sender_name
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_status = 'frozen' THEN
    RAISE EXCEPTION 'Account is temporarily restricted';
  END IF;

  -- 48h account check
  IF now() < (v_account_created + INTERVAL '48 hours') THEN
    RAISE EXCEPTION 'Withdrawals unlock 48 hours after account creation';
  END IF;

  -- Convert currency to USD
  IF UPPER(p_currency) != 'USD' THEN
    SELECT rate INTO v_rate
    FROM public.exchange_rates
    WHERE quote = UPPER(p_currency);

    IF v_rate IS NULL OR v_rate <= 0 THEN
      v_rate := 1.0;
    END IF;
    v_amount_usd := ROUND((p_amount / v_rate), 4);
  ELSE
    v_amount_usd := ROUND(p_amount, 4);
  END IF;

  IF v_amount_usd <= 0 THEN
    RAISE EXCEPTION 'Invalid withdrawal amount';
  END IF;

  IF v_current_bal < v_amount_usd THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Generate reference code
  v_ref_code := 'WD-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8));

  -- Deduct wallet balance
  UPDATE public.wallets
  SET balance_usd = balance_usd - v_amount_usd,
      updated_at = now()
  WHERE id = v_wallet_id;

  -- Insert withdrawal record
  INSERT INTO public.withdrawals (
    user_id, wallet_id, amount, currency, amount_usd,
    method, provider, upi_id, full_name, email, phone,
    reason, reference_code, status
  ) VALUES (
    v_user_id, v_wallet_id, p_amount, UPPER(p_currency), v_amount_usd,
    p_method, p_provider, p_upi_id, p_full_name, p_email, p_phone,
    p_reason, v_ref_code, 'pending'
  ) RETURNING id INTO v_withdrawal_id;

  -- Record transaction
  INSERT INTO public.transactions (
    sender_wallet_id, sender_name, sender_wallet_code,
    kind, amount, amount_usd, fee, fee_usd,
    currency, fx_rate, status,
    recipient_name, method, reference, note
  ) VALUES (
    v_wallet_id, COALESCE(v_sender_name, p_full_name), v_sender_wallet_code,
    'withdrawal', p_amount, v_amount_usd, 0, 0,
    UPPER(p_currency), v_rate, 'pending',
    COALESCE(p_upi_id, p_provider, p_method), p_method, v_ref_code,
    'Withdrawal via ' || p_method || ' (' || v_ref_code || ')'
  ) RETURNING id INTO v_tx_id;

  -- Record ledger entry
  INSERT INTO public.ledger_entries (
    wallet_id, transaction_id, entry_type, amount_usd,
    balance_after_usd
  ) VALUES (
    v_wallet_id, v_tx_id, 'debit', v_amount_usd,
    v_current_bal - v_amount_usd
  );

  RETURN v_withdrawal_id;
END;
$$;
