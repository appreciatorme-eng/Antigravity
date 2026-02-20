-- Migration: add_template_id_to_shares
-- Description: Adds a template_id column to the shared_itineraries table to support different visual presentation layers for a shared trip.

ALTER TABLE public.shared_itineraries 
ADD COLUMN IF NOT EXISTS template_id TEXT DEFAULT 'classic' NOT NULL;

-- Optionally add a comment for documentation
COMMENT ON COLUMN public.shared_itineraries.template_id IS 'The visual template selected for this shared itinerary (e.g., classic, modern).';
