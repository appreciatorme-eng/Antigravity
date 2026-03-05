-- Installment plan tables for proposal-level payment scheduling

CREATE TABLE IF NOT EXISTS public.proposal_payment_plans (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id       UUID        NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  organization_id   UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  deposit_percent   INTEGER     NOT NULL DEFAULT 30 CHECK (deposit_percent BETWEEN 0 AND 100),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (proposal_id)
);

CREATE TABLE IF NOT EXISTS public.proposal_payment_milestones (
  id                          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id                     UUID           NOT NULL REFERENCES public.proposal_payment_plans(id) ON DELETE CASCADE,
  proposal_id                 UUID           NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  organization_id             UUID           NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  label                       TEXT           NOT NULL,
  amount_percent              INTEGER        CHECK (amount_percent BETWEEN 1 AND 100),
  amount_fixed                NUMERIC(12,2),
  due_date                    DATE           NOT NULL,
  sort_order                  INTEGER        NOT NULL DEFAULT 0,
  status                      TEXT           NOT NULL DEFAULT 'pending'
                                             CHECK (status IN ('pending','sent','paid','overdue','cancelled')),
  razorpay_payment_link_id    TEXT,
  razorpay_payment_link_url   TEXT,
  sent_at                     TIMESTAMPTZ,
  paid_at                     TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ    NOT NULL DEFAULT now(),
  CONSTRAINT milestone_amount_check CHECK (amount_percent IS NOT NULL OR amount_fixed IS NOT NULL)
);

ALTER TABLE public.proposal_payment_plans    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_payment_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_admin_access_payment_plans"
  ON public.proposal_payment_plans
  FOR ALL
  USING (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "org_admin_access_payment_milestones"
  ON public.proposal_payment_milestones
  FOR ALL
  USING (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_payment_milestones_plan_id
  ON public.proposal_payment_milestones (plan_id);

CREATE INDEX IF NOT EXISTS idx_payment_milestones_proposal_id
  ON public.proposal_payment_milestones (proposal_id, sort_order);
