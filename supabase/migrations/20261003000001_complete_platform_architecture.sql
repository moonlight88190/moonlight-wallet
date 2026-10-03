-- 1. Transactions status constraint widening & new columns
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS route text NOT NULL DEFAULT 'moonlight',
  ADD COLUMN IF NOT EXISTS sender_debit numeric(20,6);

ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_status_check
  CHECK (status IN ('completed', 'pending', 'processing', 'failed', 'cancelled', 'successful', 'on hold', 'under review', 'on_hold', 'under_review'));

-- 2. Withdrawals table enhancements
ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS route text NOT NULL DEFAULT 'upi',
  ADD COLUMN IF NOT EXISTS recipient_amount numeric(20,6),
  ADD COLUMN IF NOT EXISTS recipient_currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS fee numeric(20,6) NOT NULL DEFAULT 0;

-- 3. Profiles geography metadata
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country_code text DEFAULT 'DE',
  ADD COLUMN IF NOT EXISTS region text DEFAULT 'Europe',
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS geography_updated_at timestamptz;

-- 4. Digital Vouchers table & RLS
CREATE TABLE IF NOT EXISTS public.vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  amount numeric(20,6) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired')),
  redeemed_by uuid REFERENCES auth.users(id),
  redeemed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

GRANT SELECT, INSERT, UPDATE ON public.vouchers TO authenticated;
GRANT ALL ON public.vouchers TO service_role;

ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vouchers_read_authenticated" ON public.vouchers;
CREATE POLICY "vouchers_read_authenticated"
  ON public.vouchers FOR SELECT TO authenticated USING (true);

-- 5. Voucher Redemption RPC (Security Definer)
CREATE OR REPLACE FUNCTION public.redeem_voucher(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v public.vouchers;
  w public.wallets;
  rate_v numeric;
  amt_usd numeric;
  tx_id uuid;
  clean_code text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  clean_code := upper(trim(p_code));
  
  SELECT * INTO v FROM public.vouchers WHERE code = clean_code FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid voucher code'; END IF;
  IF v.status = 'redeemed' THEN RAISE EXCEPTION 'Voucher has already been redeemed'; END IF;
  IF v.status = 'expired' OR (v.expires_at IS NOT NULL AND v.expires_at < now()) THEN
    RAISE EXCEPTION 'Voucher has expired';
  END IF;

  SELECT * INTO w FROM public.wallets WHERE user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found'; END IF;
  IF w.status = 'frozen' THEN RAISE EXCEPTION 'Account is temporarily restricted'; END IF;

  -- FX conversion to USD
  IF upper(v.currency) = 'USD' THEN
    rate_v := 1;
  ELSE
    SELECT rate INTO rate_v FROM public.exchange_rates WHERE quote = upper(v.currency);
    IF rate_v IS NULL OR rate_v <= 0 THEN rate_v := 1; END IF;
  END IF;

  amt_usd := round(v.amount / rate_v, 6);

  -- Credit wallet balance
  UPDATE public.wallets SET balance_usd = balance_usd + amt_usd, updated_at = now() WHERE id = w.id;

  -- Create transaction record
  INSERT INTO public.transactions (
    kind, status, recipient_wallet_id, recipient_name, recipient_wallet_code,
    amount, currency, amount_usd, fx_rate, recipient_amount, recipient_currency,
    method, note, route
  ) VALUES (
    'redemption', 'completed', w.id, 'Self', w.wallet_code,
    v.amount, upper(v.currency), amt_usd, rate_v, v.amount, upper(v.currency),
    'Voucher Redemption', 'Redeemed voucher ' || clean_code, 'voucher'
  ) RETURNING id INTO tx_id;

  -- Create ledger credit
  INSERT INTO public.ledger_entries (wallet_id, transaction_id, entry_type, amount_usd, balance_after_usd)
  VALUES (w.id, tx_id, 'credit', amt_usd, w.balance_usd + amt_usd);

  -- Mark voucher redeemed
  UPDATE public.vouchers
  SET status = 'redeemed', redeemed_by = auth.uid(), redeemed_at = now()
  WHERE id = v.id;

  -- Audit log
  INSERT INTO public.audit_logs (user_id, event, details)
  VALUES (auth.uid(), 'voucher_redeemed', jsonb_build_object('voucher_id', v.id, 'amount', v.amount, 'currency', v.currency));

  RETURN jsonb_build_object(
    'success', true,
    'amount', v.amount,
    'currency', v.currency,
    'amount_usd', amt_usd,
    'transaction_id', tx_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_voucher(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_voucher(text) TO service_role;
