import type { TourConfig } from './tour-types';
import { APP_TOUR_MAP } from './app-tour-steps';
import { TOUR_MAP } from './tour-steps';

// ---------------------------------------------------------------------------
// Path → Tour ID mapping (every navigable page with a tour)
// ---------------------------------------------------------------------------

const PATH_TO_TOUR: Record<string, string> = {
  // Existing tours (6)
  '/': 'tour-dashboard',
  '/admin': 'tour-dashboard',
  '/planner': 'tour-planner',
  '/trips': 'tour-trips',
  '/clients': 'tour-clients',
  '/inbox': 'tour-inbox',
  '/settings': 'tour-settings',

  // New tours — Primary
  '/proposals': 'tour-proposals',

  // New tours — Daily Workflow
  '/bookings': 'tour-bookings',
  '/calendar': 'tour-calendar',
  '/drivers': 'tour-drivers',

  // New tours — Operations
  '/admin/invoices': 'tour-invoices',
  '/admin/revenue': 'tour-revenue',
  '/admin/pricing': 'tour-pricing',
  '/admin/operations': 'tour-operations',

  // New tours — Growth
  '/marketplace': 'tour-marketplace',
  '/reputation': 'tour-reputation',
  '/social': 'tour-social',
  '/admin/insights': 'tour-insights',
  '/admin/referrals': 'tour-referrals',

  // New tours — Account
  '/billing': 'tour-billing',
  '/add-ons': 'tour-addons',
  '/support': 'tour-support',
};

// ---------------------------------------------------------------------------
// Full-app tour sequence (ordered walk-through of all pages)
// ---------------------------------------------------------------------------

export const FULL_APP_TOUR_ORDER: readonly string[] = [
  '/',
  '/planner',
  '/trips',
  '/clients',
  '/proposals',
  '/inbox',
  '/bookings',
  '/calendar',
  '/drivers',
  '/admin/invoices',
  '/admin/revenue',
  '/admin/pricing',
  '/admin/operations',
  '/marketplace',
  '/reputation',
  '/social',
  '/admin/insights',
  '/admin/referrals',
  '/settings',
  '/billing',
  '/add-ons',
  '/support',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve the tour config for the current pathname, or null if no tour exists */
export function getTourForPath(pathname: string): TourConfig | null {
  const tourId = PATH_TO_TOUR[pathname];
  if (!tourId) return null;
  return APP_TOUR_MAP[tourId] ?? TOUR_MAP[tourId] ?? null;
}

/** Get the tour ID for a pathname */
export function getTourIdForPath(pathname: string): string | null {
  return PATH_TO_TOUR[pathname] ?? null;
}

/** Get the next page in the full-app tour sequence */
export function getNextTourPage(currentPath: string): string | null {
  const idx = FULL_APP_TOUR_ORDER.indexOf(currentPath);
  if (idx === -1 || idx === FULL_APP_TOUR_ORDER.length - 1) return null;
  return FULL_APP_TOUR_ORDER[idx + 1];
}

/** Get human-readable page name from pathname */
export function getPageName(pathname: string): string {
  const names: Record<string, string> = {
    '/': 'Dashboard',
    '/admin': 'Dashboard',
    '/planner': 'AI Planner',
    '/trips': 'Trips',
    '/clients': 'Clients',
    '/proposals': 'Proposals',
    '/inbox': 'Inbox',
    '/bookings': 'Bookings',
    '/calendar': 'Calendar',
    '/drivers': 'Drivers',
    '/admin/invoices': 'Invoices',
    '/admin/revenue': 'Revenue',
    '/admin/pricing': 'Pricing & Profit',
    '/admin/operations': 'Operations',
    '/marketplace': 'Marketplace',
    '/reputation': 'Reputation',
    '/social': 'Social Studio',
    '/admin/insights': 'AI Insights',
    '/admin/referrals': 'Refer & Earn',
    '/settings': 'Settings',
    '/billing': 'Billing',
    '/add-ons': 'Add-ons',
    '/support': 'Support',
  };
  return names[pathname] ?? 'this page';
}

/** Check if a pathname has an associated tour */
export function hasPageTour(pathname: string): boolean {
  return pathname in PATH_TO_TOUR;
}
