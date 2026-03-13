// ---------------------------------------------------------------------------
// Premium layout builders: PremiumCollage, BannerRibbon, SplitWave
// ---------------------------------------------------------------------------

import type { TemplateDataForRender } from "./types";
import type { SatoriNode } from "./poster-renderer-types";
import { buildGenericFooter } from "./poster-generic-footer";

// ---------------------------------------------------------------------------
// PremiumCollageLayout
// ---------------------------------------------------------------------------

export function buildPremiumCollageText(data: TemplateDataForRender, w: number, h: number): SatoriNode {
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

// ---------------------------------------------------------------------------
// BannerRibbonLayout
// ---------------------------------------------------------------------------

export function buildBannerRibbonText(data: TemplateDataForRender, w: number, h: number): SatoriNode {
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

// ---------------------------------------------------------------------------
// SplitWaveLayout
// ---------------------------------------------------------------------------

export function buildSplitWaveText(data: TemplateDataForRender, w: number, h: number): SatoriNode {
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
