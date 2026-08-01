ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS withdrawals_blocked boolean NOT NULL DEFAULT false;

CREATE POLICY "tx deletable by admin" ON public.transactions
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));