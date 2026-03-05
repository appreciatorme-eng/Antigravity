/**
 * Multi-layer poster composition engine.
 * Builds rich canvases by compositing photos into shaped regions
 * on white/colored/gradient backgrounds — the key to Pinterest-quality posters.
 */
import sharp, { type OverlayOptions } from "sharp";
import {
  createRoundedRectMask,
  createCircleMask,
  createWaveBottomMask,
  createDiagonalMask,
  createWaveDivider,
  createGradientBlock,
  createSolidBlock,
} from "./poster-shapes";
import type { LayoutType, TemplateDataForRender } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PhotoRegion {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  mask: "rectangle" | "rounded" | "circle" | "wave-bottom" | "diagonal-left" | "diagonal-right";
  borderRadius?: number;
  waveDepth?: number;
}

interface ColorRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  gradientEnd?: string;
  gradientDirection?: "horizontal" | "vertical" | "diagonal";
}

interface ShapeOverlay {
  type: "wave-divider";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  position: "top" | "bottom";
}

export interface CompositionPlan {
  width: number;
  height: number;
  background: { r: number; g: number; b: number; alpha: number };
  photos: PhotoRegion[];
  colors: ColorRegion[];
  shapes: ShapeOverlay[];
}

// ---------------------------------------------------------------------------
// Image fetching and processing
// ---------------------------------------------------------------------------

