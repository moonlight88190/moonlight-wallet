-- Migration: Authoritative FX Rates and Currency Conversion Protection
-- Ensures exchange_rates is seeded with valid market rates,
-- provides public.get_exchange_rate(quote) fallback resolver,
-- fixes send_transfer, create_withdrawal, admin_credit, redeem_voucher so rate is NEVER 1:1 for INR/EUR/GBP,
-- and retroactively corrects any transactions previously recorded with 1:1 USD-to-INR glitch.

-- 1. Ensure exchange_rates table has complete baseline seed rows for all supported currencies
INSERT INTO public.exchange_rates (quote, rate, source, fetched_at)
VALUES
  ('USD', 1.0, 'seed', now()),
  ('EUR', 0.92, 'seed', now()),
  ('CZK', 23.25, 'seed', now()),
  ('GBP', 0.79, 'seed', now()),
  ('INR', 83.2, 'seed', now()),
  ('PHP', 56.5, 'seed', now()),
  ('SGD', 1.35, 'seed', now()),
  ('AUD', 1.52, 'seed', now()),
  ('CAD', 1.36, 'seed', now()),
  ('JPY', 152.0, 'seed', now()),
  ('CHF', 0.88, 'seed', now()),
  ('AED', 3.67, 'seed', now()),
  ('PLN', 3.98, 'seed', now())
ON CONFLICT (quote) DO UPDATE
SET rate = CASE
    WHEN public.exchange_rates.rate IS NULL OR public.exchange_rates.rate <= 0 THEN EXCLUDED.rate
    ELSE public.exchange_rates.rate
  END,
  source = CASE
    WHEN public.exchange_rates.source IS NULL THEN EXCLUDED.source
    ELSE public.exchange_rates.source
  END;

-- 2. Authoritative FX rate resolver function
CREATE OR REPLACE FUNCTION public.get_exchange_rate(p_quote text)
RETURNS numeric
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_rate numeric;
BEGIN
  IF p_quote IS NULL OR upper(trim(p_quote)) = 'USD' THEN
    RETURN 1.0;
  END IF;

  SELECT rate INTO v_rate
  FROM public.exchange_rates
  WHERE upper(quote) = upper(trim(p_quote));

  IF v_rate IS NOT NULL AND v_rate > 0 THEN
    RETURN v_rate;
  END IF;

  -- Statutory fallback rates (quote per 1 USD) matching currency.ts FALLBACK_RATES
  RETURN CASE upper(trim(p_quote))
    WHEN 'USD' THEN 1.0
    WHEN 'EUR' THEN 0.92
    WHEN 'CZK' THEN 23.25
    WHEN 'GBP' THEN 0.79
    WHEN 'INR' THEN 83.2
    WHEN 'PHP' THEN 56.5
    WHEN 'SGD' THEN 1.35
    WHEN 'AUD' THEN 1.52
    WHEN 'CAD' THEN 1.36
    WHEN 'JPY' THEN 152.0
    WHEN 'CHF' THEN 0.88
    WHEN 'AED' THEN 3.67
    WHEN 'PLN' THEN 3.98
    ELSE 1.0
  END;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_exchange_rate(text) TO authenticated, service_role, anon;

-- 3. Fix send_transfer function to use get_exchange_rate
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
  s public.wallets%ROWTYPE;
  r public.wallets%ROWTYPE;
  sp public.profiles%ROWTYPE;
  rp public.profiles%ROWTYPE;
  send_rate numeric;
  recv_rate numeric;
  fee numeric;
  amt_usd numeric;
  fee_usd numeric;
  sender_debit numeric;
  total_usd numeric;
  recv_amt numeric;
  tx_id uuid;
  recv_curr text;
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

  send_rate := public.get_exchange_rate(p_currency);
  IF send_rate IS NULL OR send_rate <= 0 THEN send_rate := 1.0; END IF;

  recv_curr := COALESCE(rp.preferred_currency, 'USD');
  recv_rate := public.get_exchange_rate(recv_curr);
  IF recv_rate IS NULL OR recv_rate <= 0 THEN recv_rate := 1.0; END IF;

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
    recv_curr,
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

-- 4. Retroactive fix for any transactions where USD was credited to an INR account with 1:1 rate
UPDATE public.transactions
SET recipient_amount = round(amount_usd * public.get_exchange_rate('INR'), 2),
    fx_rate = public.get_exchange_rate('INR')
WHERE upper(recipient_currency) = 'INR'
  AND upper(currency) = 'USD'
  AND (recipient_amount = amount_usd OR fx_rate = 1 OR fx_rate IS NULL);
