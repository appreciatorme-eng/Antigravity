-- Migration: Shared Itinerary Template Library
-- Created: 2026-03-16
-- Description: Create itinerary_templates table for cross-organization template sharing marketplace

-- ============================================================================
-- ITINERARY TEMPLATES TABLE
-- ============================================================================
-- Shared templates that operators can publish and others can fork
-- Supports filtering by destination, duration, budget, and theme

CREATE TABLE IF NOT EXISTS public.itinerary_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Template metadata
    title VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    duration_days INTEGER NOT NULL,
    budget_range VARCHAR(50) NOT NULL, -- 'budget', 'mid-range', 'luxury', 'premium'
    theme VARCHAR(50) NOT NULL, -- 'adventure', 'cultural', 'honeymoon', 'family'
    description TEXT,

    -- Template content (full itinerary structure)
    template_data JSONB NOT NULL,

    -- Publishing and tracking
    published_by_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    usage_count INTEGER DEFAULT 0 NOT NULL,
    rating_avg DECIMAL(3, 2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT valid_duration CHECK (duration_days > 0 AND duration_days <= 365),
    CONSTRAINT valid_usage_count CHECK (usage_count >= 0),
    CONSTRAINT valid_rating_avg CHECK (rating_avg >= 0.00 AND rating_avg <= 5.00),
    CONSTRAINT valid_rating_count CHECK (rating_count >= 0),
    CONSTRAINT valid_budget_range CHECK (budget_range IN ('budget', 'mid-range', 'luxury', 'premium')),
    CONSTRAINT valid_theme CHECK (theme IN ('adventure', 'cultural', 'honeymoon', 'family', 'leisure', 'business', 'pilgrimage', 'wildlife'))
);

-- ============================================================================
-- INDEXES
-- ============================================================================
-- Performance indexes for filtering and searching

CREATE INDEX idx_itinerary_templates_org_id
    ON public.itinerary_templates(organization_id);

CREATE INDEX idx_itinerary_templates_published_by
    ON public.itinerary_templates(published_by_org_id);

CREATE INDEX idx_itinerary_templates_destination
    ON public.itinerary_templates(destination);

CREATE INDEX idx_itinerary_templates_duration
    ON public.itinerary_templates(duration_days);

CREATE INDEX idx_itinerary_templates_budget
    ON public.itinerary_templates(budget_range);

CREATE INDEX idx_itinerary_templates_theme
    ON public.itinerary_templates(theme);

CREATE INDEX idx_itinerary_templates_active
    ON public.itinerary_templates(is_active);

CREATE INDEX idx_itinerary_templates_active_usage
    ON public.itinerary_templates(is_active, usage_count DESC);

CREATE INDEX idx_itinerary_templates_active_rating
    ON public.itinerary_templates(is_active, rating_avg DESC);

-- Composite index for common filter combinations
CREATE INDEX idx_itinerary_templates_filter
    ON public.itinerary_templates(is_active, destination, duration_days, budget_range, theme);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Public read access for active templates, organizations manage their own

ALTER TABLE public.itinerary_templates ENABLE ROW LEVEL SECURITY;

-- Anyone (authenticated users) can view active templates
CREATE POLICY "Anyone can view active templates"
    ON public.itinerary_templates
    FOR SELECT
    USING (is_active = true);

-- Organizations can view all their own templates (including inactive)
CREATE POLICY "Organizations can view their own templates"
    ON public.itinerary_templates
    FOR SELECT
    USING (published_by_org_id = public.get_user_organization_id());

-- Organizations can insert templates (publishing)
CREATE POLICY "Organizations can insert templates"
    ON public.itinerary_templates
    FOR INSERT
    WITH CHECK (published_by_org_id = public.get_user_organization_id());

-- Organizations can update only their own templates
CREATE POLICY "Organizations can update their own templates"
    ON public.itinerary_templates
    FOR UPDATE
    USING (published_by_org_id = public.get_user_organization_id())
    WITH CHECK (published_by_org_id = public.get_user_organization_id());

-- Organizations can delete only their own templates
CREATE POLICY "Organizations can delete their own templates"
    ON public.itinerary_templates
    FOR DELETE
    USING (published_by_org_id = public.get_user_organization_id());

-- ============================================================================
-- TRIGGERS
-- ============================================================================
-- Auto-update updated_at timestamp on modifications

CREATE OR REPLACE FUNCTION update_itinerary_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_itinerary_templates_updated_at
    BEFORE UPDATE ON public.itinerary_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_itinerary_templates_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.itinerary_templates IS 'Shared itinerary templates for cross-organization marketplace';
COMMENT ON COLUMN public.itinerary_templates.template_data IS 'Full itinerary structure including days, activities, accommodations (JSONB)';
COMMENT ON COLUMN public.itinerary_templates.budget_range IS 'Price tier: budget, mid-range, luxury, premium';
COMMENT ON COLUMN public.itinerary_templates.theme IS 'Template theme/category: adventure, cultural, honeymoon, family, etc.';
COMMENT ON COLUMN public.itinerary_templates.usage_count IS 'Number of times this template has been forked by other organizations';
COMMENT ON COLUMN public.itinerary_templates.rating_avg IS 'Average rating from 0.00 to 5.00';
COMMENT ON COLUMN public.itinerary_templates.rating_count IS 'Total number of ratings received';
