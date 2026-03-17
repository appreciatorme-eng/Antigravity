-- Migration: Shared Itinerary Template Library - Template Forks
-- Created: 2026-03-16
-- Description: Create template_forks table to track template usage and successful trips

-- ============================================================================
-- TEMPLATE FORKS TABLE
-- ============================================================================
-- Tracks when organizations fork a shared template into their own itinerary
-- Records whether the resulting trip was completed (for quality metrics)

CREATE TABLE IF NOT EXISTS public.template_forks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- References
    template_id UUID NOT NULL REFERENCES public.itinerary_templates(id) ON DELETE CASCADE,
    itinerary_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Fork metadata
    forked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    trip_completed BOOLEAN DEFAULT false NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT unique_template_itinerary UNIQUE(template_id, itinerary_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================
-- Performance indexes for tracking and analytics

CREATE INDEX idx_template_forks_template_id
    ON public.template_forks(template_id);

CREATE INDEX idx_template_forks_itinerary_id
    ON public.template_forks(itinerary_id);

CREATE INDEX idx_template_forks_organization_id
    ON public.template_forks(organization_id);

CREATE INDEX idx_template_forks_completed
    ON public.template_forks(trip_completed);

CREATE INDEX idx_template_forks_template_completed
    ON public.template_forks(template_id, trip_completed);

-- Composite index for template quality analysis
CREATE INDEX idx_template_forks_analytics
    ON public.template_forks(template_id, trip_completed, forked_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Organizations can only view and manage their own forks

ALTER TABLE public.template_forks ENABLE ROW LEVEL SECURITY;

-- Organizations can view their own forks
CREATE POLICY "Organizations can view their own forks"
    ON public.template_forks
    FOR SELECT
    USING (organization_id = public.get_user_organization_id());

-- Organizations can insert forks when creating from templates
CREATE POLICY "Organizations can insert forks"
    ON public.template_forks
    FOR INSERT
    WITH CHECK (organization_id = public.get_user_organization_id());

-- Organizations can update only their own forks
CREATE POLICY "Organizations can update their own forks"
    ON public.template_forks
    FOR UPDATE
    USING (organization_id = public.get_user_organization_id())
    WITH CHECK (organization_id = public.get_user_organization_id());

-- Organizations can delete only their own forks
CREATE POLICY "Organizations can delete their own forks"
    ON public.template_forks
    FOR DELETE
    USING (organization_id = public.get_user_organization_id());

-- ============================================================================
-- TRIGGERS
-- ============================================================================
-- Auto-update updated_at timestamp on modifications

CREATE OR REPLACE FUNCTION update_template_forks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_template_forks_updated_at
    BEFORE UPDATE ON public.template_forks
    FOR EACH ROW
    EXECUTE FUNCTION update_template_forks_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.template_forks IS 'Tracks template usage - which organizations forked which templates and whether trips were completed';
COMMENT ON COLUMN public.template_forks.template_id IS 'Reference to the shared template that was forked';
COMMENT ON COLUMN public.template_forks.itinerary_id IS 'Reference to the trip/itinerary created from the template';
COMMENT ON COLUMN public.template_forks.organization_id IS 'Organization that forked the template';
COMMENT ON COLUMN public.template_forks.forked_at IS 'Timestamp when the template was forked';
COMMENT ON COLUMN public.template_forks.trip_completed IS 'Whether the resulting trip was successfully completed (for quality metrics)';
