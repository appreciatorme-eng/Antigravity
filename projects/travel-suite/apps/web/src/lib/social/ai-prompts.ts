/**
 * Smart prompt engineering for AI-generated travel poster backgrounds and
 * complete magazine-cover-quality AI posters.
 * Used with FAL.ai Flux models.
 *
 * Provides destination-specific visual hints, 8 photographic styles for
 * backgrounds, and 5 poster design styles for FLUX text-in-image generation.
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

export type AiPosterStyle =
    | "magazine_cover"
    | "luxury_editorial"
    | "bold_modern"
    | "minimal_elegant"
    | "vibrant_festival";

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
// Destination Color Palettes (for poster prompts)
// ---------------------------------------------------------------------------

const DESTINATION_COLORS: Record<string, { primary: string; secondary: string; accent: string }> = {
    maldives:    { primary: "#0077B6", secondary: "#C9A96E", accent: "#00B4D8" },
    dubai:       { primary: "#D4A843", secondary: "#1A1A2E", accent: "#C19A6B" },
    bali:        { primary: "#2D6A4F", secondary: "#D4A843", accent: "#95D5B2" },
    paris:       { primary: "#2B2D42", secondary: "#D4A843", accent: "#8D99AE" },
    switzerland: { primary: "#1B4332", secondary: "#FFFFFF", accent: "#52B788" },
    thailand:    { primary: "#D4A843", secondary: "#7B2D26", accent: "#F8961E" },
    japan:       { primary: "#FFB7C5", secondary: "#2B2D42", accent: "#FF6B6B" },
    goa:         { primary: "#FF6B35", secondary: "#004E89", accent: "#F7C948" },
    kashmir:     { primary: "#6A4C93", secondary: "#FFFFFF", accent: "#FF6B6B" },
    rajasthan:   { primary: "#D4A843", secondary: "#7B2D26", accent: "#F4845F" },
    kerala:      { primary: "#2D6A4F", secondary: "#D4A843", accent: "#40916C" },
    singapore:   { primary: "#7209B7", secondary: "#3A0CA3", accent: "#4CC9F0" },
    london:      { primary: "#2B2D42", secondary: "#C1121F", accent: "#8D99AE" },
    "new york":  { primary: "#F7C948", secondary: "#2B2D42", accent: "#FF6B35" },
    italy:       { primary: "#0077B6", secondary: "#D4A843", accent: "#FF6B35" },
    greece:      { primary: "#0077B6", secondary: "#FFFFFF", accent: "#1D3557" },
    egypt:       { primary: "#D4A843", secondary: "#2B2D42", accent: "#E09F3E" },
    morocco:     { primary: "#0077B6", secondary: "#D4A843", accent: "#FF6B35" },
};

// ---------------------------------------------------------------------------
// Background Style Modifiers (with composition guidance)
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
// Background Style Labels (for UI display)
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
// Poster Style Modifiers (FLUX text-in-image design guidance)
// ---------------------------------------------------------------------------

const POSTER_STYLE_MODIFIERS: Record<AiPosterStyle, string> = {
    magazine_cover:
        "glossy high-end magazine cover layout, editorial typography with perfect kerning, bold sans-serif headline text, fashion-forward graphic design, Vogue Traveller aesthetic, sleek masthead area at top, color-coordinated text overlays with drop shadows, professional graphic design with layered elements, cinematic golden-hour destination photography seamlessly blended with typography",
    luxury_editorial:
        "Conde Nast Traveler style editorial spread, refined elegant serif typography, sophisticated layout with gold metallic accents, premium matte finish aesthetic, high-end brand look, elegant typographic hierarchy with thin weight subtitles, warm amber lighting, subtle texture overlay, luxury travel agency premium quality",
    bold_modern:
        "bold contemporary graphic design poster, extra-large heavy sans-serif typography, vibrant gradient color overlays blending into photography, geometric design elements and shapes, eye-catching social media ready layout, Canva Pro professional quality, strong color blocking, dynamic asymmetric composition, modern digital marketing aesthetic",
    minimal_elegant:
        "minimalist poster design with generous white space, thin elegant serif display fonts, clean precise lines and borders, understated luxury feel, muted desaturated color palette with one accent color, architectural grid layout precision, Scandinavian design influence, refined and sophisticated",
    vibrant_festival:
        "energetic celebration poster design, colorful gradient backgrounds blending multiple vibrant hues, dynamic angled text layouts with bold playful typography, high saturation punchy colors, festive party energy, confetti or bokeh decorative elements, tropical and joyful mood, Instagram-worthy visual impact",
};

// ---------------------------------------------------------------------------
// Poster Style Labels (exported for UI display)
// ---------------------------------------------------------------------------

export const POSTER_STYLE_LABELS: Record<AiPosterStyle, string> = {
    magazine_cover: "Magazine Cover",
    luxury_editorial: "Luxury Editorial",
    bold_modern: "Bold & Modern",
    minimal_elegant: "Minimal Elegant",
    vibrant_festival: "Vibrant Festival",
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
 * Generate prompt variations for all 8 background styles.
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
// Full Poster Prompt (FLUX text-in-image, magazine-cover quality)
// ---------------------------------------------------------------------------

/**
 * Resolve destination color palette from the map or generate a sensible default.
 */
