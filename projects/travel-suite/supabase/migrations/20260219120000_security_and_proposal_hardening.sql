-- Migration: Security + Proposal Hardening
-- Created: 2026-02-19
-- Description:
-- 1) Remove unsafe public proposal policies (share-token access must go through server APIs)
-- 2) Normalize proposal add-on storage to proposal_add_ons
-- 3) Enforce a single selected transport option per proposal

-- ==========================================================================
-- PROPOSAL ADD-ONS TABLE NORMALIZATION
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.proposal_add_ons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
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
    CONSTRAINT proposal_add_ons_valid_unit_price CHECK (unit_price >= 0),
    CONSTRAINT proposal_add_ons_valid_quantity CHECK (quantity > 0 AND quantity <= 100)
);

CREATE INDEX IF NOT EXISTS idx_proposal_add_ons_proposal_id ON public.proposal_add_ons(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_add_ons_category ON public.proposal_add_ons(category);
CREATE INDEX IF NOT EXISTS idx_proposal_add_ons_selected ON public.proposal_add_ons(is_selected);

ALTER TABLE public.proposal_add_ons ENABLE ROW LEVEL SECURITY;

-- Ensure updated_at trigger exists for proposal_add_ons regardless of whether this
-- database uses update_updated_at() or handle_updated_at().
DO $$
BEGIN
    IF to_regclass('public.proposal_add_ons') IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM pg_trigger
            WHERE tgname = 'trigger_proposal_add_ons_updated_at'
              AND tgrelid = 'public.proposal_add_ons'::regclass
       ) THEN
        IF EXISTS (
            SELECT 1
            FROM pg_proc
            WHERE proname = 'update_updated_at'
              AND pg_function_is_visible(oid)
        ) THEN
            EXECUTE '
                CREATE TRIGGER trigger_proposal_add_ons_updated_at
                BEFORE UPDATE ON public.proposal_add_ons
                FOR EACH ROW
                EXECUTE FUNCTION public.update_updated_at()
            ';
        ELSIF EXISTS (
            SELECT 1
            FROM pg_proc
            WHERE proname = 'handle_updated_at'
              AND pg_function_is_visible(oid)
        ) THEN
            EXECUTE '
                CREATE TRIGGER trigger_proposal_add_ons_updated_at
                BEFORE UPDATE ON public.proposal_add_ons
                FOR EACH ROW
                EXECUTE FUNCTION public.handle_updated_at()
            ';
        END IF;
    END IF;
END;
$$;

-- Migrate legacy table if it exists.
DO $$
BEGIN
    IF to_regclass('public.proposal_addons') IS NOT NULL THEN
        INSERT INTO public.proposal_add_ons (
            id,
            proposal_id,
            add_on_id,
            name,
            description,
            category,
            image_url,
            unit_price,
            quantity,
            is_selected,
            created_at,
            updated_at
        )
        SELECT
            pa.id,
            pa.proposal_id,
            pa.addon_id,
            COALESCE(a.name, 'Add-on'),
            a.description,
            COALESCE(a.category, 'Upgrades'),
            a.image_url,
            COALESCE(a.price, 0),
            1,
            COALESCE(pa.is_selected_by_client, pa.is_included_by_default, false),
            COALESCE(pa.created_at, NOW()),
            COALESCE(pa.updated_at, NOW())
        FROM public.proposal_addons pa
        LEFT JOIN public.add_ons a ON a.id = pa.addon_id
        ON CONFLICT (id) DO NOTHING;

        DROP TABLE public.proposal_addons;
    END IF;
END;
$$;

-- Recreate operator-scoped policy for proposal add-ons and remove public access.
DO $$
BEGIN
    IF to_regclass('public.proposal_add_ons') IS NOT NULL THEN
        EXECUTE 'DROP POLICY IF EXISTS "Organizations can manage their proposal add-ons" ON public.proposal_add_ons';
        EXECUTE '
            CREATE POLICY "Organizations can manage their proposal add-ons"
                ON public.proposal_add_ons
                FOR ALL
                USING (
                    proposal_id IN (
                        SELECT id
                        FROM public.proposals
                        WHERE organization_id = public.get_user_organization_id()
                    )
                )
                WITH CHECK (
                    proposal_id IN (
                        SELECT id
                        FROM public.proposals
                        WHERE organization_id = public.get_user_organization_id()
                    )
                )
        ';

        EXECUTE 'DROP POLICY IF EXISTS "Public can view proposal add-ons" ON public.proposal_add_ons';
        EXECUTE 'DROP POLICY IF EXISTS "Public can update proposal add-ons" ON public.proposal_add_ons';
    END IF;
END;
$$;

-- Keep only one selected transport option per proposal.
WITH ranked_transport AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY proposal_id
            ORDER BY created_at ASC, id ASC
        ) AS rn
    FROM public.proposal_add_ons
    WHERE is_selected = true
      AND LOWER(category) = 'transport'
)
UPDATE public.proposal_add_ons pao
SET is_selected = false,
    updated_at = NOW()
FROM ranked_transport rt
WHERE pao.id = rt.id
  AND rt.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_proposal_add_ons_selected_transport
    ON public.proposal_add_ons(proposal_id)
    WHERE is_selected = true
      AND LOWER(category) = 'transport';

-- ==========================================================================
-- REMOVE UNSAFE PUBLIC PROPOSAL POLICIES
-- ==========================================================================

DO $$
BEGIN
    IF to_regclass('public.proposals') IS NOT NULL THEN
        EXECUTE 'DROP POLICY IF EXISTS "Public can view proposals via share token" ON public.proposals';
    END IF;

    IF to_regclass('public.proposal_days') IS NOT NULL THEN
        EXECUTE 'DROP POLICY IF EXISTS "Public can view proposal days" ON public.proposal_days';
    END IF;

    IF to_regclass('public.proposal_activities') IS NOT NULL THEN
        EXECUTE 'DROP POLICY IF EXISTS "Public can view and update proposal activities" ON public.proposal_activities';
    END IF;

    IF to_regclass('public.proposal_accommodations') IS NOT NULL THEN
        EXECUTE 'DROP POLICY IF EXISTS "Public can view proposal accommodations" ON public.proposal_accommodations';
    END IF;

    IF to_regclass('public.proposal_comments') IS NOT NULL THEN
        EXECUTE 'DROP POLICY IF EXISTS "Anyone can create proposal comments" ON public.proposal_comments';
        EXECUTE 'DROP POLICY IF EXISTS "Public can view proposal comments" ON public.proposal_comments';
    END IF;
END;
$$;

COMMENT ON TABLE public.proposal_add_ons IS 'Normalized proposal add-ons/options table used by proposal pricing and client selection.';
COMMENT ON INDEX uq_proposal_add_ons_selected_transport IS 'Enforces at most one selected Transport option per proposal.';
