import React from 'react';
import { Document } from '@react-pdf/renderer';
import type { ItineraryResult } from '@/types/itinerary';
import type { ItineraryBranding, ItineraryTemplateId } from './itinerary-types';
import { DEFAULT_ITINERARY_BRANDING } from './itinerary-types';
import { ItineraryTemplatePages } from './templates/ItineraryTemplatePages';
import ProfessionalTemplate from './templates/ProfessionalTemplate';

export interface ItineraryDocumentProps {
  data: ItineraryResult;
  template?: ItineraryTemplateId;
  branding?: ItineraryBranding;
}

const ItineraryDocument: React.FC<ItineraryDocumentProps> = ({
  data,
  template = 'safari_story',
  branding = DEFAULT_ITINERARY_BRANDING,
}) => {
  // Professional template is a complete Document component
  if (template === 'professional') {
    return <ProfessionalTemplate itinerary={data} branding={branding} />;
  }

  // Other templates use the ItineraryTemplatePages wrapper
  return (
    <Document>
      <ItineraryTemplatePages itinerary={data} template={template} branding={branding} />
    </Document>
  );
};

export default ItineraryDocument;
