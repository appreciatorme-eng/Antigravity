import satori from "satori";
import sharp from "sharp";
import { loadPosterFonts } from "./fonts";
import { composeCanvasLayers, buildCompositionPlan } from "./poster-composer";
import { PREMIUM_LAYOUT_TYPES } from "./types";
import type {
  LayoutType,
  AspectRatio,
  TemplateDataForRender,
  PosterRenderInput,
  PosterRenderOutput,
} from "./types";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SatoriNode = any;

// ---------------------------------------------------------------------------
// Dimensions
// ---------------------------------------------------------------------------

const DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
};

// ---------------------------------------------------------------------------
// Layout configuration system
// ---------------------------------------------------------------------------

interface LayoutConfig {
  headerPosition: "top-center" | "top-left" | "none";
  heroPosition: "center" | "bottom-left" | "center-large";
  pricePosition:
    | "center-below"
    | "bottom-right"
    | "bottom-sheet"
    | "bottom-left";
  footerStyle: "bottom-bar" | "inline" | "navy-bar";
  overlayGradient: "bottom-fade" | "diagonal" | "full-dark" | "vignette" | "brand-tint" | "none";
  heroFontFamily: "Inter" | "Cormorant Garamond" | "Playfair Display" | "Poppins" | "Montserrat";
  heroFontSize: number;
}

interface ImageSlot {
  x: number;
  y: number;
  width: number;
  height: number;
}

