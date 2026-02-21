import type { ItineraryResult } from "@/types/itinerary";
import React from 'react';

export interface ItineraryTemplateProps {
    itineraryData: ItineraryResult;
    organizationName?: string;
    client?: {
        name: string;
        email?: string;
    } | null;
}

export interface TemplateDefinition {
    id: string;
    name: string;
    description: string;
    isPremium: boolean;
    component: React.ComponentType<ItineraryTemplateProps>;
}
