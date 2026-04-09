import React from 'react';
import type { ItineraryResult } from '@/types/itinerary';
import {
  resolveItineraryPrintFamily,
  type ItineraryBranding,
  type ItineraryTemplateId,
} from '../itinerary-types';
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
  const family = resolveItineraryPrintFamily(template);

  if (family === 'professional') {
    return null;
  }

  if (family === 'urban_brief') {
    return <UrbanBriefPages itinerary={itinerary} branding={branding} template={template} />;
  }

  return <SafariStoryPages itinerary={itinerary} branding={branding} template={template} />;
};
