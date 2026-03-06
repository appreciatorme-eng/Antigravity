-- Platform God Mode: platform_settings, platform_announcements, platform_audit_log
-- Adds admin response columns to support_tickets

-- ─── platform_settings ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_settings (
  key          TEXT PRIMARY KEY,
  value        JSONB NOT NULL DEFAULT '{}',
  description  TEXT,
  updated_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "super_admin_all_platform_settings"
    ON platform_settings
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role = 'super_admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role = 'super_admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed default settings
INSERT INTO platform_settings (key, value, description) VALUES
  (
    'maintenance_mode',
    '{"enabled": false, "message": "Platform is under scheduled maintenance. Please check back shortly.", "allowed_paths": ["/api/health", "/api/superadmin"]}',
    'Global maintenance mode toggle — disables all /api/admin/* endpoints'
  ),
  (
    'feature_flags',
    '{"ai_enabled": true, "marketplace_enabled": true, "social_enabled": true, "reputation_enabled": true, "booking_enabled": true, "whatsapp_enabled": true}',
    'Per-feature kill switches for graceful degradation'
  ),
  (
    'spend_limits',
    '{"global_daily_cap_usd": 500, "pause_all_ai": false}',
    'Global API spend limits and AI pause switch'
  ),
  (
    'org_suspensions',
    '{"suspended_org_ids": []}',
    'List of suspended organization IDs — all their admin API calls return 403'
  )
ON CONFLICT (key) DO NOTHING;

-- ─── platform_announcements ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_announcements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  body              TEXT NOT NULL,
  announcement_type TEXT NOT NULL DEFAULT 'info'
                    CHECK (announcement_type IN ('info', 'warning', 'critical', 'maintenance')),
  target_segment    TEXT NOT NULL DEFAULT 'all'
                    CHECK (target_segment IN ('all', 'free', 'pro', 'enterprise', 'specific_orgs')),
  target_org_ids    UUID[] NOT NULL DEFAULT '{}',
  delivery_channels TEXT[] NOT NULL DEFAULT '{in_app}',
  status            TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'scheduled', 'sent', 'cancelled')),
  scheduled_at      TIMESTAMPTZ,
  sent_at           TIMESTAMPTZ,
  sent_by           UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_count   INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE platform_announcements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "super_admin_all_platform_announcements"
    ON platform_announcements
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role = 'super_admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role = 'super_admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_platform_announcements_status
  ON platform_announcements (status, created_at DESC);

-- ─── platform_audit_log ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  action      TEXT NOT NULL,
  category    TEXT NOT NULL
              CHECK (category IN ('kill_switch', 'org_management', 'announcement', 'settings', 'support', 'cost_override')),
  target_type TEXT,
  target_id   TEXT,
  details     JSONB NOT NULL DEFAULT '{}',
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE platform_audit_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "super_admin_all_platform_audit_log"
    ON platform_audit_log
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role = 'super_admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role = 'super_admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_platform_audit_log_created_at
  ON platform_audit_log (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_audit_log_category_created
  ON platform_audit_log (category, created_at DESC);

-- ─── support_tickets — add admin response columns ────────────────────────────
ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS admin_response  TEXT,
  ADD COLUMN IF NOT EXISTS responded_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS responded_by    UUID REFERENCES profiles(id) ON DELETE SET NULL;
