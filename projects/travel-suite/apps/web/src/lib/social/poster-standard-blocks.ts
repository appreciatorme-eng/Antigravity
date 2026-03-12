// ---------------------------------------------------------------------------
// Standard text block builders (white text on dark photo backgrounds)
// ---------------------------------------------------------------------------

import type { TemplateDataForRender } from "./types";
import type { LayoutConfig, SatoriNode, Dimensions } from "./poster-renderer-types";

// ---------------------------------------------------------------------------
// Gradient overlay builder (bottom-fade, diagonal, full-dark, vignette, brand-tint)
// ---------------------------------------------------------------------------

export function buildGradientOverlay(
  type: LayoutConfig["overlayGradient"],
  width: number,
  height: number
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
// Header block (company name + season pill)
// ---------------------------------------------------------------------------

export function buildHeaderBlock(data: TemplateDataForRender, config: LayoutConfig): SatoriNode {
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

// ---------------------------------------------------------------------------
// Hero block (destination, offer, review text, bullet points)
// ---------------------------------------------------------------------------

export function buildHeroBlock(
  data: TemplateDataForRender,
  config: LayoutConfig,
  dims: Dimensions
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

// ---------------------------------------------------------------------------
// Price block
// ---------------------------------------------------------------------------

export function buildPriceBlock(data: TemplateDataForRender, config: LayoutConfig): SatoriNode {
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

// ---------------------------------------------------------------------------
// Footer block
// ---------------------------------------------------------------------------

export function buildFooterBlock(data: TemplateDataForRender, config: LayoutConfig, width: number): SatoriNode {
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

export function buildPosterJsx(
  data: TemplateDataForRender,
  config: LayoutConfig,
  dims: Dimensions
): SatoriNode {
  const children: SatoriNode[] = [];

  const gradient = buildGradientOverlay(config.overlayGradient, dims.width, dims.height);
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
