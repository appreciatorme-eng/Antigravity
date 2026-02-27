import { SocialTemplate } from './types';

export const templates: SocialTemplate[] = [
    {
        id: "holi_special_1",
        name: "Festival of Colors",
        category: "Festival",
        subcategory: "Holi",
        layout: "CenterLayout",
        tier: "Starter",
        dimensions: { width: 1080, height: 1080 },
        aspectRatio: "square",
        colorScheme: "brand",
        tags: ["holi", "colors", "offer"],
        seasonalAvailability: ["holi_2026"],
        defaultText: {
            headline: "Happy Holi!",
            subheadline: "May your life be filled with vibrant colors",
            body: "Special 20% off on all domestic packages this Holi."
        }
    },
    {
        id: "diwali_grand_offer",
        name: "Diwali Grand Sale",
        category: "Festival",
        subcategory: "Diwali",
        layout: "ElegantLayout",
        tier: "Starter",
        dimensions: { width: 1080, height: 1080 },
        aspectRatio: "square",
        colorScheme: "brand",
        tags: ["diwali", "sale"],
        seasonalAvailability: ["diwali_2026"],
    },
    {
        id: "destination_dubai_1",
        name: "Dubai Skyline",
        category: "Destination",
        subcategory: "Dubai",
        layout: "BottomLayout",
        tier: "Starter",
        dimensions: { width: 1080, height: 1080 },
        aspectRatio: "square",
        colorScheme: "dark",
        tags: ["dubai", "uae", "luxury"],
    },
    {
        id: "honeymoon_paradise",
        name: "Honeymoon Paradise Maldives",
        category: "Package Type",
        subcategory: "Honeymoon",
        layout: "CenterLayout",
        tier: "Pro",
        dimensions: { width: 1080, height: 1080 },
        aspectRatio: "square",
        colorScheme: "brand",
        tags: ["maldives", "honeymoon", "romantic"],
    },
    {
        id: "review_stars_minimal",
        name: "Minimalist Stars Review",
        category: "Review",
        layout: "ReviewLayout",
        tier: "Starter",
        dimensions: { width: 1080, height: 1080 },
        aspectRatio: "square",
        colorScheme: "light",
        tags: ["review", "customer love"],
    },
    {
        id: "trip_highlights_carousel",
        name: "Trip Highlights",
        category: "Carousel",
        layout: "CarouselSlideLayout",
        tier: "Pro",
        dimensions: { width: 1080, height: 1080 },
        aspectRatio: "square",
        colorScheme: "brand",
        tags: ["carousel", "highlights", "photos"],
        isCarousel: true,
    }
];

export function getTemplatesByCategory(category: string) {
    return templates.filter(t => t.category === category);
}

export function searchTemplates(query: string) {
    const q = query.toLowerCase();
    return templates.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
    );
}

export function getTemplateById(id: string) {
    return templates.find(t => t.id === id);
}

export function getTemplatesByTier(tier: string) {
    if (tier === 'Enterprise' || tier === 'Business' || tier === 'Pro') {
        return templates;
    }
    return templates.filter(t => t.tier === 'Starter');
}
