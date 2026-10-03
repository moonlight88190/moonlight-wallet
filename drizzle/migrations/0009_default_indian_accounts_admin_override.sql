-- Migration: Default all accounts to Indian and allow region override via admin panel only

-- 1. Ensure admin_region_override column exists on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin_region_override boolean NOT NULL DEFAULT false;

-- 2. Alter column defaults on profiles so new accounts are automatically Indian
ALTER TABLE public.profiles
  ALTER COLUMN country_code SET DEFAULT 'IN',
  ALTER COLUMN region SET DEFAULT 'INDIA';

-- 3. Flag existing accounts where an admin has previously executed a 'set_region' action
UPDATE public.profiles p
SET admin_region_override = true
WHERE p.id IN (
  SELECT w.user_id
  FROM public.wallets w
  JOIN public.admin_actions a ON a.target_wallet_id = w.id
  WHERE a.action = 'set_region'
);

-- 4. Default all other accounts (that have no admin override) to India
UPDATE public.profiles
SET country_code = 'IN',
    region = 'INDIA'
WHERE admin_region_override = false;
