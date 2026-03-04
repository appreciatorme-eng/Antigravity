/**
 * Smart prompt engineering for AI-generated travel poster backgrounds.
 * Used with FAL.ai Flux models.
 *
 * Provides destination-specific visual hints, 8 photographic styles,
 * and composition guidance for text-overlay-friendly backgrounds.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AiImageStyle =
    | "cinematic"
    | "editorial"
    | "vibrant"
    | "luxury"
    | "tropical"
    | "dramatic"
    | "heritage"
    | "minimal";

// ---------------------------------------------------------------------------
// Destination Visual Hints
// ---------------------------------------------------------------------------

const DESTINATION_HINTS: Record<string, string> = {
    maldives:
        "crystal turquoise water, overwater bungalow, white sand beach, palm trees swaying",
    dubai:
        "Burj Khalifa gleaming, modern glass skyscrapers, desert sunset, gold and amber tones",
    bali:
        "terraced rice paddies, tropical jungle canopy, ancient stone temple, infinity pool cliff edge",
    paris:
        "Eiffel Tower, Seine river at golden hour, Parisian cafe terrace, autumn leaves",
    switzerland:
        "snow-capped Alpine peaks, pristine mirror lake, alpine village, dramatic mountain",
    thailand:
        "ornate golden Buddhist temple, limestone karsts, floating market, turquoise lagoon",
    japan:
        "cherry blossom canopy, Mount Fuji backdrop, traditional red torii gate, zen garden",
    goa:
        "palm-fringed beach, colorful Portuguese colonial houses, sunset fishing boat silhouette",
    kashmir:
        "Dal Lake shikara houseboat, snow-capped peaks, saffron fields, Mughal garden",
    rajasthan:
        "ornate Rajput palace facade, Thar desert sand dunes, vibrant textile colors, camel silhouette",
    kerala:
        "palm-lined backwater houseboat, lush green tea plantation, Chinese fishing nets at sunset",
    singapore:
        "Marina Bay Sands, futuristic Gardens by the Bay, neon-lit skyline, modern architecture",
    london:
        "Big Ben and Westminster, red phone booth, Thames river, overcast moody sky with warm light",
    "new york":
        "Manhattan skyline, Central Park aerial, yellow taxis, Brooklyn Bridge at golden hour",
    italy:
        "Amalfi Coast cliffside village, turquoise Mediterranean, ancient Roman ruins, Tuscan vineyards",
    greece:
        "white-washed Santorini buildings, blue domes, crystal Aegean sea, dramatic cliff sunset",
    egypt:
        "Great Pyramids of Giza, golden desert, Nile river cruise, ancient hieroglyphs",
    australia:
        "Sydney Opera House, Great Barrier Reef turquoise, Uluru red rock desert, kangaroo outback",
    "sri lanka":
        "golden Buddhist stupa, lush green tea hills, colonial architecture, tropical beach cove",
    vietnam:
        "Ha Long Bay limestone karsts, traditional junk boat, lantern-lit Old Town Hoi An",
    turkey:
        "Cappadocia hot air balloons, ancient Hagia Sophia, turquoise Turkish coast, bazaar",
    nepal:
        "Himalayan peaks, prayer flags fluttering, ancient Kathmandu temple, mountain trail",
    mauritius:
        "underwater waterfall illusion, crystal lagoon, tropical palm beach, volcanic mountains",
    andaman:
        "pristine untouched beach, bioluminescent water, lush tropical forest, coral reef",
    morocco:
        "vibrant blue Chefchaouen streets, ornate Moroccan riad, Sahara desert dunes, spice market",
};

// ---------------------------------------------------------------------------
// Style Modifiers (with composition guidance)
// ---------------------------------------------------------------------------

const STYLE_MODIFIERS: Record<AiImageStyle, string> = {
    cinematic:
        "cinematic wide-angle photography, golden hour dramatic lighting, epic landscape vista, ultra-high resolution 8K, shallow depth of field, film grain texture, color-graded like a blockbuster film",
    editorial:
        "fashion editorial travel photography, dramatic side lighting, rich moody shadows, Vogue travel feature style, intentional muted color palette, art-directed composition",
    vibrant:
        "vivid hyper-saturated colors, aerial drone photography, crystal clear tropical water, magazine double-page spread quality, HDR dynamic range, punchy contrast",
    luxury:
        "luxury resort editorial shoot, warm golden ambient lighting, creamy shallow bokeh, premium five-star atmosphere, silk-smooth water reflection, Conde Nast Traveler style",
    tropical:
        "lush dense tropical foliage frame, turquoise paradise lagoon, tall palm tree canopy, warm golden sunset glow, island paradise atmosphere, travel brochure hero shot",
    dramatic:
        "dramatic storm clouds with golden light breaking through, powerful raw landscape, National Geographic award-winning quality, raw natural beauty, cinematic wide color grade",
    heritage:
        "ancient architecture bathed in warm directional light, historical grandeur and ornate carved details, cultural richness, travel documentary photography, warm earthy tones",
    minimal:
        "clean editorial photography, soft diffused natural light, muted desaturated palette, generous negative space for text, contemporary minimalist, shot on medium format Hasselblad",
};

// ---------------------------------------------------------------------------
// Style Labels (for UI display)
// ---------------------------------------------------------------------------

const STYLE_LABELS: Record<AiImageStyle, string> = {
    cinematic: "Cinematic",
    editorial: "Editorial",
    vibrant: "Vibrant",
    luxury: "Luxury",
    tropical: "Tropical",
    dramatic: "Dramatic",
    heritage: "Heritage",
    minimal: "Minimal",
};

// ---------------------------------------------------------------------------
// Background Prompt Generation
// ---------------------------------------------------------------------------

/**
 * Generate an optimized prompt for a travel poster background image.
 * Matches destination-specific visual hints and adds composition guidance
 * for text-overlay-friendly results.
 */
