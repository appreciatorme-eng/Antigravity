-- Stabilization remediation for verified live-schema drift.
-- Scope:
-- 1) Enable RLS on whatsapp_presence and allow authenticated read-only access.
-- 2) Remove stale unsafe public proposal policies still present in production.
-- 3) Re-assert the intended organization-scoped proposal policies with explicit WITH CHECK clauses.

BEGIN;

-- ---------------------------------------------------------------------------
-- whatsapp_presence
-- ---------------------------------------------------------------------------

ALTER TABLE IF EXISTS public.whatsapp_presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view WhatsApp presence" ON public.whatsapp_presence;
DROP POLICY IF EXISTS "Authenticated users can view whatsapp presence" ON public.whatsapp_presence;

CREATE POLICY "Authenticated users can view whatsapp presence"
    ON public.whatsapp_presence
    FOR SELECT
    TO authenticated
    USING (true);

-- ---------------------------------------------------------------------------
-- proposal_activities
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public can view and update proposal activities" ON public.proposal_activities;
DROP POLICY IF EXISTS "Proposal activities inherit day access" ON public.proposal_activities;

CREATE POLICY "Proposal activities inherit day access"
    ON public.proposal_activities
    FOR ALL
    TO public
    USING (
        proposal_day_id IN (
            SELECT pd.id
            FROM public.proposal_days pd
            JOIN public.proposals p ON p.id = pd.proposal_id
            WHERE p.organization_id = public.get_user_organization_id()
        )
    )
    WITH CHECK (
        proposal_day_id IN (
            SELECT pd.id
            FROM public.proposal_days pd
            JOIN public.proposals p ON p.id = pd.proposal_id
            WHERE p.organization_id = public.get_user_organization_id()
        )
    );

-- ---------------------------------------------------------------------------
-- proposal_add_ons
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public can view proposal add-ons" ON public.proposal_add_ons;
DROP POLICY IF EXISTS "Public can update proposal add-ons" ON public.proposal_add_ons;
DROP POLICY IF EXISTS "Organizations can manage their proposal add-ons" ON public.proposal_add_ons;

CREATE POLICY "Organizations can manage their proposal add-ons"
    ON public.proposal_add_ons
    FOR ALL
    TO public
    USING (
        proposal_id IN (
            SELECT p.id
            FROM public.proposals p
            WHERE p.organization_id = public.get_user_organization_id()
        )
    )
    WITH CHECK (
        proposal_id IN (
            SELECT p.id
            FROM public.proposals p
            WHERE p.organization_id = public.get_user_organization_id()
        )
    );

-- ---------------------------------------------------------------------------
-- proposal_comments
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Anyone can create proposal comments" ON public.proposal_comments;
DROP POLICY IF EXISTS "Public can view proposal comments" ON public.proposal_comments;
DROP POLICY IF EXISTS "Organizations can manage proposal comments" ON public.proposal_comments;

CREATE POLICY "Organizations can manage proposal comments"
    ON public.proposal_comments
    FOR ALL
    TO public
    USING (
        proposal_id IN (
            SELECT p.id
            FROM public.proposals p
            WHERE p.organization_id = public.get_user_organization_id()
        )
    )
    WITH CHECK (
        proposal_id IN (
            SELECT p.id
            FROM public.proposals p
            WHERE p.organization_id = public.get_user_organization_id()
        )
    );

COMMIT;
