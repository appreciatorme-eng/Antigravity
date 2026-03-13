// Aspect ratio dimension map
export const RATIO_DIMS: Record<string, { w: number; h: number; label: string }> = {
    square:   { w: 1080, h: 1080, label: "1:1" },
    portrait: { w: 1080, h: 1350, label: "4:5" },
    story:    { w: 1080, h: 1920, label: "Story" },
};

export type AspectRatio = "square" | "portrait" | "story";

export interface Dimensions {
    w: number;
    h: number;
    label: string;
}

export function toTemplateTier(userTier: string | null | undefined): string {
    if (!userTier) return "Starter";
    const normalized = userTier.toLowerCase();
    if (normalized === "enterprise") return "Enterprise";
    if (normalized === "business" || normalized === "premium") return "Business";
    if (normalized === "pro") return "Pro";
    return "Starter";
}

// localStorage keys
export const FAVORITES_KEY = "social-studio-favorites";
export const RECENT_KEY = "social-studio-recent";
export const MAX_RECENT = 8;
