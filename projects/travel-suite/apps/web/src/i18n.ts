/* ------------------------------------------------------------------
 * i18n Configuration
 *
 * Core configuration for next-intl internationalization framework.
 * Defines supported locales, default locale, and routing behavior.
 *
 * Supported locales:
 *   - en: English (default)
 *   - hi: Hindi
 *
 * Framework prepared for future expansion:
 *   - Regional: Tamil (ta), Bengali (bn), Telugu (te), Marathi (mr)
 *   - International: Thai (th), Indonesian (id), Arabic (ar), Urdu (ur)
 * ------------------------------------------------------------------ */

export const locales = ['en', 'hi', 'ta', 'te', 'mr'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/**
 * Locale display names for UI
 */
export const localeNames: Record<Locale, string> = {
  en: 'English',
  hi: 'हिन्दी',
  ta: 'தமிழ்',
  te: 'తెలుగు',
  mr: 'मराठी',
};

/**
 * Text direction by locale (for RTL support)
 * LTR: Left-to-Right (English, Hindi)
 * RTL: Right-to-Left (Arabic, Urdu - future support)
 */
export const localeDirections: Record<string, 'ltr' | 'rtl'> = {
  en: 'ltr',
  hi: 'ltr',
  ta: 'ltr',
  te: 'ltr',
  mr: 'ltr',
  // Future RTL support:
  // ar: 'rtl',
  // ur: 'rtl',
};

/**
 * Check if a string is a valid locale
 */
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

/**
 * Get text direction for a locale
 */
export function getLocaleDirection(locale: string): 'ltr' | 'rtl' {
  return localeDirections[locale] ?? 'ltr';
}
