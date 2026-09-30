CREATE OR REPLACE FUNCTION public.admin_update_withdrawal_status(p_actor uuid, p_withdrawal_id uuid, p_new_status text, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE wd public.withdrawals; w public.wallets; tx_id uuid;
BEGIN
  IF p_new_status NOT IN ('PROCESSING','SUCCESSFUL','FAILED','ON HOLD','UNDER REVIEW','CANCELLED') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  SELECT * INTO wd FROM public.withdrawals WHERE id = p_withdrawal_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawal not found'; END IF;
  IF wd.status IN ('FAILED','CANCELLED') THEN RAISE EXCEPTION 'Withdrawal already refunded'; END IF;
  IF p_new_status IN ('FAILED','CANCELLED') THEN
    UPDATE public.wallets SET balance_usd = balance_usd + wd.amount_usd WHERE id = wd.wallet_id RETURNING * INTO w;
    INSERT INTO public.ledger_entries (wallet_id, transaction_id, entry_type, amount_usd, balance_after_usd)
    VALUES (w.id, wd.transaction_id, 'credit', wd.amount_usd, w.balance_usd);
  END IF;
  UPDATE public.withdrawals SET status = p_new_status, updated_at = now() WHERE id = wd.id;
  UPDATE public.transactions SET status = lower(p_new_status) WHERE id = wd.transaction_id;
  INSERT INTO public.admin_actions (actor_user_id, action, target_wallet_id, transaction_id, details)
  VALUES (p_actor, 'withdrawal_status', wd.wallet_id, wd.transaction_id, jsonb_build_object('status', p_new_status, 'reason', p_reason));
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_update_withdrawal_status(uuid,uuid,text,text) FROM PUBLIC, anon, authenticated;