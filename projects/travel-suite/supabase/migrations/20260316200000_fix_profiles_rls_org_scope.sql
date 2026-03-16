-- M-10: Fix profiles RLS — prevent public enumeration
-- The existing get_my_org_id() helper uses bare auth.uid() which triggers per-row evaluation.
-- Fix: use (SELECT auth.uid()) subquery form for initplan optimization.
-- Also ensure the overly permissive "Public profiles are viewable by everyone" policy
-- is removed (both with and without trailing period variants).

-- Drop the legacy permissive policy if it somehow still exists
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

-- Drop the existing org-scoped policy (will recreate with initplan fix)
DROP POLICY IF EXISTS "Profiles viewable within same organization" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;

-- Recreate the SECURITY DEFINER helper with (SELECT auth.uid()) to avoid initplan issue
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = (SELECT auth.uid()) LIMIT 1;
$$;

-- Recreate org-scoped policy using the fixed helper
CREATE POLICY "Profiles viewable within same organization"
  ON public.profiles FOR SELECT
  USING (
    (SELECT auth.uid()) = id
    OR organization_id = public.get_my_org_id()
  );
