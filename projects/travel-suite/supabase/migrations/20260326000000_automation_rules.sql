-- automation_rules: configurable automation workflows for operators
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  rule_type text NOT NULL
    CHECK (rule_type IN ('proposal_followup', 'payment_reminder', 'review_request', 'trip_countdown')),
  enabled boolean NOT NULL DEFAULT false,
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  action_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, rule_type)
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_org_enabled
  ON public.automation_rules (organization_id, enabled)
  WHERE enabled = true;

CREATE INDEX IF NOT EXISTS idx_automation_rules_type
  ON public.automation_rules (rule_type);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_members_view_automation_rules" ON public.automation_rules;
CREATE POLICY "org_members_view_automation_rules"
  ON public.automation_rules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.organization_id = automation_rules.organization_id
    )
  );

DROP POLICY IF EXISTS "org_admins_manage_automation_rules" ON public.automation_rules;
CREATE POLICY "org_admins_manage_automation_rules"
  ON public.automation_rules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.organization_id = automation_rules.organization_id
        AND COALESCE(profiles.role, '') IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.organization_id = automation_rules.organization_id
        AND COALESCE(profiles.role, '') IN ('admin', 'super_admin')
    )
  );

DROP TRIGGER IF EXISTS set_updated_at_automation_rules
  ON public.automation_rules;
CREATE TRIGGER set_updated_at_automation_rules
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- automation_logs: execution history of automation rules
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  rule_id uuid NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  rule_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  target_entity_type text NOT NULL
    CHECK (target_entity_type IN ('proposal', 'payment', 'trip', 'booking')),
  target_entity_id uuid NOT NULL,
  message_channel text NOT NULL
    CHECK (message_channel IN ('whatsapp', 'email', 'both')),
  message_content text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_logs_org_created
  ON public.automation_logs (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_automation_logs_rule
  ON public.automation_logs (rule_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_automation_logs_entity
  ON public.automation_logs (target_entity_type, target_entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_automation_logs_status
  ON public.automation_logs (status, created_at DESC);

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_members_view_automation_logs" ON public.automation_logs;
CREATE POLICY "org_members_view_automation_logs"
  ON public.automation_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.organization_id = automation_logs.organization_id
    )
  );

DROP POLICY IF EXISTS "service_role_manage_automation_logs" ON public.automation_logs;
CREATE POLICY "service_role_manage_automation_logs"
  ON public.automation_logs
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'service_role'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
  );

DROP TRIGGER IF EXISTS set_updated_at_automation_logs
  ON public.automation_logs;
CREATE TRIGGER set_updated_at_automation_logs
  BEFORE UPDATE ON public.automation_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- automation_executions: tracking batch execution runs
CREATE TABLE IF NOT EXISTS public.automation_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_type text NOT NULL DEFAULT 'scheduled'
    CHECK (execution_type IN ('scheduled', 'manual', 'test')),
  rules_processed integer NOT NULL DEFAULT 0,
  messages_sent integer NOT NULL DEFAULT 0,
  messages_failed integer NOT NULL DEFAULT 0,
  messages_skipped integer NOT NULL DEFAULT 0,
  duration_ms integer,
  status text NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'completed', 'partial', 'failed')),
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_executions_started
  ON public.automation_executions (started_at DESC);

CREATE INDEX IF NOT EXISTS idx_automation_executions_status
  ON public.automation_executions (status, started_at DESC);

ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_executions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_manage_automation_executions" ON public.automation_executions;
CREATE POLICY "service_role_manage_automation_executions"
  ON public.automation_executions
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'service_role'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
  );

DROP POLICY IF EXISTS "super_admins_view_automation_executions" ON public.automation_executions;
CREATE POLICY "super_admins_view_automation_executions"
  ON public.automation_executions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND COALESCE(profiles.role, '') = 'super_admin'
    )
  );
