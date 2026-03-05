export type TemplateCategory =
    | "Festival"
    | "Season"
    | "Destination"
    | "Package Type"
    | "Promotion"
    | "Review"
    | "Informational"
    | "Carousel";

export type LayoutType =
    | "CenterLayout"
    | "SplitLayout"
    | "BottomLayout"
    | "ElegantLayout"
    | "ReviewLayout"
    | "CarouselSlideLayout"
    | "ServiceShowcaseLayout"
    | "HeroServicesLayout"
    | "InfoSplitLayout"
    | "GradientHeroLayout"
    | "DiagonalSplitLayout"
    | "MagazineCoverLayout"
    | "DuotoneLayout"
    | "BoldTypographyLayout"
    | "CollageGridLayout"
    | "TriPanelLayout"
    | "PolaroidScatterLayout"
    | "WindowGalleryLayout"
    | "MosaicStripLayout"
    // Premium composite layouts — multi-region, white/colored canvas
    | "WaveDividerLayout"
    | "CircleAccentLayout"
    | "FloatingCardLayout"
    | "PremiumCollageLayout"
    | "BannerRibbonLayout"
    | "SplitWaveLayout";

/** Premium layout types that use the multi-layer compositor instead of simple photo overlay */
export const PREMIUM_LAYOUT_TYPES: ReadonlySet<LayoutType> = new Set([
    "WaveDividerLayout",
    "CircleAccentLayout",
    "FloatingCardLayout",
    "PremiumCollageLayout",
    "BannerRibbonLayout",
    "SplitWaveLayout",
]);

export type TierLevel = "Starter" | "Pro" | "Business" | "Enterprise";

export type AspectRatio = "square" | "portrait" | "story";

export interface SocialTemplate {
    id: string;
    name: string;
    category: TemplateCategory;
    subcategory?: string;
    layout: LayoutType;
    tier: TierLevel;
    dimensions: { width: number; height: number };
    aspectRatio: AspectRatio;
    colorScheme: "brand" | "light" | "dark" | "custom";
    tags: string[];
    seasonalAvailability?: string[];
    // For dynamic mock templates mapping fields
    defaultText?: Record<string, string>;
    defaultImage?: string;
    isCarousel?: boolean;
    /** Signals this template uses multiple images in a grid/collage layout */
    isMultiImage?: boolean;
    /** How many image slots this layout uses (3-5) */
    imageSlotCount?: number;
    /** Per-template color palette for unique visual identity */
    palette?: {
        /** Tailwind bg class OR inline gradient for fallback background */
        bg: string;
        /** Tailwind text color class */
        text: string;
        /** Hex color for badges, pills, highlights */
        accent: string;
        /** CSS gradient for hero overlay tint */
        overlay: string;
    };
}

export interface CarouselSlide {
    slideIndex: number;
    title?: string;
    subtitle?: string;
    bodyText?: string;
    heroImage?: string;
    layout: "title" | "content" | "image" | "stats" | "cta";
}

// Database types for insert/select wrappers (omitting for brevity as we'll mostly use definitions from supabase types later)
export type PostStatus = 'draft' | 'ready' | 'scheduled' | 'publishing' | 'published' | 'failed';
export type PostSource = 'manual' | 'ai_generated' | 'auto_review' | 'auto_festival' | 'itinerary';

// ---------------------------------------------------------------------------
// Server-side poster rendering types
// ---------------------------------------------------------------------------

export interface TemplateDataForRender {
  companyName: string;
  destination: string;
  price: string;
  offer: string;
  season: string;
  contactNumber: string;
  email: string;
  website: string;
  logoUrl?: string;
  logoWidth?: number;
  heroImage?: string;
  /** Array of 3-5 image URLs for multi-image layouts */
  galleryImages?: string[];
  services?: string[];
  bulletPoints?: string[];
  reviewText?: string;
  reviewerName?: string;
  reviewerTrip?: string;
  /** Allow additional dynamic properties from content editors */
  [key: string]: unknown;
}

export interface PosterRenderInput {
  templateData: TemplateDataForRender;
  layoutType: LayoutType;
  backgroundUrl?: string;
  aspectRatio: AspectRatio;
  format: "png" | "jpeg" | "webp";
  quality?: number;
  /** Brand primary color for themed overlays and accent elements */
  brandColor?: string;
  /** Secondary accent color for badges, buttons, dividers */
  accentColor?: string;
}

export interface PosterRenderOutput {
  buffer: Buffer;
  contentType: string;
  width: number;
  height: number;
}
