import { SocialTemplate, type TemplateDataForRender } from "@/lib/social/types";

// ── Layout props shared by all layout components ─────────────────────────────
export interface LayoutProps {
    templateData: TemplateDataForRender;
    preset: SocialTemplate;
}

// ── Service icon map ─────────────────────────────────────────────────────────
export const SERVICE_ICONS: Record<string, string> = {
    "Flights": "✈️", "Hotels": "🏨", "Holidays": "🏖️", "Visa": "📋",
    "Airport Transfers": "🚗", "City Tours": "🏙️", "Corporate Travel": "💼",
    "Night Out": "🌙", "Special Events": "🎉", "Bus": "🚌", "Cars": "🚘",
};

export const getServiceIcon = (name: string) =>
    SERVICE_ICONS[name] ||
    SERVICE_ICONS[Object.keys(SERVICE_ICONS).find(k => name.toLowerCase().includes(k.toLowerCase())) ?? ""] ||
    "✦";

// ── Palette color extraction ────────────────────────────────────────────────
export const getPalette = (preset: { palette?: { accent?: string; overlay?: string; bg?: string } }) => {
    const accent = preset?.palette?.accent || "#ff6b6b";
    return {
        accent,
        /** Accent at 40% opacity for shadows/glows */
        accentGlow: `${accent}66`,
        /** Accent at 15% opacity for subtle tints */
        accentTint: `${accent}26`,
        /** Overlay gradient for hero image tinting */
        overlay: preset?.palette?.overlay || "",
    };
};

// ── Multi-image gallery resolver ────────────────────────────────────────────
export function resolveGalleryImages(templateData: TemplateDataForRender, count: number): string[] {
    const gallery = templateData.galleryImages || [];
    const hero = templateData.heroImage || "";
    return Array.from({ length: count }, (_, i) => gallery[i] || hero).filter(Boolean);
}
