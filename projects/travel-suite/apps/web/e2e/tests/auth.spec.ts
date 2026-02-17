import { test, expect } from '@playwright/test';
import { gotoWithRetry } from '../fixtures/navigation';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await gotoWithRetry(page, '/auth');

    // Check for login form elements
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    const response = await page.request.post('/api/auth/password-login', {
      data: {
        email: 'invalid@test.com',
        password: 'wrongpassword',
      },
    });

    expect(response.status()).toBe(401);
    const payload = await response.json();
    expect(String(payload.error || '')).toMatch(/invalid|credential|email|password|rate limit/i);
  });

  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    // Try to access admin page without login
    await gotoWithRetry(page, '/admin');

    // Should redirect to login
    await expect(page).toHaveURL(/auth/);
  });

  test('should have Google OAuth option', async ({ page }) => {
    await gotoWithRetry(page, '/auth');

    // Check for Google sign in button
    // Using robust selector for "Continue with Google"
    const googleButton = page.locator('button').filter({ hasText: /Google/i });
    await expect(googleButton).toBeVisible();
  });

  test('should switch to register mode', async ({ page }) => {
    await gotoWithRetry(page, '/auth');

    // Click register link/tab
    await page.getByRole('button', { name: /^create account$/i }).click();

    // Stay on auth screen and keep form interactive
    await expect(page).toHaveURL(/auth/);
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i }).first()).toBeVisible();
  });
});

test.describe('Registration', () => {
  test('should allow switching to sign-up mode', async ({ page }) => {
    await gotoWithRetry(page, '/auth');

    await page.getByRole('button', { name: /^create account$/i }).click();

    await expect(page).toHaveURL(/auth/);
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible();
  });
});
