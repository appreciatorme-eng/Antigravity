/**
 * GoBuddy Adventures Design System
 *
 * Unified design tokens matching the mobile app (Flutter)
 * Primary: #00d084 (Vivid Green)
 * Secondary: #124ea2 (Royal Blue)
 *
 * Features:
 * - Glassmorphism (soft glass premium aesthetic)
 * - Gradient backgrounds
 * - Poppins + Cormorant Garamond typography
 * - Consistent spacing, shadows, and radii
 */

export const DesignSystem = {
  // Brand Colors (matching mobile app_theme.dart)
  colors: {
    // Primary palette
    primary: '#00D084',           // Vivid Green
    primaryHover: '#00B874',      // Darker green for hover states
    primaryLight: '#33DDA0',      // Lighter green for backgrounds

    // Secondary palette
    secondary: '#124EA2',         // Royal Blue
    secondaryHover: '#0F3E85',    // Darker blue for hover
    secondaryLight: '#1E5FBD',    // Lighter blue

    // Neutrals
    background: '#F5F5F5',        // Soft Glass background
    surface: '#FFFFFF',           // Card surface
    textPrimary: '#124EA2',       // Royal Blue (matches secondary)
    textSecondary: '#6B7280',     // Gray-500

    // Feedback colors
    error: '#EF4444',             // Red-500
    success: '#22C55E',           // Green-500
    warning: '#F59E0B',           // Amber-500
    info: '#3B82F6',              // Blue-500

    // Glass surfaces (with opacity)
    glassSurface: 'rgba(255, 255, 255, 0.65)',      // ~65% white
    glassNavSurface: 'rgba(255, 255, 255, 0.85)',   // ~85% white
    glassBorder: 'rgba(255, 255, 255, 0.6)',        // ~60% white

    // Dark mode variants
    dark: {
      background: '#0A2F2A',      // Dark teal
      surface: '#0F3A33',         // Slightly lighter teal
      glassSurface: 'rgba(255, 255, 255, 0.2)',     // ~20% white
      glassNavSurface: 'rgba(255, 255, 255, 0.25)', // ~25% white
      textPrimary: '#FFFFFF',     // White
      textSecondary: '#B0B0B0',   // Light gray
    },
  },

  // Gradients (matching mobile gradients)
  gradients: {
    primary: 'linear-gradient(135deg, #00D084 0%, #00B874 100%)',
    background: 'linear-gradient(135deg, #E0F7FA 0%, #F5F5F5 50%, #E3F2FD 100%)',
    darkBackground: 'linear-gradient(135deg, #0A2F2A 0%, #0D3530 50%, #0A2F2A 100%)',
    card: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
  },

  // Typography (Poppins + Cormorant Garamond)
  typography: {
    fontFamilies: {
      sans: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      serif: '"Cormorant Garamond", Georgia, serif',
    },

    // Font sizes (matching mobile theme)
    fontSizes: {
      displayLarge: '2.5rem',     // 40px - Cormorant
      displayMedium: '2rem',      // 32px - Cormorant
      headlineLarge: '1.5rem',    // 24px - Poppins
      headlineMedium: '1.25rem',  // 20px - Poppins
      titleLarge: '1.125rem',     // 18px - Poppins
      titleMedium: '1rem',        // 16px - Poppins
      bodyLarge: '1rem',          // 16px - Poppins
      bodyMedium: '0.875rem',     // 14px - Poppins
      labelLarge: '0.875rem',     // 14px - Poppins
      labelSmall: '0.6875rem',    // 11px - Poppins
    },

    // Font weights
    fontWeights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },

    // Line heights
    lineHeights: {
      tight: 1.1,
      normal: 1.5,
      relaxed: 1.75,
    },

    // Letter spacing
    letterSpacing: {
      tight: '-0.01em',
      normal: '0',
      wide: '0.05em',
      wider: '0.075em',
    },
  },

  // Spacing scale (8px base)
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
  },

  // Border radius (matching mobile rounded values)
  radii: {
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    lg: '0.875rem',   // 14px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    full: '624.9375rem', // 9999px (pill shape)
  },

  // Shadows (glass morphism style)
  shadows: {
    sm: '0 2px 8px rgba(31, 38, 135, 0.07)',
    md: '0 8px 32px rgba(31, 38, 135, 0.07)',
    lg: '0 10px 40px rgba(0, 0, 0, 0.05)',
    xl: '0 12px 48px rgba(0, 0, 0, 0.08)',
    glass: '0 8px 32px rgba(31, 38, 135, 0.07)',
    button: '0 8px 14px rgba(0, 208, 132, 0.3)', // Primary green shadow
    card: '0 10px 20px rgba(0, 0, 0, 0.05)',
  },

  // Z-index scale
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },

  // Transitions
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slowest: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Breakpoints (mobile-first)
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Component-specific styles
  components: {
    // Glass card (matching GlassCard widget)
    glassCard: {
      backdropFilter: 'blur(16px)',
      background: 'rgba(255, 255, 255, 0.65)',
      border: '1px solid rgba(255, 255, 255, 0.6)',
      borderRadius: '1.5rem', // 24px
      boxShadow: '0 8px 32px rgba(31, 38, 135, 0.07)',
    },

    // Glass navigation bar (matching GlassFloatingNavBar)
    glassNavBar: {
      backdropFilter: 'blur(20px)',
      background: 'rgba(255, 255, 255, 0.85)',
      border: '1px solid rgba(255, 255, 255, 0.6)',
      borderRadius: '624.9375rem', // pill shape
      height: '3.5rem', // 56px
      boxShadow: '0 10px 18px rgba(0, 0, 0, 0.07)',
    },

    // Button (matching ElevatedButton)
    button: {
      primary: {
        background: '#00D084',
        color: '#FFFFFF',
        borderRadius: '0.875rem', // 14px
        padding: '0.875rem 1.5rem', // 14px 24px
        fontSize: '1rem', // 16px
        fontWeight: 600,
        boxShadow: '0 2px 4px rgba(0, 208, 132, 0.3)',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
      secondary: {
        background: 'transparent',
        color: '#00D084',
        border: '1.5px solid #00D084',
        borderRadius: '0.875rem',
        padding: '0.875rem 1.5rem',
        fontSize: '1rem',
        fontWeight: 600,
      },
    },

    // Input field (matching InputDecoration)
    input: {
      background: '#FAFAFA',
      border: '1px solid #E5E7EB',
      borderRadius: '0.75rem', // 12px
      padding: '0.875rem 1rem', // 14px 16px
      focusBorder: '2px solid #00D084',
      fontSize: '1rem',
    },
  },
} as const;