export function generateBackgroundPrompt(
    templateData: {
        destination?: string;
        season?: string;
        offer?: string;
    },
    style: AiImageStyle = "cinematic"
): string {
    const dest = (templateData.destination || "").toLowerCase();

    // Find destination-specific visual hints
    const destHint =
        Object.entries(DESTINATION_HINTS).find(([key]) =>
            dest.includes(key)
        )?.[1] || "";

    const destination =
        templateData.destination || "stunning exotic travel destination";
    const seasonHint = templateData.season
        ? `${templateData.season.toLowerCase()} season atmosphere`
        : "";

    const parts = [
        destination,
        destHint,
        seasonHint,
        STYLE_MODIFIERS[style],
        "professional travel marketing photography",
        "no text, no watermark, no logo, no people in foreground",
        "composition: rule of thirds, clear focal point, ample empty space for text overlay in bottom third and left side",
    ].filter(Boolean);

    return parts.join(", ");
}

// ---------------------------------------------------------------------------
// Style Variations
// ---------------------------------------------------------------------------

/**
 * Generate prompt variations for all 8 styles.
 * Used by the "Generate Options" button in the AI tab.
 */
export function generateStyleVariations(
    templateData: {
        destination?: string;
        season?: string;
    }
): { style: AiImageStyle; prompt: string; label: string }[] {
    const allStyles: AiImageStyle[] = [
        "cinematic",
        "editorial",
        "vibrant",
        "luxury",
        "tropical",
        "dramatic",
        "heritage",
        "minimal",
    ];

    return allStyles.map((style) => ({
        style,
        label: STYLE_LABELS[style],
        prompt: generateBackgroundPrompt(templateData, style),
    }));
}

// ---------------------------------------------------------------------------
// Full Poster Prompt (text-in-image, one-click generation)
// ---------------------------------------------------------------------------

/**
 * Generate a prompt for a complete AI poster (text-in-image).
 * Uses destination hints and enhanced composition guidance for
 * professional travel marketing results.
 */
export function generateFullPosterPrompt(templateData: {
    destination?: string;
    price?: string;
    offer?: string;
    companyName?: string;
    season?: string;
    contactNumber?: string;
}): string {
    const dest = (templateData.destination || "").toLowerCase();
    const destHint =
        Object.entries(DESTINATION_HINTS).find(([key]) =>
            dest.includes(key)
        )?.[1] || "";

    const parts = [
        "Professional travel marketing poster design, photorealistic destination imagery",
        `Destination: ${templateData.destination || "Dream Destination"}`,
        destHint
            ? `Visual setting: ${destHint}`
            : "Beautiful iconic destination landscape as background",
        templateData.price
            ? `Price displayed prominently: ${templateData.price}`
            : "",
        templateData.offer ? `Promotional text: ${templateData.offer}` : "",
        templateData.companyName
            ? `Brand: ${templateData.companyName}`
            : "",
        templateData.season
            ? `Seasonal theme: ${templateData.season}`
            : "",
        "Style: modern premium travel agency poster, cinematic golden-hour lighting",
        "Professional typography hierarchy with bold headline and clear call to action",
        "High resolution, print quality, 1080x1080 pixels",
        "Composition: clean layout with text areas, balanced visual weight",
    ].filter(Boolean);

    return parts.join(". ");
}
