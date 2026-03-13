// ---------------------------------------------------------------------------
// Premium text JSX -- router
//
// Individual layout builders live in:
//   poster-premium-layouts-a.ts  (WaveDivider, CircleAccent, FloatingCard)
//   poster-premium-layouts-b.ts  (PremiumCollage, BannerRibbon, SplitWave)
// Generic footer utility lives in poster-generic-footer.ts (avoids circular dep)
// ---------------------------------------------------------------------------

import type { LayoutType, TemplateDataForRender } from "./types";
import type { SatoriNode, Dimensions } from "./poster-renderer-types";
import { LAYOUT_CONFIGS } from "./poster-layout-configs";
import { buildPosterJsx } from "./poster-standard-blocks";
import { buildWaveDividerText, buildCircleAccentText, buildFloatingCardText } from "./poster-premium-layouts-a";
import { buildPremiumCollageText, buildBannerRibbonText, buildSplitWaveText } from "./poster-premium-layouts-b";

export { buildGenericFooter } from "./poster-generic-footer";

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
