-- Create trip_accommodations table for storing accommodation details per trip day
CREATE TABLE IF NOT EXISTS trip_accommodations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    hotel_name TEXT NOT NULL,
    address TEXT,
    check_in_time TEXT DEFAULT '15:00',
    contact_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure unique accommodation per trip per day
    UNIQUE(trip_id, day_number)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_trip_accommodations_trip_id ON trip_accommodations(trip_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_trip_accommodations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trip_accommodations_updated_at
    BEFORE UPDATE ON trip_accommodations
    FOR EACH ROW
    EXECUTE FUNCTION update_trip_accommodations_updated_at();

-- Add RLS policies
ALTER TABLE trip_accommodations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view accommodations for trips in their organization
CREATE POLICY trip_accommodations_select ON trip_accommodations
    FOR SELECT
    USING (
        trip_id IN (
            SELECT id FROM trips
            WHERE organization_id IN (
                SELECT organization_id FROM profiles
                WHERE id = auth.uid()
            )
        )
    );

-- Policy: Users can insert accommodations for trips in their organization
CREATE POLICY trip_accommodations_insert ON trip_accommodations
    FOR INSERT
    WITH CHECK (
        trip_id IN (
            SELECT id FROM trips
            WHERE organization_id IN (
                SELECT organization_id FROM profiles
                WHERE id = auth.uid()
            )
        )
    );

-- Policy: Users can update accommodations for trips in their organization
CREATE POLICY trip_accommodations_update ON trip_accommodations
    FOR UPDATE
    USING (
        trip_id IN (
            SELECT id FROM trips
            WHERE organization_id IN (
                SELECT organization_id FROM profiles
                WHERE id = auth.uid()
            )
        )
    );

-- Policy: Users can delete accommodations for trips in their organization
CREATE POLICY trip_accommodations_delete ON trip_accommodations
    FOR DELETE
    USING (
        trip_id IN (
            SELECT id FROM trips
            WHERE organization_id IN (
                SELECT organization_id FROM profiles
                WHERE id = auth.uid()
            )
        )
    );
