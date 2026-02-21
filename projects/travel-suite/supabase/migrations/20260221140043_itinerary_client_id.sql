-- Migration: Add client_id to itineraries table
ALTER TABLE itineraries
ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- Create an index to improve query performance when joining with clients
CREATE INDEX IF NOT EXISTS idx_itineraries_client_id ON itineraries(client_id);
