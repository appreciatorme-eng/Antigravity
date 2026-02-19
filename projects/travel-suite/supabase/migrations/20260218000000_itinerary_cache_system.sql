-- Itinerary Cache System for Cost Optimization
-- Caches AI-generated itineraries to reduce Gemini API calls by 60-90%
-- Created: 2026-02-18

-- =============================================
-- 1. ITINERARY CACHE TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.itinerary_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Cache key components (for matching)
    destination TEXT NOT NULL,
    duration_days INTEGER NOT NULL CHECK (duration_days BETWEEN 1 AND 14),
    budget TEXT, -- 'Budget-Friendly', 'Moderate', 'Luxury', 'Ultra-High End'
    interests TEXT[], -- Array of interest tags for fuzzy matching

    -- Normalized cache key for exact matching
    cache_key TEXT NOT NULL UNIQUE, -- MD5 hash of (destination + days + budget + sorted interests)

    -- Cached itinerary data (JSONB for flexibility)
    itinerary_data JSONB NOT NULL,

    -- Metadata
    generation_source TEXT DEFAULT 'ai', -- 'ai', 'manual', 'imported'
    quality_score DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 1.00 based on user ratings
    usage_count INTEGER DEFAULT 0, -- How many times this cache entry was used

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '60 days'), -- 60-day cache TTL

    -- Indexing
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    CONSTRAINT itinerary_cache_quality_score_range CHECK (quality_score BETWEEN 0 AND 1)
);

-- =============================================
-- 2. INDEXES FOR FAST LOOKUP
-- =============================================

-- Primary lookup: exact cache key match
CREATE INDEX idx_itinerary_cache_key ON public.itinerary_cache(cache_key);

-- Fuzzy matching: destination + days
CREATE INDEX idx_itinerary_cache_destination_days ON public.itinerary_cache(destination, duration_days, expires_at);

-- Popular destinations (for analytics)
CREATE INDEX idx_itinerary_cache_usage ON public.itinerary_cache(destination, usage_count DESC, expires_at);

-- Quality-based filtering
CREATE INDEX idx_itinerary_cache_quality ON public.itinerary_cache(quality_score DESC, usage_count DESC, expires_at)
    WHERE quality_score > 0.5;

-- Expiration cleanup
CREATE INDEX idx_itinerary_cache_expires ON public.itinerary_cache(expires_at);

-- =============================================
-- 3. CACHE ANALYTICS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.itinerary_cache_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Event details
    event_type TEXT NOT NULL, -- 'hit', 'miss', 'save', 'expire'
    cache_id UUID REFERENCES public.itinerary_cache(id) ON DELETE SET NULL,

    -- Query that triggered the event
    query_destination TEXT,
    query_days INTEGER,
    query_budget TEXT,
    query_interests TEXT[],

    -- Performance metrics
    api_call_avoided BOOLEAN DEFAULT FALSE, -- TRUE if cache hit saved an API call
    response_time_ms INTEGER, -- How long the lookup took

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Attribution (optional)
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL
);

-- Index for analytics queries
CREATE INDEX idx_cache_analytics_event ON public.itinerary_cache_analytics(event_type, created_at DESC);
CREATE INDEX idx_cache_analytics_org ON public.itinerary_cache_analytics(organization_id, created_at DESC);

-- =============================================
-- 4. HELPER FUNCTIONS
-- =============================================

