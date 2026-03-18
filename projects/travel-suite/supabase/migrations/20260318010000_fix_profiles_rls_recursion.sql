-- Fix: infinite recursion in profiles RLS policies
--
-- The "Users can view profiles in their organization" policy contains an
-- inline subquery on the profiles table itself:
--   organization_id = (SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid())
-- This subquery is NOT inside a SECURITY DEFINER function, so it triggers
-- the same RLS policies again → infinite recursion → query fails silently.
--
-- The "Profiles viewable within same organization" policy already provides
-- the same functionality using get_my_org_id() (SECURITY DEFINER), which
-- safely bypasses RLS for the lookup. Dropping the redundant policy fixes
-- the recursion.

DROP POLICY IF EXISTS "Users can view profiles in their organization" ON profiles;
