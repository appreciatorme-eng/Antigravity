-- Migration: Allow Admins to View and Update Profiles in their Organization
-- Created: 2026-02-17
-- Description: Adds RLS policies to public.profiles so organization admins can view and manage client profiles.

-- Policy: Admins can view all profiles in their organization
DROP POLICY IF EXISTS "Admins can view organization profiles" ON public.profiles;

CREATE POLICY "Admins can view organization profiles"
    ON public.profiles
    FOR SELECT
    USING (
        public.is_org_admin(organization_id)
    );

-- Policy: Admins can update all profiles in their organization
DROP POLICY IF EXISTS "Admins can update organization profiles" ON public.profiles;

CREATE POLICY "Admins can update organization profiles"
    ON public.profiles
    FOR UPDATE
    USING (
        public.is_org_admin(organization_id)
    )
    WITH CHECK (
        public.is_org_admin(organization_id)
    );

-- Policy: Admins can insert new profiles (create clients)
-- Usually users are creating themselves via auth signup, or admins via API.
-- API often bypasses RLS if using service role, but for consistency:
DROP POLICY IF EXISTS "Admins can insert organization profiles" ON public.profiles;

CREATE POLICY "Admins can insert organization profiles"
    ON public.profiles
    FOR INSERT
    WITH CHECK (
        public.is_org_admin(organization_id)
    );

-- Policy: Admins can delete profiles in their organization
-- Note: This might cascade delete user from auth.users if trigger exists, or require manual auth cleanup.
DROP POLICY IF EXISTS "Admins can delete organization profiles" ON public.profiles;

CREATE POLICY "Admins can delete organization profiles"
    ON public.profiles
    FOR DELETE
    USING (
        public.is_org_admin(organization_id)
    );