function resolveDestinationColors(dest: string): { primary: string; secondary: string; accent: string } {
    const entry = Object.entries(DESTINATION_COLORS).find(([key]) =>
        dest.includes(key)
    );
    return entry?.[1] ?? { primary: "#0077B6", secondary: "#1A1A2E", accent: "#F7C948" };
}

/**
 * Generate a rich, FLUX-optimized prompt for a complete AI poster
 * with text baked into the image. Uses FLUX-specific techniques:
 * - Text wrapped in quotes for FLUX to render
 * - Explicit typography size hierarchy
 * - Layout zone descriptions
 * - HEX color codes
 * - Strong negative prompts for text quality
 */
export function generateFullPosterPrompt(
    templateData: {
        destination?: string;
        price?: string;
        offer?: string;
        companyName?: string;
        season?: string;
        contactNumber?: string;
        email?: string;
        website?: string;
    },
    style: AiPosterStyle = "magazine_cover"
): string {
    const dest = (templateData.destination || "").toLowerCase();
    const destinationName = templateData.destination || "Dream Destination";

    const destHint =
        Object.entries(DESTINATION_HINTS).find(([key]) =>
            dest.includes(key)
        )?.[1] || "beautiful iconic destination landscape, stunning travel scenery";

    const colors = resolveDestinationColors(dest);
    const styleModifier = POSTER_STYLE_MODIFIERS[style];

    // Build typography instructions with FLUX-specific quoted text
    const typographyParts: string[] = [];

    if (templateData.season) {
        typographyParts.push(
            `small elegant uppercase text reading "${templateData.season.toUpperCase()}" at the top in white with letter-spacing`
        );
    }

    typographyParts.push(
        `large bold dominant headline text reading "${destinationName.toUpperCase()}" centered, this is the main focal text and must be at least 3 times larger than any other text`
    );

    if (templateData.offer) {
        typographyParts.push(
            `medium subtitle text reading "${templateData.offer}" below the headline`
        );
    }

    if (templateData.price) {
        typographyParts.push(
            `prominent price text reading "${templateData.price}" displayed in a decorative badge or banner element with contrasting background`
        );
    }

    const contactParts: string[] = [];
    if (templateData.companyName) contactParts.push(templateData.companyName);
    if (templateData.website) contactParts.push(templateData.website);
    if (templateData.email) contactParts.push(templateData.email);
    if (templateData.contactNumber) contactParts.push(templateData.contactNumber);

    if (contactParts.length > 0) {
        typographyParts.push(
            `small footer text reading "${contactParts.join(" | ")}" at the bottom bar`
        );
    }

    const seasonAtmosphere = templateData.season
        ? `, ${templateData.season.toLowerCase()} season atmosphere`
        : "";

    const sections = [
        // 1. Design intent
        `Professional travel marketing poster design with all text and imagery composed together as one unified artwork.`,

        // 2. Style directive
        styleModifier,

        // 3. Destination scene
        `Background scene: ${destHint}${seasonAtmosphere}. Photorealistic destination photography integrated seamlessly with the graphic design.`,

        // 4. Typography hierarchy (FLUX text rendering)
        `Typography hierarchy: ${typographyParts.join(". ")}.`,

        // 5. Layout zones
        `Layout composition: top 15% reserved for masthead and season tag, center 50% featuring dramatic destination imagery with the main headline overlaid, bottom 35% with gradient overlay containing pricing information and contact bar. All text naturally integrated into the design, not floating.`,

        // 6. Color palette
        `Color palette: primary ${colors.primary}, secondary ${colors.secondary}, accent ${colors.accent}. White text with subtle drop shadows for readability against the photographic background.`,

        // 7. Quality and constraints
        `Print quality 1080x1080 square format. Every piece of text must be sharp, perfectly spelled, and clearly legible. The text and imagery must feel like one cohesive design by a professional graphic designer.`,

        // 8. Negative prompts
        `Absolutely no blurry text, no misspelled words, no garbled letters, no watermarks, no lorem ipsum, no placeholder text, no stock photo badges, no low resolution artifacts.`,
    ];

    return sections.join("\n\n");
}

// ---------------------------------------------------------------------------
// Poster Style Variations
// ---------------------------------------------------------------------------

/**
 * Generate prompt variations for all 5 poster styles.
 * Used by the poster style selector in BackgroundPicker.
 */
export function generatePosterStyleVariations(
    templateData: {
        destination?: string;
        price?: string;
        offer?: string;
        companyName?: string;
        season?: string;
        contactNumber?: string;
        email?: string;
        website?: string;
    }
): { style: AiPosterStyle; prompt: string; label: string }[] {
    const allStyles: AiPosterStyle[] = [
        "magazine_cover",
        "luxury_editorial",
        "bold_modern",
        "minimal_elegant",
        "vibrant_festival",
    ];

    return allStyles.map((style) => ({
        style,
        label: POSTER_STYLE_LABELS[style],
        prompt: generateFullPosterPrompt(templateData, style),
    }));
}
