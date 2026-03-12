// ---------------------------------------------------------------------------
// Poster renderer -- slim orchestrator
//
// Re-exports all sub-modules so existing imports from "poster-renderer" still
// resolve. The heavy lifting lives in the split modules:
//   poster-renderer-types.ts   -- shared types (LayoutConfig, ImageSlot, etc.)
//   poster-layout-configs.ts   -- DIMENSIONS, LAYOUT_CONFIGS
//   poster-multi-image.ts      -- MULTI_IMAGE_SLOTS, prepareMultiImageCanvas
//   poster-standard-blocks.ts  -- gradient overlay + standard text blocks
//   poster-premium-blocks.ts   -- premium layout text builders
//   poster-background.ts       -- prepareBackground (image fetch + crop)
// ---------------------------------------------------------------------------

import satori from "satori";
import sharp from "sharp";
import { loadPosterFonts } from "./fonts";
import { composeCanvasLayers, buildCompositionPlan } from "./poster-composer";
import { PREMIUM_LAYOUT_TYPES } from "./types";
import type { PosterRenderInput, PosterRenderOutput } from "./types";

import { DIMENSIONS } from "./poster-layout-configs";
import { LAYOUT_CONFIGS } from "./poster-layout-configs";
import { MULTI_IMAGE_SLOTS, prepareMultiImageCanvas } from "./poster-multi-image";
import { buildPosterJsx } from "./poster-standard-blocks";
import { buildPremiumTextJsx } from "./poster-premium-blocks";
import { prepareBackground } from "./poster-background";

// Re-export everything so existing barrel imports keep working
export { DIMENSIONS, LAYOUT_CONFIGS } from "./poster-layout-configs";
export { MULTI_IMAGE_SLOTS, prepareMultiImageCanvas } from "./poster-multi-image";
export {
  buildGradientOverlay,
  buildHeaderBlock,
  buildHeroBlock,
  buildPriceBlock,
  buildFooterBlock,
  buildPosterJsx,
} from "./poster-standard-blocks";
export { buildPremiumTextJsx, buildGenericFooter } from "./poster-premium-blocks";
export { prepareBackground } from "./poster-background";
export type { LayoutConfig, ImageSlot, SatoriNode, Dimensions } from "./poster-renderer-types";

// ---------------------------------------------------------------------------
// Main render function
// ---------------------------------------------------------------------------

export async function renderPoster(
  input: PosterRenderInput
): Promise<PosterRenderOutput> {
  const dims = DIMENSIONS[input.aspectRatio];
  const fonts = await loadPosterFonts();
  const isPremium = PREMIUM_LAYOUT_TYPES.has(input.layoutType);

  let bgBuffer: Buffer;
  let jsx: Parameters<typeof satori>[0];

  if (isPremium) {
    // Premium path: multi-layer canvas composition
    const plan = buildCompositionPlan(
      input.layoutType,
      input.templateData,
      dims,
      input.backgroundUrl,
      input.brandColor,
      input.accentColor
    );
    bgBuffer = plan
      ? await composeCanvasLayers(plan)
      : await sharp({
          create: { width: dims.width, height: dims.height, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
        }).png().toBuffer();
    jsx = buildPremiumTextJsx(input.templateData, input.layoutType, dims, input.brandColor, input.accentColor);
  } else {
    // Standard path: single photo background
    const slotsFn = MULTI_IMAGE_SLOTS[input.layoutType];
    if (slotsFn && input.templateData.galleryImages?.length) {
      bgBuffer = await prepareMultiImageCanvas(
        input.templateData.galleryImages,
        slotsFn(dims),
        dims
      );
    } else if (input.backgroundUrl) {
      bgBuffer = await prepareBackground(input.backgroundUrl, dims.width, dims.height);
    } else {
      bgBuffer = await sharp({
        create: { width: dims.width, height: dims.height, channels: 4, background: { r: 15, g: 23, b: 42, alpha: 1 } },
      }).png().toBuffer();
    }

    const layoutConfig = LAYOUT_CONFIGS[input.layoutType] ?? LAYOUT_CONFIGS.CenterLayout;
    jsx = buildPosterJsx(input.templateData, layoutConfig, dims);
  }

  // Satori renders JSX to SVG
  const svg = await satori(jsx, {
    width: dims.width,
    height: dims.height,
    fonts,
  });

  // Sharp composites background + SVG overlay
  const svgBuffer = Buffer.from(svg);
  const result = await sharp(bgBuffer)
    .resize(dims.width, dims.height, { fit: "cover" })
    .composite([{ input: svgBuffer, top: 0, left: 0 }])
    .toFormat(
      input.format === "jpeg" ? "jpeg" : input.format === "webp" ? "webp" : "png",
      { quality: input.quality ?? 95 }
    )
    .toBuffer();

  const contentType =
    input.format === "jpeg" ? "image/jpeg" : input.format === "webp" ? "image/webp" : "image/png";

  return {
    buffer: result,
    contentType,
    width: dims.width,
    height: dims.height,
  };
}
