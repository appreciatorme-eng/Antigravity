-- Migration: Organization Default Itinerary Template
-- Created: 2026-02-19
-- Description: Persist default itinerary PDF template per organization.

ALTER TABLE public.organizations
    ADD COLUMN IF NOT EXISTS itinerary_template TEXT DEFAULT 'safari_story';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'organizations_itinerary_template_check'
          AND conrelid = 'public.organizations'::regclass
    ) THEN
        ALTER TABLE public.organizations
            ADD CONSTRAINT organizations_itinerary_template_check
            CHECK (itinerary_template IN ('safari_story', 'urban_brief'));
    END IF;
END;
$$;

UPDATE public.organizations
SET itinerary_template = COALESCE(itinerary_template, 'safari_story');

ALTER TABLE public.organizations
    ALTER COLUMN itinerary_template SET NOT NULL;

COMMENT ON COLUMN public.organizations.itinerary_template IS 'Default itinerary PDF template for this organization';
