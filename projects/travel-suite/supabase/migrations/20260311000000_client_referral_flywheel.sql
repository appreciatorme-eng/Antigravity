-- Client referral flywheel: reward tracking for clients who refer new bookings
-- Distinct from the B2B `referrals` table (operator-to-operator SaaS referrals).

CREATE TABLE IF NOT EXISTS public.client_referral_incentives (
  id                          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id             UUID           NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  referrer_client_id          UUID           NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code               TEXT           NOT NULL,
  amount_inr                  NUMERIC(10,2)  NOT NULL DEFAULT 500,
  tds_applicable              BOOLEAN        NOT NULL DEFAULT false,
  status                      TEXT           NOT NULL DEFAULT 'pending'
                                             CHECK (status IN ('pending','issued','failed','cancelled')),
  notes                       TEXT,
  issued_at                   TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.client_referral_events (
  id                          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id             UUID           NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  referrer_client_id          UUID           NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_crm_contact_id     UUID           REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  referral_code               TEXT           NOT NULL,
  converted                   BOOLEAN        NOT NULL DEFAULT false,
  converted_at                TIMESTAMPTZ,
  proposal_id                 UUID           REFERENCES public.proposals(id) ON DELETE SET NULL,
  incentive_id                UUID           REFERENCES public.client_referral_incentives(id) ON DELETE SET NULL,
  created_at                  TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ    NOT NULL DEFAULT now()
);

ALTER TABLE public.client_referral_incentives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_referral_events     ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "org_admin_access_referral_incentives"
    ON public.client_referral_incentives
    FOR ALL
    USING (
      organization_id = (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "org_admin_access_referral_events"
    ON public.client_referral_events
    FOR ALL
    USING (
      organization_id = (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_client_referral_incentives_org
  ON public.client_referral_incentives (organization_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_referral_incentives_referrer
  ON public.client_referral_incentives (referrer_client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_referral_events_org
  ON public.client_referral_events (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_referral_events_referrer
  ON public.client_referral_events (referrer_client_id);

CREATE INDEX IF NOT EXISTS idx_client_referral_events_code
  ON public.client_referral_events (referral_code);
