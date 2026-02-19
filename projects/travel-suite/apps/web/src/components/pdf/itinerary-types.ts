export type ItineraryTemplateId = 'safari_story' | 'urban_brief' | 'professional';

export interface ItineraryBranding {
  companyName: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
}

export const DEFAULT_ITINERARY_BRANDING: ItineraryBranding = {
  companyName: 'Travel Suite',
  logoUrl: null,
  primaryColor: '#f26430',
  contactPhone: null,
  contactEmail: null,
};

export const DEFAULT_ITINERARY_TEMPLATE: ItineraryTemplateId = 'safari_story';

export const normalizeItineraryTemplateId = (
  value: string | null | undefined
): ItineraryTemplateId => {
  if (value === 'urban_brief') return 'urban_brief';
  if (value === 'professional') return 'professional';
  return DEFAULT_ITINERARY_TEMPLATE;
};

export const ITINERARY_TEMPLATE_OPTIONS: Array<{
  id: ItineraryTemplateId;
  label: string;
  description: string;
}> = [
  {
    id: 'professional',
    label: 'Professional (Recommended)',
    description: 'Modern timeline design matching WBB PDF quality with rich descriptions and operator branding.',
  },
  {
    id: 'safari_story',
    label: 'Safari Story',
    description: 'Editorial brochure style inspired by Kenya safari decks.',
  },
  {
    id: 'urban_brief',
    label: 'Urban Brief',
    description: 'Clean corporate format inspired by Dubai itinerary briefs.',
  },
];
