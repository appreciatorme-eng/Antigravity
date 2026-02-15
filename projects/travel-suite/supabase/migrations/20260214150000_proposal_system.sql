-- Migration: Interactive Proposal System
-- Created: 2026-02-14
-- Description: Revolutionary replacement for static PDFs with interactive, collaborative proposals

-- ============================================================================
-- TOUR TEMPLATES (Reusable Itineraries)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tour_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    destination VARCHAR(255),
    duration_days INTEGER,
    description TEXT,
    hero_image_url TEXT,
    base_price DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'active', -- active/archived
    is_public BOOLEAN DEFAULT false, -- Share in marketplace?
    tags TEXT[], -- ['luxury', 'adventure', 'family']
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_duration CHECK (duration_days > 0 AND duration_days <= 365)
);

-- Template days (day-by-day structure)
CREATE TABLE IF NOT EXISTS public.template_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.tour_templates(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    title VARCHAR(255),
    description TEXT,
    CONSTRAINT valid_day_number CHECK (day_number > 0)
);

-- Template activities (activities within each day)
CREATE TABLE IF NOT EXISTS public.template_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_day_id UUID NOT NULL REFERENCES public.template_days(id) ON DELETE CASCADE,
    time VARCHAR(20), -- "09:00 AM"
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    image_url TEXT,
    price DECIMAL(10, 2) DEFAULT 0,
    is_optional BOOLEAN DEFAULT false, -- Can client toggle off?
    is_premium BOOLEAN DEFAULT false, -- Premium upgrade option?
    display_order INTEGER DEFAULT 0,
    CONSTRAINT valid_price CHECK (price >= 0)
);

-- Template accommodations
CREATE TABLE IF NOT EXISTS public.template_accommodations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_day_id UUID NOT NULL REFERENCES public.template_days(id) ON DELETE CASCADE,
    hotel_name VARCHAR(255) NOT NULL,
    star_rating INTEGER CHECK (star_rating BETWEEN 1 AND 5),
    room_type VARCHAR(100),
    check_in_date DATE,
    check_out_date DATE,
    price_per_night DECIMAL(10, 2),
    amenities TEXT[],
    image_url TEXT,
    CONSTRAINT valid_room_price CHECK (price_per_night >= 0)
);

-- ============================================================================
-- PROPOSALS (Client-Specific Instances)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.tour_templates(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    share_token VARCHAR(100) UNIQUE NOT NULL,
    version INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'draft', -- draft/sent/viewed/commented/approved/rejected
    total_price DECIMAL(10, 2),
    client_selected_price DECIMAL(10, 2),
    expires_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    approved_by VARCHAR(255),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_prices CHECK (total_price >= 0 AND client_selected_price >= 0)
);

-- Proposal days (cloned from template, customizable)
CREATE TABLE IF NOT EXISTS public.proposal_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    title VARCHAR(255),
    description TEXT,
    is_approved BOOLEAN DEFAULT false,
    CONSTRAINT valid_proposal_day CHECK (day_number > 0)
);

-- Proposal activities (cloned from template)
CREATE TABLE IF NOT EXISTS public.proposal_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_day_id UUID NOT NULL REFERENCES public.proposal_days(id) ON DELETE CASCADE,
    time VARCHAR(20),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    image_url TEXT,
    price DECIMAL(10, 2) DEFAULT 0,
    is_optional BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,
    is_selected BOOLEAN DEFAULT true, -- Client toggled on/off?
    display_order INTEGER DEFAULT 0,
    CONSTRAINT valid_activity_price CHECK (price >= 0)
);

-- Proposal accommodations
CREATE TABLE IF NOT EXISTS public.proposal_accommodations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_day_id UUID NOT NULL REFERENCES public.proposal_days(id) ON DELETE CASCADE,
    hotel_name VARCHAR(255) NOT NULL,
    star_rating INTEGER CHECK (star_rating BETWEEN 1 AND 5),
    room_type VARCHAR(100),
    check_in_date DATE,
    check_out_date DATE,
    price_per_night DECIMAL(10, 2),
    amenities TEXT[],
    image_url TEXT,
    is_selected BOOLEAN DEFAULT true,
    CONSTRAINT valid_accommodation_price CHECK (price_per_night >= 0)
);

-- ============================================================================
-- COLLABORATION FEATURES
-- ============================================================================