// CSS-in-JS helper for glass effect
export const glassEffect = (opacity: number = 0.65, blur: number = 16) => ({
  backdropFilter: `blur(${blur}px)`,
  background: `rgba(255, 255, 255, ${opacity})`,
  border: `1px solid rgba(255, 255, 255, ${opacity * 0.9})`,
  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.07)',
});

// Tailwind CSS extension config
export const tailwindExtension = {
  colors: {
    primary: {
      DEFAULT: '#00D084',
      hover: '#00B874',
      light: '#33DDA0',
    },
    secondary: {
      DEFAULT: '#124EA2',
      hover: '#0F3E85',
      light: '#1E5FBD',
    },
    glass: {
      surface: 'rgba(255, 255, 255, 0.65)',
      nav: 'rgba(255, 255, 255, 0.85)',
      border: 'rgba(255, 255, 255, 0.6)',
    },
  },
  fontFamily: {
    sans: ['"Poppins"', 'system-ui', 'sans-serif'],
    serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
  },
  borderRadius: {
    'xl': '1.5rem',
    '2xl': '2rem',
    'pill': '624.9375rem',
  },
  boxShadow: {
    'glass': '0 8px 32px rgba(31, 38, 135, 0.07)',
    'button': '0 8px 14px rgba(0, 208, 132, 0.3)',
  },
  backdropBlur: {
    glass: '16px',
    nav: '20px',
  },
};

export type DesignSystemType = typeof DesignSystem;
