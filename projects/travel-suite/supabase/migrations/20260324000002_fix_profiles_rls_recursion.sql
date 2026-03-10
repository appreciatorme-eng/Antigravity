-- Fix infinite recursion (42P17) in profiles RLS SELECT policy.
-- The previous policy used a subquery into profiles inside the policy itself,
-- which Postgres evaluates recursively even when auth.uid()=id short-circuits.
-- Fix: use a SECURITY DEFINER helper function that bypasses RLS to look up
-- the caller's org_id, breaking the recursion.

CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

DROP POLICY IF EXISTS "Profiles viewable within same organization" ON public.profiles;

CREATE POLICY "Profiles viewable within same organization"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR organization_id = public.get_my_org_id()
  );
