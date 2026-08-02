ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'UTC';

CREATE OR REPLACE FUNCTION public.apply_balance_delta(_user_id uuid, _delta numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance numeric;
BEGIN
  UPDATE public.profiles
     SET balance = balance + _delta,
         total_pl = total_pl + _delta,
         updated_at = now()
   WHERE id = _user_id
  RETURNING balance INTO new_balance;
  RETURN new_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_balance_delta(uuid, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_balance_delta(uuid, numeric) TO service_role;