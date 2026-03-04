import satori from "satori";
import sharp from "sharp";
import { loadPosterFonts } from "./fonts";
import type {
  LayoutType,
  AspectRatio,
  TemplateDataForRender,
  PosterRenderInput,
  PosterRenderOutput,
} from "./types";
// Satori accepts plain { type, props } objects — use a permissive alias.
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
  overlayGradient: "bottom-fade" | "diagonal" | "full-dark" | "none";
  heroFontFamily: "Inter" | "Cormorant Garamond";
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
    heroFontFamily: "Cormorant Garamond",
    heroFontSize: 96,
  },
  DiagonalSplitLayout: {
    headerPosition: "top-left",
    heroPosition: "center",
    pricePosition: "bottom-right",
    footerStyle: "navy-bar",
    overlayGradient: "diagonal",
    heroFontFamily: "Inter",
    heroFontSize: 72,
  },
  MagazineCoverLayout: {
    headerPosition: "top-left",
    heroPosition: "center",
    pricePosition: "bottom-left",
    footerStyle: "inline",
    overlayGradient: "bottom-fade",
    heroFontFamily: "Cormorant Garamond",
    heroFontSize: 88,
  },
  DuotoneLayout: {
    headerPosition: "top-left",
    heroPosition: "center",
    pricePosition: "bottom-left",
    footerStyle: "inline",
    overlayGradient: "full-dark",
    heroFontFamily: "Inter",
    heroFontSize: 80,
  },
  BoldTypographyLayout: {
    headerPosition: "top-center",
    heroPosition: "center-large",
    pricePosition: "center-below",
    footerStyle: "navy-bar",
    overlayGradient: "bottom-fade",
    heroFontFamily: "Inter",
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
    heroFontFamily: "Inter",
    heroFontSize: 72,
  },
  TriPanelLayout: {
    headerPosition: "none",
    heroPosition: "center",
    pricePosition: "bottom-left",
    footerStyle: "bottom-bar",
    overlayGradient: "none",
    heroFontFamily: "Inter",
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
    heroFontFamily: "Inter",
    heroFontSize: 60,
  },
};

// ---------------------------------------------------------------------------
// Multi-image slot positions per layout
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
      {
        x: leftW + gap,
        y: (rightH + gap) * 2,
        width: rightW,
        height: imgH - (rightH + gap) * 2,
      },
    ];
  },
  TriPanelLayout: (d) => {
    const gap = 2;
    const panelH = Math.round(d.height * 0.65);
    const panelW = Math.round((d.width - gap * 2) / 3);
    return [
      { x: 0, y: 0, width: panelW, height: panelH },
      { x: panelW + gap, y: 0, width: panelW, height: panelH },
      {
        x: (panelW + gap) * 2,
        y: 0,
        width: d.width - (panelW + gap) * 2,
        height: panelH,
      },
    ];
  },
  PolaroidScatterLayout: (d) => {
    const imgW = Math.round(d.width * 0.36);
    const imgH = Math.round(imgW * 0.75);
    return [
      {
        x: Math.round(d.width * 0.06),
        y: Math.round(d.height * 0.06),
        width: imgW,
        height: imgH,
      },
      {
        x: Math.round(d.width * 0.5),
        y: Math.round(d.height * 0.12),
        width: imgW,
        height: imgH,
      },
      {
        x: Math.round(d.width * 0.28),
        y: Math.round(d.height * 0.35),
        width: imgW,
        height: imgH,
      },
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
      {
        x: (stripW + gap) * 2,
        y: heroH + gap,
        width: stripW,
        height: stripH,
      },
      {
        x: (stripW + gap) * 3,
        y: heroH + gap,
        width: d.width - (stripW + gap) * 3,
        height: stripH,
      },
    ];
  },
};

// ---------------------------------------------------------------------------
// Multi-image canvas builder
// ---------------------------------------------------------------------------

