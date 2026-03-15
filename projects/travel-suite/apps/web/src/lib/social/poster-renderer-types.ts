// ---------------------------------------------------------------------------
// Shared types for poster renderer modules
// ---------------------------------------------------------------------------

export type SatoriNode =
  | Record<string, unknown>
  | string
  | number
  | boolean
  | null
  | SatoriNode[];

export interface LayoutConfig {
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

export interface ImageSlot {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Dimensions {
  width: number;
  height: number;
}
