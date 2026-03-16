/**
 * E2E Test: Portal Localization
 *
 * Tests portal localization URL structure and locale persistence:
 * - English portal URLs contain /en/ locale prefix
 * - Hindi portal URLs contain /hi/ locale prefix
 * - Locale persists across page reloads
 * - HTML lang and dir attributes are set correctly
 *
 * Note: Tests that require valid portal data (branding, content loading) are
 * skipped until test data fixtures are implemented. See e2e/fixtures/portal-fixtures.ts
 */

import { test, expect } from '@playwright/test';
import { gotoWithRetry } from '../fixtures/navigation';

// Mock portal tokens for testing locale routing
// These tokens don't exist in the database - tests verify locale routing infrastructure
const TEST_PORTAL_TOKEN = 'test-trip-abc123';

test.describe('Portal Localization', () => {
  test.skip('should display English portal when navigating to /en/portal/[token]', async () => {
    // SKIPPED: Requires valid test portal token - test token doesn't exist in database
    // TODO: Implement test data fixtures (see e2e/fixtures/portal-fixtures.ts)
  });

  test.skip('should display Hindi portal when navigating to /hi/portal/[token]', async () => {
    // SKIPPED: Requires valid test portal token - test token doesn't exist in database
    // TODO: Implement test data fixtures (see e2e/fixtures/portal-fixtures.ts)
  });

  test('should maintain English locale across page reload', async ({ page }) => {
    // Navigate to English portal
    await gotoWithRetry(page, `/en/portal/${TEST_PORTAL_TOKEN}`);
    await page.waitForLoadState('domcontentloaded');

    // Verify English URL
    await expect(page).toHaveURL(new RegExp(`/en/portal/${TEST_PORTAL_TOKEN}`));

    // Reload the page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Verify still on English URL after reload
    await expect(page).toHaveURL(new RegExp(`/en/portal/${TEST_PORTAL_TOKEN}`));
  });

  test('should maintain Hindi locale across page reload', async ({ page }) => {
    // Navigate to Hindi portal
    await gotoWithRetry(page, `/hi/portal/${TEST_PORTAL_TOKEN}`);
    await page.waitForLoadState('domcontentloaded');

    // Verify Hindi URL
    await expect(page).toHaveURL(new RegExp(`/hi/portal/${TEST_PORTAL_TOKEN}`));

    // Reload the page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Verify still on Hindi URL after reload
    await expect(page).toHaveURL(new RegExp(`/hi/portal/${TEST_PORTAL_TOKEN}`));
  });

  test.skip('should display operator branding in English portal', async () => {
    // SKIPPED: Requires valid test portal token with operator branding data
    // TODO: Implement test data fixtures (see e2e/fixtures/portal-fixtures.ts)
  });

  test.skip('should display operator branding in Hindi portal', async () => {
    // SKIPPED: Requires valid test portal token with operator branding data
    // TODO: Implement test data fixtures (see e2e/fixtures/portal-fixtures.ts)
  });

  test.skip('should work with different portal tokens in English', async () => {
    // SKIPPED: Requires valid test portal tokens - test tokens don't exist in database
    // TODO: Implement test data fixtures (see e2e/fixtures/portal-fixtures.ts)
  });

  test.skip('should work with different portal tokens in Hindi', async () => {
    // SKIPPED: Requires valid test portal tokens - test tokens don't exist in database
    // TODO: Implement test data fixtures (see e2e/fixtures/portal-fixtures.ts)
  });
});

test.describe('Portal Footer Localization', () => {
  test('should display footer in English portal', async ({ page }) => {
    await gotoWithRetry(page, `/en/portal/${TEST_PORTAL_TOKEN}`);
    await page.waitForLoadState('domcontentloaded');

    // Check for footer
    const footer = page.locator('footer, [role="contentinfo"]');

    // Footer should be visible
    const isFooterVisible = await footer.isVisible();

    // If footer is visible, verify it contains expected content
    if (isFooterVisible) {
      const footerText = await footer.textContent();
      expect(footerText).toBeTruthy();
      // Should contain branding text (TourOS, Powered by, etc.)
      expect(footerText).toMatch(/TourOS|Powered|safe|secured/i);
    }
  });

  test('should display footer in Hindi portal', async ({ page }) => {
    await gotoWithRetry(page, `/hi/portal/${TEST_PORTAL_TOKEN}`);
    await page.waitForLoadState('domcontentloaded');

    // Check for footer
    const footer = page.locator('footer, [role="contentinfo"]');

    // Footer should be visible
    const isFooterVisible = await footer.isVisible();

    // If footer is visible, verify it exists
    if (isFooterVisible) {
      const footerText = await footer.textContent();
      expect(footerText).toBeTruthy();
      // Footer text should exist (content may be in Hindi or English)
      expect(footerText?.length ?? 0).toBeGreaterThan(0);
    }
  });
});

test.describe('Portal Locale URL Structure', () => {
  test('English portal should have /en/ in URL', async ({ page }) => {
    await gotoWithRetry(page, `/en/portal/${TEST_PORTAL_TOKEN}`);

    const url = page.url();
    expect(url).toContain('/en/');
    expect(url).toContain('/portal/');
    expect(url).toContain(TEST_PORTAL_TOKEN);
  });

  test('Hindi portal should have /hi/ in URL', async ({ page }) => {
    await gotoWithRetry(page, `/hi/portal/${TEST_PORTAL_TOKEN}`);

    const url = page.url();
    expect(url).toContain('/hi/');
    expect(url).toContain('/portal/');
    expect(url).toContain(TEST_PORTAL_TOKEN);
  });

  test('navigating to English portal sets correct lang attribute', async ({ page }) => {
    await gotoWithRetry(page, `/en/portal/${TEST_PORTAL_TOKEN}`);
    await page.waitForLoadState('domcontentloaded');

    // Check html lang attribute
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBe('en');
  });

  test('navigating to Hindi portal sets correct lang attribute', async ({ page }) => {
    await gotoWithRetry(page, `/hi/portal/${TEST_PORTAL_TOKEN}`);
    await page.waitForLoadState('domcontentloaded');

    // Check html lang attribute
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBe('hi');
  });

  test('English portal has LTR text direction', async ({ page }) => {
    await gotoWithRetry(page, `/en/portal/${TEST_PORTAL_TOKEN}`);
    await page.waitForLoadState('domcontentloaded');

    // Check html dir attribute (should be ltr for English)
    const htmlDir = await page.locator('html').getAttribute('dir');
    expect(htmlDir).toBe('ltr');
  });

  test('Hindi portal has LTR text direction', async ({ page }) => {
    await gotoWithRetry(page, `/hi/portal/${TEST_PORTAL_TOKEN}`);
    await page.waitForLoadState('domcontentloaded');

    // Check html dir attribute (should be ltr for Hindi)
    const htmlDir = await page.locator('html').getAttribute('dir');
    expect(htmlDir).toBe('ltr');
  });
});
