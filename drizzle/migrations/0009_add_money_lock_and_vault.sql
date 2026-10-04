ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS locked_balance_usd numeric(20,6) NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.lock_funds(p_amount_usd numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  w public.wallets;
  new_bal numeric;
  new_locked numeric;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount_usd IS NULL OR p_amount_usd <= 0 THEN RAISE EXCEPTION 'Invalid lock amount'; END IF;

  SELECT * INTO w FROM public.wallets WHERE user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found'; END IF;
  IF w.status = 'frozen' THEN RAISE EXCEPTION 'Wallet is temporarily frozen'; END IF;
  IF w.balance_usd < p_amount_usd THEN RAISE EXCEPTION 'Insufficient available balance to lock'; END IF;

  new_bal := w.balance_usd - p_amount_usd;
  new_locked := COALESCE(w.locked_balance_usd, 0) + p_amount_usd;

  UPDATE public.wallets
  SET balance_usd = new_bal,
      locked_balance_usd = new_locked
  WHERE id = w.id;

  INSERT INTO public.audit_logs (user_id, event, details)
  VALUES (auth.uid(), 'funds_locked', jsonb_build_object(
    'amount_usd', p_amount_usd,
    'balance_after_usd', new_bal,
    'locked_after_usd', new_locked
  ));

  RETURN jsonb_build_object(
    'success', true,
    'balance_usd', new_bal,
    'locked_balance_usd', new_locked
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.unlock_funds(p_amount_usd numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  w public.wallets;
  new_bal numeric;
  new_locked numeric;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount_usd IS NULL OR p_amount_usd <= 0 THEN RAISE EXCEPTION 'Invalid unlock amount'; END IF;

  SELECT * INTO w FROM public.wallets WHERE user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found'; END IF;
  IF w.status = 'frozen' THEN RAISE EXCEPTION 'Wallet is temporarily frozen'; END IF;
  IF COALESCE(w.locked_balance_usd, 0) < p_amount_usd THEN RAISE EXCEPTION 'Insufficient locked balance to unlock'; END IF;

  new_bal := w.balance_usd + p_amount_usd;
  new_locked := COALESCE(w.locked_balance_usd, 0) - p_amount_usd;

  UPDATE public.wallets
  SET balance_usd = new_bal,
      locked_balance_usd = new_locked
  WHERE id = w.id;

  INSERT INTO public.audit_logs (user_id, event, details)
  VALUES (auth.uid(), 'funds_unlocked', jsonb_build_object(
    'amount_usd', p_amount_usd,
    'balance_after_usd', new_bal,
    'locked_after_usd', new_locked
  ));

  RETURN jsonb_build_object(
    'success', true,
    'balance_usd', new_bal,
    'locked_balance_usd', new_locked
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.lock_funds(numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lock_funds(numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.unlock_funds(numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_funds(numeric) TO service_role;