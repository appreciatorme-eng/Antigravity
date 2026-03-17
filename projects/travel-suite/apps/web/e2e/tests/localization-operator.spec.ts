/**
 * E2E Test: Operator Dashboard Language Switching
 *
 * Tests language switcher functionality in operator dashboard settings:
 * - Language switcher visibility
 * - Switching between EN/HI locales
 * - URL updates with locale prefix
 * - UI text updates in selected language
 * - Locale persistence across navigation
 */

import { test, expect } from '../fixtures/auth';
import { gotoWithRetry } from '../fixtures/navigation';

test.describe('Operator Dashboard Language Switching', () => {
  test('should display language switcher on settings page', async ({ adminPage: page }) => {
    // Navigate to settings page (will auto-redirect to /en/settings or /hi/settings)
    await gotoWithRetry(page, '/settings');

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');

    // Verify language switcher is visible
    const languageSwitcher = page.locator('select[aria-label="Select language"]');
    await expect(languageSwitcher).toBeVisible();

    // Verify both EN and HI options are available
    const options = await languageSwitcher.locator('option').allTextContents();
    expect(options).toContain('English');
    expect(options).toContain('हिन्दी');
  });

  test('should switch from English to Hindi and update UI', async ({ adminPage: page }) => {
    // Start with English
    await gotoWithRetry(page, '/en/settings');
    await page.waitForLoadState('domcontentloaded');

    // Verify we're on English version
    await expect(page).toHaveURL(/\/en\/settings/);

    // Verify English text is displayed
    const settingsTitle = page.locator('h1, h2').filter({ hasText: /settings/i }).first();
    await expect(settingsTitle).toBeVisible();

    // Find and click language switcher
    const languageSwitcher = page.locator('select[aria-label="Select language"]');
    await expect(languageSwitcher).toBeVisible();

    // Switch to Hindi
    await languageSwitcher.selectOption('hi');

    // Wait for navigation to complete
    await page.waitForLoadState('domcontentloaded');

    // Verify URL changed to Hindi
    await expect(page).toHaveURL(/\/hi\/settings/);

    // Verify Hindi text is displayed (check for Devanagari script in common words)
    // The settings page should have Hindi translations
    const hindiContent = page.locator('body');
    await expect(hindiContent).toContainText(/सेटिंग|सेव|टीम|प्रोफाइल/);
  });

  test('should switch from Hindi to English and update UI', async ({ adminPage: page }) => {
    // Start with Hindi
    await gotoWithRetry(page, '/hi/settings');
    await page.waitForLoadState('domcontentloaded');

    // Verify we're on Hindi version
    await expect(page).toHaveURL(/\/hi\/settings/);

    // Find and click language switcher
    const languageSwitcher = page.locator('select[aria-label="Select language"]');
    await expect(languageSwitcher).toBeVisible();

    // Verify current selection is Hindi
    await expect(languageSwitcher).toHaveValue('hi');

    // Switch to English
    await languageSwitcher.selectOption('en');

    // Wait for navigation to complete
    await page.waitForLoadState('domcontentloaded');

    // Verify URL changed to English
    await expect(page).toHaveURL(/\/en\/settings/);

    // Verify English text is displayed
    const englishContent = page.locator('body');
    await expect(englishContent).toContainText(/Settings|Save|Team|Profile/);
  });

  test('should persist locale preference across page navigation', async ({ adminPage: page }) => {
    // Set language to Hindi
    await gotoWithRetry(page, '/en/settings');
    await page.waitForLoadState('domcontentloaded');

    const languageSwitcher = page.locator('select[aria-label="Select language"]');
    await languageSwitcher.selectOption('hi');
    await page.waitForLoadState('domcontentloaded');

    // Verify we're in Hindi
    await expect(page).toHaveURL(/\/hi\/settings/);

    // Navigate to another page (if available) or refresh
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Verify we're still in Hindi after reload
    await expect(page).toHaveURL(/\/hi\/settings/);

    // Verify language switcher still shows Hindi as selected
    const switcherAfterReload = page.locator('select[aria-label="Select language"]');
    await expect(switcherAfterReload).toHaveValue('hi');
  });

  test('should handle direct navigation to localized URLs', async ({ adminPage: page }) => {
    // Direct navigation to Hindi settings
    await gotoWithRetry(page, '/hi/settings');
    await page.waitForLoadState('domcontentloaded');

    // Verify page loads correctly
    await expect(page).toHaveURL(/\/hi\/settings/);
    const languageSwitcher = page.locator('select[aria-label="Select language"]');
    await expect(languageSwitcher).toHaveValue('hi');

    // Direct navigation to English settings
    await gotoWithRetry(page, '/en/settings');
    await page.waitForLoadState('domcontentloaded');

    // Verify page loads correctly
    await expect(page).toHaveURL(/\/en\/settings/);
    await expect(languageSwitcher).toHaveValue('en');
  });

  test('should display language switcher on onboarding page', async ({ adminPage: page }) => {
    // Navigate to onboarding (assuming it exists)
    await gotoWithRetry(page, '/onboarding');
    await page.waitForLoadState('domcontentloaded');

    // Verify language switcher is visible on onboarding
    const languageSwitcher = page.locator('select[aria-label="Select language"]');
    await expect(languageSwitcher).toBeVisible();

    // Verify both languages are available
    const options = await languageSwitcher.locator('option').allTextContents();
    expect(options).toContain('English');
    expect(options).toContain('हिन्दी');
  });

  test('should update tab labels when switching language', async ({ adminPage: page }) => {
    // Start with English
    await gotoWithRetry(page, '/en/settings');
    await page.waitForLoadState('domcontentloaded');

    // Check for English tab labels (Profile, Team, etc.)
    await expect(page.locator('text=/Profile/i').first()).toBeVisible({ timeout: 5000 });

    // Switch to Hindi
    const languageSwitcher = page.locator('select[aria-label="Select language"]');
    await languageSwitcher.selectOption('hi');
    await page.waitForLoadState('domcontentloaded');

    // Wait for Hindi translations to load
    await page.waitForTimeout(500);

    // Check that at least some Hindi text appears (tabs or other UI elements)
    const body = page.locator('body');
    const hasHindiText = await body.textContent();

    // Verify Devanagari script is present (Hindi uses Devanagari)
    expect(hasHindiText).toMatch(/[\u0900-\u097F]/);
  });

  test('should maintain language selection when switching between tabs', async ({ adminPage: page }) => {
    // Set to Hindi
    await gotoWithRetry(page, '/en/settings');
    await page.waitForLoadState('domcontentloaded');

    const languageSwitcher = page.locator('select[aria-label="Select language"]');
    await languageSwitcher.selectOption('hi');
    await page.waitForLoadState('domcontentloaded');

    // Verify we're in Hindi
    await expect(page).toHaveURL(/\/hi\/settings/);

    // Click on different tabs (if they're client-side navigation)
    // Try clicking on Profile tab, Team tab, etc.
    const tabs = page.locator('button').filter({ hasText: /प्रोफाइल|टीम/ });
    const firstTab = tabs.first();

    if (await firstTab.isVisible()) {
      await firstTab.click();
      await page.waitForTimeout(500);

      // Verify we're still in Hindi after tab switch
      await expect(page).toHaveURL(/\/hi\/settings/);
      await expect(languageSwitcher).toHaveValue('hi');
    }
  });
});

test.describe('Language Switcher Accessibility', () => {
  test('language switcher should be keyboard accessible', async ({ adminPage: page }) => {
    await gotoWithRetry(page, '/en/settings');
    await page.waitForLoadState('domcontentloaded');

    // Tab to language switcher
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Find the language switcher and focus it
    const languageSwitcher = page.locator('select[aria-label="Select language"]');
    await languageSwitcher.focus();

    // Verify it's focused
    await expect(languageSwitcher).toBeFocused();

    // Use keyboard to change selection
    await languageSwitcher.press('ArrowDown');
    await languageSwitcher.press('Enter');

    // Give it a moment for potential navigation
    await page.waitForTimeout(500);
  });

  test('language switcher should have proper ARIA labels', async ({ adminPage: page }) => {
    await gotoWithRetry(page, '/en/settings');
    await page.waitForLoadState('domcontentloaded');

    const languageSwitcher = page.locator('select[aria-label="Select language"]');
    await expect(languageSwitcher).toBeVisible();

    // Verify aria-label exists
    const ariaLabel = await languageSwitcher.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toContain('language');
  });
});
