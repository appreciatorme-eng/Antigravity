import { TemplateDefinition } from "./types";
import {
    SafariStoryView,
    UrbanBriefView,
    ProfessionalView,
    LuxuryResortView,
    VisualJourneyView,
    ExecutiveDirectView
} from "@/components/itinerary-templates";
import ItineraryTemplateClassic from "./ItineraryTemplateClassic";
import ItineraryTemplateModern from "./ItineraryTemplateModern";

export const TEMPLATE_REGISTRY: TemplateDefinition[] = [
    {
        id: 'safari_story',
        name: 'Safari Story',
        description: 'Warm, earthy logbook style with a premium PDF brochure feel.',
        isPremium: false,
        component: SafariStoryView as any
    },
    {
        id: 'urban_brief',
        name: 'Urban Brief',
        description: 'Corporate aesthetic with extremely compact timeline rows.',
        isPremium: false,
        component: UrbanBriefView as any
    },
    {
        id: 'professional',
        name: 'Professional',
        description: 'Centered header and classic typography-driven layout.',
        isPremium: false,
        component: ProfessionalView as any
    },
    {
        id: 'luxury_resort',
        name: 'Luxury Resort',
        description: 'Glassmorphism dark mode with immersive, dynamic backgrounds.',
        isPremium: true,
        component: LuxuryResortView as any
    },
    {
        id: 'visual_journey',
        name: 'Visual Journey',
        description: 'Huge photographic headers for each day in strong editorial format.',
        isPremium: true,
        component: VisualJourneyView as any
    },
    {
        id: 'executive_direct',
        name: 'Executive Direct',
        description: 'Sophisticated split-screen layout with sticky imagery.',
        isPremium: true,
        component: ExecutiveDirectView as any
    },
    // Legacy mapping incase older shares try to load them
    {
        id: 'classic',
        name: 'Legacy Classic',
        description: 'Previous standard template.',
        isPremium: false,
        component: ItineraryTemplateClassic as any
    },
    {
        id: 'modern',
        name: 'Legacy Modern',
        description: 'Previous premium template.',
        isPremium: true,
        component: ItineraryTemplateModern as any
    }
];

export const getTemplateById = (id: string): TemplateDefinition => {
    return TEMPLATE_REGISTRY.find(t => t.id === id) || TEMPLATE_REGISTRY[0];
};
