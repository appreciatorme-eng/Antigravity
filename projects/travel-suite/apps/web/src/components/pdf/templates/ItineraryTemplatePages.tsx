import React from 'react';
import type { ItineraryResult } from '@/types/itinerary';
import type { ItineraryBranding, ItineraryTemplateId } from '../itinerary-types';
import { SafariStoryPages } from './sections/SafariStoryPages';
import { UrbanBriefPages } from './sections/UrbanBriefPages';

interface ItineraryTemplatePagesProps {
  itinerary: ItineraryResult;
  branding: ItineraryBranding;
  template: ItineraryTemplateId;
}

export const ItineraryTemplatePages: React.FC<ItineraryTemplatePagesProps> = ({
  itinerary,
  branding,
  template,
}) => {
  // Note: Professional template is imported as a complete Document.
  // So we return null here and handle it separately in ItineraryDocument.
  if (template === 'professional') {
    return null;
  }

  if (template === 'urban_brief') {
    return <UrbanBriefPages itinerary={itinerary} branding={branding} />;
  }

  return <SafariStoryPages itinerary={itinerary} branding={branding} />;
};
