-- Extend existing organization_ai_usage with granular tracking columns
ALTER TABLE public.organization_ai_usage
  ADD COLUMN IF NOT EXISTS direct_execution_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS token_count_input BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS token_count_output BIGINT NOT NULL DEFAULT 0;

-- Index for briefing: find orgs with WhatsApp-enabled operators
CREATE INDEX IF NOT EXISTS idx_profiles_org_phone_normalized
  ON public.profiles(organization_id, phone_normalized)
  WHERE phone_normalized IS NOT NULL;

-- Index for alert: overdue invoices by date
CREATE INDEX IF NOT EXISTS idx_invoices_overdue_due_date
  ON public.invoices(organization_id, due_date)
  WHERE status IN ('overdue', 'issued', 'partially_paid');

-- Index for alert: dormant clients
CREATE INDEX IF NOT EXISTS idx_profiles_last_contacted
  ON public.profiles(organization_id, last_contacted_at)
  WHERE role = 'client';

-- Index for alert: trips without drivers starting soon
CREATE INDEX IF NOT EXISTS idx_trips_no_driver_upcoming
  ON public.trips(organization_id, start_date)
  WHERE driver_id IS NULL;
