import { colord, extend } from 'colord';
import mixPlugin from 'colord/plugins/mix';

extend([mixPlugin]);

export interface BrandPalette {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  analogous1: string;
  analogous2: string;
  textOnPrimary: string;
  backgroundLight: string;
  gradientBackground: string;
}

/** Generate CSS gradient strings for poster overlay effects from a brand color. */
export function generateOverlayGradients(primaryHex: string) {
  const base = colord(primaryHex);
  return {
    bottomFade: `linear-gradient(180deg, transparent 0%, ${base.darken(0.4).alpha(0.9).toRgbString()} 100%)`,
    diagonalBrand: `linear-gradient(135deg, ${base.alpha(0.85).toRgbString()} 0%, ${base.rotate(30).alpha(0.7).toRgbString()} 100%)`,
    duotone: `linear-gradient(${base.alpha(0.6).toRgbString()}, ${base.rotate(180).alpha(0.6).toRgbString()})`,
    radialVignette: `radial-gradient(ellipse at center, transparent 40%, ${base.darken(0.5).alpha(0.8).toRgbString()} 100%)`,
    tintOverlay: `linear-gradient(180deg, ${base.alpha(0.15).toRgbString()} 0%, ${base.alpha(0.05).toRgbString()} 100%)`,
  };
}

export function generateBrandPalette(primaryHex: string, isDark: boolean = false): BrandPalette {
  const base = colord(primaryHex);
  
  // Decide if we need white or black text on the primary color
  const textOnPrimary = base.isLight() ? '#000000' : '#ffffff';

  if (isDark) {
    return {
      primary: base.toHex(),
      primaryLight: base.lighten(0.15).toHex(),
      primaryDark: base.darken(0.15).toHex(),
      secondary: base.rotate(180).toHex(),
      analogous1: base.rotate(30).toHex(),
      analogous2: base.rotate(-30).toHex(),
      textOnPrimary,
      backgroundLight: '#1f2937', // gray-800
      gradientBackground: `linear-gradient(135deg, ${base.darken(0.3).toHex()} 0%, #111827 100%)`, // gray-900
    };
  }

  return {
    primary: base.toHex(),
    primaryLight: base.lighten(0.15).toHex(),
    primaryDark: base.darken(0.15).toHex(),
    // Complementary color
    secondary: base.rotate(180).toHex(),
    // Analogous colors
    analogous1: base.rotate(30).toHex(),
    analogous2: base.rotate(-30).toHex(),
    textOnPrimary,
    backgroundLight: base.lighten(0.4).toHex(), // Very faint version for bg
    gradientBackground: `linear-gradient(135deg, ${base.lighten(0.4).toHex()} 0%, #ffffff 100%)`,
  };
}
