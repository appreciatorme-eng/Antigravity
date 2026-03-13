// ---------------------------------------------------------------------------
// Generic footer utility -- extracted to break the circular dependency between
// poster-premium-blocks.ts and poster-premium-layouts-a/b.ts
// ---------------------------------------------------------------------------

import type { TemplateDataForRender } from "./types";
import type { SatoriNode } from "./poster-renderer-types";

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
