-- Add 'client' role to profiles_role_check constraint.
-- The client creation handler (api/_handlers/admin/clients/route.ts) sets
-- role = 'client' when creating client profiles, but the constraint added in
-- 20260315100000 only allows ('admin','super_admin','manager','driver','staff').
-- This causes a 400 "Failed to process client data" on all client creation attempts.

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'super_admin', 'manager', 'driver', 'staff', 'client'));
