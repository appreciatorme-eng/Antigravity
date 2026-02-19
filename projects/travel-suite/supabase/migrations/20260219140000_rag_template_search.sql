-- Migration: RAG-Based Template Search System
-- Created: 2026-02-19
-- Description: Add vector embeddings and unified template sharing for cost-effective itinerary generation

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector embeddings to tour_templates table
ALTER TABLE public.tour_templates
ADD COLUMN IF NOT EXISTS embedding vector(1536),
ADD COLUMN IF NOT EXISTS searchable_text TEXT,
ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS quality_score DECIMAL(3,2) DEFAULT 0.5 CHECK (quality_score BETWEEN 0 AND 1),
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

-- Add vector embeddings to template_activities for granular search
ALTER TABLE public.template_activities
ADD COLUMN IF NOT EXISTS embedding vector(1536),
ADD COLUMN IF NOT EXISTS searchable_text TEXT;

-- Template usage attribution tracking (for unified sharing analytics)
CREATE TABLE IF NOT EXISTS public.template_usage_attribution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_cache_id UUID REFERENCES public.itinerary_cache(id) ON DELETE CASCADE,
    source_template_id UUID NOT NULL REFERENCES public.tour_templates(id) ON DELETE CASCADE,
    source_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    requesting_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    contribution_percentage DECIMAL(5,2), -- How much of final itinerary came from this template (0-100)
    similarity_score DECIMAL(5,3), -- Vector similarity score (0-1)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_template_attribution_source
ON public.template_usage_attribution(source_template_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_template_attribution_requester
ON public.template_usage_attribution(requesting_organization_id, created_at DESC);

-- Create vector similarity search index
CREATE INDEX IF NOT EXISTS idx_tour_templates_embedding
ON public.tour_templates
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_template_activities_embedding
ON public.template_activities
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Function to generate searchable text from template
CREATE OR REPLACE FUNCTION generate_template_searchable_text(p_template_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_text TEXT;
BEGIN
    SELECT
        CONCAT_WS(' ',
            name,
            destination,
            description,
            ARRAY_TO_STRING(tags, ' ')
        )
    INTO v_text
    FROM public.tour_templates
    WHERE id = p_template_id;

    RETURN v_text;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate template quality score
CREATE OR REPLACE FUNCTION calculate_template_quality(p_template_id UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    v_score DECIMAL(3,2);
    v_has_images INT;
    v_activity_count INT;
    v_avg_description_length INT;
    v_has_pricing BOOLEAN;
BEGIN
    -- Quality factors:
    -- 1. Description completeness (0-0.3)
    -- 2. Activity count (0-0.3)
    -- 3. Has images (0-0.2)
    -- 4. Has pricing (0-0.2)

    SELECT
        COUNT(DISTINCT ta.id),
        AVG(LENGTH(ta.description)),
        COUNT(DISTINCT CASE WHEN ta.image_url IS NOT NULL THEN ta.id END),
        BOOL_OR(ta.price IS NOT NULL AND ta.price > 0)
    INTO
        v_activity_count,
        v_avg_description_length,
        v_has_images,
        v_has_pricing
    FROM public.template_activities ta
    JOIN public.template_days td ON ta.template_day_id = td.id
    WHERE td.template_id = p_template_id;

    v_score := 0;

    -- Description quality (0-0.3)
    v_score := v_score + LEAST(0.3, (v_avg_description_length::DECIMAL / 1000) * 0.3);

    -- Activity count (0-0.3)
    v_score := v_score + LEAST(0.3, (v_activity_count::DECIMAL / 20) * 0.3);

    -- Has images (0-0.2)
    IF v_has_images > 0 THEN
        v_score := v_score + LEAST(0.2, (v_has_images::DECIMAL / v_activity_count) * 0.2);
    END IF;

    -- Has pricing (0-0.2)
    IF v_has_pricing THEN
        v_score := v_score + 0.2;
    END IF;

    RETURN LEAST(1.0, v_score);
END;
$$ LANGUAGE plpgsql;

-- Function to search similar templates with quality ranking
CREATE OR REPLACE FUNCTION search_similar_templates_with_quality(
    p_query_embedding vector(1536),
    p_match_threshold float DEFAULT 0.7,
    p_match_count int DEFAULT 5,
    p_min_days int DEFAULT NULL,
    p_max_days int DEFAULT NULL,
    p_exclude_organization_id UUID DEFAULT NULL
)
RETURNS TABLE (
    template_id uuid,
    organization_id uuid,
    similarity float,
    quality_score decimal,
    combined_rank decimal,
    name text,
    destination text,
    duration_days int,
    base_price decimal,
    usage_count int
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id as template_id,
        t.organization_id,
        (1 - (t.embedding <=> p_query_embedding))::float as similarity,
        t.quality_score,
        -- Combined ranking formula: 50% similarity + 30% quality + 15% usage + 5% recency
        (
            (0.5 * (1 - (t.embedding <=> p_query_embedding))) +
            (0.3 * t.quality_score) +
            (0.15 * LEAST(1.0, t.usage_count::DECIMAL / 100)) +
            (0.05 * CASE
                WHEN t.updated_at > NOW() - INTERVAL '30 days' THEN 1.0
                WHEN t.updated_at > NOW() - INTERVAL '90 days' THEN 0.5
                ELSE 0.2
            END)
        )::decimal as combined_rank,
        t.name,
        t.destination,
        t.duration_days,
        t.base_price,
        t.usage_count
    FROM public.tour_templates t
    WHERE
        t.embedding IS NOT NULL
        AND t.status = 'active'
        AND t.is_public = true
        AND 1 - (t.embedding <=> p_query_embedding) > p_match_threshold
        AND (p_min_days IS NULL OR t.duration_days >= p_min_days)
        AND (p_max_days IS NULL OR t.duration_days <= p_max_days)
        AND (p_exclude_organization_id IS NULL OR t.organization_id != p_exclude_organization_id)
    ORDER BY combined_rank DESC
    LIMIT p_match_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_template_searchable_text(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_template_quality(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION search_similar_templates_with_quality(vector, float, int, int, int, UUID) TO authenticated;

COMMENT ON COLUMN public.tour_templates.embedding IS 'Vector embedding for semantic search (1536 dimensions from text-embedding-3-small)';
COMMENT ON COLUMN public.tour_templates.searchable_text IS 'Concatenated searchable text (name + destination + description + tags)';
COMMENT ON COLUMN public.tour_templates.quality_score IS 'Auto-calculated quality score (0-1) based on completeness';
COMMENT ON COLUMN public.tour_templates.usage_count IS 'Number of times this template was used in itinerary generation';
COMMENT ON TABLE public.template_usage_attribution IS 'Tracks which templates contributed to generated itineraries (unified sharing analytics)';
