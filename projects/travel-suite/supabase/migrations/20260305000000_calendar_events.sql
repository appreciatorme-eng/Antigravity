-- Calendar Events — personal events for tour operators
-- Stores meetings, tasks, reminders, and personal items

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,
  location TEXT,

  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT FALSE,

  category TEXT NOT NULL DEFAULT 'personal'
    CHECK (category IN ('meeting', 'task', 'reminder', 'personal', 'other')),

  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'cancelled')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_calendar_events_org_time
  ON calendar_events(organization_id, start_time, end_time);
CREATE INDEX idx_calendar_events_created_by
  ON calendar_events(created_by);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can view calendar events"
  ON calendar_events FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "users can create own calendar events"
  ON calendar_events FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "users can update own calendar events"
  ON calendar_events FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "users can delete own calendar events"
  ON calendar_events FOR DELETE
  USING (created_by = auth.uid());
