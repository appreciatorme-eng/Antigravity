# 🚀 Apply Geocoding Migrations - QUICK START

## Step-by-Step Guide (5 minutes)

### Migration 1: Geocoding Cache Table

**1. Go to Supabase Dashboard**
- Visit: https://supabase.com/dashboard
- Select your project

**2. Open SQL Editor**
- Click **SQL Editor** in the left sidebar
- Click **New Query**

**3. Copy & Execute Migration**

Copy this entire SQL and paste into the editor:

```sql
-- Geocoding Cache Table
-- Stores geocoded location data to minimize API calls and improve performance

CREATE TABLE IF NOT EXISTS geocoding_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The original location query string (normalized to lowercase)
    location_query TEXT NOT NULL,

    -- Geocoded coordinates
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,

    -- Formatted address from geocoding service
    formatted_address TEXT NOT NULL,

    -- Geocoding provider used (e.g., 'mapbox', 'google', 'nominatim')
    provider TEXT NOT NULL DEFAULT 'mapbox',

    -- Confidence score from geocoding service (0.0 to 1.0)
    confidence DECIMAL(3, 2),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    access_count INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT location_query_not_empty CHECK (char_length(location_query) > 0),
    CONSTRAINT valid_latitude CHECK (latitude >= -90 AND latitude <= 90),
    CONSTRAINT valid_longitude CHECK (longitude >= -180 AND longitude <= 180)
);

-- Create unique index on location_query for fast lookups and to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_geocoding_cache_location_query
ON geocoding_cache(location_query);

-- Create index on coordinates for reverse geocoding queries
CREATE INDEX IF NOT EXISTS idx_geocoding_cache_coordinates
ON geocoding_cache(latitude, longitude);

-- Create index on last_accessed_at for cache cleanup queries
CREATE INDEX IF NOT EXISTS idx_geocoding_cache_last_accessed
ON geocoding_cache(last_accessed_at DESC);

-- Enable Row Level Security
ALTER TABLE geocoding_cache ENABLE ROW LEVEL SECURITY;

-- Public read access (geocoding cache can be read by anyone)
CREATE POLICY "Geocoding cache is publicly readable"
ON geocoding_cache
FOR SELECT
USING (true);

-- Only authenticated users can insert/update cache entries
CREATE POLICY "Authenticated users can write to geocoding cache"
ON geocoding_cache
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Add helpful comment
COMMENT ON TABLE geocoding_cache IS 'Caches geocoded location data to minimize API calls. Locations are stored with coordinates and metadata.';
COMMENT ON COLUMN geocoding_cache.location_query IS 'Normalized location string used for lookup (lowercase)';
COMMENT ON COLUMN geocoding_cache.confidence IS 'Geocoding confidence score from 0.0 (low) to 1.0 (high)';
COMMENT ON COLUMN geocoding_cache.access_count IS 'Number of times this cached entry has been accessed';
```

**4. Click "Run"** (or press Cmd/Ctrl + Enter)

**Expected Result:**
```
Success. No rows returned
```

✅ **Migration 1 Complete!**

---

### Migration 2: Usage Tracking & 90k Limit

**1. In the same SQL Editor, create New Query**

**2. Copy & Execute This SQL:**

```sql
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
```

**3. Click "Run"**

**Expected Result:**
```
Success. No rows returned
```

✅ **Migration 2 Complete!**

---

## ✅ Verification

### 1. Check Tables Were Created

Run this query in SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('geocoding_cache', 'geocoding_usage');
```

**Expected Result:**
```
geocoding_cache
geocoding_usage
```

### 2. Check Functions Were Created

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_name LIKE '%geocoding%';
```

**Expected Result:** Should show 4 functions:
```
can_make_geocoding_api_call
get_geocoding_usage_stats
get_or_create_geocoding_usage
increment_geocoding_api_call
increment_geocoding_cache_hit
```

### 3. Test the System

Visit your app and generate a test itinerary:
```
https://your-app.vercel.app/planner
Generate: "Trip to Chennai for 3 days"
```

### 4. Check Usage Stats

Visit:
```
https://your-app.vercel.app/api/admin/geocoding/usage
```

Should return:
```json
{
  "status": "healthy",
  "usage": {
    "apiCalls": 10,
    "cacheHitRate": "0%"
  },
  "limits": {
    "remaining": 89990
  }
}
```

---

## 🎉 Done!

Your geocoding system is now:
- ✅ Caching locations in database
- ✅ Tracking API usage
- ✅ Protected from exceeding 90k requests/month
- ✅ Ready to use!

---

## 📝 Quick Reference

**Migration Files Location:**
- `supabase/migrations/20260220000000_add_geocoding_cache.sql`
- `supabase/migrations/20260220010000_add_geocoding_usage_tracking.sql`

**Tables Created:**
- `geocoding_cache` - Stores geocoded locations
- `geocoding_usage` - Tracks monthly API usage

**Functions Created:**
- `can_make_geocoding_api_call()` - Check quota
- `increment_geocoding_api_call()` - Track API call
- `increment_geocoding_cache_hit()` - Track cache hit
- `get_geocoding_usage_stats()` - Get statistics

**Monitoring:**
- Usage stats: `/api/admin/geocoding/usage`
- Cache table: Query `geocoding_cache` in SQL Editor
- Usage table: Query `geocoding_usage` in SQL Editor

---

**Need Help?**
- Check `GEOCODING_IMPLEMENTATION.md` for full documentation
- Check `DEPLOYMENT_CHECKLIST.md` for testing guide
