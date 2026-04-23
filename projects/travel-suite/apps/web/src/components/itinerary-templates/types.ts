/**
 * Shared types for itinerary template components
 */

import { ItineraryResult } from '@/types/itinerary';
import type { OrganizationBranding } from './ItineraryBrandedFooter';

export interface ItineraryTemplateProps {
    itinerary: ItineraryResult;
    referenceNumber?: string;
    brandColor?: string;
    logoUrl?: string;
    organizationName?: string;
    /** Full organization branding — logo, name, contact info, colors */
    organizationBranding?: OrganizationBranding;
    client?: {
        name: string;
        email?: string;
        phone?: string;
    } | null;
}

export type ItineraryTemplateId = 'safari_story' | 'urban_brief' | 'professional' | 'luxury_resort' | 'visual_journey' | 'bento_journey';
