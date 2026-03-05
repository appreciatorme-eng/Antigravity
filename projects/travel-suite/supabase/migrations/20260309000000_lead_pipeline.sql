-- Lead Pipeline: extend crm_contacts with pipeline stage fields,
-- add lead_events audit trail, and conversion_events funnel table.

-- ─────────────────────────────────────────────────────────────
-- 1. Extend crm_contacts with pipeline fields
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.crm_contacts
  ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'new'
    CHECK (stage IN ('new', 'contacted', 'qualified', 'proposal_sent', 'negotiating', 'won', 'lost')),
  ADD COLUMN IF NOT EXISTS assigned_to UUID
    REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expected_value NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS destination TEXT,
  ADD COLUMN IF NOT EXISTS budget_tier TEXT
    CHECK (budget_tier IS NULL OR budget_tier IN ('budget', 'standard', 'premium', 'luxury')),
  ADD COLUMN IF NOT EXISTS travelers INTEGER,
  ADD COLUMN IF NOT EXISTS duration_days INTEGER,
  ADD COLUMN IF NOT EXISTS departure_month TEXT,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lost_reason TEXT;

-- Pipeline board query index (kanban by stage)
CREATE INDEX IF NOT EXISTS idx_crm_contacts_org_stage
  ON public.crm_contacts(organization_id, stage);

-- "My leads" query index
CREATE INDEX IF NOT EXISTS idx_crm_contacts_assigned_to
  ON public.crm_contacts(organization_id, assigned_to);

-- ─────────────────────────────────────────────────────────────
-- 2. lead_events — audit trail for stage changes and activities
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.lead_events (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id         UUID        NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  organization_id UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type      TEXT        NOT NULL
    CHECK (event_type IN (
      'stage_change', 'note_added', 'contacted',
      'proposal_sent', 'follow_up_scheduled', 'won', 'lost'
    )),
  from_stage      TEXT,
  to_stage        TEXT,
  note            TEXT,
  metadata        JSONB       NOT NULL DEFAULT '{}',
  created_by      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_events_lead_id
  ON public.lead_events(lead_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_events_org_created
  ON public.lead_events(organization_id, created_at DESC);

ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage lead events"
  ON public.lead_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.organization_id = lead_events.organization_id
        AND p.role IN ('admin', 'super_admin', 'manager')
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 3. conversion_events — funnel instrumentation
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.conversion_events (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id         UUID        REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  profile_id      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  trip_id         UUID        REFERENCES public.trips(id) ON DELETE SET NULL,
  event_type      TEXT        NOT NULL
    CHECK (event_type IN (
      'lead_created', 'lead_contacted', 'lead_qualified',
      'proposal_sent', 'proposal_viewed',
      'payment_initiated', 'payment_completed',
      'trip_completed'
    )),
  event_metadata  JSONB       NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversion_events_org_created
  ON public.conversion_events(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversion_events_org_type
  ON public.conversion_events(organization_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversion_events_lead_id
  ON public.conversion_events(lead_id, created_at DESC);

ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage conversion events"
  ON public.conversion_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.organization_id = conversion_events.organization_id
        AND p.role IN ('admin', 'super_admin', 'manager')
    )
  );
