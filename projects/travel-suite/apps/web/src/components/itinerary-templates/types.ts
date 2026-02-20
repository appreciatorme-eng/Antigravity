/**
 * Shared types for itinerary template components
 */

import { ItineraryResult } from '@/types/itinerary';

export interface ItineraryTemplateProps {
    itinerary: ItineraryResult;
    brandColor?: string;
    logoUrl?: string;
    organizationName?: string;
}

export type ItineraryTemplateId = 'safari_story' | 'urban_brief' | 'professional';
