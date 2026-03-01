import type { ComponentType } from "react";
import { TemplateDefinition } from "./types";
import {
    SafariStoryView,
    UrbanBriefView,
    ProfessionalView,
    LuxuryResortView,
    VisualJourneyView,
    BentoJourneyView
} from "@/components/itinerary-templates";
import ItineraryTemplateClassic from "./ItineraryTemplateClassic";
import ItineraryTemplateModern from "./ItineraryTemplateModern";

const asTemplateComponent = <TProps,>(
    component: ComponentType<TProps>
): TemplateDefinition["component"] => component as unknown as TemplateDefinition["component"];

export const TEMPLATE_REGISTRY: TemplateDefinition[] = [
    {
        id: 'safari_story',
        name: 'Safari Story',
        description: 'Warm, earthy logbook style with a premium PDF brochure feel.',
        isPremium: false,
        component: asTemplateComponent(SafariStoryView)
    },
    {
        id: 'urban_brief',
        name: 'Urban Brief',
        description: 'Corporate aesthetic with extremely compact timeline rows.',
        isPremium: false,
        component: asTemplateComponent(UrbanBriefView)
    },
    {
        id: 'professional',
        name: 'Professional',
        description: 'Centered header and classic typography-driven layout.',
        isPremium: false,
        component: asTemplateComponent(ProfessionalView)
    },
    {
        id: 'luxury_resort',
        name: 'Luxury Resort',
        description: 'Glassmorphism dark mode with immersive, dynamic backgrounds.',
        isPremium: true,
        component: asTemplateComponent(LuxuryResortView)
    },
    {
        id: 'visual_journey',
        name: 'Visual Journey',
        description: 'Huge photographic headers for each day in strong editorial format.',
        isPremium: true,
        component: asTemplateComponent(VisualJourneyView)
    },
    {
        id: 'bento_journey',
        name: 'Bento Grid',
        description: 'Immersive masonry layout showcasing beautiful locations.',
        isPremium: true,
        component: asTemplateComponent(BentoJourneyView)
    },
    // Legacy mapping incase older shares try to load them
    {
        id: 'classic',
        name: 'Legacy Classic',
        description: 'Previous standard template.',
        isPremium: false,
        component: asTemplateComponent(ItineraryTemplateClassic)
    },
    {
        id: 'modern',
        name: 'Legacy Modern',
        description: 'Previous premium template.',
        isPremium: true,
        component: asTemplateComponent(ItineraryTemplateModern)
    }
];

export const getTemplateById = (id: string): TemplateDefinition => {
    return TEMPLATE_REGISTRY.find(t => t.id === id) || TEMPLATE_REGISTRY[0];
};
