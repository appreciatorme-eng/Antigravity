-- Enhanced clone template function that copies all nested data
CREATE OR REPLACE FUNCTION clone_template_deep(
    p_template_id UUID,
    p_new_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_template_id UUID;
    v_organization_id UUID;
    v_created_by UUID;
    v_old_day RECORD;
    v_new_day_id UUID;
    v_template_name TEXT;
BEGIN
    -- Get the authenticated user
    v_created_by := auth.uid();

    IF v_created_by IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get organization_id and template name from the source template
    SELECT organization_id, name
    INTO v_organization_id, v_template_name
    FROM public.tour_templates
    WHERE id = p_template_id;

    IF v_organization_id IS NULL THEN
        RAISE EXCEPTION 'Template not found';
    END IF;

    -- Clone the template
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
        false, -- Copies are private by default
        tags,
        v_created_by
    FROM public.tour_templates
    WHERE id = p_template_id
    RETURNING id INTO v_new_template_id;

    -- Clone all days and their nested data
    FOR v_old_day IN
        SELECT * FROM public.template_days
        WHERE template_id = p_template_id
        ORDER BY day_number
    LOOP
        -- Clone the day
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

        -- Clone all activities for this day
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

        -- Clone accommodation for this day
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION clone_template_deep(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION clone_template_deep IS 'Clones a tour template with all days, activities, and accommodations. Returns the new template ID.';