const LAYOUT_CONFIGS: Record<LayoutType, LayoutConfig> = {
  CenterLayout: {
    headerPosition: "top-center",
    heroPosition: "center",
    pricePosition: "center-below",
    footerStyle: "bottom-bar",
    overlayGradient: "bottom-fade",
    heroFontFamily: "Cormorant Garamond",
    heroFontSize: 80,
  },
  SplitLayout: {
    headerPosition: "top-left",
    heroPosition: "center",
    pricePosition: "bottom-right",
    footerStyle: "bottom-bar",
    overlayGradient: "diagonal",
    heroFontFamily: "Inter",
    heroFontSize: 72,
  },
  BottomLayout: {
    headerPosition: "top-center",
    heroPosition: "center",
    pricePosition: "center-below",
    footerStyle: "bottom-bar",
    overlayGradient: "bottom-fade",
    heroFontFamily: "Inter",
    heroFontSize: 80,
  },
  ElegantLayout: {
    headerPosition: "none",
    heroPosition: "center",
    pricePosition: "center-below",
    footerStyle: "inline",
    overlayGradient: "full-dark",
    heroFontFamily: "Cormorant Garamond",
    heroFontSize: 88,
  },
  ReviewLayout: {
    headerPosition: "none",
    heroPosition: "center",
    pricePosition: "center-below",
    footerStyle: "bottom-bar",
    overlayGradient: "none",
    heroFontFamily: "Cormorant Garamond",
    heroFontSize: 36,
  },
  ServiceShowcaseLayout: {
    headerPosition: "top-center",
    heroPosition: "center",
    pricePosition: "center-below",
    footerStyle: "navy-bar",
    overlayGradient: "none",
    heroFontFamily: "Inter",
    heroFontSize: 64,
  },
  HeroServicesLayout: {
    headerPosition: "top-left",
    heroPosition: "center",
    pricePosition: "center-below",
    footerStyle: "navy-bar",
    overlayGradient: "bottom-fade",
    heroFontFamily: "Inter",
    heroFontSize: 72,
  },
  InfoSplitLayout: {
    headerPosition: "top-left",
    heroPosition: "center",
    pricePosition: "bottom-left",
    footerStyle: "navy-bar",
    overlayGradient: "diagonal",
    heroFontFamily: "Inter",
    heroFontSize: 64,
  },
  GradientHeroLayout: {
    headerPosition: "top-left",
    heroPosition: "center-large",
    pricePosition: "center-below",
    footerStyle: "bottom-bar",
    overlayGradient: "bottom-fade",
    heroFontFamily: "Playfair Display",
    heroFontSize: 96,
  },
  DiagonalSplitLayout: {
    headerPosition: "top-left",
    heroPosition: "center",
    pricePosition: "bottom-right",
    footerStyle: "navy-bar",
    overlayGradient: "diagonal",
    heroFontFamily: "Montserrat",
    heroFontSize: 72,
  },
  MagazineCoverLayout: {
    headerPosition: "top-left",
    heroPosition: "center",
    pricePosition: "bottom-left",
    footerStyle: "inline",
    overlayGradient: "bottom-fade",
    heroFontFamily: "Playfair Display",
    heroFontSize: 88,
  },
  DuotoneLayout: {
    headerPosition: "top-left",
    heroPosition: "center",
    pricePosition: "bottom-left",
    footerStyle: "inline",
    overlayGradient: "full-dark",
    heroFontFamily: "Montserrat",
    heroFontSize: 80,
  },
  BoldTypographyLayout: {
    headerPosition: "top-center",
    heroPosition: "center-large",
    pricePosition: "center-below",
    footerStyle: "navy-bar",
    overlayGradient: "bottom-fade",
    heroFontFamily: "Montserrat",
    heroFontSize: 96,
  },
  CarouselSlideLayout: {
    headerPosition: "top-left",
    heroPosition: "center",
    pricePosition: "center-below",
    footerStyle: "bottom-bar",
    overlayGradient: "bottom-fade",
    heroFontFamily: "Inter",
    heroFontSize: 64,
  },
  CollageGridLayout: {
    headerPosition: "none",
    heroPosition: "center",
    pricePosition: "bottom-left",
    footerStyle: "bottom-bar",
    overlayGradient: "bottom-fade",
    heroFontFamily: "Poppins",
    heroFontSize: 72,
  },
  TriPanelLayout: {
    headerPosition: "none",
    heroPosition: "center",
    pricePosition: "bottom-left",
    footerStyle: "bottom-bar",
    overlayGradient: "none",
    heroFontFamily: "Poppins",
    heroFontSize: 64,
  },
  PolaroidScatterLayout: {
    headerPosition: "none",
    heroPosition: "center",
    pricePosition: "bottom-left",
    footerStyle: "bottom-bar",
    overlayGradient: "none",
    heroFontFamily: "Inter",
    heroFontSize: 60,
  },
  WindowGalleryLayout: {
    headerPosition: "none",
    heroPosition: "center",
    pricePosition: "bottom-left",
    footerStyle: "bottom-bar",
    overlayGradient: "none",
    heroFontFamily: "Cormorant Garamond",
    heroFontSize: 64,
  },
  MosaicStripLayout: {
    headerPosition: "none",
    heroPosition: "center",
    pricePosition: "bottom-left",
    footerStyle: "bottom-bar",
    overlayGradient: "none",
    heroFontFamily: "Poppins",
    heroFontSize: 60,
  },
  // Premium layouts — text overlays handled by buildPremiumTextJsx
  WaveDividerLayout: {
    headerPosition: "none",
    heroPosition: "center",
    pricePosition: "center-below",
    footerStyle: "bottom-bar",
    overlayGradient: "none",
    heroFontFamily: "Playfair Display",
    heroFontSize: 72,
  },
  CircleAccentLayout: {
    headerPosition: "none",
    heroPosition: "center",
    pricePosition: "center-below",
    footerStyle: "bottom-bar",
    overlayGradient: "none",
    heroFontFamily: "Poppins",
    heroFontSize: 64,
  },
  FloatingCardLayout: {
    headerPosition: "top-left",
    heroPosition: "center",
    pricePosition: "center-below",
    footerStyle: "bottom-bar",
    overlayGradient: "vignette",
    heroFontFamily: "Playfair Display",
    heroFontSize: 80,
  },
  PremiumCollageLayout: {
    headerPosition: "none",
    heroPosition: "center",
    pricePosition: "center-below",
    footerStyle: "bottom-bar",
    overlayGradient: "none",
    heroFontFamily: "Montserrat",
    heroFontSize: 72,
  },
  BannerRibbonLayout: {
    headerPosition: "none",
    heroPosition: "center",
    pricePosition: "center-below",
    footerStyle: "navy-bar",
    overlayGradient: "none",
    heroFontFamily: "Playfair Display",
    heroFontSize: 80,
  },
  SplitWaveLayout: {
    headerPosition: "none",
    heroPosition: "center",
    pricePosition: "bottom-left",
    footerStyle: "navy-bar",
    overlayGradient: "none",
    heroFontFamily: "Poppins",
    heroFontSize: 64,
  },
};

// ---------------------------------------------------------------------------
// Multi-image slot positions per layout (standard layouts only)
// ---------------------------------------------------------------------------

const MULTI_IMAGE_SLOTS: Partial<
  Record<LayoutType, (dims: { width: number; height: number }) => ImageSlot[]>
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

