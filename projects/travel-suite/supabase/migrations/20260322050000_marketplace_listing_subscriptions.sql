ALTER TABLE public.marketplace_profiles
  ADD COLUMN IF NOT EXISTS listing_tier text NOT NULL DEFAULT 'free'
    CHECK (listing_tier IN ('free', 'featured_lite', 'featured_pro', 'top_placement')),
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_until timestamptz,
  ADD COLUMN IF NOT EXISTS boost_score integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.marketplace_listing_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  marketplace_profile_id uuid REFERENCES public.marketplace_profiles(id) ON DELETE SET NULL,
  plan_id text NOT NULL
    CHECK (plan_id IN ('featured_lite', 'featured_pro', 'top_placement')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  amount_paise integer NOT NULL CHECK (amount_paise > 0),
  currency text NOT NULL DEFAULT 'INR'
    CHECK (currency IN ('INR')),
  boost_score integer NOT NULL DEFAULT 0,
  razorpay_order_id text UNIQUE,
  razorpay_payment_id text,
  started_at timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_listing_subscriptions_org
  ON public.marketplace_listing_subscriptions (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_listing_subscriptions_active
  ON public.marketplace_listing_subscriptions (organization_id, current_period_end DESC)
  WHERE status = 'active';

ALTER TABLE public.marketplace_listing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listing_subscriptions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_members_view_marketplace_listing_subscriptions" ON public.marketplace_listing_subscriptions;
CREATE POLICY "org_members_view_marketplace_listing_subscriptions"
  ON public.marketplace_listing_subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.organization_id = marketplace_listing_subscriptions.organization_id
    )
  );

DROP POLICY IF EXISTS "org_members_manage_marketplace_listing_subscriptions" ON public.marketplace_listing_subscriptions;
CREATE POLICY "org_members_manage_marketplace_listing_subscriptions"
  ON public.marketplace_listing_subscriptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.organization_id = marketplace_listing_subscriptions.organization_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.organization_id = marketplace_listing_subscriptions.organization_id
    )
  );

DROP TRIGGER IF EXISTS set_updated_at_marketplace_listing_subscriptions
  ON public.marketplace_listing_subscriptions;
CREATE TRIGGER set_updated_at_marketplace_listing_subscriptions
  BEFORE UPDATE ON public.marketplace_listing_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
