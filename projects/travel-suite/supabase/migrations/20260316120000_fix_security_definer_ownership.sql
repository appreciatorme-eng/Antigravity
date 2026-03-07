-- Migration: Fix SECURITY DEFINER ownership verification
-- Created: 2026-03-16
-- Description: Require authenticated tenant ownership before privileged RPCs execute.

CREATE OR REPLACE FUNCTION public._authenticated_org_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: not authenticated';
    END IF;

    SELECT organization_id
    INTO v_org_id
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: no org membership found';
    END IF;

    RETURN v_org_id;
END;
$$;

REVOKE ALL ON FUNCTION public._authenticated_org_id() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public._assert_organization_access(p_organization_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org_id UUID;
BEGIN
    v_org_id := public._authenticated_org_id();

    IF p_organization_id IS NULL OR p_organization_id <> v_org_id THEN
        RAISE EXCEPTION 'Forbidden: organization does not belong to caller tenant';
    END IF;

    RETURN v_org_id;
END;
$$;

REVOKE ALL ON FUNCTION public._assert_organization_access(UUID) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public._assert_client_belongs_to_authenticated_org(p_client_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org_id UUID;
    v_client_org_id UUID;
BEGIN
    v_org_id := public._authenticated_org_id();

    SELECT organization_id
    INTO v_client_org_id
    FROM public.clients
    WHERE id = p_client_id;

    IF v_client_org_id IS NULL THEN
        RAISE EXCEPTION 'Client not found: %', p_client_id;
    END IF;

    IF v_client_org_id <> v_org_id THEN
        RAISE EXCEPTION 'Forbidden: client does not belong to caller tenant';
    END IF;

    RETURN v_client_org_id;
END;
$$;

REVOKE ALL ON FUNCTION public._assert_client_belongs_to_authenticated_org(UUID) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public._assert_trip_belongs_to_org(
    p_trip_id UUID,
    p_expected_org_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_trip_org_id UUID;
BEGIN
    IF p_trip_id IS NULL THEN
        RETURN;
    END IF;

    SELECT organization_id
    INTO v_trip_org_id
    FROM public.trips
    WHERE id = p_trip_id;

    IF v_trip_org_id IS NULL THEN
        RAISE EXCEPTION 'Trip not found: %', p_trip_id;
    END IF;

    IF v_trip_org_id <> p_expected_org_id THEN
        RAISE EXCEPTION 'Forbidden: trip does not belong to caller tenant';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public._assert_trip_belongs_to_org(UUID, UUID) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public._assert_addon_belongs_to_org(
    p_add_on_id UUID,
    p_expected_org_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_add_on_org_id UUID;
BEGIN
    SELECT organization_id
    INTO v_add_on_org_id
    FROM public.add_ons
    WHERE id = p_add_on_id;

    IF v_add_on_org_id IS NULL THEN
        RAISE EXCEPTION 'Add-on not found: %', p_add_on_id;
    END IF;

    IF v_add_on_org_id <> p_expected_org_id THEN
        RAISE EXCEPTION 'Forbidden: add-on does not belong to caller tenant';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public._assert_addon_belongs_to_org(UUID, UUID) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public._assert_template_belongs_to_org(
    p_template_id UUID,
    p_expected_org_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_template_org_id UUID;
BEGIN
    SELECT organization_id
    INTO v_template_org_id
    FROM public.tour_templates
    WHERE id = p_template_id;

    IF v_template_org_id IS NULL THEN
        RAISE EXCEPTION 'Template not found: %', p_template_id;
    END IF;

    IF v_template_org_id <> p_expected_org_id THEN
        RAISE EXCEPTION 'Forbidden: template does not belong to caller tenant';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public._assert_template_belongs_to_org(UUID, UUID) FROM PUBLIC;

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
SET search_path = public
AS $$
DECLARE
    v_org_id UUID;
    v_tags TEXT[];
    v_lifecycle_stage VARCHAR;
    v_purchased_addon_ids UUID[];
BEGIN
    v_org_id := public._assert_client_belongs_to_authenticated_org(p_client_id);

    IF p_trip_id IS NOT NULL THEN
        PERFORM public._assert_trip_belongs_to_org(p_trip_id, v_org_id);
    END IF;

    SELECT c.tags, c.lifecycle_stage
    INTO v_tags, v_lifecycle_stage
    FROM public.clients c
    WHERE c.id = p_client_id;

    SELECT ARRAY_AGG(add_on_id)
    INTO v_purchased_addon_ids
    FROM public.client_add_ons
    WHERE client_id = p_client_id;

    v_purchased_addon_ids := COALESCE(v_purchased_addon_ids, ARRAY[]::UUID[]);

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
            50 +
            CASE
                WHEN 'VIP' = ANY(v_tags) AND a.category = 'Upgrades' THEN 30
                WHEN 'Adventure' = ANY(v_tags) AND a.category = 'Activities' THEN 25
                WHEN 'Foodie' = ANY(v_tags) AND a.category = 'Dining' THEN 25
                WHEN 'Luxury' = ANY(v_tags) AND a.price > 200 THEN 20
                ELSE 0
            END +
            CASE
                WHEN v_lifecycle_stage = 'active' AND a.price < 150 THEN 15
                WHEN v_lifecycle_stage = 'payment_confirmed' AND a.category = 'Transport' THEN 20
                ELSE 0
            END +
            CASE
                WHEN p_trip_id IS NOT NULL THEN 10
                ELSE 0
            END AS score,
            CASE
                WHEN 'VIP' = ANY(v_tags) AND a.category = 'Upgrades' THEN 'Perfect for VIP travelers'
                WHEN 'Adventure' = ANY(v_tags) AND a.category = 'Activities' THEN 'Matches your adventurous spirit'
                WHEN 'Foodie' = ANY(v_tags) AND a.category = 'Dining' THEN 'Curated for food lovers'
                WHEN 'Luxury' = ANY(v_tags) AND a.price > 200 THEN 'Premium experience'
                WHEN v_lifecycle_stage = 'active' AND a.price < 150 THEN 'Great value for money'
                ELSE 'Recommended for you'
            END AS reason,
            CASE
                WHEN EXTRACT(DOW FROM NOW()) IN (5, 6) AND a.category = 'Dining' THEN 10
                WHEN EXTRACT(HOUR FROM NOW()) < 10 AND a.category = 'Activities' THEN 15
                ELSE NULL
            END AS discount
        FROM public.add_ons a
        WHERE a.organization_id = v_org_id
          AND a.is_active = true
          AND NOT (a.id = ANY(v_purchased_addon_ids))
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
    WHERE s.score >= 50
    ORDER BY s.score DESC, s.price ASC
    LIMIT p_max_results;
END;
$$;

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
SET search_path = public
AS $$
BEGIN
    PERFORM public._assert_organization_access(p_organization_id);

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
    FROM public.add_ons a
    LEFT JOIN public.client_add_ons ca ON ca.add_on_id = a.id
        AND ca.purchased_at >= NOW() - (p_days || ' days')::INTERVAL
    WHERE a.organization_id = p_organization_id
      AND a.is_active = true
    GROUP BY a.id
    ORDER BY purchase_count DESC, a.price ASC
    LIMIT p_max_results;
END;
$$;

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
SET search_path = public
AS $$
BEGIN
    PERFORM public._assert_client_belongs_to_authenticated_org(p_client_id);

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
    FROM public.get_recommended_addons(p_client_id, NULL, p_max_results) r
    WHERE r.discount IS NOT NULL AND r.discount > 0
    ORDER BY r.discount DESC, r.score DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.track_addon_view(
    p_client_id UUID,
    p_add_on_id UUID,
    p_source VARCHAR DEFAULT 'explore'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org_id UUID;
BEGIN
    v_org_id := public._assert_client_belongs_to_authenticated_org(p_client_id);
    PERFORM public._assert_addon_belongs_to_org(p_add_on_id, v_org_id);

    INSERT INTO public.addon_views (client_id, add_on_id, source)
    VALUES (p_client_id, p_add_on_id, p_source);
END;
$$;

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
SET search_path = public
AS $$
BEGIN
    PERFORM public._assert_organization_access(p_organization_id);

    RETURN QUERY
    WITH view_counts AS (
        SELECT
            av.add_on_id,
            COUNT(*) AS view_count
        FROM public.addon_views av
        JOIN public.clients c ON c.id = av.client_id
        WHERE c.organization_id = p_organization_id
          AND av.viewed_at >= NOW() - (p_days || ' days')::INTERVAL
        GROUP BY av.add_on_id
    ),
    purchase_counts AS (
        SELECT
            ca.add_on_id,
            COUNT(*) AS purchase_count
        FROM public.client_add_ons ca
        JOIN public.clients c ON c.id = ca.client_id
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
    FROM public.add_ons a
    LEFT JOIN view_counts vc ON vc.add_on_id = a.id
    LEFT JOIN purchase_counts pc ON pc.add_on_id = a.id
    WHERE a.organization_id = p_organization_id
    ORDER BY conversion_rate DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.clone_template_to_proposal(
    p_template_id UUID,
    p_client_id UUID,
    p_created_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_proposal_id UUID;
    v_template RECORD;
    v_day RECORD;
    v_activity RECORD;
    v_accommodation RECORD;
    v_new_day_id UUID;
    v_org_id UUID;
    v_authenticated_user_id UUID;
BEGIN
    v_authenticated_user_id := auth.uid();

    IF v_authenticated_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_created_by IS NOT NULL AND p_created_by <> v_authenticated_user_id THEN
        RAISE EXCEPTION 'Forbidden: created_by must match auth.uid()';
    END IF;

    v_org_id := public._assert_client_belongs_to_authenticated_org(p_client_id);
    PERFORM public._assert_template_belongs_to_org(p_template_id, v_org_id);

    SELECT *
    INTO v_template
    FROM public.tour_templates
    WHERE id = p_template_id
      AND organization_id = v_org_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found';
    END IF;

    INSERT INTO public.proposals (
        organization_id,
        client_id,
        template_id,
        title,
        share_token,
        total_price,
        client_selected_price,
        created_by,
        expires_at
    ) VALUES (
        v_org_id,
        p_client_id,
        p_template_id,
        v_template.name,
        public.generate_share_token(),
        v_template.base_price,
        v_template.base_price,
        v_authenticated_user_id,
        NOW() + INTERVAL '30 days'
    )
    RETURNING id INTO v_proposal_id;

    FOR v_day IN
        SELECT * FROM public.template_days
        WHERE template_id = p_template_id
        ORDER BY day_number
    LOOP
        INSERT INTO public.proposal_days (proposal_id, day_number, title, description)
        VALUES (v_proposal_id, v_day.day_number, v_day.title, v_day.description)
        RETURNING id INTO v_new_day_id;

        FOR v_activity IN
            SELECT * FROM public.template_activities
            WHERE template_day_id = v_day.id
            ORDER BY display_order
        LOOP
            INSERT INTO public.proposal_activities (
                proposal_day_id, time, title, description, location,
                image_url, price, is_optional, is_premium, display_order
            ) VALUES (
                v_new_day_id, v_activity.time, v_activity.title, v_activity.description,
                v_activity.location, v_activity.image_url, v_activity.price,
                v_activity.is_optional, v_activity.is_premium, v_activity.display_order
            );
        END LOOP;

        FOR v_accommodation IN
            SELECT * FROM public.template_accommodations
            WHERE template_day_id = v_day.id
        LOOP
            INSERT INTO public.proposal_accommodations (
                proposal_day_id, hotel_name, star_rating, room_type,
                check_in_date, check_out_date, price_per_night, amenities, image_url
            ) VALUES (
                v_new_day_id, v_accommodation.hotel_name, v_accommodation.star_rating,
                v_accommodation.room_type, v_accommodation.check_in_date,
                v_accommodation.check_out_date, v_accommodation.price_per_night,
                v_accommodation.amenities, v_accommodation.image_url
            );
        END LOOP;
    END LOOP;

    RETURN v_proposal_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.clone_template_deep(
    p_template_id UUID,
    p_new_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_template_id UUID;
    v_organization_id UUID;
    v_created_by UUID;
    v_old_day RECORD;
    v_new_day_id UUID;
    v_template_name TEXT;
BEGIN
    v_created_by := auth.uid();

    IF v_created_by IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    v_organization_id := public._authenticated_org_id();
    PERFORM public._assert_template_belongs_to_org(p_template_id, v_organization_id);

    SELECT name
    INTO v_template_name
    FROM public.tour_templates
    WHERE id = p_template_id
      AND organization_id = v_organization_id;

    IF v_template_name IS NULL THEN
        RAISE EXCEPTION 'Template not found';
    END IF;

    INSERT INTO public.tour_templates (
        organization_id,
        name,
        destination,
        duration_days,
        description,
        hero_image_url,
        base_price,
        status,
        is_public,
        tags,
        created_by
    )
    SELECT
        organization_id,
        COALESCE(p_new_name, name || ' (Copy)'),
        destination,
        duration_days,
        description,
        hero_image_url,
        base_price,
        'active',
        false,
        tags,
        v_created_by
    FROM public.tour_templates
    WHERE id = p_template_id
      AND organization_id = v_organization_id
    RETURNING id INTO v_new_template_id;

    FOR v_old_day IN
        SELECT * FROM public.template_days
        WHERE template_id = p_template_id
        ORDER BY day_number
    LOOP
        INSERT INTO public.template_days (
            template_id,
            day_number,
            title,
            description
        ) VALUES (
            v_new_template_id,
            v_old_day.day_number,
            v_old_day.title,
            v_old_day.description
        )
        RETURNING id INTO v_new_day_id;

        INSERT INTO public.template_activities (
            template_day_id,
            time,
            title,
            description,
            location,
            image_url,
            price,
            is_optional,
            is_premium,
            display_order
        )
        SELECT
            v_new_day_id,
            time,
            title,
            description,
            location,
            image_url,
            price,
            is_optional,
            is_premium,
            display_order
        FROM public.template_activities
        WHERE template_day_id = v_old_day.id
        ORDER BY display_order;

        INSERT INTO public.template_accommodations (
            template_day_id,
            hotel_name,
            star_rating,
            room_type,
            price_per_night,
            amenities,
            image_url
        )
        SELECT
            v_new_day_id,
            hotel_name,
            star_rating,
            room_type,
            price_per_night,
            amenities,
            image_url
        FROM public.template_accommodations
        WHERE template_day_id = v_old_day.id;
    END LOOP;

    RETURN v_new_template_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_recommended_addons(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_trending_addons(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_special_offers(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_addon_view(UUID, UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_addon_conversion_rate(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clone_template_to_proposal(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clone_template_deep(UUID, TEXT) TO authenticated;
