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
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Load messages for the requested locale
  const messages = (await import(`../../messages/${locale}.json`)).default;

  return {
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
