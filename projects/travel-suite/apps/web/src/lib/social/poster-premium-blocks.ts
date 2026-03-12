// ---------------------------------------------------------------------------
// Premium text JSX -- router + generic footer utility
//
// Individual layout builders live in:
//   poster-premium-layouts-a.ts  (WaveDivider, CircleAccent, FloatingCard)
//   poster-premium-layouts-b.ts  (PremiumCollage, BannerRibbon, SplitWave)
// ---------------------------------------------------------------------------

import type { LayoutType, TemplateDataForRender } from "./types";
import type { SatoriNode, Dimensions } from "./poster-renderer-types";
import { LAYOUT_CONFIGS } from "./poster-layout-configs";
import { buildPosterJsx } from "./poster-standard-blocks";
import { buildWaveDividerText, buildCircleAccentText, buildFloatingCardText } from "./poster-premium-layouts-a";
import { buildPremiumCollageText, buildBannerRibbonText, buildSplitWaveText } from "./poster-premium-layouts-b";

// ---------------------------------------------------------------------------
// Generic footer used by several premium layouts
// ---------------------------------------------------------------------------

export function buildGenericFooter(data: TemplateDataForRender, width: number, bgColor: string): SatoriNode {
  const parts: string[] = [];
  if (data.contactNumber) parts.push(data.contactNumber);
  if (data.email) parts.push(data.email);
  if (data.website) parts.push(data.website);
  if (parts.length === 0) return { type: "div", props: { style: { display: "flex" }, children: null } };

  return {
    type: "div",
    props: {
      style: {
        position: "absolute", bottom: 0, left: 0, width,
        display: "flex", flexDirection: "row" as const,
        alignItems: "center", justifyContent: "center",
        gap: 20, padding: "14px 32px",
        backgroundColor: bgColor,
      },
      children: parts.map((p) => ({
        type: "div",
        props: {
          style: { fontFamily: "Inter", fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.9)" },
          children: p,
        },
      })),
    },
  };
}

// ---------------------------------------------------------------------------
// Premium text router
// ---------------------------------------------------------------------------

export function buildPremiumTextJsx(
  data: TemplateDataForRender,
  layoutType: LayoutType,
  dims: Dimensions,
  brandColor?: string,
  accentColor?: string
): SatoriNode {
  const w = dims.width;
  const h = dims.height;
  const brand = brandColor || "#0891b2";
  const accent = accentColor || "#f97316";

  switch (layoutType) {
    case "WaveDividerLayout":
      return buildWaveDividerText(data, w, h, brand, accent);
    case "CircleAccentLayout":
      return buildCircleAccentText(data, w, h, brand);
    case "FloatingCardLayout":
      return buildFloatingCardText(data, w, h, brand);
    case "PremiumCollageLayout":
      return buildPremiumCollageText(data, w, h);
    case "BannerRibbonLayout":
      return buildBannerRibbonText(data, w, h);
    case "SplitWaveLayout":
      return buildSplitWaveText(data, w, h);
    default:
      return buildPosterJsx(data, LAYOUT_CONFIGS[layoutType] ?? LAYOUT_CONFIGS.CenterLayout, dims);
  }
}
