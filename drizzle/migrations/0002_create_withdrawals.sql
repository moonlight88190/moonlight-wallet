CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  amount_usd NUMERIC NOT NULL,
  fee_usd NUMERIC NOT NULL DEFAULT 0,
  method TEXT NOT NULL,
  provider TEXT,
  upi_id TEXT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'PROCESSING',
  reference TEXT NOT NULL UNIQUE DEFAULT ('MLW-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own withdrawals read" ON public.withdrawals FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.create_withdrawal(
  p_amount NUMERIC, p_currency TEXT, p_method TEXT, p_full_name TEXT, p_email TEXT,
  p_upi_id TEXT DEFAULT NULL, p_provider TEXT DEFAULT NULL, p_phone TEXT DEFAULT NULL, p_reason TEXT DEFAULT NULL)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w public.wallets; wp public.profiles; rate_v numeric; amt_usd numeric; tx_id uuid; wd_id uuid; ref text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 100000000 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  SELECT * INTO w FROM public.wallets WHERE user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found'; END IF;
  IF w.status = 'frozen' THEN RAISE EXCEPTION 'Account is temporarily restricted'; END IF;
  SELECT * INTO wp FROM public.profiles WHERE id = w.user_id;
  SELECT rate INTO rate_v FROM public.exchange_rates WHERE quote = upper(p_currency);
  IF upper(p_currency) = 'USD' THEN rate_v := 1; END IF;
  IF rate_v IS NULL OR rate_v <= 0 THEN RAISE EXCEPTION 'Unsupported currency'; END IF;
  amt_usd := round(p_amount / rate_v, 6);
  IF w.balance_usd < amt_usd THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
  ref := 'MLW-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
  INSERT INTO public.transactions (kind, status, sender_wallet_id, sender_name, sender_wallet_code, recipient_name,
    amount, currency, amount_usd, fx_rate, recipient_amount, recipient_currency, method, note)
  VALUES ('withdrawal', 'processing', w.id, wp.full_name, w.wallet_code, left(coalesce(p_full_name, p_upi_id, p_provider, p_method),120),
    p_amount, upper(p_currency), amt_usd, rate_v, p_amount, upper(p_currency), left(p_method,60), ref)
  RETURNING id INTO tx_id;
  UPDATE public.wallets SET balance_usd = balance_usd - amt_usd WHERE id = w.id RETURNING * INTO w;
  INSERT INTO public.ledger_entries (wallet_id, transaction_id, entry_type, amount_usd, balance_after_usd)
  VALUES (w.id, tx_id, 'debit', amt_usd, w.balance_usd);
  INSERT INTO public.withdrawals (user_id, wallet_id, transaction_id, amount, currency, amount_usd, method, provider, upi_id,
    full_name, email, phone, reason, reference, status)
  VALUES (auth.uid(), w.id, tx_id, p_amount, upper(p_currency), amt_usd, left(p_method,60), left(p_provider,120), left(p_upi_id,120),
    coalesce(left(p_full_name,120),''), coalesce(left(p_email,200),''), left(p_phone,40), left(p_reason,300), ref, 'PROCESSING')
  RETURNING id INTO wd_id;
  INSERT INTO public.audit_logs (user_id, event, details) VALUES (auth.uid(), 'withdrawal_created', jsonb_build_object('withdrawal_id', wd_id));
  RETURN wd_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.create_withdrawal(numeric,text,text,text,text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_withdrawal(numeric,text,text,text,text,text,text,text,text) TO authenticated;