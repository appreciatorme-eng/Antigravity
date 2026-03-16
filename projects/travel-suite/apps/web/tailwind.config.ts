import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import tailwindClipPath from "tailwind-clip-path";

/**
 * RTL (Right-to-Left) Support Configuration
 *
 * Tailwind CSS v4 has built-in RTL support via `rtl:` and `ltr:` variants.
 * The `dir` attribute on the <html> element (set dynamically in src/app/layout.tsx)
 * automatically enables RTL mode for supported languages (Arabic, Urdu, Hebrew).
 *
 * IMPORTANT RTL-Safe Utility Patterns:
 *
 * 1. Logical Properties (Recommended):
 *    Use directional-agnostic utilities that adapt to text direction:
 *    - `ms-4` (margin-inline-start) instead of `ml-4` (margin-left)
 *    - `me-4` (margin-inline-end) instead of `mr-4` (margin-right)
 *    - `ps-4` (padding-inline-start) instead of `pl-4` (padding-left)
 *    - `pe-4` (padding-inline-end) instead of `pr-4` (padding-right)
 *    - `start-0` (inset-inline-start) instead of `left-0`
 *    - `end-0` (inset-inline-end) instead of `right-0`
 *    - `rounded-s-lg` instead of `rounded-l-lg`
 *    - `rounded-e-lg` instead of `rounded-r-lg`
 *
 * 2. RTL Variants (For Specific Cases):
 *    Use `rtl:` and `ltr:` variants when logical properties aren't sufficient:
 *    - `ltr:ml-4 rtl:mr-4` - different margins for each direction
 *    - `ltr:text-left rtl:text-right` - text alignment per direction
 *    - `ltr:flex-row rtl:flex-row-reverse` - reverse flex direction
 *
 * 3. Direction-Aware Icons:
 *    For directional icons (arrows, chevrons), use RTL variants:
 *    - `ltr:rotate-0 rtl:rotate-180` - flip arrow icons in RTL
 *
 * Current Locale Support:
 * - English (en): LTR
 * - Hindi (hi): LTR
 * - Future: Arabic (ar), Urdu (ur) - RTL
 *
 * See: src/i18n.ts for locale direction configuration
 * See: src/app/layout.tsx for dynamic `dir` attribute
 */

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        merriweather: ["var(--font-merriweather)"],
        sans: ["var(--font-sans)"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "shimmer": {
          "100%": {
            transform: "translateX(100%)",
          },
        },
         "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "gradient-x": {
          "0%, 100%": {
            "background-size": "200% 200%",
            "background-position": "left center"
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center"
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
         "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        "gradient-x": "gradient-x 3s ease infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate, tailwindClipPath],
} satisfies Config;

export default config;
