CREATE TABLE IF NOT EXISTS public.operator_unavailability (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT operator_unavailability_valid_range CHECK (end_date >= start_date)
);

ALTER TABLE public.operator_unavailability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org admins manage operator_unavailability" ON public.operator_unavailability;
CREATE POLICY "org admins manage operator_unavailability"
    ON public.operator_unavailability
    FOR ALL
    USING (public.is_org_admin(organization_id))
    WITH CHECK (public.is_org_admin(organization_id));

CREATE INDEX IF NOT EXISTS idx_operator_unavailability_org_dates
    ON public.operator_unavailability (organization_id, start_date, end_date);
