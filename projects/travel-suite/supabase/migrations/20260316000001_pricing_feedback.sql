-- Migration: pricing_feedback table for tracking AI pricing suggestion outcomes
-- Tracks accepted/adjusted/dismissed suggestions to improve pricing model over time

CREATE TABLE IF NOT EXISTS public.pricing_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
    suggestion_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('accepted', 'adjusted', 'dismissed')),
    suggested_price_paise INTEGER NOT NULL CHECK (suggested_price_paise > 0),
    final_price_paise INTEGER CHECK (final_price_paise IS NULL OR final_price_paise > 0),
    confidence_level TEXT NOT NULL CHECK (confidence_level IN ('high', 'medium', 'low', 'ai_estimate')),
    comparable_trips_count INTEGER NOT NULL DEFAULT 0 CHECK (comparable_trips_count >= 0),
    destination TEXT NOT NULL,
    duration_days INTEGER NOT NULL CHECK (duration_days >= 1 AND duration_days <= 30),
    pax INTEGER NOT NULL CHECK (pax >= 1 AND pax <= 20),
    package_tier TEXT CHECK (package_tier IN ('budget', 'standard', 'premium', 'luxury')),
    season_month INTEGER CHECK (season_month IS NULL OR (season_month >= 1 AND season_month <= 12)),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pricing_feedback_organization_id ON public.pricing_feedback(organization_id);
CREATE INDEX IF NOT EXISTS idx_pricing_feedback_proposal_id ON public.pricing_feedback(proposal_id);
CREATE INDEX IF NOT EXISTS idx_pricing_feedback_action ON public.pricing_feedback(action);
CREATE INDEX IF NOT EXISTS idx_pricing_feedback_created_at ON public.pricing_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_pricing_feedback_created_by ON public.pricing_feedback(created_by);
CREATE INDEX IF NOT EXISTS idx_pricing_feedback_destination_duration ON public.pricing_feedback(destination, duration_days);

ALTER TABLE public.pricing_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view pricing feedback" ON public.pricing_feedback;
CREATE POLICY "Org members can view pricing feedback"
    ON public.pricing_feedback
    FOR SELECT
    USING (
        organization_id = (
            SELECT organization_id
            FROM public.profiles
            WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Org members can create pricing feedback" ON public.pricing_feedback;
CREATE POLICY "Org members can create pricing feedback"
    ON public.pricing_feedback
    FOR INSERT
    WITH CHECK (
        organization_id = (
            SELECT organization_id
            FROM public.profiles
            WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Org members can update pricing feedback" ON public.pricing_feedback;
CREATE POLICY "Org members can update pricing feedback"
    ON public.pricing_feedback
    FOR UPDATE
    USING (
        organization_id = (
            SELECT organization_id
            FROM public.profiles
            WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        organization_id = (
            SELECT organization_id
            FROM public.profiles
            WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Org admins can delete pricing feedback" ON public.pricing_feedback;
CREATE POLICY "Org admins can delete pricing feedback"
    ON public.pricing_feedback
    FOR DELETE
    USING (public.is_org_admin(organization_id));

DROP TRIGGER IF EXISTS set_updated_at_pricing_feedback ON public.pricing_feedback;
CREATE TRIGGER set_updated_at_pricing_feedback
    BEFORE UPDATE ON public.pricing_feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
