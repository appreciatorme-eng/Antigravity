// ---------------------------------------------------------------------------
// Multi-image slot positions and canvas builder (standard layouts)
// ---------------------------------------------------------------------------

import sharp from "sharp";
import type { LayoutType } from "./types";
import type { ImageSlot, Dimensions } from "./poster-renderer-types";
import { prepareBackground } from "./poster-background";

// ---------------------------------------------------------------------------
// Multi-image slot positions per layout (standard layouts only)
// ---------------------------------------------------------------------------

export const MULTI_IMAGE_SLOTS: Partial<
  Record<LayoutType, (dims: Dimensions) => ImageSlot[]>
> = {
  CollageGridLayout: (d) => {
    const gap = 2;
    const leftW = Math.round(d.width * 0.65);
    const rightW = d.width - leftW - gap;
    const imgH = Math.round(d.height * 0.65);
    const rightH = Math.round((imgH - gap * 2) / 3);
    return [
      { x: 0, y: 0, width: leftW, height: imgH },
      { x: leftW + gap, y: 0, width: rightW, height: rightH },
      { x: leftW + gap, y: rightH + gap, width: rightW, height: rightH },
      { x: leftW + gap, y: (rightH + gap) * 2, width: rightW, height: imgH - (rightH + gap) * 2 },
    ];
  },
  TriPanelLayout: (d) => {
    const gap = 2;
    const panelH = Math.round(d.height * 0.65);
    const panelW = Math.round((d.width - gap * 2) / 3);
    return [
      { x: 0, y: 0, width: panelW, height: panelH },
      { x: panelW + gap, y: 0, width: panelW, height: panelH },
      { x: (panelW + gap) * 2, y: 0, width: d.width - (panelW + gap) * 2, height: panelH },
    ];
  },
  PolaroidScatterLayout: (d) => {
    const imgW = Math.round(d.width * 0.36);
    const imgH = Math.round(imgW * 0.75);
    return [
      { x: Math.round(d.width * 0.06), y: Math.round(d.height * 0.06), width: imgW, height: imgH },
      { x: Math.round(d.width * 0.5), y: Math.round(d.height * 0.12), width: imgW, height: imgH },
      { x: Math.round(d.width * 0.28), y: Math.round(d.height * 0.35), width: imgW, height: imgH },
    ];
  },
  WindowGalleryLayout: (d) => {
    const imgW = Math.round(d.width * 0.27);
    const imgH = Math.round(imgW * 1.1);
    const gap = Math.round((d.width - imgW * 3) / 4);
    const topY = Math.round(d.height * 0.12);
    return [
      { x: gap, y: topY, width: imgW, height: imgH },
      { x: gap * 2 + imgW, y: topY, width: imgW, height: imgH },
      { x: gap * 3 + imgW * 2, y: topY, width: imgW, height: imgH },
    ];
  },
  MosaicStripLayout: (d) => {
    const gap = 2;
    const heroH = Math.round(d.height * 0.5);
    const stripH = Math.round(d.height * 0.18);
    const stripW = Math.round((d.width - gap * 3) / 4);
    return [
      { x: 0, y: 0, width: d.width, height: heroH },
      { x: 0, y: heroH + gap, width: stripW, height: stripH },
      { x: stripW + gap, y: heroH + gap, width: stripW, height: stripH },
      { x: (stripW + gap) * 2, y: heroH + gap, width: stripW, height: stripH },
      { x: (stripW + gap) * 3, y: heroH + gap, width: d.width - (stripW + gap) * 3, height: stripH },
    ];
  },
};

// ---------------------------------------------------------------------------
// Multi-image canvas builder (standard layouts)
// ---------------------------------------------------------------------------

export async function prepareMultiImageCanvas(
  images: string[],
  slots: ImageSlot[],
  dims: Dimensions,
  bgColor?: { r: number; g: number; b: number; alpha: number }
): Promise<Buffer> {
  const background = bgColor || { r: 15, g: 23, b: 42, alpha: 1 };
  const baseBuffer = await sharp({
    create: { width: dims.width, height: dims.height, channels: 4, background },
  }).png().toBuffer();

  const composites = await Promise.all(
    slots.map(async (slot, i) => {
      const url = images[i] || images[0];
      if (!url) return null;
      try {
        const buffer = await prepareBackground(url, Math.round(slot.width), Math.round(slot.height));
        return { input: buffer, top: Math.round(slot.y), left: Math.round(slot.x) };
      } catch {
        return null;
      }
    })
  );

  const validComposites = composites.filter(Boolean) as { input: Buffer; top: number; left: number }[];
  if (validComposites.length === 0) return baseBuffer;
  return sharp(baseBuffer).composite(validComposites).png().toBuffer();
}
