import type { ItineraryResult } from "@/types/itinerary";
import React from 'react';

export interface ItineraryTemplateProps {
    itineraryData: ItineraryResult;
    organizationName?: string;
}

export interface TemplateDefinition {
    id: string;
    name: string;
    description: string;
    isPremium: boolean;
    component: React.ComponentType<ItineraryTemplateProps>;
}
