ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS region text NOT NULL DEFAULT 'GLOBAL';

CREATE OR REPLACE FUNCTION public.block_frozen_debit() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'frozen' AND OLD.status = 'frozen' AND NEW.balance_usd < OLD.balance_usd THEN
    RAISE EXCEPTION 'Wallet is frozen';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS wallets_block_frozen_debit ON public.wallets;
CREATE TRIGGER wallets_block_frozen_debit BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.block_frozen_debit();

CREATE OR REPLACE FUNCTION public.admin_debit(p_actor uuid, p_wallet_code text, p_amount numeric, p_currency text, p_reason text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w public.wallets; wp public.profiles; rate_v numeric; amt_usd numeric; tx_id uuid;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 100000000 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  SELECT * INTO w FROM public.wallets WHERE upper(wallet_code) = upper(trim(p_wallet_code)) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found'; END IF;
  IF w.status = 'frozen' THEN RAISE EXCEPTION 'Wallet is frozen — unfreeze first'; END IF;
  SELECT * INTO wp FROM public.profiles WHERE id = w.user_id;
  SELECT rate INTO rate_v FROM public.exchange_rates WHERE quote = upper(p_currency);
  IF rate_v IS NULL THEN RAISE EXCEPTION 'Unsupported currency'; END IF;
  amt_usd := round(p_amount / rate_v, 6);
  IF w.balance_usd < amt_usd THEN RAISE EXCEPTION 'Amount exceeds wallet balance'; END IF;
  INSERT INTO public.transactions (kind, sender_wallet_id, sender_name, sender_wallet_code, recipient_name, amount, currency, amount_usd, fx_rate, recipient_amount, recipient_currency, method, note)
  VALUES ('admin_debit', w.id, wp.full_name, w.wallet_code, 'Moonlight', p_amount, upper(p_currency), amt_usd, 1, p_amount, upper(p_currency), 'Balance adjustment', p_reason)
  RETURNING id INTO tx_id;
  UPDATE public.wallets SET balance_usd = balance_usd - amt_usd WHERE id = w.id RETURNING * INTO w;
  INSERT INTO public.ledger_entries (wallet_id, transaction_id, entry_type, amount_usd, balance_after_usd) VALUES (w.id, tx_id, 'debit', amt_usd, w.balance_usd);
  INSERT INTO public.admin_actions (actor_user_id, action, target_wallet_id, transaction_id, details)
  VALUES (p_actor, 'remove_balance', w.id, tx_id, jsonb_build_object('amount', p_amount, 'currency', upper(p_currency), 'reason', p_reason));
  RETURN tx_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_wallet_freeze(p_actor uuid, p_wallet_code text, p_freeze boolean, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w public.wallets;
BEGIN
  UPDATE public.wallets SET status = CASE WHEN p_freeze THEN 'frozen' ELSE 'active' END
  WHERE upper(wallet_code) = upper(trim(p_wallet_code)) RETURNING * INTO w;
  IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found'; END IF;
  INSERT INTO public.admin_actions (actor_user_id, action, target_wallet_id, details)
  VALUES (p_actor, CASE WHEN p_freeze THEN 'freeze' ELSE 'unfreeze' END, w.id, jsonb_build_object('reason', p_reason));
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_profile_region(p_actor uuid, p_wallet_code text, p_region text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w public.wallets;
BEGIN
  IF p_region NOT IN ('GLOBAL','EUROPE','INDIA','PHILIPPINES') THEN RAISE EXCEPTION 'Invalid region'; END IF;
  SELECT * INTO w FROM public.wallets WHERE upper(wallet_code) = upper(trim(p_wallet_code));
  IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found'; END IF;
  UPDATE public.profiles SET region = p_region, updated_at = now() WHERE id = w.user_id;
  INSERT INTO public.admin_actions (actor_user_id, action, target_wallet_id, details)
  VALUES (p_actor, 'set_region', w.id, jsonb_build_object('region', p_region));
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_debit(uuid,text,numeric,text,text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_set_wallet_freeze(uuid,text,boolean,text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_set_profile_region(uuid,text,text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_credit(uuid,text,numeric,text,text) FROM PUBLIC, anon, authenticated;