async function prepareMultiImageCanvas(
  images: string[],
  slots: ImageSlot[],
  dims: { width: number; height: number },
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

// ---------------------------------------------------------------------------
// Gradient overlay builder (enhanced with vignette + brand tint)
// ---------------------------------------------------------------------------

function buildGradientOverlay(
  type: LayoutConfig["overlayGradient"],
  width: number,
  height: number,
  _brandColor?: string
): SatoriNode {
  if (type === "none") return null;

  const gradientMap: Record<string, string> = {
    "bottom-fade":
      "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.88) 100%)",
    diagonal:
      "linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%)",
    "full-dark":
      "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.55) 100%)",
    vignette:
      "radial-gradient(ellipse 80% 70% at 50% 40%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.65) 100%)",
    "brand-tint":
      "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.7) 100%)",
  };

  return {
    type: "div",
    props: {
      style: {
        position: "absolute",
        top: 0,
        left: 0,
        width,
        height,
        backgroundImage: gradientMap[type] || gradientMap["bottom-fade"],
        display: "flex",
      },
      children: null,
    },
  };
}

// ---------------------------------------------------------------------------
// Standard text block builders (white text on dark backgrounds)
// ---------------------------------------------------------------------------

function buildHeaderBlock(data: TemplateDataForRender, config: LayoutConfig): SatoriNode {
  if (config.headerPosition === "none") return null;
  const isCenter = config.headerPosition === "top-center";
  const children: SatoriNode[] = [];

  if (data.companyName) {
    children.push({
      type: "div",
      props: {
        style: {
          fontFamily: "Inter",
          fontSize: 22,
          fontWeight: 600,
          color: "white",
          letterSpacing: 2,
          textTransform: "uppercase" as const,
        },
        children: data.companyName,
      },
    });
  }

  if (data.season) {
    children.push({
      type: "div",
      props: {
        style: {
          fontFamily: "Inter",
          fontSize: 14,
          fontWeight: 400,
          color: "rgba(255,255,255,0.85)",
          backgroundColor: "rgba(255,255,255,0.15)",
          padding: "6px 16px",
          borderRadius: 20,
          marginTop: 8,
        },
        children: data.season,
      },
    });
  }

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column" as const,
        alignItems: isCenter ? "center" : "flex-start",
        padding: "40px 48px 0",
        width: "100%",
      },
      children,
    },
  };
}

function buildHeroBlock(
  data: TemplateDataForRender,
  config: LayoutConfig,
  dims: { width: number; height: number }
): SatoriNode {
  const isLarge = config.heroPosition === "center-large";
  const fontSize = isLarge
    ? Math.min(config.heroFontSize, Math.floor(dims.width / 8))
    : Math.min(config.heroFontSize, Math.floor(dims.width / 10));

  const alignItems = config.heroPosition === "bottom-left" ? "flex-start" : "center";
  const textAlign = config.heroPosition === "bottom-left" ? "left" : ("center" as const);
  const justifyContent = config.heroPosition === "bottom-left" ? "flex-end" : "center";

  const children: SatoriNode[] = [];

  if (data.destination) {
    children.push({
      type: "div",
      props: {
        style: {
          fontFamily: config.heroFontFamily,
          fontSize,
          fontWeight: config.heroFontFamily === "Playfair Display" ? 900 : 700,
          color: "white",
          textAlign,
          lineHeight: 1.05,
          letterSpacing: -1,
          maxWidth: "90%",
          textShadow: "0 3px 24px rgba(0,0,0,0.6)",
        },
        children: data.destination,
      },
    });
  }

  // Decorative divider
  if (data.destination && (data.offer || data.price)) {
    children.push({
      type: "div",
      props: {
        style: {
          width: 80,
          height: 2,
          backgroundColor: "rgba(255,255,255,0.45)",
          marginTop: 16,
          marginBottom: 8,
          borderRadius: 1,
        },
        children: null,
      },
    });
  }

  if (data.offer) {
    children.push({
      type: "div",
      props: {
        style: {
          fontFamily: "Inter",
          fontSize: 28,
          fontWeight: 600,
          color: "rgba(255,255,255,0.92)",
          textAlign,
          marginTop: 8,
          maxWidth: "80%",
          letterSpacing: 1,
        },
        children: data.offer,
      },
    });
  }

  if (data.reviewText) {
    children.push({
      type: "div",
      props: {
        style: {
          fontFamily: "Cormorant Garamond",
          fontSize: 32,
          fontWeight: 400,
          fontStyle: "italic",
          color: "rgba(255,255,255,0.95)",
          textAlign: "center" as const,
          marginTop: 24,
          maxWidth: "85%",
          lineHeight: 1.4,
        },
        children: `\u201C${data.reviewText}\u201D`,
      },
    });

    if (data.reviewerName) {
      children.push({
        type: "div",
        props: {
          style: {
            fontFamily: "Inter",
            fontSize: 18,
            fontWeight: 400,
            color: "rgba(255,255,255,0.75)",
            marginTop: 16,
            textAlign: "center" as const,
          },
          children: `\u2014 ${data.reviewerName}${data.reviewerTrip ? `, ${data.reviewerTrip}` : ""}`,
        },
      });
    }
  }

  const items = data.bulletPoints ?? data.services;
  if (items && items.length > 0) {
    children.push({
      type: "div",
      props: {
        style: {
          display: "flex",
          flexDirection: "row" as const,
          flexWrap: "wrap" as const,
          gap: 8,
          marginTop: 20,
          justifyContent: alignItems === "center" ? "center" : "flex-start",
          maxWidth: "90%",
        },
        children: items.slice(0, 6).map((item: string) => ({
          type: "div",
          props: {
            style: {
              fontFamily: "Inter",
              fontSize: 16,
              fontWeight: 500,
              color: "white",
              backgroundColor: "rgba(255,255,255,0.18)",
              padding: "6px 14px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.2)",
            },
            children: item,
          },
        })),
      },
    });
  }

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column" as const,
        alignItems,
        justifyContent,
        flex: 1,
        padding: "0 48px",
        width: "100%",
      },
      children,
    },
  };
}

