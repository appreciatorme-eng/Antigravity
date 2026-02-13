-- Allow clients (travelers) to view only the external driver records assigned to their trips.
-- This unblocks the mobile app from showing driver details while keeping external_drivers non-enumerable.

DROP POLICY IF EXISTS "Clients can view assigned external drivers" ON public.external_drivers;

CREATE POLICY "Clients can view assigned external drivers"
    ON public.external_drivers FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.trip_driver_assignments a
            JOIN public.trips t ON t.id = a.trip_id
            WHERE a.external_driver_id = external_drivers.id
              AND t.client_id = auth.uid()
        )
    );

