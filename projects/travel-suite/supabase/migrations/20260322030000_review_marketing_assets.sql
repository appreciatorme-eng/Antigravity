CREATE TABLE IF NOT EXISTS public.review_marketing_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  review_id uuid NOT NULL UNIQUE REFERENCES public.reputation_reviews(id) ON DELETE CASCADE,
  social_post_id uuid NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  template_id text NOT NULL,
  lifecycle_state text NOT NULL DEFAULT 'asset_generated'
    CHECK (lifecycle_state IN ('asset_generated', 'queued_for_review', 'scheduled', 'published', 'archived')),
  quote_excerpt text,
  image_url text,
  platform_targets jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_queued_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_marketing_assets_org_state
  ON public.review_marketing_assets (organization_id, lifecycle_state, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_review_marketing_assets_social_post
  ON public.review_marketing_assets (social_post_id);

ALTER TABLE public.review_marketing_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org admins manage review marketing assets" ON public.review_marketing_assets;
CREATE POLICY "org admins manage review marketing assets"
  ON public.review_marketing_assets
  FOR ALL
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

CREATE OR REPLACE FUNCTION public.touch_review_marketing_assets_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_review_marketing_assets_updated_at ON public.review_marketing_assets;
CREATE TRIGGER trg_review_marketing_assets_updated_at
BEFORE UPDATE ON public.review_marketing_assets
FOR EACH ROW
EXECUTE FUNCTION public.touch_review_marketing_assets_updated_at();
