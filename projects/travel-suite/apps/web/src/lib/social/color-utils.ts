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
