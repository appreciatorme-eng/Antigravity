/**
 * Template Registry — aggregates all template modules and re-exports
 * utility functions with backward-compatible signatures.
 *
 * Split modules:
 *   templates-festival.ts           — Festival (Holi, Diwali, Christmas, etc.)
 *   templates-season.ts             — Season (Summer, Monsoon, Winter)
 *   templates-destination.ts        — Destination single-image layouts
 *   templates-destination-gallery.ts — Destination multi-image + premium composite
 *   templates-packages.ts           — Package Type (Honeymoon, Family, etc.)
 *   templates-promotion.ts          — Promotion (Flash Sale, Early Bird, etc.)
 *   templates-content.ts            — Review, Carousel, Informational
 *   template-utils.ts               — Pure utility functions
 */

import { SocialTemplate } from './types';
import { festivalTemplates } from './templates-festival';
import { seasonTemplates } from './templates-season';
import { destinationTemplates } from './templates-destination';
import { destinationGalleryTemplates } from './templates-destination-gallery';
import { packageTemplates } from './templates-packages';
import { promotionTemplates } from './templates-promotion';
import { contentTemplates } from './templates-content';
import {
    getTemplatesByCategory as _getTemplatesByCategory,
    searchTemplates as _searchTemplates,
    getTemplateById as _getTemplateById,
    getTemplatesByTier as _getTemplatesByTier,
    canAccessTemplate,
    TIER_ORDER,
} from './template-utils';

// ─── Combined array (preserves original export name) ───────────────────────
export const templates: SocialTemplate[] = [
    ...festivalTemplates,
    ...seasonTemplates,
    ...destinationTemplates,
    ...destinationGalleryTemplates,
    ...packageTemplates,
    ...promotionTemplates,
    ...contentTemplates,
];

// ─── Backward-compatible wrappers (original single-arg signatures) ─────────
export function getTemplatesByCategory(category: string) {
    return _getTemplatesByCategory(category, templates);
}

export function searchTemplates(query: string) {
    return _searchTemplates(query, templates);
}

export function getTemplateById(id: string) {
    return _getTemplateById(id, templates);
}

export function getTemplatesByTier(tier: string) {
    return _getTemplatesByTier(tier, templates);
}

// ─── Re-exports ────────────────────────────────────────────────────────────
export { canAccessTemplate, TIER_ORDER };

// Re-export individual template arrays for direct access
export { festivalTemplates } from './templates-festival';
export { seasonTemplates } from './templates-season';
export { destinationTemplates } from './templates-destination';
export { destinationGalleryTemplates } from './templates-destination-gallery';
export { packageTemplates } from './templates-packages';
export { promotionTemplates } from './templates-promotion';
export { contentTemplates } from './templates-content';
