-- Assistant session state for conversations and pending confirmations
CREATE TABLE IF NOT EXISTS assistant_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    channel TEXT NOT NULL CHECK (channel IN ('web', 'whatsapp')),
    conversation_history JSONB DEFAULT '[]'::jsonb,
    pending_action JSONB DEFAULT NULL,
    context_snapshot JSONB DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + INTERVAL '24 hours') NOT NULL
);

ALTER TABLE assistant_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
ON assistant_sessions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sessions"
ON assistant_sessions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sessions"
ON assistant_sessions FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own sessions"
ON assistant_sessions FOR DELETE
USING (user_id = auth.uid());

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_assistant_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_assistant_sessions_modtime') THEN
        CREATE TRIGGER update_assistant_sessions_modtime
        BEFORE UPDATE ON assistant_sessions FOR EACH ROW
        EXECUTE FUNCTION update_assistant_sessions_updated_at();
    END IF;
END $$;

-- Index for quick session lookup
CREATE INDEX IF NOT EXISTS idx_assistant_sessions_user_channel
ON assistant_sessions(user_id, channel);

-- Cleanup expired sessions (can be called by a cron job)
CREATE INDEX IF NOT EXISTS idx_assistant_sessions_expires_at
ON assistant_sessions(expires_at);

-- Audit log for all assistant actions
CREATE TABLE IF NOT EXISTS assistant_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES assistant_sessions(id) ON DELETE SET NULL,
    channel TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('action_proposed', 'action_confirmed', 'action_executed', 'action_cancelled', 'action_failed')),
    action_name TEXT,
    action_params JSONB,
    action_result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE assistant_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org audit logs"
ON assistant_audit_log FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- Service role inserts audit logs (no user insert policy needed since orchestrator uses admin client)

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_assistant_audit_log_org_created
ON assistant_audit_log(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_assistant_audit_log_session
ON assistant_audit_log(session_id);
