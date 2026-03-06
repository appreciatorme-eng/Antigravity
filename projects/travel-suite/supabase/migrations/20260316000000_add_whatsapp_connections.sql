-- Add whatsapp_connections table for tracking WAHA sessions per organization.
-- One row per organization; status tracks the QR-scan lifecycle.

CREATE TABLE IF NOT EXISTS whatsapp_connections (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    session_name     TEXT NOT NULL UNIQUE,
    phone_number     TEXT,
    display_name     TEXT,
    status           TEXT NOT NULL DEFAULT 'disconnected'
                     CHECK (status IN ('disconnected', 'connecting', 'connected')),
    connected_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_org
    ON whatsapp_connections (organization_id);

ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;

-- Org members can read their own connection row.
-- All writes go through the service-role admin client in API routes.
DO $$ BEGIN
  CREATE POLICY "org_members_read_own_connection"
      ON whatsapp_connections
      FOR SELECT
      USING (
          organization_id IN (
              SELECT organization_id FROM profiles WHERE id = auth.uid()
          )
      );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Reuse the existing trigger function that is already present in the schema.
DROP TRIGGER IF EXISTS update_whatsapp_connections_updated_at ON whatsapp_connections;
CREATE TRIGGER update_whatsapp_connections_updated_at
    BEFORE UPDATE ON whatsapp_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
