/**
 * Language Switcher Component
 *
 * Switches between supported locales (EN, HI) using next-intl
 * Persists preference via URL routing
 */

'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Globe, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { locales, localeNames, type Locale } from '@/i18n';

export function LanguageSwitcher({ className }: { className?: string }) {
  const currentLocale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;

    // Replace the locale prefix in the pathname
    // pathname includes locale: /en/settings -> /hi/settings
    const localePattern = new RegExp(`^/(${locales.join('|')})(?=/|$)`);
    const pathWithoutLocale = pathname.replace(localePattern, '');
    const newPath = `/${newLocale}${pathWithoutLocale}`;

    router.push(newPath);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div
        className={cn(
          'relative w-32 h-10 rounded-lg',
          'bg-gray-100 dark:bg-gray-800',
          className
        )}
        aria-label="Language switcher"
      />
    );
  }

  return (
    <div
      className={cn(
        'relative inline-flex items-center gap-2',
        'px-3 py-2 rounded-lg',
        'bg-white dark:bg-gray-800',
        'border border-gray-200 dark:border-gray-700',
        'shadow-sm',
        className
      )}
    >
      <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      <select
        value={currentLocale}
        onChange={(e) => switchLocale(e.target.value as Locale)}
        className={cn(
          'appearance-none bg-transparent',
          'text-sm font-medium',
          'text-gray-900 dark:text-gray-100',
          'border-none outline-none cursor-pointer',
          'pr-6'
        )}
        aria-label="Select language"
      >
        {locales.map((locale) => (
          <option key={locale} value={locale}>
            {localeNames[locale]}
          </option>
        ))}
      </select>
      {/* Custom dropdown arrow */}
      <div className="absolute right-3 pointer-events-none">
        <svg
          className="w-4 h-4 text-gray-600 dark:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}

export function LanguageSwitcherButton({ className }: { className?: string }) {
  const currentLocale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === currentLocale) {
      setIsOpen(false);
      return;
    }

    const localePattern = new RegExp(`^/(${locales.join('|')})(?=/|$)`);
    const pathWithoutLocale = pathname.replace(localePattern, '');
    const newPath = `/${newLocale}${pathWithoutLocale}`;

    router.push(newPath);
    setIsOpen(false);
  };

  if (!mounted) {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center',
          'w-10 h-10 rounded-full',
          'bg-white/80 text-[#124ea2]',
          'shadow-[0_6px_10px_rgba(0,0,0,0.05)]',
          className
        )}
        aria-label="Language switcher"
      >
        <Languages className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center justify-center',
          'w-10 h-10 rounded-full',
          'transition-all duration-200',
          'hover:scale-105 active:scale-95',
          isOpen
            ? 'bg-[#00d084]/20 text-[#00d084]'
            : 'bg-white/80 text-[#124ea2] dark:bg-gray-800 dark:text-[#00d084]',
          'shadow-[0_6px_10px_rgba(0,0,0,0.05)]',
        )}
        aria-label={`Current language: ${localeNames[currentLocale]}`}
        aria-expanded={isOpen}
      >
        <Languages className="w-5 h-5" />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Menu */}
          <div
            className={cn(
              'absolute right-0 mt-2 z-50',
              'w-32 py-1 rounded-lg',
              'bg-white dark:bg-gray-800',
              'border border-gray-200 dark:border-gray-700',
              'shadow-lg',
              'animate-in fade-in slide-in-from-top-2 duration-200'
            )}
          >
            {locales.map((locale) => (
              <button
                key={locale}
                onClick={() => switchLocale(locale)}
                className={cn(
                  'w-full px-4 py-2 text-left text-sm',
                  'transition-colors duration-150',
                  locale === currentLocale
                    ? 'bg-[#00d084]/10 text-[#00d084] font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                {localeNames[locale]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
