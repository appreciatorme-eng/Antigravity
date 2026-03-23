-- Soft-delete migration for trips, proposals, clients, invoices
-- Apply via Supabase dashboard or CLI: supabase db push

-- Add deleted_at column to key tables
ALTER TABLE trips ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create indexes for soft-delete queries (filter by NOT deleted)
CREATE INDEX IF NOT EXISTS idx_trips_deleted_at ON trips (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_proposals_deleted_at ON proposals (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clients_deleted_at ON clients (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_deleted_at ON invoices (deleted_at) WHERE deleted_at IS NULL;

-- Create index for trash view (show only deleted items)
CREATE INDEX IF NOT EXISTS idx_trips_trash ON trips (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_proposals_trash ON proposals (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_trash ON clients (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_trash ON invoices (deleted_at) WHERE deleted_at IS NOT NULL;
