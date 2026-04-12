ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_proposals_trip_id
  ON public.proposals(trip_id);
