-- Migration: Introduce Gemini-backed embedding v2 storage on existing pgvector tables
-- Goal: preserve pgvector search in Supabase while removing OpenAI embedding generation

CREATE EXTENSION IF NOT EXISTS vector;

-- Template vectors
ALTER TABLE public.tour_templates
ADD COLUMN IF NOT EXISTS embedding_v2 vector(1536),
ADD COLUMN IF NOT EXISTS embedding_model text,
ADD COLUMN IF NOT EXISTS embedding_version integer;

ALTER TABLE public.template_activities
ADD COLUMN IF NOT EXISTS embedding_v2 vector(1536),
ADD COLUMN IF NOT EXISTS embedding_model text,
ADD COLUMN IF NOT EXISTS embedding_version integer;

-- Semantic itinerary cache vectors
ALTER TABLE public.itinerary_embeddings
ALTER COLUMN embedding DROP NOT NULL;

ALTER TABLE public.itinerary_embeddings
ADD COLUMN IF NOT EXISTS embedding_v2 vector(1536),
ADD COLUMN IF NOT EXISTS embedding_model text,
ADD COLUMN IF NOT EXISTS embedding_version integer;

-- Policy / knowledge-base vectors
ALTER TABLE public.policy_embeddings
ADD COLUMN IF NOT EXISTS embedding_v2 vector(1536),
ADD COLUMN IF NOT EXISTS embedding_model text,
ADD COLUMN IF NOT EXISTS embedding_version integer;

-- Preserve metadata for existing rows
UPDATE public.tour_templates
SET embedding_model = COALESCE(embedding_model, 'text-embedding-3-small'),
    embedding_version = COALESCE(embedding_version, 1)
WHERE embedding IS NOT NULL;

UPDATE public.template_activities
SET embedding_model = COALESCE(embedding_model, 'text-embedding-3-small'),
    embedding_version = COALESCE(embedding_version, 1)
WHERE embedding IS NOT NULL;

UPDATE public.itinerary_embeddings
SET embedding_model = COALESCE(embedding_model, 'text-embedding-3-small'),
    embedding_version = COALESCE(embedding_version, 1)
WHERE embedding IS NOT NULL;

UPDATE public.policy_embeddings
SET embedding_model = COALESCE(embedding_model, 'text-embedding-3-small'),
    embedding_version = COALESCE(embedding_version, 1)
WHERE embedding IS NOT NULL;

-- V2 indexes
CREATE INDEX IF NOT EXISTS idx_tour_templates_embedding_v2
ON public.tour_templates
USING hnsw (embedding_v2 vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_template_activities_embedding_v2
ON public.template_activities
USING hnsw (embedding_v2 vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS itinerary_embeddings_hnsw_v2_idx
ON public.itinerary_embeddings
USING hnsw (embedding_v2 vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_policy_embeddings_vector_v2
ON public.policy_embeddings
USING hnsw (embedding_v2 vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- V2 template search function
CREATE OR REPLACE FUNCTION public.search_similar_templates_with_quality_v2(
    p_query_embedding vector(1536),
    p_match_threshold float DEFAULT 0.7,
    p_match_count int DEFAULT 5,
    p_min_days int DEFAULT NULL,
    p_max_days int DEFAULT NULL,
    p_exclude_organization_id uuid DEFAULT NULL
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
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id as template_id,
        t.organization_id,
        (1 - (t.embedding_v2 <=> p_query_embedding))::float as similarity,
        t.quality_score,
        (
            (0.5 * (1 - (t.embedding_v2 <=> p_query_embedding))) +
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
        t.embedding_v2 IS NOT NULL
        AND t.status = 'active'
        AND t.is_public = true
        AND 1 - (t.embedding_v2 <=> p_query_embedding) > p_match_threshold
        AND (p_min_days IS NULL OR t.duration_days >= p_min_days)
        AND (p_max_days IS NULL OR t.duration_days <= p_max_days)
        AND (p_exclude_organization_id IS NULL OR t.organization_id != p_exclude_organization_id)
    ORDER BY combined_rank DESC
    LIMIT p_match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_similar_templates_with_quality_v2(vector, float, int, int, int, uuid) TO authenticated;

-- V2 itinerary cache match function
CREATE OR REPLACE FUNCTION public.match_itineraries_v2(
    query_embedding vector(1536),
    match_threshold float,
    match_count int,
    filter_destination text,
    filter_days integer
)
RETURNS TABLE (
    id uuid,
    query_text text,
    destination text,
    duration_days integer,
    itinerary_data jsonb,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ie.id,
        ie.query_text,
        ie.destination,
        ie.duration_days,
        ie.itinerary_data,
        1 - (ie.embedding_v2 <=> query_embedding) AS similarity
    FROM public.itinerary_embeddings ie
    WHERE
        ie.embedding_v2 IS NOT NULL
        AND ie.destination = filter_destination
        AND ie.duration_days = filter_days
        AND 1 - (ie.embedding_v2 <=> query_embedding) > match_threshold
    ORDER BY ie.embedding_v2 <=> query_embedding
    LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.match_itineraries_v2(vector, float, int, text, integer) TO authenticated;

COMMENT ON COLUMN public.tour_templates.embedding_v2 IS 'Gemini embedding v2 (1536 dimensions) used for template semantic search.';
COMMENT ON COLUMN public.template_activities.embedding_v2 IS 'Gemini embedding v2 (1536 dimensions) for future activity-level semantic search.';
COMMENT ON COLUMN public.itinerary_embeddings.embedding_v2 IS 'Gemini embedding v2 (1536 dimensions) used for itinerary semantic cache search.';
COMMENT ON COLUMN public.policy_embeddings.embedding_v2 IS 'Gemini embedding v2 (1536 dimensions) for policy/knowledge retrieval.';
