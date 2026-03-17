-- Migration: Itinerary Templates RLS Policies Hardening
-- Created: 2026-03-25
-- Description: Harden RLS policies for itinerary_templates table
-- Ensures: (1) anyone can SELECT active templates, (2) organizations can INSERT their own templates,
--          (3) organizations can UPDATE/DELETE only their own templates

-- ============================================================================
-- FORCE ROW LEVEL SECURITY
-- ============================================================================
-- Ensure RLS cannot be bypassed even for table owner
ALTER TABLE public.itinerary_templates FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- DROP EXISTING POLICIES (for idempotent migration)
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can view active templates" ON public.itinerary_templates;
DROP POLICY IF EXISTS "Organizations can view their own templates" ON public.itinerary_templates;
DROP POLICY IF EXISTS "Organizations can insert templates" ON public.itinerary_templates;
DROP POLICY IF EXISTS "Organizations can update their own templates" ON public.itinerary_templates;
DROP POLICY IF EXISTS "Organizations can delete their own templates" ON public.itinerary_templates;

-- ============================================================================
-- SELECT POLICIES
-- ============================================================================
-- Public read access for active templates (authenticated users)
-- This allows any authenticated user to browse the template marketplace
CREATE POLICY "Anyone can view active templates"
    ON public.itinerary_templates
    FOR SELECT
    USING (
        is_active = true
        AND auth.uid() IS NOT NULL
    );

-- Organizations can view ALL their own templates (including inactive)
-- This allows organizations to manage their draft/inactive templates
CREATE POLICY "Organizations can view their own templates"
    ON public.itinerary_templates
    FOR SELECT
    USING (
        published_by_org_id = public.get_user_organization_id()
    );

-- ============================================================================
-- INSERT POLICIES
-- ============================================================================
-- Organizations can publish templates (must be from their own organization)
CREATE POLICY "Organizations can insert templates"
    ON public.itinerary_templates
    FOR INSERT
    WITH CHECK (
        published_by_org_id = public.get_user_organization_id()
        AND organization_id = public.get_user_organization_id()
    );

-- ============================================================================
-- UPDATE POLICIES
-- ============================================================================
-- Organizations can update only their own templates
-- Both USING and WITH CHECK ensure organization ownership
CREATE POLICY "Organizations can update their own templates"
    ON public.itinerary_templates
    FOR UPDATE
    USING (
        published_by_org_id = public.get_user_organization_id()
    )
    WITH CHECK (
        published_by_org_id = public.get_user_organization_id()
        AND organization_id = public.get_user_organization_id()
    );

-- ============================================================================
-- DELETE POLICIES
-- ============================================================================
-- Organizations can delete only their own templates
CREATE POLICY "Organizations can delete their own templates"
    ON public.itinerary_templates
    FOR DELETE
    USING (
        published_by_org_id = public.get_user_organization_id()
    );

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON POLICY "Anyone can view active templates" ON public.itinerary_templates
    IS 'Allows authenticated users to browse active templates in the marketplace';
COMMENT ON POLICY "Organizations can view their own templates" ON public.itinerary_templates
    IS 'Allows organizations to view all their templates including drafts/inactive ones';
COMMENT ON POLICY "Organizations can insert templates" ON public.itinerary_templates
    IS 'Allows organizations to publish new templates to the marketplace';
COMMENT ON POLICY "Organizations can update their own templates" ON public.itinerary_templates
    IS 'Allows organizations to update only their own templates';
COMMENT ON POLICY "Organizations can delete their own templates" ON public.itinerary_templates
    IS 'Allows organizations to delete only their own templates';
