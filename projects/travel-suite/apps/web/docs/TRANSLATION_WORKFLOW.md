# Translation Workflow

This document describes how to manage translations in the GoBuddy Travel Suite using next-intl.

## Table of Contents

- [Overview](#overview)
- [Translation File Structure](#translation-file-structure)
- [How to Add a New Language](#how-to-add-a-new-language)
- [How to Extract Strings](#how-to-extract-strings)
- [How to Add Translations](#how-to-add-translations)
- [Best Practices](#best-practices)
- [RTL Support](#rtl-support)
- [Testing Translations](#testing-translations)

## Overview

The application uses [next-intl](https://next-intl-docs.vercel.app/) for internationalization (i18n). Currently supported languages:

- **English (en)** - Default language
- **Hindi (hi)** - हिन्दी

The framework is designed to support future expansion to:
- **Regional Indian languages**: Tamil (ta), Bengali (bn), Telugu (te), Marathi (mr)
- **International languages**: Thai (th), Indonesian (id), Arabic (ar), Urdu (ur)

## Translation File Structure

Translation files are located in the `messages/` directory at the project root:

```
messages/
├── en.json    # English translations
└── hi.json    # Hindi translations
```

Each translation file uses a **nested JSON structure** organized by namespaces:

```json
{
  "common": {
    "loading": "Loading...",
    "save": "Save",
    "status": {
      "pending": "Pending",
      "confirmed": "Confirmed"
    },
    "labels": {
      "total": "Total",
      "items": "Items"
    }
  },
  "settings": {
    "title": "Settings",
    "tabs": {
      "organization": "Organization",
      "profile": "Profile"
    }
  },
  "portal": {
    "hero": {
      "welcome": "Welcome, {firstName}"
    }
  }
}
```

### Namespace Organization

- **`common`**: Shared UI elements (buttons, labels, status values)
- **`settings`**: Settings page and related components
- **`portal`**: Traveler portal strings
- **`languageSwitcher`**: Language switcher component
- Add new namespaces as needed for feature areas (e.g., `booking`, `itinerary`, `payments`)

## How to Add a New Language

Follow these steps to add support for a new language (example: Tamil - `ta`):

### 1. Update Locale Configuration

Edit `src/i18n.ts` to add the new locale:

```typescript
// Add the new locale code to the locales array
export const locales = ['en', 'hi', 'ta'] as const;

// Add the display name
export const localeNames: Record<Locale, string> = {
  en: 'English',
  hi: 'हिन्दी',
  ta: 'தமிழ்',
};

// Add text direction (ltr for Tamil, rtl for Arabic/Urdu)
export const localeDirections: Record<string, 'ltr' | 'rtl'> = {
  en: 'ltr',
  hi: 'ltr',
  ta: 'ltr',
};
```

### 2. Create Translation File

Create a new JSON file `messages/ta.json` by copying the English file:

```bash
cp messages/en.json messages/ta.json
```

### 3. Translate All Strings

Translate all strings in `messages/ta.json` to Tamil. Ensure:
- All keys match the English file exactly
- Placeholders like `{firstName}`, `{count}` are preserved
- Nested structure is maintained

### 4. Update Language Switcher

The language switcher component will automatically detect new locales, but verify the display name appears correctly in `languageSwitcher.languages`:

```json
{
  "languageSwitcher": {
    "label": "Language",
    "languages": {
      "en": "English",
      "hi": "हिन्दी",
      "ta": "தமிழ்"
    }
  }
}
```

### 5. Test the New Language

1. Start the dev server: `npm run dev`
2. Navigate to Settings → Language Switcher
3. Select the new language and verify all strings display correctly
4. Test both operator dashboard and traveler portal

## How to Extract Strings

When building new features, follow this process to avoid hardcoded strings:

### 1. Identify String Categories

Determine which namespace the string belongs to:
- Generic UI elements → `common`
- Feature-specific → Create or use feature namespace (e.g., `booking`, `itinerary`)
- Settings-related → `settings`
- Traveler portal → `portal`

### 2. Add to English Translation File

Add the string to `messages/en.json` in the appropriate namespace:

```json
{
  "booking": {
    "title": "Create New Booking",
    "fields": {
      "destination": "Destination",
      "startDate": "Start Date",
      "endDate": "End Date"
    },
    "actions": {
      "createBooking": "Create Booking",
      "cancel": "Cancel"
    }
  }
}
```

### 3. Use in Components

Import and use the `useTranslations` hook:

```tsx
'use client';

import { useTranslations } from 'next-intl';

export function CreateBookingForm() {
  const t = useTranslations('booking');

  return (
    <form>
      <h2>{t('title')}</h2>
      <label>{t('fields.destination')}</label>
      <input type="text" />

      <label>{t('fields.startDate')}</label>
      <input type="date" />

      <button type="submit">{t('actions.createBooking')}</button>
      <button type="button">{t('actions.cancel')}</button>
    </form>
  );
}
```

### 4. For Server Components

Use `getTranslations` in Server Components:

```tsx
import { getTranslations } from 'next-intl/server';

export default async function BookingPage() {
  const t = await getTranslations('booking');

  return (
    <div>
      <h1>{t('title')}</h1>
      {/* ... */}
    </div>
  );
}
```

### 5. Strings with Variables

Use ICU message format for dynamic values:

```json
{
  "portal": {
    "hero": {
      "welcome": "Welcome, {firstName}",
      "tripDuration": "{days} days",
      "travellersCount": "{count, plural, =0 {No travellers} =1 {1 traveller} other {# travellers}}"
    }
  }
}
```

Usage:

```tsx
const t = useTranslations('portal.hero');

<h1>{t('welcome', { firstName: 'Rajesh' })}</h1>
<p>{t('tripDuration', { days: 5 })}</p>
<p>{t('travellersCount', { count: 3 })}</p>
```

## How to Add Translations

### For Existing Strings

When adding a translation to an existing string in a new language:

1. **Find the English key**: Locate the key path in `messages/en.json`
2. **Add to target language**: Add the translated value to the same key path in the target language file
3. **Preserve structure**: Ensure the JSON structure matches exactly

Example:

```json
// messages/en.json
{
  "booking": {
    "confirmationMessage": "Your booking has been confirmed"
  }
}

// messages/hi.json
{
  "booking": {
    "confirmationMessage": "आपकी बुकिंग की पुष्टि हो गई है"
  }
}
```

### For New Features

When building a new feature:

1. **Write in English first**: Add all strings to `messages/en.json`
2. **Mark for translation**: Create a checklist of keys needing translation
3. **Translate to all languages**: Ensure all supported languages receive translations before release
4. **Verify completeness**: Use TypeScript to catch missing keys (the type system will error if a key exists in English but not in other languages)

### Translation Guidelines

- **Be consistent**: Use the same translation for the same concept across the app
- **Context matters**: Some words have different translations based on context (e.g., "book" as verb vs noun)
- **Keep placeholders**: Never translate placeholder variables like `{firstName}`, `{count}`, etc.
- **Respect cultural nuances**: Adapt tone and formality to match cultural expectations
- **Test in context**: Always preview translations in the actual UI, not just in the JSON file

## Best Practices

### 1. Never Hardcode Strings

❌ **Bad:**
```tsx
<button>Save</button>
<p>Your trip starts on {date}</p>
```

✅ **Good:**
```tsx
const t = useTranslations('common');
<button>{t('save')}</button>

const tPortal = useTranslations('portal');
<p>{tPortal('tripStarts', { date })}</p>
```

### 2. Use Semantic Keys

❌ **Bad:**
```json
{
  "button1": "Save",
  "text1": "Loading..."
}
```

✅ **Good:**
```json
{
  "actions": {
    "save": "Save"
  },
  "states": {
    "loading": "Loading..."
  }
}
```

### 3. Group Related Strings

❌ **Bad:**
```json
{
  "saveButton": "Save",
  "cancelButton": "Cancel",
  "deleteButton": "Delete"
}
```

✅ **Good:**
```json
{
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  }
}
```

### 4. Keep Translations DRY

Reuse common strings from the `common` namespace instead of duplicating:

```tsx
// ✅ Reuse common.save across features
const tCommon = useTranslations('common');
<button>{tCommon('save')}</button>

// ❌ Don't create booking.save, settings.save, etc. for the same word
```

### 5. Plan for Plurals

Use ICU message format for proper plural handling:

```json
{
  "itemCount": "{count, plural, =0 {No items} =1 {1 item} other {# items}}"
}
```

### 6. Handle Missing Translations Gracefully

The framework falls back to English if a translation is missing. During development:

```tsx
// Add a visual indicator for missing translations in dev mode
const t = useTranslations('namespace');

{process.env.NODE_ENV === 'development' && !t.raw('key') && (
  <span className="text-red-500">[MISSING: namespace.key]</span>
)}
```

## RTL Support

The framework includes RTL (Right-to-Left) support for languages like Arabic and Urdu.

### Current Status

All current languages (English, Hindi) use LTR (Left-to-Right):

```typescript
export const localeDirections: Record<string, 'ltr' | 'rtl'> = {
  en: 'ltr',
  hi: 'ltr',
};
```

### Adding RTL Languages

When adding Arabic (ar) or Urdu (ur):

1. **Update locale direction**:

```typescript
export const localeDirections: Record<string, 'ltr' | 'rtl'> = {
  en: 'ltr',
  hi: 'ltr',
  ar: 'rtl',
  ur: 'rtl',
};
```

2. **Apply direction to HTML**:

The middleware automatically sets the `dir` attribute on the `<html>` element based on the locale.

3. **Test layouts**: Verify that all components adapt correctly to RTL layout
4. **Mirror icons**: Some directional icons (arrows, chevrons) should be mirrored in RTL

## Testing Translations

### Manual Testing

1. **Switch languages**: Use the language switcher in Settings to change locales
2. **Check all routes**: Verify translations appear on all pages (dashboard, portal, settings)
3. **Test with real data**: Use actual user data to ensure dynamic strings render correctly
4. **Verify formatting**: Check dates, numbers, and currencies format according to locale

### Automated Testing

Add tests to verify translation keys exist:

```typescript
import { describe, it, expect } from 'vitest';
import enMessages from '@/messages/en.json';
import hiMessages from '@/messages/hi.json';

describe('Translation completeness', () => {
  it('should have the same keys in all languages', () => {
    const enKeys = getAllKeys(enMessages);
    const hiKeys = getAllKeys(hiMessages);

    expect(enKeys).toEqual(hiKeys);
  });
});

function getAllKeys(obj: any, prefix = ''): string[] {
  return Object.keys(obj).flatMap(key => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof obj[key] === 'object' && !Array.isArray(obj[key])
      ? getAllKeys(obj[key], path)
      : [path];
  });
}
```

### Browser Testing

Test locale detection in the traveler portal:

1. **Set browser language**: Change your browser's Accept-Language preference
2. **Visit portal without locale**: Go to `/portal/[token]` (no locale prefix)
3. **Verify redirect**: Confirm automatic redirect to `/[locale]/portal/[token]` with correct locale
4. **Test fallback**: If browser language is not supported, should fall back to English

## Common Issues

### Issue: Translations not appearing

**Solution**:
- Verify the translation key exists in both `en.json` and the target language file
- Check that the key path is correct (e.g., `portal.hero.welcome` not `portal.welcome`)
- Ensure you're using `useTranslations()` or `getTranslations()` with the correct namespace

### Issue: Placeholder not replaced

**Solution**:
- Verify you're passing the variable in the second argument: `t('welcome', { firstName })`
- Check that the placeholder name matches exactly: `{firstName}` in JSON must receive `{ firstName: 'value' }`

### Issue: Wrong language displayed

**Solution**:
- Clear browser cookies and cache
- Verify the locale is in the URL path: `/en/dashboard` or `/hi/dashboard`
- Check middleware configuration in `src/middleware.ts`

### Issue: New language not appearing in switcher

**Solution**:
- Verify locale is added to `locales` array in `src/i18n.ts`
- Check that `localeNames` includes the new locale
- Restart dev server after changing `i18n.ts`

## Resources

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [ICU Message Format Guide](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
- [Next.js Internationalization](https://nextjs.org/docs/app/building-your-application/routing/internationalization)

## Need Help?

For translation-related questions or issues:
1. Check this documentation first
2. Review the next-intl docs
3. Look for similar examples in existing `messages/*.json` files
4. Reach out to the development team
