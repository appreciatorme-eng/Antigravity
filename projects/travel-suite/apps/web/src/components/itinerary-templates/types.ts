/**
 * Shared types for itinerary template components
 */

import { ItineraryResult } from '@/types/itinerary';

export interface ItineraryTemplateProps {
    itinerary: ItineraryResult;
    brandColor?: string;
    logoUrl?: string;
    organizationName?: string;
    client?: {
        name: string;
        email?: string;
        phone?: string;
    } | null;
}

export type ItineraryTemplateId = 'safari_story' | 'urban_brief' | 'professional' | 'luxury_resort' | 'visual_journey' | 'bento_journey';
