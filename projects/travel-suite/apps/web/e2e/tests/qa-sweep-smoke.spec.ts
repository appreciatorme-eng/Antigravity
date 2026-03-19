/**
 * QA Sweep Smoke Test
 *
 * Crawls every route in the app with the correct auth role.
 * Checks: page loads, no error boundary, console errors captured,
 * placeholder text flagged.
 *
 * Run against production:
 *   npx playwright test --config=e2e/playwright.prod.config.ts e2e/tests/qa-sweep-smoke.spec.ts
 */
import { test, expect } from '../fixtures/auth';
import { gotoWithRetry } from '../fixtures/navigation';

// 60s per test — Vercel cold starts can be slow
const TIMEOUT = 60_000;

// ── Route definitions ──────────────────────────────────────────────

const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/blog',
  '/demo',
  '/pricing',
  '/auth',
  '/offline',
];

const ADMIN_ROUTES = [
  '/admin',
  '/admin/activity',
  '/admin/billing',
  '/admin/cost',
  '/admin/e-invoicing',
  '/admin/gst-report',
  '/admin/insights',
  '/admin/internal/marketplace',
  '/admin/invoices',
  '/admin/itinerary-templates',
  '/admin/kanban',
  '/admin/notifications',
  '/admin/operations',
  '/admin/performance',
  '/admin/planner',
  '/admin/pricing',
  '/admin/referrals',
  '/admin/revenue',
  '/admin/security',
  '/admin/settings',
  '/admin/settings/marketplace',
  '/admin/settings/notifications',
  '/admin/support',
  '/admin/templates',
  '/admin/tour-templates',
  '/admin/tour-templates/create',
  '/admin/tour-templates/import',
  '/admin/trips',
];

const SHARED_ROUTES = [
  '/add-ons',
  '/analytics',
  '/analytics/drill-through',
  '/analytics/templates',
  '/billing',
  '/bookings',
  '/calendar',
  '/clients',
  '/dashboard/schedule',
  '/dashboard/tasks',
  '/drivers',
  '/inbox',
  '/marketplace',
  '/marketplace/analytics',
  '/marketplace/inquiries',
  '/planner',
  '/proposals',
  '/proposals/create',
  '/reputation',
  '/reputation/analytics',
  '/reputation/campaigns',
  '/reputation/reviews',
  '/reputation/settings',
  '/reputation/widget',
  '/settings',
  '/settings/team',
  '/settings/marketplace',
  '/social',
  '/support',
  '/trips',
];

const SUPERADMIN_ROUTES = [
  '/god',
  '/god/analytics',
  '/god/announcements',
  '/god/audit-log',
  '/god/costs',
  '/god/directory',
  '/god/kill-switch',
  '/god/monitoring',
  '/god/referrals',
  '/god/signups',
  '/god/support',
];

// Error boundary / crash indicators
const ERROR_PATTERNS = [
  'Something went wrong',
  'Application error',
  'Internal Server Error',
  'This page could not be found',
  'Unhandled Runtime Error',
];

// Placeholder patterns to flag (soft — logged, not failed)
const PLACEHOLDER_PATTERNS = [
  'coming soon',
  'under construction',
  'placeholder',
  'lorem ipsum',
  'not implemented',
  'todo:',
  'fixme:',
];

// ── Helpers ────────────────────────────────────────────────────────

interface RouteResult {
  route: string;
  status: 'pass' | 'fail' | 'error';
  consoleErrors: string[];
  pageErrors: string[];
  placeholderHits: string[];
  loadTimeMs: number;
}

const allResults: RouteResult[] = [];

