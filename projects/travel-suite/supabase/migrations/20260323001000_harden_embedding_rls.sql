-- Security hardening: embedding corpora must not be world-readable.
-- Restrict reads/writes to authenticated users (service role still bypasses RLS).

ALTER TABLE public.policy_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_embeddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can search embeddings" ON public.policy_embeddings;
DROP POLICY IF EXISTS "Authenticated can search embeddings" ON public.policy_embeddings;
CREATE POLICY "Authenticated can search embeddings"
    ON public.policy_embeddings FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Anyone can read itinerary embeddings" ON public.itinerary_embeddings;
DROP POLICY IF EXISTS "Authenticated can read itinerary embeddings" ON public.itinerary_embeddings;
CREATE POLICY "Authenticated can read itinerary embeddings"
    ON public.itinerary_embeddings FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Service role can insert itinerary embeddings" ON public.itinerary_embeddings;
DROP POLICY IF EXISTS "Authenticated can insert itinerary embeddings" ON public.itinerary_embeddings;
CREATE POLICY "Authenticated can insert itinerary embeddings"
    ON public.itinerary_embeddings FOR INSERT TO authenticated
    WITH CHECK (true);

REVOKE EXECUTE ON FUNCTION public.match_itineraries(vector, float, int, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_itineraries(vector, float, int, text, integer) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.match_itineraries_v2(vector, float, int, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_itineraries_v2(vector, float, int, text, integer) TO authenticated;
