-- 0001_withdrawals_and_admin.sql

-- Add columns to wallets and profiles
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS is_frozen boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS region text NOT NULL DEFAULT 'GLOBAL' CHECK (region IN ('GLOBAL', 'EUROPE', 'INDIA', 'PHILIPPINES'));

-- WITHDRAWALS TABLE
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT ('MLW-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  amount numeric(20,6) NOT NULL CHECK (amount > 0),
  currency text NOT NULL,
  amount_usd numeric(20,6) NOT NULL CHECK (amount_usd > 0),
  fee numeric(20,6) NOT NULL DEFAULT 0,
  fee_usd numeric(20,6) NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'UPI Direct',
  upi_id text,
  provider text,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text,
  reason text,
  status text NOT NULL DEFAULT 'PROCESSING' CHECK (status IN ('PROCESSING','SUCCESSFUL','FAILED','ON HOLD','UNDER REVIEW','CANCELLED')),
  transaction_id uuid REFERENCES public.transactions(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_created ON public.withdrawals (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_wallet_created ON public.withdrawals (wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals (status);

GRANT SELECT, INSERT ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'withdrawals' AND policyname = 'own withdrawals read'
  ) THEN
    CREATE POLICY "own withdrawals read" ON public.withdrawals FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- UPDATE send_transfer RPC TO CHECK FOR FROZEN WALLETS
CREATE OR REPLACE FUNCTION public.send_transfer(p_recipient_code text, p_amount numeric, p_currency text, p_note text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s public.wallets; r public.wallets; sp public.profiles; rp public.profiles;
  send_rate numeric; recv_rate numeric; amt_usd numeric; fee numeric; fee_usd numeric; total_usd numeric;
  recv_amt numeric; tx_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 1000000000 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  IF p_note IS NOT NULL AND length(p_note) > 200 THEN RAISE EXCEPTION 'Note too long'; END IF;

  SELECT * INTO s FROM public.wallets WHERE user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found'; END IF;
  IF s.is_frozen THEN RAISE EXCEPTION 'Your account is frozen. Please contact support.'; END IF;
  IF s.status <> 'active' THEN RAISE EXCEPTION 'Wallet is not active'; END IF;

  SELECT * INTO r FROM public.wallets WHERE upper(wallet_code) = upper(trim(p_recipient_code)) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Recipient not found'; END IF;
  IF r.id = s.id THEN RAISE EXCEPTION 'You cannot send money to yourself'; END IF;
  IF r.is_frozen THEN RAISE EXCEPTION 'Recipient wallet is frozen'; END IF;

  SELECT * INTO sp FROM public.profiles WHERE id = s.user_id;
  SELECT * INTO rp FROM public.profiles WHERE id = r.user_id;
  SELECT rate INTO send_rate FROM public.exchange_rates WHERE quote = upper(p_currency);
  IF send_rate IS NULL THEN RAISE EXCEPTION 'Unsupported currency'; END IF;
  SELECT rate INTO recv_rate FROM public.exchange_rates WHERE quote = rp.preferred_currency;
  IF recv_rate IS NULL THEN recv_rate := 1; END IF;

  amt_usd := round(p_amount / send_rate, 6);
  fee := round(p_amount * 0.005, 6);
  fee_usd := round(fee / send_rate, 6);
  total_usd := amt_usd + fee_usd;
  IF s.balance_usd < total_usd THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
  recv_amt := round(amt_usd * recv_rate, 6);

  INSERT INTO public.transactions (kind, sender_wallet_id, recipient_wallet_id, sender_name, sender_wallet_code, recipient_name, recipient_wallet_code,
    amount, currency, amount_usd, fee, fee_usd, fx_rate, recipient_amount, recipient_currency, note)
  VALUES ('transfer', s.id, r.id, sp.full_name, s.wallet_code, rp.full_name, r.wallet_code,
    p_amount, upper(p_currency), amt_usd, fee, fee_usd, round(recv_rate / send_rate, 8), recv_amt, COALESCE(rp.preferred_currency,'USD'), NULLIF(trim(p_note),''))
  RETURNING id INTO tx_id;

  UPDATE public.wallets SET balance_usd = balance_usd - total_usd WHERE id = s.id RETURNING * INTO s;
  UPDATE public.wallets SET balance_usd = balance_usd + amt_usd WHERE id = r.id RETURNING * INTO r;
  INSERT INTO public.ledger_entries (wallet_id, transaction_id, entry_type, amount_usd, balance_after_usd) VALUES
    (s.id, tx_id, 'debit', total_usd, s.balance_usd), (r.id, tx_id, 'credit', amt_usd, r.balance_usd);
  INSERT INTO public.audit_logs (user_id, event, details) VALUES (auth.uid(), 'transfer_sent', jsonb_build_object('transaction_id', tx_id));
  RETURN tx_id;
END $$;
REVOKE ALL ON FUNCTION public.send_transfer(text, numeric, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_transfer(text, numeric, text, text) TO authenticated;

-- CREATE WITHDRAWAL RPC
CREATE OR REPLACE FUNCTION public.create_withdrawal(
  p_amount numeric,
  p_currency text,
  p_method text,
  p_upi_id text,
  p_provider text,
  p_full_name text,
  p_email text,
  p_phone text DEFAULT NULL,
  p_reason text DEFAULT NULL
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  w public.wallets;
  p public.profiles;
  rate_v numeric;
  amt_usd numeric;
  fee numeric := 0;
  fee_usd numeric := 0;
  total_usd numeric;
  wd_count int;
  wd_id uuid;
  tx_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Invalid withdrawal amount'; END IF;
  IF p_full_name IS NULL OR trim(p_full_name) = '' THEN RAISE EXCEPTION 'Full name is required'; END IF;
  IF p_email IS NULL OR trim(p_email) = '' THEN RAISE EXCEPTION 'Email is required'; END IF;

  -- Lock user wallet
  SELECT * INTO w FROM public.wallets WHERE user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found'; END IF;
  IF w.is_frozen THEN RAISE EXCEPTION 'Your wallet is frozen. Withdrawals are disabled.'; END IF;
  IF w.status <> 'active' THEN RAISE EXCEPTION 'Wallet is not active'; END IF;

  -- Lock user profile & check 48h account age
  SELECT * INTO p FROM public.profiles WHERE id = auth.uid();
  IF p.created_at > (now() - interval '48 hours') THEN
    RAISE EXCEPTION 'Withdrawals unlock 48 hours after account creation.';
  END IF;

  -- Exchange rate
  SELECT rate INTO rate_v FROM public.exchange_rates WHERE quote = upper(trim(p_currency));
  IF rate_v IS NULL THEN RAISE EXCEPTION 'Unsupported currency: %', p_currency; END IF;

  amt_usd := round(p_amount / rate_v, 6);
  total_usd := amt_usd + fee_usd;

  -- Check first withdrawal limit ($100 USD equivalent)
  SELECT count(*) INTO wd_count FROM public.withdrawals WHERE user_id = auth.uid();
  IF wd_count = 0 AND amt_usd > 100.000001 THEN
    RAISE EXCEPTION 'First withdrawal is limited to $100 USD equivalent.';
  END IF;

  -- Balance check
  IF w.balance_usd < total_usd THEN
    RAISE EXCEPTION 'Insufficient wallet balance for this withdrawal.';
  END IF;

  -- Insert transaction record
  INSERT INTO public.transactions (
    kind, status, sender_wallet_id, sender_name, sender_wallet_code,
    amount, currency, amount_usd, fee, fee_usd, fx_rate, recipient_amount, recipient_currency, method, note
  ) VALUES (
    'redemption', 'processing', w.id, p.full_name, w.wallet_code,
    p_amount, upper(p_currency), amt_usd, fee, fee_usd, 1, p_amount, upper(p_currency), COALESCE(NULLIF(trim(p_method),''), 'UPI Direct'), p_reason
  ) RETURNING id INTO tx_id;

  -- Create withdrawal record
  INSERT INTO public.withdrawals (
    user_id, wallet_id, amount, currency, amount_usd, fee, fee_usd,
    method, upi_id, provider, full_name, email, phone, reason, status, transaction_id
  ) VALUES (
    auth.uid(), w.id, p_amount, upper(p_currency), amt_usd, fee, fee_usd,
    COALESCE(NULLIF(trim(p_method),''), 'UPI Direct'), NULLIF(trim(p_upi_id),''), NULLIF(trim(p_provider),''),
    trim(p_full_name), trim(p_email), NULLIF(trim(p_phone),''), NULLIF(trim(p_reason),''), 'PROCESSING', tx_id
  ) RETURNING id INTO wd_id;

  -- Deduct wallet balance
  UPDATE public.wallets SET balance_usd = balance_usd - total_usd WHERE id = w.id RETURNING * INTO w;

  -- Write ledger entry
  INSERT INTO public.ledger_entries (wallet_id, transaction_id, entry_type, amount_usd, balance_after_usd)
  VALUES (w.id, tx_id, 'debit', total_usd, w.balance_usd);

  -- Audit log
  INSERT INTO public.audit_logs (user_id, event, details)
  VALUES (auth.uid(), 'withdrawal_created', jsonb_build_object('withdrawal_id', wd_id, 'amount', p_amount, 'currency', p_currency, 'amount_usd', amt_usd));

  RETURN wd_id;
END $$;
REVOKE ALL ON FUNCTION public.create_withdrawal(numeric, text, text, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_withdrawal(numeric, text, text, text, text, text, text, text, text) TO authenticated;

-- ADMIN UPDATE WITHDRAWAL STATUS RPC
CREATE OR REPLACE FUNCTION public.admin_update_withdrawal_status(
  p_actor uuid,
  p_withdrawal_id uuid,
  p_new_status text,
  p_reason text
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  wd public.withdrawals;
  w public.wallets;
  total_usd numeric;
  old_st text;
BEGIN
  IF p_withdrawal_id IS NULL THEN RAISE EXCEPTION 'Withdrawal ID is required'; END IF;
  IF p_new_status NOT IN ('PROCESSING','SUCCESSFUL','FAILED','ON HOLD','UNDER REVIEW','CANCELLED') THEN
    RAISE EXCEPTION 'Invalid withdrawal status: %', p_new_status;
  END IF;

  SELECT * INTO wd FROM public.withdrawals WHERE id = p_withdrawal_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawal record not found'; END IF;

  old_st := wd.status;
  IF old_st = p_new_status THEN
    RAISE EXCEPTION 'Withdrawal status is already %', p_new_status;
  END IF;

  SELECT * INTO w FROM public.wallets WHERE id = wd.wallet_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found'; END IF;

  total_usd := wd.amount_usd + wd.fee_usd;

  -- If status transitions to FAILED or CANCELLED from an active/held state, refund balance exactly once
  IF (p_new_status IN ('FAILED', 'CANCELLED')) AND (old_st IN ('PROCESSING', 'ON HOLD', 'UNDER REVIEW')) THEN
    UPDATE public.wallets SET balance_usd = balance_usd + total_usd WHERE id = w.id RETURNING * INTO w;

    IF wd.transaction_id IS NOT NULL THEN
      UPDATE public.transactions SET status = 'failed' WHERE id = wd.transaction_id;
      INSERT INTO public.ledger_entries (wallet_id, transaction_id, entry_type, amount_usd, balance_after_usd)
      VALUES (w.id, wd.transaction_id, 'credit', total_usd, w.balance_usd);
    END IF;
  ELSIF (p_new_status = 'SUCCESSFUL') AND (wd.transaction_id IS NOT NULL) THEN
    UPDATE public.transactions SET status = 'completed' WHERE id = wd.transaction_id;
  END IF;

  -- Update withdrawal status
  UPDATE public.withdrawals
  SET status = p_new_status, updated_at = now(), reason = COALESCE(p_reason, reason)
  WHERE id = wd.id;

  -- Admin action & audit log
  INSERT INTO public.admin_actions (actor_user_id, action, target_wallet_id, transaction_id, details)
  VALUES (
    p_actor, 'update_withdrawal_status', w.id, wd.transaction_id,
    jsonb_build_object('withdrawal_id', wd.id, 'old_status', old_st, 'new_status', p_new_status, 'reason', p_reason)
  );

  INSERT INTO public.audit_logs (user_id, event, details)
  VALUES (
    p_actor, 'admin_withdrawal_status_updated',
    jsonb_build_object('withdrawal_id', wd.id, 'old_status', old_st, 'new_status', p_new_status, 'reason', p_reason)
  );

  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.admin_update_withdrawal_status(uuid, uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_withdrawal_status(uuid, uuid, text, text) TO service_role;

-- ADMIN DEBIT BALANCE RPC
CREATE OR REPLACE FUNCTION public.admin_debit(
  p_actor uuid,
  p_wallet_code text,
  p_amount numeric,
  p_currency text,
  p_reason text
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  w public.wallets; wp public.profiles; rate_v numeric; amt_usd numeric; tx_id uuid;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  SELECT * INTO w FROM public.wallets WHERE upper(wallet_code) = upper(trim(p_wallet_code)) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found'; END IF;

  SELECT * INTO wp FROM public.profiles WHERE id = w.user_id;
  SELECT rate INTO rate_v FROM public.exchange_rates WHERE quote = upper(p_currency);
  IF rate_v IS NULL THEN RAISE EXCEPTION 'Unsupported currency'; END IF;

  amt_usd := round(p_amount / rate_v, 6);
  IF w.balance_usd < amt_usd THEN
    RAISE EXCEPTION 'Wallet balance (USD %) is less than debit amount (USD %)', w.balance_usd, amt_usd;
  END IF;

  INSERT INTO public.transactions (
    kind, status, sender_wallet_id, sender_name, sender_wallet_code, amount, currency, amount_usd, fx_rate, recipient_amount, recipient_currency, method, note
  ) VALUES (
    'redemption', 'completed', w.id, wp.full_name, w.wallet_code, p_amount, upper(p_currency), amt_usd, 1, p_amount, upper(p_currency), 'Admin balance removal', p_reason
  ) RETURNING id INTO tx_id;

  UPDATE public.wallets SET balance_usd = balance_usd - amt_usd WHERE id = w.id RETURNING * INTO w;

  INSERT INTO public.ledger_entries (wallet_id, transaction_id, entry_type, amount_usd, balance_after_usd)
  VALUES (w.id, tx_id, 'debit', amt_usd, w.balance_usd);

  INSERT INTO public.admin_actions (actor_user_id, action, target_wallet_id, transaction_id, details)
  VALUES (p_actor, 'remove_balance', w.id, tx_id, jsonb_build_object('amount', p_amount, 'currency', upper(p_currency), 'reason', p_reason));

  INSERT INTO public.audit_logs (user_id, event, details)
  VALUES (p_actor, 'admin_remove_balance', jsonb_build_object('transaction_id', tx_id, 'wallet', w.wallet_code));

  RETURN tx_id;
END $$;
REVOKE ALL ON FUNCTION public.admin_debit(uuid, text, numeric, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_debit(uuid, text, numeric, text, text) TO service_role;

-- ADMIN FREEZE / UNFREEZE RPC
CREATE OR REPLACE FUNCTION public.admin_set_wallet_freeze(
  p_actor uuid,
  p_wallet_code text,
  p_freeze boolean,
  p_reason text DEFAULT ''
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w public.wallets;
BEGIN
  SELECT * INTO w FROM public.wallets WHERE upper(wallet_code) = upper(trim(p_wallet_code)) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found'; END IF;

  UPDATE public.wallets SET is_frozen = p_freeze WHERE id = w.id;

  INSERT INTO public.admin_actions (actor_user_id, action, target_wallet_id, details)
  VALUES (p_actor, CASE WHEN p_freeze THEN 'freeze_wallet' ELSE 'unfreeze_wallet' END, w.id, jsonb_build_object('reason', p_reason));

  INSERT INTO public.audit_logs (user_id, event, details)
  VALUES (p_actor, CASE WHEN p_freeze THEN 'admin_freeze_wallet' ELSE 'admin_unfreeze_wallet' END, jsonb_build_object('wallet', w.wallet_code, 'reason', p_reason));

  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.admin_set_wallet_freeze(uuid, text, boolean, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_wallet_freeze(uuid, text, boolean, text) TO service_role;

-- ADMIN SET PROFILE REGION RPC
CREATE OR REPLACE FUNCTION public.admin_set_profile_region(
  p_actor uuid,
  p_wallet_code text,
  p_region text
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w public.wallets;
BEGIN
  IF p_region NOT IN ('GLOBAL', 'EUROPE', 'INDIA', 'PHILIPPINES') THEN
    RAISE EXCEPTION 'Invalid region: %', p_region;
  END IF;

  SELECT * INTO w FROM public.wallets WHERE upper(wallet_code) = upper(trim(p_wallet_code)) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found'; END IF;

  UPDATE public.profiles SET region = p_region WHERE id = w.user_id;

  INSERT INTO public.admin_actions (actor_user_id, action, target_wallet_id, details)
  VALUES (p_actor, 'set_region', w.id, jsonb_build_object('region', p_region));

  INSERT INTO public.audit_logs (user_id, event, details)
  VALUES (p_actor, 'admin_set_region', jsonb_build_object('wallet', w.wallet_code, 'region', p_region));

  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.admin_set_profile_region(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_profile_region(uuid, text, text) TO service_role;
