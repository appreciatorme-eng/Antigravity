CREATE TABLE IF NOT EXISTS public.shared_itinerary_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_key text NOT NULL,
  season_key text NOT NULL,
  duration_bucket text NOT NULL,
  budget_bucket text NOT NULL,
  interests_key text NOT NULL,
  fingerprint text NOT NULL UNIQUE,
  itinerary_data jsonb NOT NULL,
  prompt_version text NOT NULL DEFAULT 'v1',
  source_type text NOT NULL DEFAULT 'generated'
    CHECK (source_type IN ('generated', 'rag', 'promoted')),
  promotion_state text NOT NULL DEFAULT 'shared'
    CHECK (promotion_state IN ('candidate', 'shared', 'archived')),
  quality_score numeric(4,3) NOT NULL DEFAULT 0.700,
  hit_count integer NOT NULL DEFAULT 0,
  last_hit_at timestamptz,
  last_promoted_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shared_itinerary_cache_lookup
  ON public.shared_itinerary_cache (destination_key, season_key, duration_bucket, budget_bucket, interests_key);

CREATE INDEX IF NOT EXISTS idx_shared_itinerary_cache_hits
  ON public.shared_itinerary_cache (hit_count DESC, quality_score DESC, last_hit_at DESC);

ALTER TABLE public.shared_itinerary_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service role manages shared itinerary cache" ON public.shared_itinerary_cache;
CREATE POLICY "service role manages shared itinerary cache"
  ON public.shared_itinerary_cache
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TABLE IF NOT EXISTS public.shared_itinerary_cache_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL
    CHECK (event_type IN ('hit', 'miss', 'promote')),
  cache_source text NOT NULL,
  shared_cache_id uuid REFERENCES public.shared_itinerary_cache(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  destination_key text,
  duration_bucket text,
  response_time_ms integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shared_itinerary_cache_events_created_at
  ON public.shared_itinerary_cache_events (created_at DESC, cache_source);

CREATE INDEX IF NOT EXISTS idx_shared_itinerary_cache_events_org
  ON public.shared_itinerary_cache_events (organization_id, created_at DESC);

ALTER TABLE public.shared_itinerary_cache_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service role manages shared itinerary cache events" ON public.shared_itinerary_cache_events;
CREATE POLICY "service role manages shared itinerary cache events"
  ON public.shared_itinerary_cache_events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.touch_shared_itinerary_cache_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_shared_itinerary_cache_updated_at ON public.shared_itinerary_cache;
CREATE TRIGGER trg_shared_itinerary_cache_updated_at
BEFORE UPDATE ON public.shared_itinerary_cache
FOR EACH ROW
EXECUTE FUNCTION public.touch_shared_itinerary_cache_updated_at();
