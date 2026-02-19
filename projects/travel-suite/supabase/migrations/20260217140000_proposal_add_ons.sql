-- Migration: Proposal Add-ons (Vehicle Type + Options)
-- Created: 2026-02-17
-- Description: Attach upsell-style options to proposals and include them in pricing.

-- ============================================================================
-- PROPOSAL ADD-ONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.proposal_add_ons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
    -- Optional reference to the master add_ons catalog (snapshot fields below are used for rendering)
    add_on_id UUID REFERENCES public.add_ons(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    image_url TEXT,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 1,
    is_selected BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_unit_price CHECK (unit_price >= 0),
    CONSTRAINT valid_quantity CHECK (quantity > 0 AND quantity <= 100)
);

CREATE INDEX IF NOT EXISTS idx_proposal_add_ons_proposal_id ON public.proposal_add_ons(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_add_ons_category ON public.proposal_add_ons(category);
CREATE INDEX IF NOT EXISTS idx_proposal_add_ons_selected ON public.proposal_add_ons(is_selected);

ALTER TABLE public.proposal_add_ons ENABLE ROW LEVEL SECURITY;

-- Organizations can manage add-ons for their proposals.
CREATE POLICY "Organizations can manage their proposal add-ons"
    ON public.proposal_add_ons
    FOR ALL
    USING (
        proposal_id IN (
            SELECT id FROM public.proposals
            WHERE organization_id = public.get_user_organization_id()
        )
    );

-- Public can view and update proposal add-ons (share-token validation happens in app logic).
-- This matches the existing public behavior for proposal activities and accommodations.
CREATE POLICY "Public can view proposal add-ons"
    ON public.proposal_add_ons
    FOR SELECT
    USING (true);

CREATE POLICY "Public can update proposal add-ons"
    ON public.proposal_add_ons
    FOR UPDATE
    USING (true);

-- Keep updated_at fresh
CREATE TRIGGER trigger_proposal_add_ons_updated_at
    BEFORE UPDATE ON public.proposal_add_ons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE public.proposal_add_ons IS 'Snapshot add-ons/options attached to a proposal (vehicle type, upgrades, etc.)';

-- ============================================================================
-- PRICING: INCLUDE BASE + SELECTED ITEMS + SELECTED ADD-ONS
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_proposal_price(p_proposal_id UUID)
RETURNS DECIMAL(10, 2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total DECIMAL(10, 2);
BEGIN
    SELECT
        COALESCE((SELECT p.total_price FROM public.proposals p WHERE p.id = p_proposal_id), 0) +
        COALESCE((
            SELECT SUM(pa.price)
            FROM public.proposal_days pd
            JOIN public.proposal_activities pa ON pa.proposal_day_id = pd.id
            WHERE pd.proposal_id = p_proposal_id
              AND pa.is_selected = true
        ), 0) +
        COALESCE((
            SELECT SUM(pac.price_per_night)
            FROM public.proposal_days pd
            JOIN public.proposal_accommodations pac ON pac.proposal_day_id = pd.id
            WHERE pd.proposal_id = p_proposal_id
              AND pac.is_selected = true
        ), 0) +
        COALESCE((
            SELECT SUM(pao.unit_price * pao.quantity)
            FROM public.proposal_add_ons pao
            WHERE pao.proposal_id = p_proposal_id
              AND pao.is_selected = true
        ), 0)
    INTO v_total;

    RETURN v_total;
END;
$$;

COMMENT ON FUNCTION calculate_proposal_price IS 'Calculates total price (base proposal total_price + selected activities/accommodations + selected proposal add-ons).';

