import { templates } from "./template-registry";
import type { SocialTemplate, AspectRatio, LayoutType, TemplateCategory } from "./types";
import type { AiImageStyle } from "./ai-prompts";

interface ContentForSelection {
  destination: string;
  price: string;
  offer: string;
  season: string;
  services?: string[];
}

interface SelectionConstraints {
  aspectRatio?: AspectRatio;
  style?: AiImageStyle;
  excludeLayouts?: LayoutType[];
}

// Map keywords to categories
const CATEGORY_KEYWORDS: Record<TemplateCategory, string[]> = {
  Festival: [
    "diwali", "holi", "christmas", "navratri", "eid",
    "new year", "independence", "festival",
  ],
  Season: ["summer", "winter", "monsoon", "spring", "autumn"],
  Destination: [
    "dubai", "bali", "maldives", "kashmir", "europe",
    "thailand", "kerala", "goa", "rajasthan",
  ],
  "Package Type": [
    "honeymoon", "family", "adventure", "luxury",
    "corporate", "group",
  ],
  Promotion: [
    "flash", "sale", "early bird", "last minute",
    "discount", "offer", "deal",
  ],
  Review: ["review", "testimonial", "feedback", "rating"],
  Informational: ["services", "about", "why choose", "showcase"],
  Carousel: ["carousel", "itinerary", "day by day"],
};

// Map styles to preferred layouts
const STYLE_LAYOUT_PREFERENCE: Record<AiImageStyle, LayoutType[]> = {
  cinematic: ["FloatingCardLayout", "GradientHeroLayout", "MagazineCoverLayout", "WaveDividerLayout"],
  editorial: ["MagazineCoverLayout", "SplitWaveLayout", "PremiumCollageLayout", "DuotoneLayout"],
  luxury: ["FloatingCardLayout", "CircleAccentLayout", "ElegantLayout", "PremiumCollageLayout"],
  vibrant: ["BannerRibbonLayout", "BoldTypographyLayout", "WaveDividerLayout", "DiagonalSplitLayout"],
  tropical: ["WaveDividerLayout", "CircleAccentLayout", "GradientHeroLayout", "BoldTypographyLayout"],
  dramatic: ["FloatingCardLayout", "GradientHeroLayout", "SplitWaveLayout", "DuotoneLayout"],
  heritage: ["PremiumCollageLayout", "CircleAccentLayout", "ElegantLayout", "MagazineCoverLayout"],
  minimal: ["WaveDividerLayout", "CenterLayout", "BottomLayout", "ElegantLayout"],
};

export function selectBestTemplate(
  content: ContentForSelection,
  constraints: SelectionConstraints = {}
): SocialTemplate {
  const searchText = [
    content.destination,
    content.offer,
    content.season,
    ...(content.services || []),
  ]
    .join(" ")
    .toLowerCase();

  let bestTemplate: SocialTemplate | null = null;
  let bestScore = -1;

  for (const template of templates) {
    if (constraints.excludeLayouts?.includes(template.layout)) continue;
    if (constraints.aspectRatio && template.aspectRatio !== constraints.aspectRatio) continue;

    let score = 0;

    // Category match (highest weight)
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (template.category === category) {
        for (const keyword of keywords) {
          if (searchText.includes(keyword)) {
            score += 10;
          }
        }
      }
    }

    // Tag overlap
    for (const tag of template.tags) {
      if (searchText.includes(tag.toLowerCase())) {
        score += 3;
      }
    }

    // Style preference
    if (constraints.style) {
      const preferred = STYLE_LAYOUT_PREFERENCE[constraints.style];
      if (preferred?.includes(template.layout)) {
        score += 5;
      }
    }

    // Prefer non-review, non-carousel layouts for general content
    if (template.layout !== "ReviewLayout" && template.layout !== "CarouselSlideLayout") {
      score += 1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestTemplate = template;
    }
  }

  // Fallback to first matching template or first available
  if (!bestTemplate) {
    bestTemplate =
      templates.find(
        (t) => !constraints.aspectRatio || t.aspectRatio === constraints.aspectRatio
      ) || templates[0];
  }

  return bestTemplate;
}
