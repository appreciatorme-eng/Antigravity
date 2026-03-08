CREATE TABLE IF NOT EXISTS public.operator_scorecards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  month_key text NOT NULL,
  score numeric(5,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'ready', 'emailed', 'failed')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  pdf_generated_at timestamptz,
  emailed_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, month_key)
);

CREATE INDEX IF NOT EXISTS idx_operator_scorecards_org_month
  ON public.operator_scorecards (organization_id, month_key DESC);

CREATE INDEX IF NOT EXISTS idx_operator_scorecards_status
  ON public.operator_scorecards (status, month_key DESC);

ALTER TABLE public.operator_scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_scorecards FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_members_view_operator_scorecards" ON public.operator_scorecards;
CREATE POLICY "org_members_view_operator_scorecards"
  ON public.operator_scorecards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.organization_id = operator_scorecards.organization_id
    )
  );

DROP POLICY IF EXISTS "org_admins_manage_operator_scorecards" ON public.operator_scorecards;
CREATE POLICY "org_admins_manage_operator_scorecards"
  ON public.operator_scorecards
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.organization_id = operator_scorecards.organization_id
        AND COALESCE(profiles.role, '') IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.organization_id = operator_scorecards.organization_id
        AND COALESCE(profiles.role, '') IN ('admin', 'super_admin')
    )
  );

DROP TRIGGER IF EXISTS set_updated_at_operator_scorecards
  ON public.operator_scorecards;
CREATE TRIGGER set_updated_at_operator_scorecards
  BEFORE UPDATE ON public.operator_scorecards
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