-- Client comments on proposals
CREATE TABLE IF NOT EXISTS public.proposal_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
    proposal_day_id UUID REFERENCES public.proposal_days(id) ON DELETE CASCADE,
    proposal_activity_id UUID REFERENCES public.proposal_activities(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    author_email VARCHAR(255),
    comment TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proposal version history
CREATE TABLE IF NOT EXISTS public.proposal_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    snapshot JSONB NOT NULL,
    change_summary TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_tour_templates_org ON public.tour_templates(organization_id);
CREATE INDEX idx_tour_templates_status ON public.tour_templates(status);
CREATE INDEX idx_template_days_template ON public.template_days(template_id);
CREATE INDEX idx_template_activities_day ON public.template_activities(template_day_id);

CREATE INDEX idx_proposals_org ON public.proposals(organization_id);
CREATE INDEX idx_proposals_client ON public.proposals(client_id);
CREATE INDEX idx_proposals_share_token ON public.proposals(share_token);
CREATE INDEX idx_proposals_status ON public.proposals(status);
CREATE INDEX idx_proposal_days_proposal ON public.proposal_days(proposal_id);
CREATE INDEX idx_proposal_activities_day ON public.proposal_activities(proposal_day_id);
CREATE INDEX idx_proposal_comments_proposal ON public.proposal_comments(proposal_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.tour_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Templates
CREATE POLICY "Organizations can manage their templates"
    ON public.tour_templates
    USING (organization_id = auth.uid_organization_id());

CREATE POLICY "Template days inherit template access"
    ON public.template_days
    USING (
        template_id IN (
            SELECT id FROM public.tour_templates
            WHERE organization_id = auth.uid_organization_id()
        )
    );

CREATE POLICY "Template activities inherit day access"
    ON public.template_activities
    USING (
        template_day_id IN (
            SELECT td.id FROM public.template_days td
            JOIN public.tour_templates tt ON tt.id = td.template_id
            WHERE tt.organization_id = auth.uid_organization_id()
        )
    );

CREATE POLICY "Template accommodations inherit day access"
    ON public.template_accommodations
    USING (
        template_day_id IN (
            SELECT td.id FROM public.template_days td
            JOIN public.tour_templates tt ON tt.id = td.template_id
            WHERE tt.organization_id = auth.uid_organization_id()
        )
    );

-- RLS Policies: Proposals (Operators and Public access via share token)
CREATE POLICY "Organizations can manage their proposals"
    ON public.proposals
    FOR ALL
    USING (organization_id = auth.uid_organization_id());

CREATE POLICY "Public can view proposals via share token"
    ON public.proposals
    FOR SELECT
    USING (true); -- Share token validated in application logic

CREATE POLICY "Proposal days inherit proposal access"
    ON public.proposal_days
    FOR ALL
    USING (
        proposal_id IN (
            SELECT id FROM public.proposals
            WHERE organization_id = auth.uid_organization_id()
        )
    );

CREATE POLICY "Public can view proposal days"
    ON public.proposal_days
    FOR SELECT
    USING (true);

CREATE POLICY "Proposal activities inherit day access"
    ON public.proposal_activities
    FOR ALL
    USING (
        proposal_day_id IN (
            SELECT pd.id FROM public.proposal_days pd
            JOIN public.proposals p ON p.id = pd.proposal_id
            WHERE p.organization_id = auth.uid_organization_id()
        )
    );

CREATE POLICY "Public can view and update proposal activities"
    ON public.proposal_activities
    FOR ALL
    USING (true);

CREATE POLICY "Proposal accommodations inherit day access"
    ON public.proposal_accommodations
    FOR ALL
    USING (
        proposal_day_id IN (
            SELECT pd.id FROM public.proposal_days pd
            JOIN public.proposals p ON p.id = pd.proposal_id
            WHERE p.organization_id = auth.uid_organization_id()
        )
    );

CREATE POLICY "Public can view proposal accommodations"
    ON public.proposal_accommodations
    FOR SELECT
    USING (true);

-- RLS Policies: Comments (Public can comment)
CREATE POLICY "Anyone can create proposal comments"
    ON public.proposal_comments
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Organizations can manage proposal comments"
    ON public.proposal_comments
    FOR ALL
    USING (
        proposal_id IN (
            SELECT id FROM public.proposals
            WHERE organization_id = auth.uid_organization_id()
        )
    );

CREATE POLICY "Public can view proposal comments"
    ON public.proposal_comments
    FOR SELECT
    USING (true);

-- RLS Policies: Versions
CREATE POLICY "Organizations can manage proposal versions"
    ON public.proposal_versions
    USING (
        proposal_id IN (
            SELECT id FROM public.proposals
            WHERE organization_id = auth.uid_organization_id()
        )
    );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Generate unique share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS VARCHAR(100)
LANGUAGE plpgsql
AS $$
DECLARE
    token VARCHAR(100);
    token_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate random 32-character token
        token := encode(gen_random_bytes(24), 'base64');
        token := replace(token, '/', '_');
        token := replace(token, '+', '-');
        token := substring(token, 1, 32);

        -- Check if token already exists
        SELECT EXISTS(SELECT 1 FROM proposals WHERE share_token = token) INTO token_exists;

        EXIT WHEN NOT token_exists;
    END LOOP;

    RETURN token;
END;
$$;

-- Clone template to proposal
CREATE OR REPLACE FUNCTION clone_template_to_proposal(
    p_template_id UUID,
    p_client_id UUID,
    p_created_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_proposal_id UUID;
    v_template RECORD;
    v_day RECORD;
    v_activity RECORD;
    v_accommodation RECORD;
    v_new_day_id UUID;
    v_org_id UUID;
BEGIN
    -- Get template details
    SELECT * INTO v_template
    FROM tour_templates
    WHERE id = p_template_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found';
    END IF;

    -- Get organization ID from client
    SELECT organization_id INTO v_org_id
    FROM clients
    WHERE id = p_client_id;

    -- Create proposal
    INSERT INTO proposals (
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
        generate_share_token(),
        v_template.base_price,
        v_template.base_price,
        p_created_by,
        NOW() + INTERVAL '30 days'
    )
    RETURNING id INTO v_proposal_id;

    -- Clone days
    FOR v_day IN
        SELECT * FROM template_days
        WHERE template_id = p_template_id
        ORDER BY day_number
    LOOP
        INSERT INTO proposal_days (proposal_id, day_number, title, description)
        VALUES (v_proposal_id, v_day.day_number, v_day.title, v_day.description)
        RETURNING id INTO v_new_day_id;

        -- Clone activities for this day
        FOR v_activity IN
            SELECT * FROM template_activities
            WHERE template_day_id = v_day.id
            ORDER BY display_order
        LOOP
            INSERT INTO proposal_activities (
                proposal_day_id, time, title, description, location,
                image_url, price, is_optional, is_premium, display_order
            ) VALUES (
                v_new_day_id, v_activity.time, v_activity.title, v_activity.description,
                v_activity.location, v_activity.image_url, v_activity.price,
                v_activity.is_optional, v_activity.is_premium, v_activity.display_order
            );
        END LOOP;

        -- Clone accommodations for this day
        FOR v_accommodation IN
            SELECT * FROM template_accommodations
            WHERE template_day_id = v_day.id
        LOOP
            INSERT INTO proposal_accommodations (
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

-- Calculate proposal price based on selected activities
CREATE OR REPLACE FUNCTION calculate_proposal_price(p_proposal_id UUID)
RETURNS DECIMAL(10, 2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total DECIMAL(10, 2);
BEGIN
    SELECT COALESCE(SUM(pa.price), 0) +
           COALESCE(SUM(pac.price_per_night), 0)
    INTO v_total
    FROM proposal_days pd
    LEFT JOIN proposal_activities pa ON pa.proposal_day_id = pd.id AND pa.is_selected = true
    LEFT JOIN proposal_accommodations pac ON pac.proposal_day_id = pd.id AND pac.is_selected = true
    WHERE pd.proposal_id = p_proposal_id;

    RETURN v_total;
END;
$$;

-- Create proposal version snapshot
CREATE OR REPLACE FUNCTION create_proposal_version(
    p_proposal_id UUID,
    p_change_summary TEXT,
    p_created_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_version_id UUID;
    v_version_number INTEGER;
    v_snapshot JSONB;
BEGIN
    -- Get next version number
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_version_number
    FROM proposal_versions
    WHERE proposal_id = p_proposal_id;

    -- Create snapshot (full proposal state)
    SELECT jsonb_build_object(
        'proposal', row_to_json(p),
        'days', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'day', row_to_json(pd),
                    'activities', (
                        SELECT jsonb_agg(row_to_json(pa))
                        FROM proposal_activities pa
                        WHERE pa.proposal_day_id = pd.id
                    ),
                    'accommodations', (
                        SELECT jsonb_agg(row_to_json(pac))
                        FROM proposal_accommodations pac
                        WHERE pac.proposal_day_id = pd.id
                    )
                )
            )
            FROM proposal_days pd
            WHERE pd.proposal_id = p_proposal_id
        )
    )
    INTO v_snapshot
    FROM proposals p
    WHERE p.id = p_proposal_id;

    -- Insert version
    INSERT INTO proposal_versions (
        proposal_id, version_number, snapshot, change_summary, created_by
    ) VALUES (
        p_proposal_id, v_version_number, v_snapshot, p_change_summary, p_created_by
    )
    RETURNING id INTO v_version_id;

    -- Update proposal version number
    UPDATE proposals
    SET version = v_version_number
    WHERE id = p_proposal_id;

    RETURN v_version_id;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tour_templates_updated_at
    BEFORE UPDATE ON public.tour_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_proposals_updated_at
    BEFORE UPDATE ON public.proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION generate_share_token() TO authenticated;
GRANT EXECUTE ON FUNCTION clone_template_to_proposal(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_proposal_price(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION create_proposal_version(UUID, TEXT, UUID) TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.tour_templates IS 'Reusable tour itinerary templates created by tour operators';
COMMENT ON TABLE public.proposals IS 'Client-specific proposal instances with shareable magic links';
COMMENT ON TABLE public.proposal_comments IS 'Client comments on proposals (no login required)';
COMMENT ON TABLE public.proposal_versions IS 'Version history snapshots for proposal changes';
COMMENT ON FUNCTION clone_template_to_proposal IS 'Creates a new proposal by cloning a template';
COMMENT ON FUNCTION calculate_proposal_price IS 'Calculates total price based on selected activities/accommodations';
COMMENT ON FUNCTION create_proposal_version IS 'Creates a snapshot of current proposal state';
