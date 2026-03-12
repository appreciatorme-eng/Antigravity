import { SocialTemplate } from './types';

/** Filter templates by category */
export function getTemplatesByCategory(category: string, allTemplates: SocialTemplate[]) {
    return allTemplates.filter(t => t.category === category);
}

/** Search templates by name, category, subcategory, or tags */
export function searchTemplates(query: string, allTemplates: SocialTemplate[]) {
    const q = query.toLowerCase();
    return allTemplates.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.subcategory?.toLowerCase().includes(q)) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
    );
}

/** Find a template by its unique id */
export function getTemplateById(id: string, allTemplates: SocialTemplate[]) {
    return allTemplates.find(t => t.id === id);
}

/** Filter templates accessible at the given tier level */
export function getTemplatesByTier(tier: string, allTemplates: SocialTemplate[]) {
    if (tier === 'Enterprise') return allTemplates;
    if (tier === 'Business') return allTemplates.filter(t => t.tier !== 'Enterprise');
    if (tier === 'Pro') return allTemplates.filter(t => t.tier === 'Starter' || t.tier === 'Pro');
    return allTemplates.filter(t => t.tier === 'Starter');
}

/** Tier access ordering — lower number = more restricted */
export const TIER_ORDER: Record<string, number> = {
    Starter: 0,
    Pro: 1,
    Business: 2,
    Enterprise: 3,
};

/** Returns true if `userTier` can access `templateTier` */
export function canAccessTemplate(templateTier: string, userTier: string = 'Starter'): boolean {
    return (TIER_ORDER[userTier] ?? 0) >= (TIER_ORDER[templateTier] ?? 0);
}
