// ---------------------------------------------------------------------------
// Premium layout builders: WaveDivider, CircleAccent, FloatingCard
// ---------------------------------------------------------------------------

import type { TemplateDataForRender } from "./types";
import type { SatoriNode } from "./poster-renderer-types";
import { buildGenericFooter } from "./poster-premium-blocks";

// ---------------------------------------------------------------------------
// WaveDividerLayout
// ---------------------------------------------------------------------------

export function buildWaveDividerText(
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

// ---------------------------------------------------------------------------
// CircleAccentLayout
// ---------------------------------------------------------------------------

export function buildCircleAccentText(
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

// ---------------------------------------------------------------------------
// FloatingCardLayout
// ---------------------------------------------------------------------------

export function buildFloatingCardText(
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
