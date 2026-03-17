/* ------------------------------------------------------------------
 * i18n Request Configuration
 *
 * Provides request-specific configuration for next-intl.
 * Loads translation messages for the current locale and configures
 * time zone and message formatting.
 *
 * Used by:
 *   - Server components (via NextIntlClientProvider in layout)
 *   - Middleware (for locale detection and routing)
 *   - Client components (via useTranslations hook)
 * ------------------------------------------------------------------ */

import { getRequestConfig } from 'next-intl/server';
import { locales, type Locale } from '@/i18n';

export default getRequestConfig(async ({ requestLocale }) => {
  // In next-intl v4, requestLocale is a promise-like that resolves to the detected locale
  const requested = await requestLocale;
  const locale: Locale = (requested && locales.includes(requested as Locale))
    ? (requested as Locale)
    : 'en';

  // Load messages for the requested locale
  const messages = (await import(`../../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
    // Configure time zone (India Standard Time for default, can be overridden)
    timeZone: 'Asia/Kolkata',
    // Enable time zone awareness for date/time formatting
    now: new Date(),
    // Format options for numbers (Indian numbering system for hi locale)
    formats: {
      dateTime: {
        short: {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        },
        long: {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        },
      },
      number: {
        currency: {
          style: 'currency',
          currency: 'INR',
        },
        decimal: {
          style: 'decimal',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        },
      },
    },
  };
});
