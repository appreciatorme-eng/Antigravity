-- Enable the pgvector extension to work with embedding vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the itinerary_embeddings table
CREATE TABLE IF NOT EXISTS public.itinerary_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- The prompt or the semantic representation of the query
    -- (e.g., "7 days in Rome for a family of 4 on a budget")
    query_text TEXT NOT NULL,
    
    -- The normalized base parameters for strict filtering
    destination TEXT NOT NULL,
    duration_days INTEGER NOT NULL,
    
    -- The OpenAI embedding vector for the prompt (1536 dimensions for text-embedding-3-small)
    embedding vector(1536) NOT NULL,
    
    -- The resulting generated itinerary
    itinerary_data JSONB NOT NULL,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    usage_count INTEGER DEFAULT 0
);

-- Note: We use an HNSW index for extremely fast approximate nearest neighbor search
-- It performs much better than IVFFlat for high-dimensional vectors in production
CREATE INDEX IF NOT EXISTS itinerary_embeddings_hnsw_idx 
    ON public.itinerary_embeddings 
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Function to match itineraries by cosine similarity
CREATE OR REPLACE FUNCTION public.match_itineraries(
    query_embedding vector(1536),
    match_threshold float,
    match_count int,
    filter_destination TEXT,
    filter_days INTEGER
)
RETURNS TABLE (
    id UUID,
    query_text TEXT,
    destination TEXT,
    duration_days INTEGER,
    itinerary_data JSONB,
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
        1 - (ie.embedding <=> query_embedding) AS similarity
    FROM public.itinerary_embeddings ie
    WHERE
        ie.destination = filter_destination AND
        ie.duration_days = filter_days AND
        1 - (ie.embedding <=> query_embedding) > match_threshold
    ORDER BY ie.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- RLS Policies
ALTER TABLE public.itinerary_embeddings ENABLE ROW LEVEL SECURITY;

-- Anyone can read embeddings to find a match
CREATE POLICY "Anyone can read itinerary embeddings"
    ON public.itinerary_embeddings FOR SELECT
    USING (true);

-- Backend service role can insert
CREATE POLICY "Service role can insert itinerary embeddings"
    ON public.itinerary_embeddings FOR INSERT
    WITH CHECK (true);
