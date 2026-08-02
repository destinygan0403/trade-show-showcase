ALTER TABLE public.positions ADD COLUMN IF NOT EXISTS stake numeric NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.apply_balance_only(_user_id uuid, _delta numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_balance numeric;
BEGIN
  UPDATE public.profiles
     SET balance = balance + _delta,
         updated_at = now()
   WHERE id = _user_id
  RETURNING balance INTO new_balance;
  RETURN new_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_balance_only(uuid, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_balance_only(uuid, numeric) TO service_role;