-- AI usage guardrails for per-organization cost control.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS ai_monthly_request_cap INTEGER DEFAULT 400,
  ADD COLUMN IF NOT EXISTS ai_monthly_spend_cap_usd NUMERIC(10,2) DEFAULT 25.00;

CREATE TABLE IF NOT EXISTS public.organization_ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  month_start DATE NOT NULL,
  ai_requests INTEGER NOT NULL DEFAULT 0,
  rag_hits INTEGER NOT NULL DEFAULT 0,
  cache_hits INTEGER NOT NULL DEFAULT 0,
  fallback_count INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd NUMERIC(12,4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, month_start)
);

CREATE INDEX IF NOT EXISTS idx_organization_ai_usage_org_month
  ON public.organization_ai_usage(organization_id, month_start DESC);

ALTER TABLE public.organization_ai_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view organization ai usage" ON public.organization_ai_usage;
CREATE POLICY "Admins can view organization ai usage"
  ON public.organization_ai_usage FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
        AND (
          profiles.role = 'super_admin'
          OR profiles.organization_id = organization_ai_usage.organization_id
        )
    )
  );
