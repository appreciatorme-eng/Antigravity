-- Security hardening: prevent public enumeration of active shared itineraries.
-- Anonymous access to shared itineraries must only happen through application
-- endpoints that validate the share token server-side.

DROP POLICY IF EXISTS "Anyone can view shared itinerary by code" ON public.shared_itineraries;
DROP POLICY IF EXISTS "Shared itineraries viewable when not expired" ON public.shared_itineraries;

DROP POLICY IF EXISTS "Owners can view own shares" ON public.shared_itineraries;
CREATE POLICY "Owners can view own shares"
    ON public.shared_itineraries FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.itineraries
            WHERE itineraries.id = shared_itineraries.itinerary_id
              AND itineraries.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Owners can create shares" ON public.shared_itineraries;
CREATE POLICY "Owners can create shares"
    ON public.shared_itineraries FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.itineraries
            WHERE itineraries.id = shared_itineraries.itinerary_id
              AND itineraries.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Owners can delete own shares" ON public.shared_itineraries;
CREATE POLICY "Owners can delete own shares"
    ON public.shared_itineraries FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.itineraries
            WHERE itineraries.id = shared_itineraries.itinerary_id
              AND itineraries.user_id = auth.uid()
        )
    );
