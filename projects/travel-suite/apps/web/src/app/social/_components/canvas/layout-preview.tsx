"use client";

import { SocialTemplate, type TemplateDataForRender } from "@/lib/social/types";
import {
  BoldTypographyLayout,
  BottomLayout,
  CarouselSlideLayout,
  CenterLayout,
  CollageGridLayout,
  DiagonalSplitLayout,
  DuotoneLayout,
  ElegantLayout,
  GradientHeroLayout,
  HeroServicesLayout,
  InfoSplitLayout,
  MagazineCoverLayout,
  MosaicStripLayout,
  PolaroidScatterLayout,
  ReviewLayout,
  ServiceShowcaseLayout,
  SplitLayout,
  TriPanelLayout,
  WindowGalleryLayout,
} from "@/components/social/templates/layouts/LayoutRenderer";

export function renderLayout(
  preset: SocialTemplate,
  templateData: TemplateDataForRender
) {
  const props = { templateData, preset };
  switch (preset.layout) {
    case "ElegantLayout":
      return <ElegantLayout {...props} />;
    case "SplitLayout":
      return <SplitLayout {...props} />;
    case "BottomLayout":
      return <BottomLayout {...props} />;
    case "ReviewLayout":
      return <ReviewLayout {...props} />;
    case "CarouselSlideLayout":
      return <CarouselSlideLayout {...props} />;
    case "ServiceShowcaseLayout":
      return <ServiceShowcaseLayout {...props} />;
    case "HeroServicesLayout":
      return <HeroServicesLayout {...props} />;
    case "InfoSplitLayout":
      return <InfoSplitLayout {...props} />;
    case "GradientHeroLayout":
      return <GradientHeroLayout {...props} />;
    case "DiagonalSplitLayout":
      return <DiagonalSplitLayout {...props} />;
    case "MagazineCoverLayout":
      return <MagazineCoverLayout {...props} />;
    case "DuotoneLayout":
      return <DuotoneLayout {...props} />;
    case "BoldTypographyLayout":
      return <BoldTypographyLayout {...props} />;
    case "CollageGridLayout":
      return <CollageGridLayout {...props} />;
    case "TriPanelLayout":
      return <TriPanelLayout {...props} />;
    case "PolaroidScatterLayout":
      return <PolaroidScatterLayout {...props} />;
    case "WindowGalleryLayout":
      return <WindowGalleryLayout {...props} />;
    case "MosaicStripLayout":
      return <MosaicStripLayout {...props} />;
    default:
      return <CenterLayout {...props} />;
  }
}

export function renderBg(preset: SocialTemplate) {
  const selfBgLayouts = [
    "ServiceShowcaseLayout",
    "HeroServicesLayout",
    "InfoSplitLayout",
    "GradientHeroLayout",
    "DiagonalSplitLayout",
    "MagazineCoverLayout",
    "DuotoneLayout",
    "BoldTypographyLayout",
    "CollageGridLayout",
    "TriPanelLayout",
    "PolaroidScatterLayout",
    "WindowGalleryLayout",
    "MosaicStripLayout",
  ];

  if (selfBgLayouts.includes(preset.layout)) return "";
  if (preset.colorScheme === "dark") return "bg-slate-900 text-white";
  if (preset.colorScheme === "light") return "bg-white text-slate-900";
  return "bg-gradient-to-br from-indigo-500 to-purple-600 text-white";
}