async function prepareMultiImageCanvas(
  images: string[],
  slots: ImageSlot[],
  dims: { width: number; height: number },
  bgColor?: { r: number; g: number; b: number; alpha: number }
): Promise<Buffer> {
  const background = bgColor || { r: 15, g: 23, b: 42, alpha: 1 };
  const baseBuffer = await sharp({
    create: {
      width: dims.width,
      height: dims.height,
      channels: 4,
      background,
    },
  })
    .png()
    .toBuffer();

  const composites = await Promise.all(
    slots.map(async (slot, i) => {
      const url = images[i] || images[0];
      if (!url) return null;
      try {
        const buffer = await prepareBackground(
          url,
          Math.round(slot.width),
          Math.round(slot.height)
        );
        return {
          input: buffer,
          top: Math.round(slot.y),
          left: Math.round(slot.x),
        };
      } catch {
        return null;
      }
    })
  );

  const validComposites = composites.filter(
    Boolean
  ) as { input: Buffer; top: number; left: number }[];
  if (validComposites.length === 0) return baseBuffer;

  return sharp(baseBuffer).composite(validComposites).png().toBuffer();
}

// ---------------------------------------------------------------------------
// Gradient overlay builder
// ---------------------------------------------------------------------------

function buildGradientOverlay(
  type: LayoutConfig["overlayGradient"],
  width: number,
  height: number
): SatoriNode {
  if (type === "none") return null;

  const gradientMap: Record<string, string> = {
    "bottom-fade":
      "linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.7) 100%)",
    diagonal:
      "linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%)",
    "full-dark":
      "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.55) 100%)",
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
        backgroundImage: gradientMap[type],
        display: "flex",
      },
      children: null,
    },
  };
}

// ---------------------------------------------------------------------------
// Header block
// ---------------------------------------------------------------------------

function buildHeaderBlock(
  data: TemplateDataForRender,
  config: LayoutConfig
): SatoriNode {
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
          letterSpacing: 1,
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

// ---------------------------------------------------------------------------
// Hero block (destination + offer)
// ---------------------------------------------------------------------------

function buildHeroBlock(
  data: TemplateDataForRender,
  config: LayoutConfig,
  dims: { width: number; height: number }
): SatoriNode {
  const isLarge = config.heroPosition === "center-large";
  const fontSize = isLarge
    ? Math.min(config.heroFontSize, Math.floor(dims.width / 8))
    : Math.min(config.heroFontSize, Math.floor(dims.width / 10));

  const alignItems =
    config.heroPosition === "bottom-left" ? "flex-start" : "center";
  const textAlign =
    config.heroPosition === "bottom-left" ? "left" : ("center" as const);
  const justifyContent =
    config.heroPosition === "bottom-left" ? "flex-end" : "center";

  const children: SatoriNode[] = [];

  // Destination heading
  if (data.destination) {
    children.push({
      type: "div",
      props: {
        style: {
          fontFamily: config.heroFontFamily,
          fontSize,
          fontWeight: 700,
          color: "white",
          textAlign,
          lineHeight: 1.1,
          maxWidth: "90%",
          textShadow: "0 2px 12px rgba(0,0,0,0.4)",
        },
        children: data.destination,
      },
    });
  }

  // Offer subtitle
  if (data.offer) {
    children.push({
      type: "div",
      props: {
        style: {
          fontFamily: "Inter",
          fontSize: 30,
          fontWeight: 600,
          color: "rgba(255,255,255,0.92)",
          textAlign,
          marginTop: 16,
          maxWidth: "80%",
        },
        children: data.offer,
      },
    });
  }

  // Review text (for ReviewLayout)
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
        children: `"${data.reviewText}"`,
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
          children: `-- ${data.reviewerName}${data.reviewerTrip ? `, ${data.reviewerTrip}` : ""}`,
        },
      });
    }
  }

  // Bullet points / services
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

// ---------------------------------------------------------------------------
// Price block
// ---------------------------------------------------------------------------

function buildPriceBlock(
  data: TemplateDataForRender,
  config: LayoutConfig
): SatoriNode {
  if (!data.price) return null;

  const positionStyles: Record<string, Record<string, unknown>> = {
    "center-below": {
      alignItems: "center",
      justifyContent: "center",
      padding: "0 48px 20px",
    },
    "bottom-right": {
      alignItems: "flex-end",
      justifyContent: "flex-end",
      padding: "0 48px 20px",
    },
    "bottom-sheet": {
      alignItems: "center",
      justifyContent: "flex-end",
      padding: "0 48px 20px",
    },
    "bottom-left": {
      alignItems: "flex-start",
      justifyContent: "flex-end",
      padding: "0 48px 20px",
    },
  };

  const pos = positionStyles[config.pricePosition] ?? positionStyles["center-below"];

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column" as const,
        width: "100%",
        ...pos,
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "row" as const,
              alignItems: "baseline",
              gap: 12,
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    fontFamily: "Inter",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.7)",
                    textTransform: "uppercase" as const,
                    letterSpacing: 2,
                  },
                  children: "Starting from",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    fontFamily: "Inter",
                    fontSize: 56,
                    fontWeight: 700,
                    color: "white",
                    textShadow: "0 2px 8px rgba(0,0,0,0.3)",
                  },
                  children: data.price,
                },
              },
            ],
          },
        },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Footer block
