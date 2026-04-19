CREATE TABLE IF NOT EXISTS assistant_trip_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    operator_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    source_channel TEXT NOT NULL DEFAULT 'whatsapp_group',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready_to_create', 'completed', 'cancelled')),
    request_summary TEXT,
    destination TEXT,
    duration_days INTEGER,
    client_name TEXT,
    client_phone TEXT,
    traveler_count INTEGER,
    travel_window TEXT,
    start_date DATE,
    end_date DATE,
    budget TEXT,
    hotel_preference TEXT,
    interests TEXT[],
    origin_city TEXT,
    current_step TEXT,
    collected_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
    missing_required_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    created_itinerary_id UUID REFERENCES itineraries(id) ON DELETE SET NULL,
    created_share_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE assistant_trip_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trip intake drafts"
ON assistant_trip_requests FOR SELECT
USING (operator_user_id = auth.uid());

CREATE POLICY "Users can insert own trip intake drafts"
ON assistant_trip_requests FOR INSERT
WITH CHECK (operator_user_id = auth.uid());

CREATE POLICY "Users can update own trip intake drafts"
ON assistant_trip_requests FOR UPDATE
USING (operator_user_id = auth.uid());

CREATE POLICY "Users can delete own trip intake drafts"
ON assistant_trip_requests FOR DELETE
USING (operator_user_id = auth.uid());

CREATE OR REPLACE FUNCTION update_assistant_trip_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_assistant_trip_requests_modtime') THEN
        CREATE TRIGGER update_assistant_trip_requests_modtime
        BEFORE UPDATE ON assistant_trip_requests FOR EACH ROW
        EXECUTE FUNCTION update_assistant_trip_requests_updated_at();
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_assistant_trip_requests_operator_status
ON assistant_trip_requests(operator_user_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_assistant_trip_requests_org_status
ON assistant_trip_requests(organization_id, status, updated_at DESC);
