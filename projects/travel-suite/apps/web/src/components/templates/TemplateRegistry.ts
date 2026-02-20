import { TemplateDefinition } from "./types";
import ItineraryTemplateClassic from "./ItineraryTemplateClassic";
import ItineraryTemplateModern from "./ItineraryTemplateModern";

export const TEMPLATE_REGISTRY: TemplateDefinition[] = [
    {
        id: 'classic',
        name: 'Classic Standard',
        description: 'A clean, straightforward presentation highlighting your journey day-by-day.',
        isPremium: false,
        component: ItineraryTemplateClassic
    },
    {
        id: 'modern',
        name: 'Modern Editorial',
        description: 'A visually striking, magazine-style layout with large imagery and sticky sidebars.',
        isPremium: true,
        component: ItineraryTemplateModern
    },
    // Future templates can be added here
    // {
    //     id: 'compact',
    //     name: 'Compact Minimal',
    //     description: 'A space-saving, text-heavy layout perfect for dense schedules.',
    //     isPremium: false,
    //     component: ItineraryTemplateCompact
    // }
];

export const getTemplateById = (id: string): TemplateDefinition => {
    return TEMPLATE_REGISTRY.find(t => t.id === id) || TEMPLATE_REGISTRY[0];
};