async function fetchImageBuffer(url: string): Promise<Buffer> {
  if (url.startsWith("data:")) {
    const base64Data = url.split(",")[1];
    if (!base64Data) throw new Error("Invalid data URL");
    return Buffer.from(base64Data, "base64");
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function preparePhotoComposite(
  region: PhotoRegion
): Promise<OverlayOptions | null> {
  try {
    const raw = await fetchImageBuffer(region.url);
    const targetW = Math.round(region.width);
    const targetH = Math.round(region.height);

    let photo = await sharp(raw)
      .resize(targetW, targetH, { fit: "cover", position: "attention" })
      .modulate({ saturation: 1.12, brightness: 0.97 })
      .sharpen({ sigma: 0.6 })
      .png()
      .toBuffer();

    let mask: Buffer | null = null;
    switch (region.mask) {
      case "rounded":
        mask = createRoundedRectMask(targetW, targetH, region.borderRadius ?? 24);
        break;
      case "circle": {
        const d = Math.min(targetW, targetH);
        mask = createCircleMask(d);
        photo = await sharp(raw)
          .resize(d, d, { fit: "cover", position: "attention" })
          .modulate({ saturation: 1.12, brightness: 0.97 })
          .sharpen({ sigma: 0.6 })
          .png()
          .toBuffer();
        break;
      }
      case "wave-bottom":
        mask = createWaveBottomMask(targetW, targetH, region.waveDepth ?? 60);
        break;
      case "diagonal-left":
        mask = createDiagonalMask(targetW, targetH, "left");
        break;
      case "diagonal-right":
        mask = createDiagonalMask(targetW, targetH, "right");
        break;
    }

    if (mask) {
      photo = await sharp(photo)
        .composite([{ input: mask, blend: "dest-in" }])
        .png()
        .toBuffer();
    }

    return { input: photo, top: Math.round(region.y), left: Math.round(region.x) };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Canvas composition
// ---------------------------------------------------------------------------

export async function composeCanvasLayers(plan: CompositionPlan): Promise<Buffer> {
  const composites: OverlayOptions[] = [];

  // Color regions
  for (const region of plan.colors) {
    const layer = region.gradientEnd
      ? createGradientBlock(region.width, region.height, region.fill, region.gradientEnd, region.gradientDirection ?? "vertical")
      : createSolidBlock(region.width, region.height, region.fill);
    composites.push({ input: layer, top: region.y, left: region.x });
  }

  // Photo regions (processed in parallel)
  const photoComposites = await Promise.all(plan.photos.map(preparePhotoComposite));
  for (const pc of photoComposites) {
    if (pc) composites.push(pc);
  }

  // Shape overlays
  for (const shape of plan.shapes) {
    if (shape.type === "wave-divider") {
      const svg = createWaveDivider(shape.width, shape.height, shape.color, shape.position);
      composites.push({ input: svg, top: shape.y, left: shape.x });
    }
  }

  // Single composite operation for efficiency
  const canvas = await sharp({
    create: {
      width: plan.width,
      height: plan.height,
      channels: 4,
      background: plan.background,
    },
  })
    .png()
    .toBuffer();

  if (composites.length === 0) return canvas;
  return sharp(canvas).composite(composites).png().toBuffer();
}

// ---------------------------------------------------------------------------
// Layout-specific composition plans
// ---------------------------------------------------------------------------

function resolveHeroUrl(data: TemplateDataForRender, bgUrl?: string): string {
  return bgUrl || data.heroImage || data.galleryImages?.[0] || "";
}

function resolveGalleryUrl(data: TemplateDataForRender, index: number, bgUrl?: string): string {
  return data.galleryImages?.[index] || bgUrl || data.heroImage || "";
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16) || 255,
    g: parseInt(h.substring(2, 4), 16) || 255,
    b: parseInt(h.substring(4, 6), 16) || 255,
  };
}

export function buildCompositionPlan(
  layoutType: LayoutType,
  data: TemplateDataForRender,
  dims: { width: number; height: number },
  backgroundUrl?: string,
  brandColor?: string,
  accentColor?: string
): CompositionPlan | null {
  const w = dims.width;
  const h = dims.height;
  const brand = brandColor || "#0891b2"; // default teal
  const accent = accentColor || "#f97316"; // default orange
  const heroUrl = resolveHeroUrl(data, backgroundUrl);

  switch (layoutType) {
    // ── Wave Divider ──────────────────────────────────────────────────────
    // Hero photo top 55% with wave-cut bottom, white section below
    case "WaveDividerLayout": {
      const photoH = Math.round(h * 0.58);
      return {
        width: w, height: h,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
        photos: heroUrl ? [{
          url: heroUrl, x: 0, y: 0, width: w, height: photoH + 60,
          mask: "wave-bottom", waveDepth: 70,
        }] : [],
        colors: [
          { x: 0, y: photoH - 10, width: w, height: h - photoH + 10, fill: "#ffffff" },
        ],
        shapes: [],
      };
    }

    // ── Circle Accent ─────────────────────────────────────────────────────
    // Hero photo top 50%, white canvas with 3 circular accent photos below
    case "CircleAccentLayout": {
      const photoH = Math.round(h * 0.50);
      const circleD = Math.round(w * 0.22);
      const circleY = photoH + Math.round(h * 0.06);
      const gap = Math.round((w - circleD * 3) / 4);
      return {
        width: w, height: h,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
        photos: [
          ...(heroUrl ? [{
            url: heroUrl, x: 0, y: 0, width: w, height: photoH,
            mask: "wave-bottom" as const, waveDepth: 50,
          }] : []),
          ...[0, 1, 2].map((i) => ({
            url: resolveGalleryUrl(data, i, backgroundUrl),
            x: gap + i * (circleD + gap),
            y: circleY,
            width: circleD,
            height: circleD,
            mask: "circle" as const,
          })).filter(p => p.url),
        ],
        colors: [],
        shapes: [],
      };
    }

    // ── Floating Card ─────────────────────────────────────────────────────
    // Full hero photo background, semi-transparent card overlay at bottom
    case "FloatingCardLayout": {
      return {
        width: w, height: h,
        background: { r: 15, g: 23, b: 42, alpha: 1 },
        photos: heroUrl ? [{
          url: heroUrl, x: 0, y: 0, width: w, height: h,
          mask: "rectangle",
        }] : [],
        colors: [],
        shapes: [],
      };
    }

    // ── Premium Collage ───────────────────────────────────────────────────
    // Gradient canvas with 4 rounded photos arranged in a creative grid
    case "PremiumCollageLayout": {
      const pad = Math.round(w * 0.04);
      const mainW = Math.round(w * 0.55);
      const mainH = Math.round(h * 0.42);
      const sideW = w - mainW - pad * 3;
      const sideH = Math.round((mainH - pad) / 2);
      const topY = Math.round(h * 0.06);
      const rgb = hexToRgb(brand);
      return {
        width: w, height: h,
        background: { ...rgb, alpha: 1 },
        photos: [
          ...(heroUrl ? [{
            url: heroUrl, x: pad, y: topY, width: mainW, height: mainH,
            mask: "rounded" as const, borderRadius: 20,
          }] : []),
          {
            url: resolveGalleryUrl(data, 0, backgroundUrl),
            x: mainW + pad * 2, y: topY, width: sideW, height: sideH,
            mask: "rounded" as const, borderRadius: 16,
          },
          {
            url: resolveGalleryUrl(data, 1, backgroundUrl),
            x: mainW + pad * 2, y: topY + sideH + pad, width: sideW, height: sideH,
            mask: "rounded" as const, borderRadius: 16,
          },
          {
            url: resolveGalleryUrl(data, 2, backgroundUrl),
            x: pad, y: topY + mainH + pad,
            width: w - pad * 2, height: Math.round(h * 0.18),
            mask: "rounded" as const, borderRadius: 16,
          },
        ].filter(p => p.url),
        colors: [],
        shapes: [],
      };
    }

    // ── Banner Ribbon ─────────────────────────────────────────────────────
    // Horizontal photo strip at top, colored banner with text, photo strip at bottom
    case "BannerRibbonLayout": {
      const stripH = Math.round(h * 0.28);
      const midH = h - stripH * 2;
      const rgb = hexToRgb(brand);
      return {
        width: w, height: h,
        background: { ...rgb, alpha: 1 },
        photos: [
          ...(heroUrl ? [{
            url: heroUrl, x: 0, y: 0, width: w, height: stripH,
            mask: "rectangle" as const,
          }] : []),
          {
            url: resolveGalleryUrl(data, 0, backgroundUrl),
            x: 0, y: stripH + midH, width: w, height: stripH,
            mask: "rectangle" as const,
          },
        ].filter(p => p.url),
        colors: [
          {
            x: 0, y: stripH, width: w, height: midH,
            fill: brand,
            gradientEnd: accent,
            gradientDirection: "horizontal",
          },
        ],
        shapes: [],
      };
    }

    // ── Split Wave ────────────────────────────────────────────────────────
    // Left side: photo (55%), Right side: colored with wave divider
    case "SplitWaveLayout": {
      const photoW = Math.round(w * 0.55);
      const rgb = hexToRgb(brand);
      return {
        width: w, height: h,
        background: { ...rgb, alpha: 1 },
        photos: heroUrl ? [{
          url: heroUrl, x: 0, y: 0, width: photoW, height: h,
          mask: "diagonal-right",
        }] : [],
        colors: [
          {
            x: photoW - Math.round(w * 0.05), y: 0,
            width: w - photoW + Math.round(w * 0.05), height: h,
            fill: brand,
            gradientEnd: accent,
            gradientDirection: "vertical",
          },
        ],
        shapes: [],
      };
    }

    default:
      return null;
  }
}
