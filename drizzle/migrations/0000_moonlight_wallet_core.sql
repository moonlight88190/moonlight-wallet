-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  preferred_currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, preferred_currency, updated_at) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- WALLETS (balance stored in USD base, only changed by security-definer functions)
CREATE TABLE public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  wallet_code text NOT NULL UNIQUE,
  balance_usd numeric(20,6) NOT NULL DEFAULT 0 CHECK (balance_usd >= 0),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wallet read" ON public.wallets FOR SELECT TO authenticated USING (user_id = auth.uid());

-- EXCHANGE RATES (quote per 1 USD)
CREATE TABLE public.exchange_rates (
  quote text PRIMARY KEY,
  rate numeric(20,8) NOT NULL CHECK (rate > 0),
  source text NOT NULL DEFAULT 'frankfurter',
  fetched_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.exchange_rates TO authenticated;
GRANT ALL ON public.exchange_rates TO service_role;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rates readable" ON public.exchange_rates FOR SELECT TO authenticated USING (true);
INSERT INTO public.exchange_rates (quote, rate, source, fetched_at) VALUES
 ('USD',1,'seed',now()-interval '2 days'),('EUR',0.92,'seed',now()-interval '2 days'),('GBP',0.79,'seed',now()-interval '2 days'),
 ('INR',83.5,'seed',now()-interval '2 days'),('PHP',56.5,'seed',now()-interval '2 days'),('SGD',1.35,'seed',now()-interval '2 days'),
 ('AUD',1.52,'seed',now()-interval '2 days'),('CAD',1.37,'seed',now()-interval '2 days'),('JPY',150,'seed',now()-interval '2 days'),
 ('CHF',0.88,'seed',now()-interval '2 days');

-- TRANSACTIONS
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT ('MLT-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  kind text NOT NULL CHECK (kind IN ('transfer','admin_credit','redemption','gift_card')),
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','pending','processing','failed','cancelled')),
  sender_wallet_id uuid REFERENCES public.wallets(id),
  recipient_wallet_id uuid REFERENCES public.wallets(id),
  sender_name text,
  sender_wallet_code text,
  recipient_name text,
  recipient_wallet_code text,
  amount numeric(20,6) NOT NULL,
  currency text NOT NULL,
  amount_usd numeric(20,6) NOT NULL,
  fee numeric(20,6) NOT NULL DEFAULT 0,
  fee_usd numeric(20,6) NOT NULL DEFAULT 0,
  fx_rate numeric(20,8),
  recipient_amount numeric(20,6),
  recipient_currency text,
  method text NOT NULL DEFAULT 'Moonlight transfer',
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.transactions (sender_wallet_id, created_at DESC);
CREATE INDEX ON public.transactions (recipient_wallet_id, created_at DESC);
GRANT SELECT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants read" ON public.transactions FOR SELECT TO authenticated USING (
  sender_wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid())
  OR recipient_wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid())
);

-- LEDGER
CREATE TABLE public.ledger_entries (
  id bigserial PRIMARY KEY,
  wallet_id uuid NOT NULL REFERENCES public.wallets(id),
  transaction_id uuid NOT NULL REFERENCES public.transactions(id),
  entry_type text NOT NULL CHECK (entry_type IN ('debit','credit')),
  amount_usd numeric(20,6) NOT NULL CHECK (amount_usd > 0),
  balance_after_usd numeric(20,6) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.ledger_entries (wallet_id, created_at DESC);
GRANT SELECT ON public.ledger_entries TO authenticated;
GRANT ALL ON public.ledger_entries TO service_role;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ledger read" ON public.ledger_entries FOR SELECT TO authenticated USING (
  wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid())
);

