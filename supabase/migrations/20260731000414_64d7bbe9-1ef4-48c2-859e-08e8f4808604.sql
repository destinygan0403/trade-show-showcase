ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS broker_topup_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS broker_address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS broker_qr_url text NOT NULL DEFAULT '';