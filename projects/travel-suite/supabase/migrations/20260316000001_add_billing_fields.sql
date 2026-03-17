ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS legal_name text,
  ADD COLUMN IF NOT EXISTS billing_address_line1 text,
  ADD COLUMN IF NOT EXISTS billing_address_line2 text,
  ADD COLUMN IF NOT EXISTS billing_city text,
  ADD COLUMN IF NOT EXISTS billing_pincode text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS billing_address text,
  ADD COLUMN IF NOT EXISTS billing_city text,
  ADD COLUMN IF NOT EXISTS billing_state text,
  ADD COLUMN IF NOT EXISTS billing_pincode text,
  ADD COLUMN IF NOT EXISTS gstin text;
