-- Migration: Create Clients Table
-- Created: 2026-02-14
-- Description: Create a clients table that references profiles for backward compatibility with new features

-- ============================================================================
-- Helper Functions (MUST be defined before RLS policies)
-- ============================================================================

-- Function to get organization ID from auth.uid()
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================================
-- Clients Table (References Profiles)
-- ============================================================================
-- This table extends profiles for client-specific data
-- It maintains a 1:1 relationship with profiles where role='client'

CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- For RLS lookups
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    -- Client profile data is stored in profiles table
    -- This table mainly serves as a foreign key target for other tables
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_clients_org_id ON public.clients(organization_id);
CREATE INDEX idx_clients_user_id ON public.clients(user_id);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Clients can view their own record
CREATE POLICY "Clients can view their own record"
    ON public.clients
    FOR SELECT
    USING (user_id = auth.uid());

-- RLS Policy: Organizations can manage their clients
CREATE POLICY "Organizations can manage their clients"
    ON public.clients
    USING (organization_id = public.get_user_organization_id());

-- ============================================================================
-- Trigger to Auto-Create Client Record
-- ============================================================================
-- Automatically create a client record when a profile with role='client' is created

CREATE OR REPLACE FUNCTION create_client_from_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create client record if role is 'client' and organization_id is set
    IF NEW.role = 'client' AND NEW.organization_id IS NOT NULL THEN
        INSERT INTO public.clients (id, user_id, organization_id)
        VALUES (NEW.id, NEW.id, NEW.organization_id)
        ON CONFLICT (id) DO UPDATE
        SET organization_id = EXCLUDED.organization_id,
            updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_client_from_profile
    AFTER INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_client_from_profile();

-- ============================================================================
-- Backfill Existing Clients
-- ============================================================================
-- Insert records for existing profiles with role='client'

INSERT INTO public.clients (id, user_id, organization_id)
SELECT id, id as user_id, organization_id
FROM public.profiles
WHERE role = 'client' AND organization_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Trigger for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION update_clients_updated_at();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.clients IS 'Client records that extend profiles for client-specific features';
COMMENT ON FUNCTION create_client_from_profile IS 'Auto-creates client record when profile role is set to client';