function buildPriceBlock(data: TemplateDataForRender, config: LayoutConfig): SatoriNode {
  if (!data.price) return null;

  const positionStyles: Record<string, Record<string, unknown>> = {
    "center-below": { alignItems: "center", justifyContent: "center", padding: "0 48px 20px" },
    "bottom-right": { alignItems: "flex-end", justifyContent: "flex-end", padding: "0 48px 20px" },
    "bottom-sheet": { alignItems: "center", justifyContent: "flex-end", padding: "0 48px 20px" },
    "bottom-left": { alignItems: "flex-start", justifyContent: "flex-end", padding: "0 48px 20px" },
  };

  const pos = positionStyles[config.pricePosition] ?? positionStyles["center-below"];

  return {
    type: "div",
    props: {
      style: { display: "flex", flexDirection: "column" as const, width: "100%", ...pos },
      children: [{
        type: "div",
        props: {
          style: {
            display: "flex",
            flexDirection: "column" as const,
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.35)",
            borderRadius: 16,
            padding: "12px 32px",
            border: "1px solid rgba(255,255,255,0.2)",
          },
          children: [
            {
              type: "div",
              props: {
                style: {
                  fontFamily: "Inter",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.7)",
                  textTransform: "uppercase" as const,
                  letterSpacing: 3,
                },
                children: "Starting from",
              },
            },
            {
              type: "div",
              props: {
                style: {
                  fontFamily: "Inter",
                  fontSize: 48,
                  fontWeight: 700,
                  color: "white",
                  textShadow: "0 2px 8px rgba(0,0,0,0.3)",
                  marginTop: 4,
                },
                children: data.price,
              },
            },
          ],
        },
      }],
    },
  };
}

function buildFooterBlock(data: TemplateDataForRender, config: LayoutConfig, width: number): SatoriNode {
  const contactParts: string[] = [];
  if (data.contactNumber) contactParts.push(data.contactNumber);
  if (data.email) contactParts.push(data.email);
  if (data.website) contactParts.push(data.website);
  if (contactParts.length === 0) return null;

  const isNavy = config.footerStyle === "navy-bar" || config.footerStyle === "bottom-bar";
  const bgColor = isNavy ? "#1a2d5a" : "rgba(0,0,0,0.5)";

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "row" as const,
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        width,
        padding: "16px 32px",
        backgroundColor: bgColor,
      },
      children: contactParts.map((part) => ({
        type: "div",
        props: {
          style: { fontFamily: "Inter", fontSize: 15, fontWeight: 400, color: "rgba(255,255,255,0.9)" },
          children: part,
        },
      })),
    },
  };
}

// ---------------------------------------------------------------------------
// Standard JSX builder (dark photo overlay paradigm)
// ---------------------------------------------------------------------------

function buildPosterJsx(
  data: TemplateDataForRender,
  config: LayoutConfig,
  dims: { width: number; height: number },
  brandColor?: string
): SatoriNode {
  const children: SatoriNode[] = [];

  const gradient = buildGradientOverlay(config.overlayGradient, dims.width, dims.height, brandColor);
  if (gradient) children.push(gradient);

  const header = buildHeaderBlock(data, config);
  if (header) children.push(header);

  children.push(buildHeroBlock(data, config, dims));

  const price = buildPriceBlock(data, config);
  if (price) children.push(price);

  const footer = buildFooterBlock(data, config, dims.width);
  if (footer) children.push(footer);

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column" as const,
        width: dims.width,
        height: dims.height,
        position: "relative",
      },
      children,
    },
  };
}

// ---------------------------------------------------------------------------
// Premium text JSX builders (dark text on light canvas)
// ---------------------------------------------------------------------------