-- ADMIN ACTIONS & AUDIT LOGS (server only)
CREATE TABLE public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL,
  action text NOT NULL,
  target_wallet_id uuid REFERENCES public.wallets(id),
  transaction_id uuid REFERENCES public.transactions(id),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_actions TO service_role;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.audit_logs (
  id bigserial PRIMARY KEY,
  user_id uuid,
  event text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.audit_logs (user_id, event, created_at DESC);
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- WALLET CODE GENERATOR
CREATE OR REPLACE FUNCTION public.generate_wallet_code() RETURNS text
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; code text; i int;
BEGIN
  LOOP
    code := 'ML-';
    FOR i IN 1..8 LOOP
      code := code || substr(chars, 1 + floor(random()*length(chars))::int, 1);
      IF i = 4 THEN code := code || '-'; END IF;
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.wallets WHERE wallet_code = code);
  END LOOP;
  RETURN code;
END $$;

-- NEW USER TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)), COALESCE(NEW.email,''));
  INSERT INTO public.wallets (user_id, wallet_code) VALUES (NEW.id, public.generate_wallet_code());
  INSERT INTO public.audit_logs (user_id, event) VALUES (NEW.id, 'account_created');
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RECIPIENT LOOKUP
CREATE OR REPLACE FUNCTION public.lookup_recipient(p_query text)
RETURNS TABLE (wallet_code text, full_name text, preferred_currency text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT w.wallet_code, p.full_name, p.preferred_currency
  FROM public.wallets w JOIN public.profiles p ON p.id = w.user_id
  WHERE auth.uid() IS NOT NULL AND w.user_id <> auth.uid() AND w.status = 'active'
    AND (upper(w.wallet_code) = upper(trim(p_query)) OR lower(p.email) = lower(trim(p_query)))
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.lookup_recipient(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lookup_recipient(text) TO authenticated;

-- TRANSFER (sender = auth.uid(); rates read from DB; fee 0.5%)
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
  SELECT * INTO r FROM public.wallets WHERE upper(wallet_code) = upper(trim(p_recipient_code)) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Recipient not found'; END IF;
  IF r.id = s.id THEN RAISE EXCEPTION 'You cannot send money to yourself'; END IF;
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

-- ADMIN CREDIT (service role only)
CREATE OR REPLACE FUNCTION public.admin_credit(p_actor uuid, p_wallet_code text, p_amount numeric, p_currency text, p_reason text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w public.wallets; wp public.profiles; rate_v numeric; amt_usd numeric; tx_id uuid;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 100000000 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  SELECT * INTO w FROM public.wallets WHERE upper(wallet_code) = upper(trim(p_wallet_code)) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found'; END IF;
  SELECT * INTO wp FROM public.profiles WHERE id = w.user_id;
  SELECT rate INTO rate_v FROM public.exchange_rates WHERE quote = upper(p_currency);
  IF rate_v IS NULL THEN RAISE EXCEPTION 'Unsupported currency'; END IF;
  amt_usd := round(p_amount / rate_v, 6);
  INSERT INTO public.transactions (kind, recipient_wallet_id, sender_name, recipient_name, recipient_wallet_code, amount, currency, amount_usd, fx_rate, recipient_amount, recipient_currency, method, note)
  VALUES ('admin_credit', w.id, 'Moonlight', wp.full_name, w.wallet_code, p_amount, upper(p_currency), amt_usd, 1, p_amount, upper(p_currency), 'Balance adjustment', p_reason)
  RETURNING id INTO tx_id;
  UPDATE public.wallets SET balance_usd = balance_usd + amt_usd WHERE id = w.id RETURNING * INTO w;
  INSERT INTO public.ledger_entries (wallet_id, transaction_id, entry_type, amount_usd, balance_after_usd) VALUES (w.id, tx_id, 'credit', amt_usd, w.balance_usd);
  INSERT INTO public.admin_actions (actor_user_id, action, target_wallet_id, transaction_id, details)
  VALUES (p_actor, 'add_balance', w.id, tx_id, jsonb_build_object('amount', p_amount, 'currency', upper(p_currency), 'reason', p_reason));
  INSERT INTO public.audit_logs (user_id, event, details) VALUES (p_actor, 'admin_add_balance', jsonb_build_object('transaction_id', tx_id, 'wallet', w.wallet_code));
  RETURN tx_id;
END $$;
REVOKE ALL ON FUNCTION public.admin_credit(uuid, text, numeric, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_credit(uuid, text, numeric, text, text) TO service_role;
REVOKE ALL ON FUNCTION public.generate_wallet_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;