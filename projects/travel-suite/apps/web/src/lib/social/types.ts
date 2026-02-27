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
    | "InfoSplitLayout";

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