function buildPremiumTextJsx(
  data: TemplateDataForRender,
  layoutType: LayoutType,
  dims: { width: number; height: number },
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
      return buildPosterJsx(data, LAYOUT_CONFIGS[layoutType] ?? LAYOUT_CONFIGS.CenterLayout, dims, brandColor);
  }
}

function buildWaveDividerText(
  data: TemplateDataForRender,
  w: number,
  h: number,
  brand: string,
  accent: string
): SatoriNode {
  const textTop = Math.round(h * 0.56);
  const children: SatoriNode[] = [];

  // Company name on the photo region (white)
  if (data.companyName) {
    children.push({
      type: "div",
      props: {
        style: {
          position: "absolute", top: 36, left: 48,
          fontFamily: "Inter", fontSize: 20, fontWeight: 700,
          color: "white", letterSpacing: 2, textTransform: "uppercase" as const,
          textShadow: "0 2px 8px rgba(0,0,0,0.4)",
        },
        children: data.companyName,
      },
    });
  }

  // Season pill on photo
  if (data.season) {
    children.push({
      type: "div",
      props: {
        style: {
          position: "absolute", top: 36, right: 48,
          fontFamily: "Inter", fontSize: 13, fontWeight: 600,
          color: "white", backgroundColor: accent,
          padding: "6px 18px", borderRadius: 20,
          letterSpacing: 1, textTransform: "uppercase" as const,
        },
        children: data.season,
      },
    });
  }

  // Text section on white background
  const textChildren: SatoriNode[] = [];

  if (data.destination) {
    textChildren.push({
      type: "div",
      props: {
        style: {
          fontFamily: "Playfair Display",
          fontSize: Math.min(72, Math.floor(w / 12)),
          fontWeight: 900,
          color: "#1a1a2e",
          lineHeight: 1.05,
          letterSpacing: -1,
        },
        children: data.destination,
      },
    });
  }

  // Decorative accent line
  textChildren.push({
    type: "div",
    props: {
      style: { width: 60, height: 3, backgroundColor: brand, borderRadius: 2, marginTop: 12, marginBottom: 12 },
      children: null,
    },
  });

  if (data.offer) {
    textChildren.push({
      type: "div",
      props: {
        style: {
          fontFamily: "Poppins", fontSize: 22, fontWeight: 600, color: brand,
          marginTop: 4,
        },
        children: data.offer,
      },
    });
  }

  // Services as colored pills
  const items = data.services ?? data.bulletPoints;
  if (items && items.length > 0) {
    textChildren.push({
      type: "div",
      props: {
        style: {
          display: "flex", flexDirection: "row" as const, flexWrap: "wrap" as const,
          gap: 8, marginTop: 16,
        },
        children: items.slice(0, 5).map((item: string) => ({
          type: "div",
          props: {
            style: {
              fontFamily: "Inter", fontSize: 13, fontWeight: 600,
              color: brand, backgroundColor: `${brand}18`,
              padding: "5px 14px", borderRadius: 14,
              border: `1px solid ${brand}40`,
            },
            children: item,
          },
        })),
      },
    });
  }

  // Price badge
  if (data.price) {
    textChildren.push({
      type: "div",
      props: {
        style: {
          display: "flex", flexDirection: "row" as const, alignItems: "baseline",
          gap: 8, marginTop: 20,
          backgroundColor: brand, borderRadius: 12, padding: "10px 24px",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                fontFamily: "Inter", fontSize: 12, fontWeight: 600,
                color: "rgba(255,255,255,0.8)", textTransform: "uppercase" as const, letterSpacing: 2,
              },
              children: "From",
            },
          },
          {
            type: "div",
            props: {
              style: { fontFamily: "Poppins", fontSize: 36, fontWeight: 700, color: "white" },
              children: data.price,
            },
          },
        ],
      },
    });
  }

  children.push({
    type: "div",
    props: {
      style: {
        position: "absolute", top: textTop, left: 48, right: 48, bottom: 80,
        display: "flex", flexDirection: "column" as const, justifyContent: "flex-start",
      },
      children: textChildren,
    },
  });

  // Footer
  const footerParts: string[] = [];
  if (data.contactNumber) footerParts.push(data.contactNumber);
  if (data.email) footerParts.push(data.email);
  if (data.website) footerParts.push(data.website);

  if (footerParts.length > 0) {
    children.push({
      type: "div",
      props: {
        style: {
          position: "absolute", bottom: 0, left: 0, right: 0,
          display: "flex", flexDirection: "row" as const,
          alignItems: "center", justifyContent: "center",
          gap: 20, padding: "14px 32px",
          backgroundColor: brand,
        },
        children: footerParts.map((part) => ({
          type: "div",
          props: {
            style: { fontFamily: "Inter", fontSize: 14, fontWeight: 500, color: "white" },
            children: part,
          },
        })),
      },
    });
  }

  return {
    type: "div",
    props: {
      style: { display: "flex", width: w, height: h, position: "relative" },
      children,
    },
  };
}