// ---------------------------------------------------------------------------

function buildFooterBlock(
  data: TemplateDataForRender,
  config: LayoutConfig,
  width: number
): SatoriNode {
  const contactParts: string[] = [];
  if (data.contactNumber) contactParts.push(data.contactNumber);
  if (data.email) contactParts.push(data.email);
  if (data.website) contactParts.push(data.website);

  if (contactParts.length === 0) return null;

  const isNavy =
    config.footerStyle === "navy-bar" || config.footerStyle === "bottom-bar";
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
          style: {
            fontFamily: "Inter",
            fontSize: 15,
            fontWeight: 400,
            color: "rgba(255,255,255,0.9)",
          },
          children: part,
        },
      })),
    },
  };
}

// ---------------------------------------------------------------------------
// Full JSX builder
// ---------------------------------------------------------------------------

function buildPosterJsx(
  data: TemplateDataForRender,
  config: LayoutConfig,
  dims: { width: number; height: number }
): SatoriNode {
  const children: SatoriNode[] = [];

  // Gradient overlay
  const gradient = buildGradientOverlay(
    config.overlayGradient,
    dims.width,
    dims.height
  );
  if (gradient) children.push(gradient);

  // Header
  const header = buildHeaderBlock(data, config);
  if (header) children.push(header);

  // Hero
  children.push(buildHeroBlock(data, config, dims));

  // Price
  const price = buildPriceBlock(data, config);
  if (price) children.push(price);

  // Footer
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
// Background preparation
// ---------------------------------------------------------------------------

async function prepareBackground(
  url: string,
  width: number,
  height: number
): Promise<Buffer> {
  if (url.startsWith("data:")) {
    const base64Data = url.split(",")[1];
    if (!base64Data) throw new Error("Invalid data URL");
    const buffer = Buffer.from(base64Data, "base64");
    return sharp(buffer)
      .resize(width, height, { fit: "cover" })
      .toBuffer();
  }

  const response = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch background: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return sharp(Buffer.from(arrayBuffer))
    .resize(width, height, { fit: "cover" })
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

  // 1. Prepare background (multi-image canvas or single image)
  let bgBuffer: Buffer;

  const slotsFn = MULTI_IMAGE_SLOTS[input.layoutType];
  if (slotsFn && input.templateData.galleryImages?.length) {
    const slots = slotsFn(dims);
    bgBuffer = await prepareMultiImageCanvas(
      input.templateData.galleryImages,
      slots,
      dims
    );
  } else if (input.backgroundUrl) {
    bgBuffer = await prepareBackground(
      input.backgroundUrl,
      dims.width,
      dims.height
    );
  } else {
    // Solid navy fallback
    bgBuffer = await sharp({
      create: {
        width: dims.width,
        height: dims.height,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 },
      },
    })
      .png()
      .toBuffer();
  }

  // 2. Build Satori JSX from layout config
  const layoutConfig =
    LAYOUT_CONFIGS[input.layoutType] ?? LAYOUT_CONFIGS.CenterLayout;
  const jsx = buildPosterJsx(input.templateData, layoutConfig, dims);

  // 3. Satori renders JSX to SVG string
  const svg = await satori(jsx as Parameters<typeof satori>[0], {
    width: dims.width,
    height: dims.height,
    fonts,
  });

  // 4. Sharp composites background + SVG overlay
  const svgBuffer = Buffer.from(svg);
  const result = await sharp(bgBuffer)
    .resize(dims.width, dims.height, { fit: "cover" })
    .composite([{ input: svgBuffer, top: 0, left: 0 }])
    .toFormat(
      input.format === "jpeg"
        ? "jpeg"
        : input.format === "webp"
          ? "webp"
          : "png",
      { quality: input.quality ?? 95 }
    )
    .toBuffer();

  const contentType =
    input.format === "jpeg"
      ? "image/jpeg"
      : input.format === "webp"
        ? "image/webp"
        : "image/png";

  return {
    buffer: result,
    contentType,
    width: dims.width,
    height: dims.height,
  };
}
