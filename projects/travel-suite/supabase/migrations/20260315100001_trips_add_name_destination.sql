-- Add name and destination columns to trips.
-- These are used by the pricing/profit feature for human-readable trip labels
-- without requiring a join to itineraries every time.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trips' AND column_name = 'name'
  ) THEN
    ALTER TABLE public.trips ADD COLUMN name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trips' AND column_name = 'destination'
  ) THEN
    ALTER TABLE public.trips ADD COLUMN destination TEXT;
  END IF;
END $$;