function buildCircleAccentText(
  data: TemplateDataForRender,
  w: number,
  h: number,
  brand: string
): SatoriNode {
  const textTop = Math.round(h * 0.72);
  const children: SatoriNode[] = [];

  // Company on photo
  if (data.companyName) {
    children.push({
      type: "div",
      props: {
        style: {
          position: "absolute", top: 32, left: 40,
          fontFamily: "Montserrat", fontSize: 18, fontWeight: 800,
          color: "white", letterSpacing: 2, textTransform: "uppercase" as const,
          textShadow: "0 2px 12px rgba(0,0,0,0.5)",
        },
        children: data.companyName,
      },
    });
  }

  // Text below circles
  const textChildren: SatoriNode[] = [];
  if (data.destination) {
    textChildren.push({
      type: "div",
      props: {
        style: {
          fontFamily: "Poppins", fontSize: Math.min(48, Math.floor(w / 18)),
          fontWeight: 700, color: "#1a1a2e", textAlign: "center" as const,
        },
        children: data.destination,
      },
    });
  }
  if (data.offer) {
    textChildren.push({
      type: "div",
      props: {
        style: {
          fontFamily: "Inter", fontSize: 20, fontWeight: 600, color: brand,
          textAlign: "center" as const, marginTop: 8,
        },
        children: data.offer,
      },
    });
  }
  if (data.price) {
    textChildren.push({
      type: "div",
      props: {
        style: {
          display: "flex", alignItems: "center", justifyContent: "center",
          marginTop: 16, gap: 8,
        },
        children: [{
          type: "div",
          props: {
            style: {
              fontFamily: "Poppins", fontSize: 40, fontWeight: 700, color: brand,
            },
            children: data.price,
          },
        }],
      },
    });
  }

  children.push({
    type: "div",
    props: {
      style: {
        position: "absolute", top: textTop, left: 32, right: 32, bottom: 60,
        display: "flex", flexDirection: "column" as const, alignItems: "center",
      },
      children: textChildren,
    },
  });

  // Footer
  children.push(buildGenericFooter(data, w, brand));

  return {
    type: "div",
    props: { style: { display: "flex", width: w, height: h, position: "relative" }, children },
  };
}

function buildFloatingCardText(
  data: TemplateDataForRender,
  w: number,
  h: number,
  brand: string
): SatoriNode {
  const cardW = Math.round(w * 0.85);
  const cardH = Math.round(h * 0.42);
  const cardX = Math.round((w - cardW) / 2);
  const cardY = Math.round(h * 0.52);

  const children: SatoriNode[] = [];

  // Vignette overlay
  children.push({
    type: "div",
    props: {
      style: {
        position: "absolute", top: 0, left: 0, width: w, height: h,
        backgroundImage: "radial-gradient(ellipse 80% 70% at 50% 40%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 100%)",
        display: "flex",
      },
      children: null,
    },
  });

  // Company name
  if (data.companyName) {
    children.push({
      type: "div",
      props: {
        style: {
          position: "absolute", top: 40, left: 48,
          fontFamily: "Playfair Display", fontSize: 28, fontWeight: 700,
          color: "white", textShadow: "0 2px 12px rgba(0,0,0,0.5)",
        },
        children: data.companyName,
      },
    });
  }

  // Floating card
  const cardChildren: SatoriNode[] = [];
  if (data.season) {
    cardChildren.push({
      type: "div",
      props: {
        style: {
          fontFamily: "Inter", fontSize: 12, fontWeight: 600,
          color: brand, textTransform: "uppercase" as const, letterSpacing: 3,
        },
        children: data.season,
      },
    });
  }
  if (data.destination) {
    cardChildren.push({
      type: "div",
      props: {
        style: {
          fontFamily: "Playfair Display", fontSize: Math.min(56, Math.floor(w / 14)),
          fontWeight: 900, color: "#1a1a2e", lineHeight: 1.05, marginTop: 8,
        },
        children: data.destination,
      },
    });
  }
  if (data.offer) {
    cardChildren.push({
      type: "div",
      props: {
        style: {
          fontFamily: "Inter", fontSize: 18, fontWeight: 600, color: "#4b5563", marginTop: 12,
        },
        children: data.offer,
      },
    });
  }
  if (data.price) {
    cardChildren.push({
      type: "div",
      props: {
        style: {
          display: "flex", alignItems: "baseline", gap: 8, marginTop: 16,
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                fontFamily: "Inter", fontSize: 12, fontWeight: 500,
                color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: 2,
              },
              children: "Starting from",
            },
          },
          {
            type: "div",
            props: {
              style: { fontFamily: "Poppins", fontSize: 40, fontWeight: 700, color: brand },
              children: data.price,
            },
          },
        ],
      },
    });
  }

  // Services
  const items = data.services ?? data.bulletPoints;
  if (items && items.length > 0) {
    cardChildren.push({
      type: "div",
      props: {
        style: { display: "flex", flexWrap: "wrap" as const, gap: 6, marginTop: 14 },
        children: items.slice(0, 5).map((item: string) => ({
          type: "div",
          props: {
            style: {
              fontFamily: "Inter", fontSize: 12, fontWeight: 500,
              color: "#6b7280", backgroundColor: "#f3f4f6",
              padding: "4px 12px", borderRadius: 12,
            },
            children: item,
          },
        })),
      },
    });
  }

  children.push({
    type: "div",
    props: {
      style: {
        position: "absolute", top: cardY, left: cardX,
        width: cardW, height: cardH,
        backgroundColor: "rgba(255,255,255,0.95)",
        borderRadius: 20,
        padding: "32px 36px",
        display: "flex", flexDirection: "column" as const,
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      },
      children: cardChildren,
    },
  });

  return {
    type: "div",
    props: { style: { display: "flex", width: w, height: h, position: "relative" }, children },
  };
}