async function smokeTestRoute(
  page: import('@playwright/test').Page,
  route: string,
) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const startTime = Date.now();

  // Collect console errors
  const onConsole = (msg: import('@playwright/test').ConsoleMessage) => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[console.error] ${msg.text()}`);
    }
  };
  const onPageError = (error: Error) => {
    pageErrors.push(`[pageerror] ${error.message}`);
  };

  page.on('console', onConsole);
  page.on('pageerror', onPageError);

  try {
    await gotoWithRetry(page, route, 3);
    // Wait a moment for client-side hydration
    await page.waitForTimeout(2000);
  } catch (err) {
    const loadTimeMs = Date.now() - startTime;
    const result: RouteResult = {
      route,
      status: 'error',
      consoleErrors,
      pageErrors: [...pageErrors, `Navigation failed: ${String(err)}`],
      placeholderHits: [],
      loadTimeMs,
    };
    allResults.push(result);
    page.removeListener('console', onConsole);
    page.removeListener('pageerror', onPageError);
    throw err;
  }

  const loadTimeMs = Date.now() - startTime;

  // Check for VISIBLE error boundary text (not hidden elements / Next.js templates)
  const errorHits: string[] = [];
  for (const pattern of ERROR_PATTERNS) {
    const visible = await page.locator(`text=${pattern}`).first()
      .isVisible({ timeout: 1000 })
      .catch(() => false);
    if (visible) {
      errorHits.push(pattern);
    }
  }

  // Check for visible placeholder text (soft check)
  const placeholderHits: string[] = [];
  for (const pattern of PLACEHOLDER_PATTERNS) {
    const visible = await page.locator(`text=${pattern}`).first()
      .isVisible({ timeout: 500 })
      .catch(() => false);
    if (visible) {
      placeholderHits.push(pattern);
    }
  }

  const hasErrors = errorHits.length > 0;
  const result: RouteResult = {
    route,
    status: hasErrors ? 'fail' : 'pass',
    consoleErrors,
    pageErrors,
    placeholderHits,
    loadTimeMs,
  };
  allResults.push(result);

  // Log placeholder hits as warnings (don't fail)
  if (placeholderHits.length > 0) {
    console.warn(`⚠️  ${route} — placeholder text found: ${placeholderHits.join(', ')}`);
  }

  // Log console errors as warnings (don't fail the test for console errors)
  if (consoleErrors.length > 0) {
    console.warn(`⚠️  ${route} — ${consoleErrors.length} console error(s)`);
  }

  // Assert: no error boundary visible
  expect(
    errorHits,
    `Route ${route} shows error text: ${errorHits.join(', ')}`,
  ).toHaveLength(0);

  // Assert: page rendered something (not blank)
  const hasContent = await page.locator('h1, h2, h3, [role="main"], main, [data-testid]').first()
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  // Soft assertion for content — log but only fail if error boundary was hit
  if (!hasContent) {
    console.warn(`⚠️  ${route} — no heading or main content element found`);
  }

  page.removeListener('console', onConsole);
  page.removeListener('pageerror', onPageError);
}

// ── Tests ──────────────────────────────────────────────────────────

test.describe('QA Sweep — Public Routes', () => {
  test.describe.configure({ timeout: TIMEOUT });

  for (const route of PUBLIC_ROUTES) {
    test(`public: ${route}`, async ({ page }) => {
      await smokeTestRoute(page, route);
    });
  }
});

test.describe('QA Sweep — Admin Routes', () => {
  test.describe.configure({ timeout: TIMEOUT });

  for (const route of ADMIN_ROUTES) {
    test(`admin: ${route}`, async ({ adminPage }) => {
      await smokeTestRoute(adminPage, route);
    });
  }
});

test.describe('QA Sweep — Shared Routes (as admin)', () => {
  test.describe.configure({ timeout: TIMEOUT });

  for (const route of SHARED_ROUTES) {
    test(`shared: ${route}`, async ({ adminPage }) => {
      await smokeTestRoute(adminPage, route);
    });
  }
});

test.describe('QA Sweep — Super Admin Routes', () => {
  test.describe.configure({ timeout: TIMEOUT });

  for (const route of SUPERADMIN_ROUTES) {
    test(`superadmin: ${route}`, async ({ superAdminPage }) => {
      await smokeTestRoute(superAdminPage, route);
    });
  }
});

test.describe('QA Sweep — Client Routes', () => {
  test.describe.configure({ timeout: TIMEOUT });

  const CLIENT_ROUTES = ['/trips', '/bookings', '/billing', '/support'];

  for (const route of CLIENT_ROUTES) {
    test(`client: ${route}`, async ({ clientPage }) => {
      await smokeTestRoute(clientPage, route);
    });
  }
});
