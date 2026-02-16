-- Template Analytics
-- Track template usage and popularity

-- Template views tracking
CREATE TABLE IF NOT EXISTS template_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES tour_templates(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    viewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    source VARCHAR(50) DEFAULT 'web', -- web, mobile, api

    CONSTRAINT fk_template FOREIGN KEY (template_id) REFERENCES tour_templates(id) ON DELETE CASCADE,
    CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Template usage tracking (when template is used to create proposal)
CREATE TABLE IF NOT EXISTS template_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES tour_templates(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_template FOREIGN KEY (template_id) REFERENCES tour_templates(id) ON DELETE CASCADE,
    CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_proposal FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_template_views_template ON template_views(template_id);
CREATE INDEX idx_template_views_org ON template_views(organization_id);
CREATE INDEX idx_template_views_date ON template_views(viewed_at DESC);
CREATE INDEX idx_template_usage_template ON template_usage(template_id);
CREATE INDEX idx_template_usage_org ON template_usage(organization_id);
CREATE INDEX idx_template_usage_date ON template_usage(created_at DESC);

-- RLS Policies
ALTER TABLE template_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_usage ENABLE ROW LEVEL SECURITY;

-- Users can only see analytics for their organization
CREATE POLICY "Users can view template_views for their organization"
ON template_views
FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM profiles
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert template_views for their organization"
ON template_views
FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can view template_usage for their organization"
ON template_usage
FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM profiles
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert template_usage for their organization"
ON template_usage
FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles
        WHERE user_id = auth.uid()
    )
);

-- Helper function: Get template analytics
CREATE OR REPLACE FUNCTION get_template_analytics(
    p_template_id UUID,
    p_organization_id UUID
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'template_id', p_template_id,
        'total_views', (
            SELECT COUNT(*) FROM template_views
            WHERE template_id = p_template_id
            AND organization_id = p_organization_id
        ),
        'total_uses', (
            SELECT COUNT(*) FROM template_usage
            WHERE template_id = p_template_id
            AND organization_id = p_organization_id
        ),
        'views_last_7_days', (
            SELECT COUNT(*) FROM template_views
            WHERE template_id = p_template_id
            AND organization_id = p_organization_id
            AND viewed_at >= NOW() - INTERVAL '7 days'
        ),
        'views_last_30_days', (
            SELECT COUNT(*) FROM template_views
            WHERE template_id = p_template_id
            AND organization_id = p_organization_id
            AND viewed_at >= NOW() - INTERVAL '30 days'
        ),
        'uses_last_7_days', (
            SELECT COUNT(*) FROM template_usage
            WHERE template_id = p_template_id
            AND organization_id = p_organization_id
            AND created_at >= NOW() - INTERVAL '7 days'
        ),
        'uses_last_30_days', (
            SELECT COUNT(*) FROM template_usage
            WHERE template_id = p_template_id
            AND organization_id = p_organization_id
            AND created_at >= NOW() - INTERVAL '30 days'
        ),
        'conversion_rate', CASE
            WHEN (SELECT COUNT(*) FROM template_views WHERE template_id = p_template_id AND organization_id = p_organization_id) > 0
            THEN (
                SELECT ROUND(
                    (COUNT(DISTINCT tu.id)::DECIMAL / COUNT(DISTINCT tv.id)::DECIMAL) * 100,
                    2
                )
                FROM template_views tv
                LEFT JOIN template_usage tu ON tu.template_id = tv.template_id
                WHERE tv.template_id = p_template_id
                AND tv.organization_id = p_organization_id
            )
            ELSE 0
        END,
        'last_viewed_at', (
            SELECT MAX(viewed_at) FROM template_views
            WHERE template_id = p_template_id
            AND organization_id = p_organization_id
        ),
        'last_used_at', (
            SELECT MAX(created_at) FROM template_usage
            WHERE template_id = p_template_id
            AND organization_id = p_organization_id
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Get top templates by usage
CREATE OR REPLACE FUNCTION get_top_templates_by_usage(
    p_organization_id UUID,
    p_limit INTEGER DEFAULT 10,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    template_id UUID,
    template_name VARCHAR,
    destination VARCHAR,
    total_uses BIGINT,
    total_views BIGINT,
    conversion_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id AS template_id,
        t.name AS template_name,
        t.destination,
        COUNT(DISTINCT tu.id) AS total_uses,
        COUNT(DISTINCT tv.id) AS total_views,
        CASE
            WHEN COUNT(DISTINCT tv.id) > 0
            THEN ROUND((COUNT(DISTINCT tu.id)::DECIMAL / COUNT(DISTINCT tv.id)::DECIMAL) * 100, 2)
            ELSE 0
        END AS conversion_rate
    FROM tour_templates t
    LEFT JOIN template_usage tu ON tu.template_id = t.id
        AND tu.created_at >= NOW() - (p_days || ' days')::INTERVAL
    LEFT JOIN template_views tv ON tv.template_id = t.id
        AND tv.viewed_at >= NOW() - (p_days || ' days')::INTERVAL
    WHERE t.organization_id = p_organization_id
    AND t.status = 'active'
    GROUP BY t.id, t.name, t.destination
    ORDER BY total_uses DESC, total_views DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE template_views IS 'Tracks when templates are viewed by users';
COMMENT ON TABLE template_usage IS 'Tracks when templates are used to create proposals';
COMMENT ON FUNCTION get_template_analytics IS 'Get comprehensive analytics for a template';
COMMENT ON FUNCTION get_top_templates_by_usage IS 'Get top performing templates by usage and views';
