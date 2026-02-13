-- Allow drivers to see the trip context they need to operate:
-- - trips assigned to them via direct trips.driver_id OR via external driver assignments
-- - itineraries for trips they can access (route, activities)
-- - their own trip_driver_assignments rows (pickup time/location, notes)

-- 1) Trip driver assignments: driver read
DROP POLICY IF EXISTS "Drivers can view their trip assignments" ON public.trip_driver_assignments;
CREATE POLICY "Drivers can view their trip assignments"
    ON public.trip_driver_assignments FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.trips t
            WHERE t.id = trip_driver_assignments.trip_id
              AND t.driver_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM public.driver_accounts da
            WHERE da.profile_id = auth.uid()
              AND da.is_active = true
              AND da.external_driver_id = trip_driver_assignments.external_driver_id
        )
    );

-- 2) Trips: driver read via external driver assignments (in addition to trips.driver_id)
DROP POLICY IF EXISTS "Drivers can view trips via external driver assignments" ON public.trips;
CREATE POLICY "Drivers can view trips via external driver assignments"
    ON public.trips FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.trip_driver_assignments a
            JOIN public.driver_accounts da
              ON da.external_driver_id = a.external_driver_id
             AND da.is_active = true
            WHERE a.trip_id = trips.id
              AND da.profile_id = auth.uid()
        )
    );

-- 3) Itineraries: driver read for trips they can access
DROP POLICY IF EXISTS "Drivers can view assigned itineraries" ON public.itineraries;
CREATE POLICY "Drivers can view assigned itineraries"
    ON public.itineraries FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.trips t
            WHERE t.itinerary_id = itineraries.id
              AND t.driver_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM public.trips t
            JOIN public.trip_driver_assignments a ON a.trip_id = t.id
            JOIN public.driver_accounts da
              ON da.external_driver_id = a.external_driver_id
             AND da.is_active = true
            WHERE t.itinerary_id = itineraries.id
              AND da.profile_id = auth.uid()
        )
    );

