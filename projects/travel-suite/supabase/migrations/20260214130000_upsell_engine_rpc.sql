-- Migration: Upsell Engine RPC Functions
-- Created: 2026-02-14
-- Description: Database functions to support AI-driven add-on recommendations

-- ============================================================================
-- Function: Get Recommended Add-ons for Client
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_recommended_addons(
    p_client_id UUID,
    p_trip_id UUID DEFAULT NULL,
    p_max_results INTEGER DEFAULT 6
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    description TEXT,
    price DECIMAL,
    category VARCHAR,
    image_url TEXT,
    duration VARCHAR,
    score INTEGER,
    reason TEXT,
    discount INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_client RECORD;
    v_trip RECORD;
    v_org_id UUID;
    v_tags TEXT[];
    v_lifecycle_stage VARCHAR;
    v_purchased_addon_ids UUID[];
BEGIN
    -- Step 1: Get client info
    SELECT c.organization_id, c.tags, c.lifecycle_stage
    INTO v_org_id, v_tags, v_lifecycle_stage
    FROM clients c
    WHERE c.id = p_client_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Client not found: %', p_client_id;
    END IF;

    -- Step 2: Get trip info (if provided)
    IF p_trip_id IS NOT NULL THEN
        SELECT *
        INTO v_trip
        FROM trips t
        WHERE t.id = p_trip_id;
    END IF;

    -- Step 3: Get already purchased add-on IDs
    SELECT ARRAY_AGG(add_on_id)
    INTO v_purchased_addon_ids
    FROM client_add_ons
    WHERE client_id = p_client_id;

    -- Coalesce to empty array if no purchases
    v_purchased_addon_ids := COALESCE(v_purchased_addon_ids, ARRAY[]::UUID[]);

    -- Step 4: Score and return recommendations
    RETURN QUERY
    WITH scored_addons AS (
        SELECT
            a.id,
            a.name,
            a.description,
            a.price,
            a.category,
            a.image_url,
            a.duration,
            -- Base score: 50
            50 +
            -- Rule 1: Tag-based scoring
            CASE
                WHEN 'VIP' = ANY(v_tags) AND a.category = 'Upgrades' THEN 30
                WHEN 'Adventure' = ANY(v_tags) AND a.category = 'Activities' THEN 25
                WHEN 'Foodie' = ANY(v_tags) AND a.category = 'Dining' THEN 25
                WHEN 'Luxury' = ANY(v_tags) AND a.price > 200 THEN 20
                ELSE 0
            END +
            -- Rule 2: Price sensitivity
            CASE
                WHEN v_lifecycle_stage = 'active' AND a.price < 150 THEN 15
                WHEN v_lifecycle_stage = 'payment_confirmed' AND a.category = 'Transport' THEN 20
                ELSE 0
            END +
            -- Rule 3: Trip destination (simplified for SQL)
            CASE
                WHEN p_trip_id IS NOT NULL THEN 10
                ELSE 0
            END
            AS score,
            -- Reason (first matching rule)
            CASE
                WHEN 'VIP' = ANY(v_tags) AND a.category = 'Upgrades' THEN 'Perfect for VIP travelers'
                WHEN 'Adventure' = ANY(v_tags) AND a.category = 'Activities' THEN 'Matches your adventurous spirit'
                WHEN 'Foodie' = ANY(v_tags) AND a.category = 'Dining' THEN 'Curated for food lovers'
                WHEN 'Luxury' = ANY(v_tags) AND a.price > 200 THEN 'Premium experience'
                WHEN v_lifecycle_stage = 'active' AND a.price < 150 THEN 'Great value for money'
                ELSE 'Recommended for you'
            END AS reason,
            -- Discount (weekend special for dining)
            CASE
                WHEN EXTRACT(DOW FROM NOW()) IN (5, 6) AND a.category = 'Dining' THEN 10
                WHEN EXTRACT(HOUR FROM NOW()) < 10 AND a.category = 'Activities' THEN 15
                ELSE NULL
            END AS discount
        FROM add_ons a
        WHERE a.organization_id = v_org_id
          AND a.is_active = true
          AND NOT (a.id = ANY(v_purchased_addon_ids)) -- Exclude purchased
    )
    SELECT
        s.id,
        s.name,
        s.description,
        s.price,
        s.category,
        s.image_url,
        s.duration,
        s.score,
        s.reason,
        s.discount
    FROM scored_addons s
    WHERE s.score >= 50 -- Min score threshold
    ORDER BY s.score DESC, s.price ASC
    LIMIT p_max_results;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_recommended_addons(UUID, UUID, INTEGER) TO authenticated;

-- ============================================================================
-- Function: Get Trending Add-ons (Most Purchased)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_trending_addons(
    p_organization_id UUID,
    p_days INTEGER DEFAULT 30,
    p_max_results INTEGER DEFAULT 6
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    description TEXT,
    price DECIMAL,
    category VARCHAR,
    image_url TEXT,
    duration VARCHAR,
    purchase_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.name,
        a.description,
        a.price,
        a.category,
        a.image_url,
        a.duration,
        COUNT(ca.id) AS purchase_count
    FROM add_ons a
    LEFT JOIN client_add_ons ca ON ca.add_on_id = a.id
        AND ca.purchased_at >= NOW() - (p_days || ' days')::INTERVAL
    WHERE a.organization_id = p_organization_id
      AND a.is_active = true
    GROUP BY a.id
    ORDER BY purchase_count DESC, a.price ASC
    LIMIT p_max_results;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_trending_addons(UUID, INTEGER, INTEGER) TO authenticated;

-- ============================================================================
-- Function: Get Special Offers (Discounted Add-ons)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_special_offers(
    p_client_id UUID,
    p_max_results INTEGER DEFAULT 6
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    description TEXT,
    price DECIMAL,
    category VARCHAR,
    image_url TEXT,
    duration VARCHAR,
    discount INTEGER,
    reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.name,
        r.description,
        r.price,
        r.category,
        r.image_url,
        r.duration,
        r.discount,
        r.reason
    FROM get_recommended_addons(p_client_id, NULL, p_max_results) r
    WHERE r.discount IS NOT NULL AND r.discount > 0
    ORDER BY r.discount DESC, r.score DESC;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_special_offers(UUID, INTEGER) TO authenticated;

-- ============================================================================
-- Function: Track Add-on View (for analytics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.addon_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    add_on_id UUID NOT NULL REFERENCES public.add_ons(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    source VARCHAR(50) -- 'explore', 'recommendations', 'special_offers'
);

CREATE INDEX idx_addon_views_client_id ON public.addon_views(client_id);
CREATE INDEX idx_addon_views_addon_id ON public.addon_views(add_on_id);
CREATE INDEX idx_addon_views_viewed_at ON public.addon_views(viewed_at);

-- Enable RLS
ALTER TABLE public.addon_views ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Organizations can view addon analytics"
    ON public.addon_views
    FOR SELECT
    USING (
        client_id IN (
            SELECT id FROM public.clients WHERE organization_id = auth.uid_organization_id()
        )
    );

-- Function to record view
CREATE OR REPLACE FUNCTION public.track_addon_view(
    p_client_id UUID,
    p_add_on_id UUID,
    p_source VARCHAR DEFAULT 'explore'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO addon_views (client_id, add_on_id, source)
    VALUES (p_client_id, p_add_on_id, p_source);
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_addon_view(UUID, UUID, VARCHAR) TO authenticated;

-- ============================================================================
-- Function: Get Conversion Rate by Add-on
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_addon_conversion_rate(
    p_organization_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    add_on_id UUID,
    add_on_name VARCHAR,
    views BIGINT,
    purchases BIGINT,
    conversion_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH view_counts AS (
        SELECT
            av.add_on_id,
            COUNT(*) AS view_count
        FROM addon_views av
        JOIN clients c ON c.id = av.client_id
        WHERE c.organization_id = p_organization_id
          AND av.viewed_at >= NOW() - (p_days || ' days')::INTERVAL
        GROUP BY av.add_on_id
    ),
    purchase_counts AS (
        SELECT
            ca.add_on_id,
            COUNT(*) AS purchase_count
        FROM client_add_ons ca
        JOIN clients c ON c.id = ca.client_id
        WHERE c.organization_id = p_organization_id
          AND ca.purchased_at >= NOW() - (p_days || ' days')::INTERVAL
        GROUP BY ca.add_on_id
    )
    SELECT
        a.id AS add_on_id,
        a.name AS add_on_name,
        COALESCE(vc.view_count, 0) AS views,
        COALESCE(pc.purchase_count, 0) AS purchases,
        CASE
            WHEN COALESCE(vc.view_count, 0) = 0 THEN 0
            ELSE ROUND((COALESCE(pc.purchase_count, 0)::NUMERIC / vc.view_count::NUMERIC) * 100, 2)
        END AS conversion_rate
    FROM add_ons a
    LEFT JOIN view_counts vc ON vc.add_on_id = a.id
    LEFT JOIN purchase_counts pc ON pc.add_on_id = a.id
    WHERE a.organization_id = p_organization_id
    ORDER BY conversion_rate DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_addon_conversion_rate(UUID, INTEGER) TO authenticated;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON FUNCTION public.get_recommended_addons IS 'AI-driven add-on recommendations based on client profile';
COMMENT ON FUNCTION public.get_trending_addons IS 'Most purchased add-ons in the last N days';
COMMENT ON FUNCTION public.get_special_offers IS 'Recommended add-ons with active discounts';
COMMENT ON FUNCTION public.track_addon_view IS 'Track when a client views an add-on for analytics';
COMMENT ON FUNCTION public.get_addon_conversion_rate IS 'Calculate view-to-purchase conversion rate';
