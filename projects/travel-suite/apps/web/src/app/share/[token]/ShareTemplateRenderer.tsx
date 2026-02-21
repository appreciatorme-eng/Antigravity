"use client";

import type { ItineraryResult } from "@/types/itinerary";
import { SafariStoryView } from "@/components/itinerary-templates/SafariStoryView";
import { UrbanBriefView } from "@/components/itinerary-templates/UrbanBriefView";
import ProfessionalView from "@/components/itinerary-templates/ProfessionalView";
import { LuxuryResortView } from "@/components/itinerary-templates/LuxuryResortView";
import { VisualJourneyView } from "@/components/itinerary-templates/VisualJourneyView";
import { BentoJourneyView } from "@/components/itinerary-templates/BentoJourneyView";
import ItineraryTemplateClassic from "@/components/templates/ItineraryTemplateClassic";
import ItineraryTemplateModern from "@/components/templates/ItineraryTemplateModern";

interface ShareTemplateRendererProps {
    templateId: string;
    itinerary: ItineraryResult;
    organizationName: string;
    client: { name: string; email?: string } | null;
}

export default function ShareTemplateRenderer({
    templateId,
    itinerary,
    organizationName,
    client,
}: ShareTemplateRendererProps) {
    const commonProps = { itinerary, organizationName, client };
    const legacyProps = { itineraryData: itinerary, organizationName, client };

    switch (templateId) {
        case "safari_story":
            return <SafariStoryView {...commonProps} />;
        case "urban_brief":
            return <UrbanBriefView {...commonProps} />;
        case "professional":
            return <ProfessionalView {...commonProps} />;
        case "luxury_resort":
            return <LuxuryResortView {...commonProps} />;
        case "visual_journey":
            return <VisualJourneyView {...commonProps} />;
        case "bento_journey":
            return <BentoJourneyView {...commonProps} />;
        case "modern":
            return <ItineraryTemplateModern {...legacyProps} />;
        case "classic":
        default:
            return <ItineraryTemplateClassic {...legacyProps} />;
    }
}
