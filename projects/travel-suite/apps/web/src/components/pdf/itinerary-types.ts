export type ItineraryTemplateId =
  | 'safari_story'
  | 'urban_brief'
  | 'professional'
  | 'luxury_resort'
  | 'visual_journey'
  | 'bento_journey';

export type ItineraryPrintFamily = 'safari_story' | 'urban_brief' | 'professional';

export interface ItineraryBranding {
  companyName: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  clientName?: string | null;
}

export const DEFAULT_ITINERARY_BRANDING: ItineraryBranding = {
  companyName: 'TripBuilt',
  logoUrl: null,
  primaryColor: '#f26430',
  contactPhone: null,
  contactEmail: null,
};

export const DEFAULT_ITINERARY_TEMPLATE: ItineraryTemplateId = 'safari_story';

export interface ItineraryPrintTemplateMeta {
  id: ItineraryTemplateId;
  family: ItineraryPrintFamily;
  label: string;
  description: string;
  coverKicker: string;
  styleLabel: string;
  overviewTitle: string;
  accentFallback: string;
}

export const ITINERARY_PRINT_TEMPLATE_META: Record<ItineraryTemplateId, ItineraryPrintTemplateMeta> = {
  safari_story: {
    id: 'safari_story',
    family: 'safari_story',
    label: 'Safari Story',
    description: 'Editorial brochure style inspired by safari decks.',
    coverKicker: 'Curated Itinerary',
    styleLabel: 'Safari Story',
    overviewTitle: 'Trip Story',
    accentFallback: '#f26430',
  },
  urban_brief: {
    id: 'urban_brief',
    family: 'urban_brief',
    label: 'Urban Brief',
    description: 'Clean corporate format for city-first itineraries.',
    coverKicker: 'Travel Brief',
    styleLabel: 'Urban Brief',
    overviewTitle: 'Overview',
    accentFallback: '#1d4ed8',
  },
  professional: {
    id: 'professional',
    family: 'professional',
    label: 'Professional',
    description: 'Structured premium print layout with rich itinerary detail.',
    coverKicker: 'Prepared Itinerary',
    styleLabel: 'Professional',
    overviewTitle: 'Day-by-Day Itinerary',
    accentFallback: '#00d084',
  },
  luxury_resort: {
    id: 'luxury_resort',
    family: 'safari_story',
    label: 'Luxury Resort',
    description: 'Resort-led brochure with warmer, slower premium pacing.',
    coverKicker: 'Private Escape',
    styleLabel: 'Luxury Resort',
    overviewTitle: 'Resort Overview',
    accentFallback: '#9a6c2f',
  },
  visual_journey: {
    id: 'visual_journey',
    family: 'safari_story',
    label: 'Visual Journey',
    description: 'Image-led brochure variant with cleaner visual pacing.',
    coverKicker: 'Visual Journey',
    styleLabel: 'Visual Journey',
    overviewTitle: 'Journey Overview',
    accentFallback: '#0f766e',
  },
  bento_journey: {
    id: 'bento_journey',
    family: 'urban_brief',
    label: 'Bento Journey',
    description: 'Compact modular print layout for denser itineraries.',
    coverKicker: 'Journey Brief',
    styleLabel: 'Bento Journey',
    overviewTitle: 'At a Glance',
    accentFallback: '#4f46e5',
  },
};

export const normalizeItineraryTemplateId = (
  value: string | null | undefined
): ItineraryTemplateId => {
  if (value === 'luxury_resort') return 'luxury_resort';
  if (value === 'visual_journey') return 'visual_journey';
  if (value === 'bento_journey') return 'bento_journey';
  if (value === 'urban_brief') return 'urban_brief';
  if (value === 'professional') return 'professional';
  return DEFAULT_ITINERARY_TEMPLATE;
};

export const resolveItineraryPrintFamily = (template: ItineraryTemplateId): ItineraryPrintFamily =>
  ITINERARY_PRINT_TEMPLATE_META[template].family;

export const ITINERARY_TEMPLATE_OPTIONS: Array<{
  id: ItineraryTemplateId;
  label: string;
  description: string;
}> = [
  {
    id: 'professional',
    label: 'Professional (Recommended)',
    description: 'Structured premium print brochure with strong pagination for longer itineraries.',
  },
  {
    id: 'safari_story',
    label: 'Safari Story',
    description: 'Editorial brochure style inspired by safari decks.',
  },
  {
    id: 'urban_brief',
    label: 'Urban Brief',
    description: 'Clean corporate format for concise, city-forward itineraries.',
  },
  {
    id: 'luxury_resort',
    label: 'Luxury Resort',
    description: 'Warm, hospitality-led print styling for resort and leisure journeys.',
  },
  {
    id: 'visual_journey',
    label: 'Visual Journey',
    description: 'Image-led print variant with cleaner visual pacing.',
  },
  {
    id: 'bento_journey',
    label: 'Bento Journey',
    description: 'Compact modular print layout for denser day plans.',
  },
];
