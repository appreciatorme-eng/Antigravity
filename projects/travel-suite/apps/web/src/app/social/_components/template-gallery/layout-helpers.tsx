"use client";

import { CenterLayout, ElegantLayout, SplitLayout, BottomLayout, ReviewLayout, CarouselSlideLayout, ServiceShowcaseLayout, HeroServicesLayout, InfoSplitLayout, GradientHeroLayout, DiagonalSplitLayout, MagazineCoverLayout, DuotoneLayout, BoldTypographyLayout, CollageGridLayout, TriPanelLayout, PolaroidScatterLayout, WindowGalleryLayout, MosaicStripLayout, WaveDividerLayout, CircleAccentLayout, FloatingCardLayout, PremiumCollageLayout, BannerRibbonLayout, SplitWaveLayout } from "@/components/social/templates/layouts/LayoutRenderer";
import { SocialTemplate, type TemplateDataForRender } from "@/lib/social/types";

export function renderLayout(preset: SocialTemplate, templateData: TemplateDataForRender) {
    const p = { templateData, preset };
    switch (preset.layout) {
        case "ElegantLayout":           return <ElegantLayout {...p} />;
        case "SplitLayout":             return <SplitLayout {...p} />;
        case "BottomLayout":            return <BottomLayout {...p} />;
        case "ReviewLayout":            return <ReviewLayout {...p} />;
        case "CarouselSlideLayout":     return <CarouselSlideLayout {...p} />;
        case "ServiceShowcaseLayout":   return <ServiceShowcaseLayout {...p} />;
        case "HeroServicesLayout":      return <HeroServicesLayout {...p} />;
        case "InfoSplitLayout":         return <InfoSplitLayout {...p} />;
        case "GradientHeroLayout":      return <GradientHeroLayout {...p} />;
        case "DiagonalSplitLayout":     return <DiagonalSplitLayout {...p} />;
        case "MagazineCoverLayout":     return <MagazineCoverLayout {...p} />;
        case "DuotoneLayout":           return <DuotoneLayout {...p} />;
        case "BoldTypographyLayout":    return <BoldTypographyLayout {...p} />;
        case "CollageGridLayout":       return <CollageGridLayout {...p} />;
        case "TriPanelLayout":          return <TriPanelLayout {...p} />;
        case "PolaroidScatterLayout":   return <PolaroidScatterLayout {...p} />;
        case "WindowGalleryLayout":     return <WindowGalleryLayout {...p} />;
        case "MosaicStripLayout":       return <MosaicStripLayout {...p} />;
        case "WaveDividerLayout":       return <WaveDividerLayout {...p} />;
        case "CircleAccentLayout":      return <CircleAccentLayout {...p} />;
        case "FloatingCardLayout":      return <FloatingCardLayout {...p} />;
        case "PremiumCollageLayout":    return <PremiumCollageLayout {...p} />;
        case "BannerRibbonLayout":      return <BannerRibbonLayout {...p} />;
        case "SplitWaveLayout":         return <SplitWaveLayout {...p} />;
        default:                        return <CenterLayout {...p} />;
    }
}

const SELF_BG_LAYOUTS = [
    "ServiceShowcaseLayout", "HeroServicesLayout", "InfoSplitLayout",
    "GradientHeroLayout", "DiagonalSplitLayout", "MagazineCoverLayout",
    "DuotoneLayout", "BoldTypographyLayout",
    "CollageGridLayout", "TriPanelLayout", "PolaroidScatterLayout",
    "WindowGalleryLayout", "MosaicStripLayout",
    "WaveDividerLayout", "CircleAccentLayout", "FloatingCardLayout",
    "PremiumCollageLayout", "BannerRibbonLayout", "SplitWaveLayout",
];

export function renderBg(preset: SocialTemplate): string {
    if (SELF_BG_LAYOUTS.includes(preset.layout)) return "";
    if (preset.layout === "CarouselSlideLayout") return "";
    if (preset.palette) return `${preset.palette.bg} ${preset.palette.text}`;
    if (preset.colorScheme === "dark")  return "bg-slate-900 text-white";
    if (preset.colorScheme === "light") return "bg-white text-slate-900";
    return "bg-gradient-to-br from-indigo-500 to-purple-600 text-white";
}
