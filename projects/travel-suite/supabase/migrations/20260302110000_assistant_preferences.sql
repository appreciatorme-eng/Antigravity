-- =============================================================================
-- Migration: Assistant Preferences
-- Phase 5 of the GoBuddy second-brain transformation.
-- Stores per-user operator preferences for the assistant.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- assistant_preferences table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS assistant_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  preference_key TEXT NOT NULL,
  preference_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, user_id, preference_key)
);

-- Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS idx_assistant_preferences_user
  ON assistant_preferences(organization_id, user_id);

-- RLS
ALTER TABLE assistant_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences"
  ON assistant_preferences
  FOR ALL
  USING (user_id = auth.uid());

-- Updated_at trigger (reuse existing trigger function if available)
CREATE OR REPLACE FUNCTION update_assistant_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assistant_preferences_updated_at
  BEFORE UPDATE ON assistant_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_assistant_preferences_updated_at();
