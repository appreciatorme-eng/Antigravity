/**
 * Smart prompt engineering for AI-generated travel poster backgrounds.
 * Used with Pollinations AI (free) and Together AI (free tier).
 */

export type AiImageStyle = "cinematic" | "minimal" | "vibrant" | "luxury";

const STYLE_MODIFIERS: Record<AiImageStyle, string> = {
    cinematic:
        "cinematic photography, golden hour lighting, dramatic sky, ultra detailed, 8k quality, depth of field, epic landscape",
    minimal:
        "clean minimal photography, soft natural lighting, muted tones, editorial style, contemporary, airy composition",
    vibrant:
        "vibrant saturated colors, aerial view, tropical paradise, magazine cover quality, high contrast, stunning clarity",
    luxury:
        "luxury resort atmosphere, premium travel, elegant ambiance, warm tones, bokeh background, five-star quality",
};

/**
 * Generate an optimized prompt for a travel poster background image.
 * Designed to produce stunning, text-free backgrounds suitable for overlaying template content.
 */
export function generateBackgroundPrompt(
    templateData: {
        destination?: string;
        season?: string;
        offer?: string;
    },
    style: AiImageStyle = "cinematic"
): string {
    const destination = templateData.destination || "beautiful travel destination";
    const seasonHint = templateData.season
        ? `, ${templateData.season.toLowerCase()} atmosphere`
        : "";

    return `${destination} travel destination${seasonHint}, ${STYLE_MODIFIERS[style]}, no text, no watermark, no logo, professional photography`;
}

/**
 * Generate 4 prompt variations (one per style) for a given destination.
 * Used by the "Generate 4 Options" button in the AI tab.
 */
export function generateStyleVariations(
    templateData: {
        destination?: string;
        season?: string;
    }
): { style: AiImageStyle; prompt: string; label: string }[] {
    return (
        [
            { style: "cinematic" as AiImageStyle, label: "Cinematic" },
            { style: "vibrant" as AiImageStyle, label: "Vibrant" },
            { style: "luxury" as AiImageStyle, label: "Luxury" },
            { style: "minimal" as AiImageStyle, label: "Minimal" },
        ] as const
    ).map(({ style, label }) => ({
        style,
        label,
        prompt: generateBackgroundPrompt(templateData, style),
    }));
}

/**
 * Generate a prompt for a complete AI poster (text-in-image, used for one-click stunning).
 */
export function generateFullPosterPrompt(templateData: {
    destination?: string;
    price?: string;
    offer?: string;
    companyName?: string;
    season?: string;
    contactNumber?: string;
}): string {
    const parts = [
        "Professional travel marketing poster design",
        `Destination: ${templateData.destination || "Dream Destination"}`,
        templateData.price ? `Price: ${templateData.price}` : "",
        templateData.offer ? `Offer: ${templateData.offer}` : "",
        templateData.companyName ? `Company: ${templateData.companyName}` : "",
        templateData.season ? `Theme: ${templateData.season}` : "",
        "Style: modern, clean, professional travel agency poster",
        "Beautiful destination imagery as background",
        "Professional typography hierarchy, bold headlines",
        "Call to action with price prominently displayed",
        "High resolution, print quality, 1080x1080 pixels",
    ].filter(Boolean);

    return parts.join(". ");
}
