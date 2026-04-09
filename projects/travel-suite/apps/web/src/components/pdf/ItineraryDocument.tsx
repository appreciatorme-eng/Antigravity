import React from 'react';
import { Document } from '@react-pdf/renderer';
import type { ItineraryResult } from '@/types/itinerary';
import {
  DEFAULT_ITINERARY_BRANDING,
  resolveItineraryPrintFamily,
  type ItineraryBranding,
  type ItineraryTemplateId,
} from './itinerary-types';
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
  if (resolveItineraryPrintFamily(template) === 'professional') {
    return <ProfessionalTemplate itinerary={data} branding={branding} template={template} />;
  }

  return (
    <Document>
      <ItineraryTemplatePages itinerary={data} template={template} branding={branding} />
    </Document>
  );
};

export default ItineraryDocument;
