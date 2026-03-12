"use client";

import { SocialTemplate, type TemplateDataForRender } from "@/lib/social/types";

// ── Import all layout components ────────────────────────────────────────────
import { CenterLayout } from "./CenterLayout";
import { ElegantLayout } from "./ElegantLayout";
import { SplitLayout } from "./SplitLayout";
import { BottomLayout } from "./BottomLayout";
import { ReviewLayout, CarouselSlideLayout } from "./ReviewLayout";
import { ServiceShowcaseLayout, HeroServicesLayout } from "./ServiceLayouts";
import { InfoSplitLayout, GradientHeroLayout } from "./InfoSplitLayout";
import {
    DiagonalSplitLayout,
    MagazineCoverLayout,
    DuotoneLayout,
    BoldTypographyLayout,
} from "./StyleLayouts";
import {
    CollageGridLayout,
    TriPanelLayout,
    PolaroidScatterLayout,
    WindowGalleryLayout,
    MosaicStripLayout,
} from "./GalleryLayouts";
import {
    WaveDividerLayout,
    CircleAccentLayout,
    FloatingCardLayout,
    PremiumCollageLayout,
    BannerRibbonLayout,
    SplitWaveLayout,
} from "./PremiumLayouts";

// ── Re-export everything for backward compatibility ─────────────────────────
export { type LayoutProps } from "./layout-helpers";
export { PosterFooter } from "./PosterFooter";
export {
    CenterLayout,
    ElegantLayout,
    SplitLayout,
    BottomLayout,
    ReviewLayout,
    CarouselSlideLayout,
    ServiceShowcaseLayout,
    HeroServicesLayout,
    InfoSplitLayout,
    GradientHeroLayout,
    DiagonalSplitLayout,
    MagazineCoverLayout,
    DuotoneLayout,
    BoldTypographyLayout,
    CollageGridLayout,
    TriPanelLayout,
    PolaroidScatterLayout,
    WindowGalleryLayout,
    MosaicStripLayout,
    WaveDividerLayout,
    CircleAccentLayout,
    FloatingCardLayout,
    PremiumCollageLayout,
    BannerRibbonLayout,
    SplitWaveLayout,
};

// ── LayoutRenderer (used by CarouselBuilder / other non-gallery consumers) ──
interface LayoutRendererProps {
    layout: string;
    data: TemplateDataForRender;
}

export const LayoutRenderer = ({ layout, data }: LayoutRendererProps) => {
    const props = { templateData: data, preset: {} as SocialTemplate };
    switch (layout) {
        case "Elegant":            return <ElegantLayout {...props} />;
        case "Split":              return <SplitLayout {...props} />;
        case "Bottom":             return <BottomLayout {...props} />;
        case "Center":             return <CenterLayout {...props} />;
        case "Creative":           return <CarouselSlideLayout {...props} />;
        case "Review":             return <ReviewLayout {...props} />;
        case "ServiceShowcase":    return <ServiceShowcaseLayout {...props} />;
        case "HeroServices":       return <HeroServicesLayout {...props} />;
        case "InfoSplit":          return <InfoSplitLayout {...props} />;
        case "GradientHero":       return <GradientHeroLayout {...props} />;
        case "DiagonalSplit":      return <DiagonalSplitLayout {...props} />;
        case "MagazineCover":      return <MagazineCoverLayout {...props} />;
        case "Duotone":            return <DuotoneLayout {...props} />;
        case "BoldTypography":     return <BoldTypographyLayout {...props} />;
        case "CollageGrid":        return <CollageGridLayout {...props} />;
        case "TriPanel":           return <TriPanelLayout {...props} />;
        case "PolaroidScatter":    return <PolaroidScatterLayout {...props} />;
        case "WindowGallery":      return <WindowGalleryLayout {...props} />;
        case "MosaicStrip":        return <MosaicStripLayout {...props} />;
        case "WaveDivider":        return <WaveDividerLayout {...props} />;
        case "CircleAccent":       return <CircleAccentLayout {...props} />;
        case "FloatingCard":       return <FloatingCardLayout {...props} />;
        case "PremiumCollage":     return <PremiumCollageLayout {...props} />;
        case "BannerRibbon":       return <BannerRibbonLayout {...props} />;
        case "SplitWave":          return <SplitWaveLayout {...props} />;
        default:                   return <ElegantLayout {...props} />;
    }
};
