-- Add indexes on notification FK columns for RLS policy performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_trip_id ON public.notification_logs (trip_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_trip_id ON public.notification_queue (trip_id);
