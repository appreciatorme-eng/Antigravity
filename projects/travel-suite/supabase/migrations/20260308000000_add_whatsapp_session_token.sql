-- Add session_token column to whatsapp_connections.
-- WPPConnect requires a per-session bearer token (generated via /generate-token).
-- Token is stored so route handlers can make authenticated API calls.

ALTER TABLE whatsapp_connections
    ADD COLUMN IF NOT EXISTS session_token TEXT;
