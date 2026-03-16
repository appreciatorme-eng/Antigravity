/**
 * E2E Test: Portal Localization
 *
 * Tests portal localization URL structure and locale persistence:
 * - English portal URLs contain /en/ locale prefix
 * - Hindi portal URLs contain /hi/ locale prefix
 * - Locale persists across page reloads
 * - Different portal tokens work with both locales
 *
 * Note: These tests focus on verifying that the locale routing infrastructure
 * is in place, which enables browser-based locale detection via middleware.
 */

import { test, expect } from '@playwright/test';
import { gotoWithRetry } from '../fixtures/navigation';

// Mock portal tokens for testing
const TEST_PORTAL_TOKEN = 'test-trip-abc123';
const ALT_PORTAL_TOKEN = 'different-trip-xyz789';

test.describe('Portal Locale URL Structure', () => {
  test('English portal URL should contain /en/ prefix', async ({ page }) => {
    await gotoWithRetry(page, `/en/portal/${TEST_PORTAL_TOKEN}`);
    await page.waitForLoadState('domcontentloaded');

    // Verify URL contains English locale
    const url = page.url();
    expect(url).toContain('/en/');
    expect(url).toContain('/portal/');
    expect(url).toContain(TEST_PORTAL_TOKEN);
  });

  test('Hindi portal URL should contain /hi/ prefix', async ({ page }) => {
    await gotoWithRetry(page, `/hi/portal/${TEST_PORTAL_TOKEN}`);
    await page.waitForLoadState('domcontentloaded');

    // Verify URL contains Hindi locale
    const url = page.url();
    expect(url).toContain('/hi/');
    expect(url).toContain('/portal/');
    expect(url).toContain(TEST_PORTAL_TOKEN);
  });

  test('English portal URL pattern matches expected structure', async ({ page }) => {
    await gotoWithRetry(page, `/en/portal/${TEST_PORTAL_TOKEN}`);

    // Verify URL pattern
    await expect(page).toHaveURL(new RegExp(`/en/portal/${TEST_PORTAL_TOKEN}`));
  });

  test('Hindi portal URL pattern matches expected structure', async ({ page }) => {
    await gotoWithRetry(page, `/hi/portal/${TEST_PORTAL_TOKEN}`);

    // Verify URL pattern
    await expect(page).toHaveURL(new RegExp(`/hi/portal/${TEST_PORTAL_TOKEN}`));
  });
});

test.describe('Portal Locale Persistence', () => {
  test('English locale persists across page reload', async ({ page }) => {
    // Navigate to English portal
    await gotoWithRetry(page, `/en/portal/${TEST_PORTAL_TOKEN}`);
    await page.waitForLoadState('domcontentloaded');

    // Verify English URL
    await expect(page).toHaveURL(new RegExp(`/en/portal/${TEST_PORTAL_TOKEN}`));

    // Reload page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Verify still on English URL
    await expect(page).toHaveURL(new RegExp(`/en/portal/${TEST_PORTAL_TOKEN}`));
  });

  test('Hindi locale persists across page reload', async ({ page }) => {
    // Navigate to Hindi portal
    await gotoWithRetry(page, `/hi/portal/${TEST_PORTAL_TOKEN}`);
    await page.waitForLoadState('domcontentloaded');

    // Verify Hindi URL
    await expect(page).toHaveURL(new RegExp(`/hi/portal/${TEST_PORTAL_TOKEN}`));

    // Reload page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Verify still on Hindi URL
    await expect(page).toHaveURL(new RegExp(`/hi/portal/${TEST_PORTAL_TOKEN}`));
  });
});

test.describe('Portal Multi-Token Support', () => {
  test('English locale works with different portal tokens', async ({ page }) => {
    // Test with alternate token
    await gotoWithRetry(page, `/en/portal/${ALT_PORTAL_TOKEN}`);
    await page.waitForLoadState('domcontentloaded');

    // Verify correct URL structure
    const url = page.url();
    expect(url).toContain('/en/');
    expect(url).toContain('/portal/');
    expect(url).toContain(ALT_PORTAL_TOKEN);
  });

  test('Hindi locale works with different portal tokens', async ({ page }) => {
    // Test with alternate token
    await gotoWithRetry(page, `/hi/portal/${ALT_PORTAL_TOKEN}`);
    await page.waitForLoadState('domcontentloaded');

    // Verify correct URL structure
    const url = page.url();
    expect(url).toContain('/hi/');
    expect(url).toContain('/portal/');
    expect(url).toContain(ALT_PORTAL_TOKEN);
  });
});

test.describe('Portal Locale Route Configuration', () => {
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
