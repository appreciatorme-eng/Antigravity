ALTER TABLE public.shared_itineraries
  ADD COLUMN IF NOT EXISTS payment_config JSONB;

COMMENT ON COLUMN public.shared_itineraries.payment_config IS
  'Optional share-page payment configuration for public itinerary checkout.';
