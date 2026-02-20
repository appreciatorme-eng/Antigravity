-- Geocoding Cache Table
-- Stores geocoded location data to minimize API calls and improve performance
-- Each location is cached with its coordinates and formatted address

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

-- Function to update last_accessed_at when a cached entry is used
CREATE OR REPLACE FUNCTION update_geocoding_cache_access()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE geocoding_cache
    SET
        last_accessed_at = NOW(),
        access_count = access_count + 1
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comment
COMMENT ON TABLE geocoding_cache IS 'Caches geocoded location data to minimize API calls. Locations are stored with coordinates and metadata.';
COMMENT ON COLUMN geocoding_cache.location_query IS 'Normalized location string used for lookup (lowercase)';
COMMENT ON COLUMN geocoding_cache.confidence IS 'Geocoding confidence score from 0.0 (low) to 1.0 (high)';
COMMENT ON COLUMN geocoding_cache.access_count IS 'Number of times this cached entry has been accessed';
