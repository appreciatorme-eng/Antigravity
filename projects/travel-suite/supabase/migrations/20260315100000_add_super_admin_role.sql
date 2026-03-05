-- Extend profiles_role_check to include super_admin.
-- The original constraint only covered per-org roles; super_admin was added
-- to the application layer without updating the DB constraint.

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'super_admin', 'manager', 'driver', 'staff'));

-- Grant super_admin to the platform owner account.
UPDATE public.profiles
SET role = 'super_admin'
WHERE id = '35b4c6e3-98ca-4804-a758-07e83559841a';
