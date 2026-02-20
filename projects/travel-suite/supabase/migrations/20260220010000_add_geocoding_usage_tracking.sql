-- Geocoding Usage Tracking Table
-- Tracks API usage to prevent exceeding free tier limits (90k requests/month)

CREATE TABLE IF NOT EXISTS geocoding_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Time period tracking
    month_year TEXT NOT NULL, -- Format: "2024-01" for January 2024

    -- Usage counters
    total_requests INTEGER NOT NULL DEFAULT 0,
    cache_hits INTEGER NOT NULL DEFAULT 0,
    api_calls INTEGER NOT NULL DEFAULT 0, -- Actual calls to Mapbox API

    -- Status tracking
    limit_reached BOOLEAN NOT NULL DEFAULT false,
    limit_threshold INTEGER NOT NULL DEFAULT 90000, -- 90k requests (10k buffer from 100k limit)

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_api_call_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT valid_month_year CHECK (month_year ~ '^\d{4}-\d{2}$'),
    CONSTRAINT positive_counters CHECK (
        total_requests >= 0 AND
        cache_hits >= 0 AND
        api_calls >= 0 AND
        api_calls <= total_requests
    )
);

-- Unique index on month_year (one row per month)
CREATE UNIQUE INDEX IF NOT EXISTS idx_geocoding_usage_month_year
ON geocoding_usage(month_year);

-- Index on limit status for quick checks
CREATE INDEX IF NOT EXISTS idx_geocoding_usage_limit_reached
ON geocoding_usage(limit_reached)
WHERE limit_reached = true;

-- Function to get or create current month's usage record
CREATE OR REPLACE FUNCTION get_or_create_geocoding_usage()
RETURNS geocoding_usage AS $$
DECLARE
    current_month TEXT;
    usage_record geocoding_usage;
BEGIN
    current_month := TO_CHAR(NOW(), 'YYYY-MM');

    -- Try to get existing record
    SELECT * INTO usage_record
    FROM geocoding_usage
    WHERE month_year = current_month;

    -- Create if doesn't exist
    IF NOT FOUND THEN
        INSERT INTO geocoding_usage (month_year)
        VALUES (current_month)
        RETURNING * INTO usage_record;
    END IF;

    RETURN usage_record;
END;
$$ LANGUAGE plpgsql;

-- Function to increment API call counter
CREATE OR REPLACE FUNCTION increment_geocoding_api_call()
RETURNS BOOLEAN AS $$
DECLARE
    current_month TEXT;
    current_usage geocoding_usage;
    can_proceed BOOLEAN;
BEGIN
    current_month := TO_CHAR(NOW(), 'YYYY-MM');

    -- Get or create current month's record
    current_usage := get_or_create_geocoding_usage();

    -- Check if limit already reached
    IF current_usage.limit_reached THEN
        RETURN false;
    END IF;

    -- Check if this call would exceed limit
    IF current_usage.api_calls >= current_usage.limit_threshold THEN
        -- Mark limit as reached
        UPDATE geocoding_usage
        SET
            limit_reached = true,
            updated_at = NOW()
        WHERE month_year = current_month;

        RETURN false;
    END IF;

    -- Increment counters
    UPDATE geocoding_usage
    SET
        total_requests = total_requests + 1,
        api_calls = api_calls + 1,
        last_api_call_at = NOW(),
        updated_at = NOW()
    WHERE month_year = current_month;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to increment total request counter (cache hit)
CREATE OR REPLACE FUNCTION increment_geocoding_cache_hit()
RETURNS VOID AS $$
DECLARE
    current_month TEXT;
BEGIN
    current_month := TO_CHAR(NOW(), 'YYYY-MM');

    -- Ensure record exists
    PERFORM get_or_create_geocoding_usage();

    -- Increment counters
    UPDATE geocoding_usage
    SET
        total_requests = total_requests + 1,
        cache_hits = cache_hits + 1,
        updated_at = NOW()
    WHERE month_year = current_month;
END;
$$ LANGUAGE plpgsql;

-- Function to check if API calls are allowed
CREATE OR REPLACE FUNCTION can_make_geocoding_api_call()
RETURNS BOOLEAN AS $$
DECLARE
    current_usage geocoding_usage;
BEGIN
    current_usage := get_or_create_geocoding_usage();

    RETURN NOT current_usage.limit_reached
        AND current_usage.api_calls < current_usage.limit_threshold;
END;
$$ LANGUAGE plpgsql;

-- Function to get current month's usage stats
CREATE OR REPLACE FUNCTION get_geocoding_usage_stats()
RETURNS TABLE (
    month_year TEXT,
    total_requests BIGINT,
    cache_hits BIGINT,
    api_calls BIGINT,
    cache_hit_rate NUMERIC,
    remaining_calls INTEGER,
    limit_threshold INTEGER,
    limit_reached BOOLEAN,
    last_api_call_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        gu.month_year,
        gu.total_requests::BIGINT,
        gu.cache_hits::BIGINT,
        gu.api_calls::BIGINT,
        CASE
            WHEN gu.total_requests > 0
            THEN ROUND((gu.cache_hits::NUMERIC / gu.total_requests::NUMERIC) * 100, 2)
            ELSE 0
        END as cache_hit_rate,
        GREATEST(0, gu.limit_threshold - gu.api_calls) as remaining_calls,
        gu.limit_threshold,
        gu.limit_reached,
        gu.last_api_call_at
    FROM get_or_create_geocoding_usage() gu;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE geocoding_usage ENABLE ROW LEVEL SECURITY;

-- Read access for authenticated users (to see usage stats)
CREATE POLICY "Geocoding usage stats are readable by authenticated users"
ON geocoding_usage
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only system/admin can modify (via functions)
CREATE POLICY "Only system can modify geocoding usage"
ON geocoding_usage
FOR ALL
USING (false);

-- Add helpful comments
COMMENT ON TABLE geocoding_usage IS 'Tracks monthly Mapbox API usage to prevent exceeding free tier limits';
COMMENT ON COLUMN geocoding_usage.month_year IS 'Month in YYYY-MM format (e.g., 2024-01)';
COMMENT ON COLUMN geocoding_usage.limit_threshold IS 'Request limit before blocking API calls (default 90k, 10k buffer from 100k limit)';
COMMENT ON FUNCTION increment_geocoding_api_call() IS 'Increments API call counter and returns false if limit reached';
COMMENT ON FUNCTION increment_geocoding_cache_hit() IS 'Increments cache hit counter without consuming API quota';
COMMENT ON FUNCTION can_make_geocoding_api_call() IS 'Checks if API calls are still allowed this month';
COMMENT ON FUNCTION get_geocoding_usage_stats() IS 'Returns current month usage statistics including cache hit rate';