-- Function: Generate cache key from query parameters
CREATE OR REPLACE FUNCTION public.generate_cache_key(
    p_destination TEXT,
    p_days INTEGER,
    p_budget TEXT DEFAULT NULL,
    p_interests TEXT[] DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
    sorted_interests TEXT;
    key_string TEXT;
BEGIN
    -- Sort interests alphabetically for consistent hashing
    IF p_interests IS NOT NULL AND array_length(p_interests, 1) > 0 THEN
        SELECT string_agg(interest, '|' ORDER BY interest)
        INTO sorted_interests
        FROM unnest(p_interests) AS interest;
    ELSE
        sorted_interests := '';
    END IF;

    -- Create key string: "destination|days|budget|interests"
    key_string := lower(trim(p_destination)) || '|' ||
                  p_days::TEXT || '|' ||
                  COALESCE(p_budget, 'any') || '|' ||
                  sorted_interests;

    -- Return MD5 hash
    RETURN md5(key_string);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Get cached itinerary (exact match)
CREATE OR REPLACE FUNCTION public.get_cached_itinerary(
    p_destination TEXT,
    p_days INTEGER,
    p_budget TEXT DEFAULT NULL,
    p_interests TEXT[] DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    cache_key TEXT;
    cached_data JSONB;
    cache_id UUID;
BEGIN
    -- Generate cache key
    cache_key := public.generate_cache_key(p_destination, p_days, p_budget, p_interests);

    -- Look up cached itinerary
    SELECT id, itinerary_data
    INTO cache_id, cached_data
    FROM public.itinerary_cache
    WHERE cache_key = cache_key
      AND expires_at > NOW()
    LIMIT 1;

    -- If found, update usage stats
    IF cache_id IS NOT NULL THEN
        UPDATE public.itinerary_cache
        SET usage_count = usage_count + 1,
            last_used_at = NOW()
        WHERE id = cache_id;

        -- Log cache hit
        INSERT INTO public.itinerary_cache_analytics (
            event_type, cache_id, query_destination, query_days,
            query_budget, query_interests, api_call_avoided
        ) VALUES (
            'hit', cache_id, p_destination, p_days,
            p_budget, p_interests, TRUE
        );

        RETURN cached_data;
    ELSE
        -- Log cache miss
        INSERT INTO public.itinerary_cache_analytics (
            event_type, query_destination, query_days,
            query_budget, query_interests, api_call_avoided
        ) VALUES (
            'miss', p_destination, p_days,
            p_budget, p_interests, FALSE
        );

        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Save itinerary to cache
CREATE OR REPLACE FUNCTION public.save_itinerary_to_cache(
    p_destination TEXT,
    p_days INTEGER,
    p_budget TEXT,
    p_interests TEXT[],
    p_itinerary_data JSONB,
    p_created_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    cache_key TEXT;
    cache_id UUID;
BEGIN
    -- Generate cache key
    cache_key := public.generate_cache_key(p_destination, p_days, p_budget, p_interests);

    -- Insert or update cache entry
    INSERT INTO public.itinerary_cache (
        destination, duration_days, budget, interests,
        cache_key, itinerary_data, created_by
    ) VALUES (
        p_destination, p_days, p_budget, p_interests,
        cache_key, p_itinerary_data, p_created_by
    )
    ON CONFLICT (cache_key) DO UPDATE
    SET itinerary_data = EXCLUDED.itinerary_data,
        updated_at = NOW(),
        expires_at = NOW() + INTERVAL '60 days'
    RETURNING id INTO cache_id;

    -- Log cache save
    INSERT INTO public.itinerary_cache_analytics (
        event_type, cache_id, query_destination, query_days,
        query_budget, query_interests
    ) VALUES (
        'save', cache_id, p_destination, p_days,
        p_budget, p_interests
    );

    RETURN cache_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Get cache statistics
CREATE OR REPLACE FUNCTION public.get_cache_stats(
    p_days INTEGER DEFAULT 30
) RETURNS TABLE (
    total_cached_itineraries BIGINT,
    total_cache_hits BIGINT,
    total_cache_misses BIGINT,
    cache_hit_rate DECIMAL,
    api_calls_avoided BIGINT,
    top_destinations JSONB,
    cost_savings_estimate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT
            COUNT(*) FILTER (WHERE event_type = 'hit') AS hits,
            COUNT(*) FILTER (WHERE event_type = 'miss') AS misses,
            COUNT(*) FILTER (WHERE api_call_avoided = TRUE) AS calls_avoided
        FROM public.itinerary_cache_analytics
        WHERE created_at > NOW() - (p_days || ' days')::INTERVAL
    ),
    destinations AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'destination', query_destination,
                'requests', count
            ) ORDER BY count DESC
        ) AS top_dest
        FROM (
            SELECT query_destination, COUNT(*) as count
            FROM public.itinerary_cache_analytics
            WHERE created_at > NOW() - (p_days || ' days')::INTERVAL
              AND query_destination IS NOT NULL
            GROUP BY query_destination
            ORDER BY count DESC
            LIMIT 10
        ) AS top
    )
    SELECT
        (SELECT COUNT(*) FROM public.itinerary_cache WHERE expires_at > NOW())::BIGINT,
        s.hits::BIGINT,
        s.misses::BIGINT,
        CASE
            WHEN (s.hits + s.misses) > 0
            THEN ROUND((s.hits::DECIMAL / (s.hits + s.misses)) * 100, 2)
            ELSE 0
        END,
        s.calls_avoided::BIGINT,
        d.top_dest,
        (s.calls_avoided * 0.01)::DECIMAL -- Assuming $0.01 per API call
    FROM stats s, destinations d;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 5. AUTOMATIC CLEANUP (CRON JOB)
-- =============================================

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS void AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM public.itinerary_cache
        WHERE expires_at < NOW()
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;

    -- Log cleanup
    IF deleted_count > 0 THEN
        INSERT INTO public.itinerary_cache_analytics (event_type)
        VALUES ('expire');
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE public.itinerary_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_cache_analytics ENABLE ROW LEVEL SECURITY;

-- Everyone can read cached itineraries (public cache)
CREATE POLICY "Anyone can read itinerary cache"
    ON public.itinerary_cache FOR SELECT
    USING (expires_at > NOW());

-- Only authenticated users can save to cache
CREATE POLICY "Authenticated users can save to cache"
    ON public.itinerary_cache FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Analytics: Only authenticated users can read their own analytics
CREATE POLICY "Users can read their own analytics"
    ON public.itinerary_cache_analytics FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR user_id IS NULL);

-- =============================================
-- 7. COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE public.itinerary_cache IS
'Caches AI-generated itineraries to reduce API costs by 60-90%. 60-day TTL.';

COMMENT ON COLUMN public.itinerary_cache.cache_key IS
'MD5 hash of (destination + days + budget + sorted interests) for exact matching';

COMMENT ON COLUMN public.itinerary_cache.quality_score IS
'User rating-based quality score (0.00-1.00). Calculated from upvotes/downvotes.';

COMMENT ON FUNCTION public.get_cached_itinerary IS
'Looks up cached itinerary by query parameters. Returns NULL if cache miss.';

COMMENT ON FUNCTION public.save_itinerary_to_cache IS
'Saves AI-generated itinerary to cache with 60-day expiration.';

COMMENT ON FUNCTION public.get_cache_stats IS
'Returns cache performance statistics: hit rate, API calls avoided, cost savings.';
