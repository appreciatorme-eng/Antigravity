-- Canonical soft-delete support for operator-facing entities.
-- This matches the app trash/restore flow and home dashboard filtering.

ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_trips_deleted_at
  ON trips (deleted_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_proposals_deleted_at
  ON proposals (deleted_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_clients_deleted_at
  ON clients (deleted_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_deleted_at
  ON invoices (deleted_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_trips_trash
  ON trips (deleted_at)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_proposals_trash
  ON proposals (deleted_at)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_trash
  ON clients (deleted_at)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_trash
  ON invoices (deleted_at)
  WHERE deleted_at IS NOT NULL;
