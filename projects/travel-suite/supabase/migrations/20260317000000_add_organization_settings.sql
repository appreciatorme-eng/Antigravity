-- Organization settings: API-key and simple-value integrations per org
-- Covers: UPI ID, TripAdvisor location, Google Places activation flag

CREATE TABLE IF NOT EXISTS public.organization_settings (
    organization_id     UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
    upi_id              TEXT,
    tripadvisor_location_id TEXT,
    tripadvisor_connected_at TIMESTAMPTZ,
    google_places_enabled   BOOLEAN DEFAULT false,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

-- Org admins can read their own settings row
DO $$ BEGIN
  CREATE POLICY "org_settings_select" ON public.organization_settings
      FOR SELECT USING (is_org_admin(organization_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Org admins can insert their own settings row
DO $$ BEGIN
  CREATE POLICY "org_settings_insert" ON public.organization_settings
      FOR INSERT WITH CHECK (is_org_admin(organization_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Org admins can update their own settings row
DO $$ BEGIN
  CREATE POLICY "org_settings_update" ON public.organization_settings
      FOR UPDATE USING (is_org_admin(organization_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Auto-update updated_at on every write
DROP TRIGGER IF EXISTS trg_organization_settings_updated_at ON public.organization_settings;
CREATE TRIGGER trg_organization_settings_updated_at
    BEFORE UPDATE ON public.organization_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
