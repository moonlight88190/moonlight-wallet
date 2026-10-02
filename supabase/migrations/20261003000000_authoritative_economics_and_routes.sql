-- 20261003000000_authoritative_economics_and_routes.sql
-- Enforce authoritative 10% fee economics, 48h account clearance, $100 first-withdrawal limit,
-- persisted transaction routes, and geography metadata.

-- 1. Add route & sender_debit columns to transactions
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS route text NOT NULL DEFAULT 'moonlight',
  ADD COLUMN IF NOT EXISTS sender_debit numeric(20,6);

-- 2. Add route, recipient_amount, recipient_currency, fee columns to withdrawals
ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS route text NOT NULL DEFAULT 'upi',
  ADD COLUMN IF NOT EXISTS recipient_amount numeric(20,6),
  ADD COLUMN IF NOT EXISTS recipient_currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS fee numeric(20,6) NOT NULL DEFAULT 0;

-- 3. Add geography metadata columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country_code text DEFAULT 'DE',
  ADD COLUMN IF NOT EXISTS region text DEFAULT 'Europe',
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS geography_updated_at timestamptz;

-- 4. Authoritative send_transfer function
-- SEND ECONOMICS: 10% fee charged ON TOP of requested amount.
-- User sends 500 -> fee = 50 -> recipient receives 500 (converted via FX) -> sender loses 550.
CREATE OR REPLACE FUNCTION public.send_transfer(
  p_recipient_code text,
  p_amount numeric,
  p_currency text,
  p_note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.wallets;
  r public.wallets;
  sp public.profiles;
  rp public.profiles;
  send_rate numeric;
  recv_rate numeric;
  amt_usd numeric;
  fee numeric;
  fee_usd numeric;
  sender_debit numeric;
  total_usd numeric;
  recv_amt numeric;
  tx_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 1000000000 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  IF p_note IS NOT NULL AND length(p_note) > 200 THEN RAISE EXCEPTION 'Note too long'; END IF;

  SELECT * INTO s FROM public.wallets WHERE user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found'; END IF;

  SELECT * INTO r FROM public.wallets WHERE upper(wallet_code) = upper(trim(p_recipient_code)) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Recipient not found'; END IF;
  IF r.id = s.id THEN RAISE EXCEPTION 'You cannot send money to yourself'; END IF;

  SELECT * INTO sp FROM public.profiles WHERE id = s.user_id;
  SELECT * INTO rp FROM public.profiles WHERE id = r.user_id;

  SELECT rate INTO send_rate FROM public.exchange_rates WHERE quote = upper(p_currency);
  IF send_rate IS NULL THEN RAISE EXCEPTION 'Unsupported currency'; END IF;

  SELECT rate INTO recv_rate FROM public.exchange_rates WHERE quote = COALESCE(rp.preferred_currency, 'USD');
  IF recv_rate IS NULL THEN recv_rate := 1; END IF;

  -- Authoritative 10% transfer fee on top
  fee := round(p_amount * 0.10, 6);
  sender_debit := p_amount + fee;
  amt_usd := round(p_amount / send_rate, 6);
  fee_usd := round(fee / send_rate, 6);
  total_usd := amt_usd + fee_usd;

  IF s.balance_usd < total_usd THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  -- Recipient receives the full requested amount (converted via FX)
  recv_amt := round(amt_usd * recv_rate, 6);

  INSERT INTO public.transactions (
    kind,
    route,
    status,
    sender_wallet_id,
    recipient_wallet_id,
    sender_name,
    sender_wallet_code,
    recipient_name,
    recipient_wallet_code,
    amount,
    currency,
    amount_usd,
    fee,
    fee_usd,
    sender_debit,
    fx_rate,
    recipient_amount,
    recipient_currency,
    method,
    note
  )
  VALUES (
    'transfer',
    'moonlight',
    'completed',
    s.id,
    r.id,
    sp.full_name,
    s.wallet_code,
    rp.full_name,
    r.wallet_code,
    p_amount,
    upper(p_currency),
    amt_usd,
    fee,
    fee_usd,
    sender_debit,
    round(recv_rate / send_rate, 8),
    recv_amt,
    COALESCE(rp.preferred_currency, 'USD'),
    'Moonlight transfer',
    NULLIF(trim(p_note), '')
  )
  RETURNING id INTO tx_id;

  UPDATE public.wallets SET balance_usd = balance_usd - total_usd WHERE id = s.id RETURNING * INTO s;
  UPDATE public.wallets SET balance_usd = balance_usd + amt_usd WHERE id = r.id RETURNING * INTO r;

  INSERT INTO public.ledger_entries (wallet_id, transaction_id, entry_type, amount_usd, balance_after_usd)
  VALUES
    (s.id, tx_id, 'debit', total_usd, s.balance_usd),
    (r.id, tx_id, 'credit', amt_usd, r.balance_usd);

  INSERT INTO public.audit_logs (user_id, event, details)
  VALUES (auth.uid(), 'transfer_sent', jsonb_build_object('transaction_id', tx_id, 'route', 'moonlight', 'sender_debit', sender_debit));

  RETURN tx_id;
END;
$$;
REVOKE ALL ON FUNCTION public.send_transfer(text, numeric, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_transfer(text, numeric, text, text) TO authenticated;

-- 5. Authoritative create_withdrawal function
-- WITHDRAWAL ECONOMICS: 10% fee comes OUT OF requested amount.
-- User withdraws 500 -> fee = 50 -> net payout = 450 -> wallet debit = 500.
-- Server enforces 48-hour account clearance and $100 first-withdrawal limit.
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
  w public.wallets;
  wp public.profiles;
  source_rate numeric;
  dest_rate numeric;
  amt_usd numeric;
  fee numeric;
  fee_usd numeric;
  net_source numeric;
  net_payout numeric;
  dest_currency text;
  v_route text;
  tx_id uuid;
  wd_id uuid;
  ref text;
  prior_wd_count int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 100000000 THEN RAISE EXCEPTION 'Invalid amount'; END IF;

  SELECT * INTO w FROM public.wallets WHERE user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found'; END IF;
  IF w.status = 'frozen' THEN RAISE EXCEPTION 'Account is temporarily restricted'; END IF;

  SELECT * INTO wp FROM public.profiles WHERE id = w.user_id;

  -- 48-hour account clearance check
  IF now() < (wp.created_at + INTERVAL '48 hours') THEN
    RAISE EXCEPTION 'Withdrawals unlock 48 hours after account creation';
  END IF;

  -- Authoritative rates from exchange_rates
  SELECT rate INTO source_rate FROM public.exchange_rates WHERE quote = upper(p_currency);
  IF upper(p_currency) = 'USD' THEN source_rate := 1; END IF;
  IF source_rate IS NULL OR source_rate <= 0 THEN RAISE EXCEPTION 'Unsupported source currency'; END IF;

  dest_currency := upper(p_currency);
  dest_rate := source_rate;

  -- Derive route from method / provider
  v_route := CASE
    WHEN lower(p_method) LIKE '%bank%' THEN 'bank'
    WHEN lower(p_method) LIKE '%upi%' OR p_upi_id IS NOT NULL THEN 'upi'
    WHEN lower(p_method) LIKE '%sepa%' THEN 'sepa'
    WHEN lower(p_method) LIKE '%fast%' THEN 'fps'
    WHEN lower(p_method) LIKE '%voucher%' OR lower(p_method) LIKE '%gift%' THEN 'gift-card'
    ELSE 'external'
  END;

  -- Convert requested source amount to USD for balance and limit verification
  amt_usd := round(p_amount / source_rate, 6);

  -- First withdrawal $100 USD-equivalent limit check
  SELECT count(*) INTO prior_wd_count
  FROM public.withdrawals
  WHERE user_id = auth.uid() AND status NOT IN ('FAILED', 'CANCELLED', 'REJECTED');

  IF prior_wd_count = 0 AND amt_usd > 100.00 THEN
    RAISE EXCEPTION 'First withdrawal is limited to $100.00 USD equivalent';
  END IF;

  -- 10% fee comes OUT OF requested withdrawal amount
  fee := round(p_amount * 0.10, 6);
  net_source := p_amount - fee;
  fee_usd := round(fee / source_rate, 6);

  -- Payout in destination currency
  net_payout := round(net_source * (dest_rate / source_rate), 2);

  -- Balance check against full requested amount
  IF w.balance_usd < amt_usd THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  ref := 'MLW-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  -- Record transaction
  INSERT INTO public.transactions (
    kind,
    route,
    status,
    sender_wallet_id,
    sender_name,
    sender_wallet_code,
    recipient_name,
    amount,
    currency,
    amount_usd,
    fee,
    fee_usd,
    fx_rate,
    recipient_amount,
    recipient_currency,
    method,
    note
  )
  VALUES (
    'withdrawal',
    v_route,
    'processing',
    w.id,
    wp.full_name,
    w.wallet_code,
    left(COALESCE(p_full_name, p_upi_id, p_provider, p_method), 120),
    p_amount,
    upper(p_currency),
    amt_usd,
    fee,
    fee_usd,
    source_rate,
    net_payout,
    dest_currency,
    left(p_method, 60),
    ref
  )
  RETURNING id INTO tx_id;

  -- Debit wallet balance by requested amount
  UPDATE public.wallets SET balance_usd = balance_usd - amt_usd WHERE id = w.id RETURNING * INTO w;

  -- Write ledger entry
  INSERT INTO public.ledger_entries (wallet_id, transaction_id, entry_type, amount_usd, balance_after_usd)
  VALUES (w.id, tx_id, 'debit', amt_usd, w.balance_usd);

  -- Record withdrawal
  INSERT INTO public.withdrawals (
    user_id,
    wallet_id,
    transaction_id,
    amount,
    currency,
    amount_usd,
    fee,
    fee_usd,
    recipient_amount,
    recipient_currency,
    method,
    route,
    provider,
    upi_id,
    full_name,
    email,
    phone,
    reason,
    reference,
    status
  )
  VALUES (
    auth.uid(),
    w.id,
    tx_id,
    p_amount,
    upper(p_currency),
    amt_usd,
    fee,
    fee_usd,
    net_payout,
    dest_currency,
    left(p_method, 60),
    v_route,
    left(p_provider, 120),
    left(p_upi_id, 120),
    COALESCE(left(p_full_name, 120), ''),
    COALESCE(left(p_email, 200), ''),
    left(p_phone, 40),
    left(p_reason, 300),
    ref,
    'PROCESSING'
  )
  RETURNING id INTO wd_id;

  INSERT INTO public.audit_logs (user_id, event, details)
  VALUES (auth.uid(), 'withdrawal_created', jsonb_build_object('withdrawal_id', wd_id, 'route', v_route, 'amount', p_amount, 'net_payout', net_payout));

  RETURN wd_id;
END;
$$;
REVOKE ALL ON FUNCTION public.create_withdrawal(numeric, text, text, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_withdrawal(numeric, text, text, text, text, text, text, text, text) TO authenticated;
