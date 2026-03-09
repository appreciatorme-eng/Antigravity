-- Fix: shared_itineraries SELECT policy previously allowed broad public reads.
-- Restrict reads to authenticated itinerary owners only.

DROP POLICY IF EXISTS "Anyone can view shared itinerary by code" ON public.shared_itineraries;
DROP POLICY IF EXISTS "Shared itineraries viewable when not expired" ON public.shared_itineraries;
DROP POLICY IF EXISTS "Owners can view own shares" ON public.shared_itineraries;
DROP POLICY IF EXISTS "Owners can delete own shares" ON public.shared_itineraries;

-- Allow owners to always see their own shares (for management)
CREATE POLICY "Owners can view own shares"
    ON public.shared_itineraries FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.itineraries
            WHERE itineraries.id = shared_itineraries.itinerary_id
            AND itineraries.user_id = auth.uid()
        )
    );

-- Allow owners to delete their shares
CREATE POLICY "Owners can delete own shares"
    ON public.shared_itineraries FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.itineraries
            WHERE itineraries.id = shared_itineraries.itinerary_id
            AND itineraries.user_id = auth.uid()
        )
    );

-- Fix: push_tokens needs admin policy for cleaning stale tokens
DROP POLICY IF EXISTS "Admins can manage push tokens" ON public.push_tokens;
CREATE POLICY "Admins can manage push tokens"
    ON public.push_tokens FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Fix: add updated_at trigger to notification_logs
DROP TRIGGER IF EXISTS handle_updated_at_notification_logs ON public.notification_logs;
CREATE TRIGGER handle_updated_at_notification_logs
    BEFORE UPDATE ON public.notification_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.notification_logs
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