function buildPremiumCollageText(data: TemplateDataForRender, w: number, h: number): SatoriNode {
  const textY = Math.round(h * 0.56);
  const children: SatoriNode[] = [];
  const textChildren: SatoriNode[] = [];

  if (data.destination) {
    textChildren.push({
      type: "div",
      props: {
        style: {
          fontFamily: "Montserrat", fontSize: Math.min(64, Math.floor(w / 14)),
          fontWeight: 800, color: "white", lineHeight: 1.05,
          textShadow: "0 2px 12px rgba(0,0,0,0.3)",
        },
        children: data.destination,
      },
    });
  }
  textChildren.push({
    type: "div",
    props: {
      style: { width: 50, height: 3, backgroundColor: "rgba(255,255,255,0.6)", marginTop: 12, marginBottom: 12, borderRadius: 2 },
      children: null,
    },
  });
  if (data.offer) {
    textChildren.push({
      type: "div",
      props: {
        style: { fontFamily: "Poppins", fontSize: 22, fontWeight: 600, color: "rgba(255,255,255,0.9)" },
        children: data.offer,
      },
    });
  }
  if (data.price) {
    textChildren.push({
      type: "div",
      props: {
        style: {
          display: "flex", alignItems: "baseline", gap: 8, marginTop: 16,
          backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12,
          padding: "10px 24px", border: "1px solid rgba(255,255,255,0.3)",
        },
        children: [
          {
            type: "div",
            props: {
              style: { fontFamily: "Inter", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", letterSpacing: 2, textTransform: "uppercase" as const },
              children: "From",
            },
          },
          {
            type: "div",
            props: {
              style: { fontFamily: "Poppins", fontSize: 36, fontWeight: 700, color: "white" },
              children: data.price,
            },
          },
        ],
      },
    });
  }

  children.push({
    type: "div",
    props: {
      style: {
        position: "absolute", top: textY, left: Math.round(w * 0.04), right: Math.round(w * 0.04), bottom: 60,
        display: "flex", flexDirection: "column" as const,
      },
      children: textChildren,
    },
  });

  children.push(buildGenericFooter(data, w, "#1a2d5a"));

  return {
    type: "div",
    props: { style: { display: "flex", width: w, height: h, position: "relative" }, children },
  };
}

function buildBannerRibbonText(data: TemplateDataForRender, w: number, h: number): SatoriNode {
  const stripH = Math.round(h * 0.28);
  const midY = stripH;
  const midH = h - stripH * 2;
  const children: SatoriNode[] = [];

  const textChildren: SatoriNode[] = [];
  if (data.destination) {
    textChildren.push({
      type: "div",
      props: {
        style: {
          fontFamily: "Playfair Display", fontSize: Math.min(72, Math.floor(w / 12)),
          fontWeight: 900, color: "white", textAlign: "center" as const, lineHeight: 1.05,
        },
        children: data.destination,
      },
    });
  }
  if (data.offer) {
    textChildren.push({
      type: "div",
      props: {
        style: {
          fontFamily: "Poppins", fontSize: 24, fontWeight: 600, color: "rgba(255,255,255,0.9)",
          textAlign: "center" as const, marginTop: 12,
        },
        children: data.offer,
      },
    });
  }
  if (data.price) {
    textChildren.push({
      type: "div",
      props: {
        style: {
          fontFamily: "Poppins", fontSize: 44, fontWeight: 700, color: "white",
          textAlign: "center" as const, marginTop: 16,
        },
        children: data.price,
      },
    });
  }

  children.push({
    type: "div",
    props: {
      style: {
        position: "absolute", top: midY, left: 48, right: 48, height: midH,
        display: "flex", flexDirection: "column" as const,
        alignItems: "center", justifyContent: "center",
      },
      children: textChildren,
    },
  });

  children.push(buildGenericFooter(data, w, "#1a2d5a"));

  return {
    type: "div",
    props: { style: { display: "flex", width: w, height: h, position: "relative" }, children },
  };
}

function buildSplitWaveText(data: TemplateDataForRender, w: number, h: number): SatoriNode {
  const textX = Math.round(w * 0.48);
  const children: SatoriNode[] = [];

  const textChildren: SatoriNode[] = [];
  if (data.companyName) {
    textChildren.push({
      type: "div",
      props: {
        style: {
          fontFamily: "Inter", fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.8)",
          letterSpacing: 3, textTransform: "uppercase" as const,
        },
        children: data.companyName,
      },
    });
  }
  if (data.destination) {
    textChildren.push({
      type: "div",
      props: {
        style: {
          fontFamily: "Poppins", fontSize: Math.min(52, Math.floor(w / 16)),
          fontWeight: 700, color: "white", lineHeight: 1.1, marginTop: 12,
        },
        children: data.destination,
      },
    });
  }
  textChildren.push({
    type: "div",
    props: {
      style: { width: 40, height: 3, backgroundColor: "rgba(255,255,255,0.5)", marginTop: 14, marginBottom: 14, borderRadius: 2 },
      children: null,
    },
  });
  if (data.offer) {
    textChildren.push({
      type: "div",
      props: {
        style: { fontFamily: "Inter", fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,0.9)" },
        children: data.offer,
      },
    });
  }
  if (data.price) {
    textChildren.push({
      type: "div",
      props: {
        style: {
          fontFamily: "Poppins", fontSize: 44, fontWeight: 700, color: "white", marginTop: 20,
        },
        children: data.price,
      },
    });
  }

  const items = data.services ?? data.bulletPoints;
  if (items && items.length > 0) {
    textChildren.push({
      type: "div",
      props: {
        style: { display: "flex", flexDirection: "column" as const, gap: 6, marginTop: 20 },
        children: items.slice(0, 4).map((item: string) => ({
          type: "div",
          props: {
            style: {
              fontFamily: "Inter", fontSize: 14, fontWeight: 500,
              color: "rgba(255,255,255,0.85)",
              display: "flex", alignItems: "center", gap: 8,
            },
            children: `\u2713 ${item}`,
          },
        })),
      },
    });
  }

  children.push({
    type: "div",
    props: {
      style: {
        position: "absolute", top: 48, left: textX, right: 36, bottom: 80,
        display: "flex", flexDirection: "column" as const, justifyContent: "center",
      },
      children: textChildren,
    },
  });

  children.push(buildGenericFooter(data, w, "rgba(0,0,0,0.4)"));

  return {
    type: "div",
    props: { style: { display: "flex", width: w, height: h, position: "relative" }, children },
  };
}

function buildGenericFooter(data: TemplateDataForRender, width: number, bgColor: string): SatoriNode {
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
// Background preparation (enhanced with smart crop + enhancement)
// ---------------------------------------------------------------------------

async function prepareBackground(
  url: string,
  width: number,
  height: number
): Promise<Buffer> {
  let buffer: Buffer;
  if (url.startsWith("data:")) {
    const base64Data = url.split(",")[1];
    if (!base64Data) throw new Error("Invalid data URL");
    buffer = Buffer.from(base64Data, "base64");
  } else {
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`Failed to fetch background: ${response.status}`);
    buffer = Buffer.from(await response.arrayBuffer());
  }

  return sharp(buffer)
    .resize(width, height, { fit: "cover", position: "attention" })
    .modulate({ saturation: 1.12, brightness: 0.97 })
    .sharpen({ sigma: 0.6 })
    .toBuffer();
}

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
  let jsx: SatoriNode;

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
    jsx = buildPosterJsx(input.templateData, layoutConfig, dims, input.brandColor);
  }

  // Satori renders JSX to SVG
  const svg = await satori(jsx as Parameters<typeof satori>[0], {
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
