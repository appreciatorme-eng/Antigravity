import fs from 'node:fs';
import path from 'node:path';
import { test as base, expect, Browser, Page } from '@playwright/test';

// Test user credentials (use test accounts in your Supabase)
const TEST_USERS = {
  client: {
    email: process.env.TEST_CLIENT_EMAIL || 'qa-client-e2e@gobuddy.test',
    password: process.env.TEST_CLIENT_PASSWORD || 'GoBuddyClient!2026',
  },
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'qa-admin-e2e@gobuddy.test',
    password: process.env.TEST_ADMIN_PASSWORD || 'GoBuddyAdmin!2026',
  },
  driver: {
    email: process.env.TEST_DRIVER_EMAIL || 'qa-driver-e2e@gobuddy.test',
    password: process.env.TEST_DRIVER_PASSWORD || 'GoBuddyDriver!2026',
  },
};

type UserType = 'client' | 'admin' | 'driver';

const AUTH_STATE_DIR = path.resolve(__dirname, '..', '.auth');
const AUTH_STATE_PATHS: Record<UserType, string> = {
  client: path.join(AUTH_STATE_DIR, 'client.json'),
  admin: path.join(AUTH_STATE_DIR, 'admin.json'),
  driver: path.join(AUTH_STATE_DIR, 'driver.json'),
};

// Extend base test with authentication fixtures
export const test = base.extend<{
  authenticatedPage: Page;
  adminPage: Page;
  clientPage: Page;
}>({
  // Generic authenticated page (client role)
  authenticatedPage: async ({ browser }, runFixture) => {
    const page = await createAuthenticatedPage(browser, 'client');
    try {
      await runFixture(page);
    } finally {
      await page.context().close();
    }
  },

  // Admin authenticated page
  adminPage: async ({ browser }, runFixture) => {
    const page = await createAuthenticatedPage(browser, 'admin');
    try {
      await runFixture(page);
    } finally {
      await page.context().close();
    }
  },

  // Client authenticated page
  clientPage: async ({ browser }, runFixture) => {
    const page = await createAuthenticatedPage(browser, 'client');
    try {
      await runFixture(page);
    } finally {
      await page.context().close();
    }
  },
});

async function createAuthenticatedPage(browser: Browser, userType: UserType): Promise<Page> {
  const statePath = AUTH_STATE_PATHS[userType];

  if (fs.existsSync(statePath)) {
    const context = await browser.newContext({ storageState: statePath });
    return context.newPage();
  }

  // Fallback for local runs if setup file did not run.
  const context = await browser.newContext();
  const page = await context.newPage();
  await loginAs(page, userType);
  return page;
}

/**
 * Login as a specific user type
 */
async function loginAs(page: Page, userType: UserType) {
  const user = TEST_USERS[userType];

  // Use API login for stable cookie/session setup across SSR/client routes.
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      const baseURL = process.env.BASE_URL || 'http://127.0.0.1:3100';
      const response = await page.request.post(`${baseURL}/api/auth/password-login`, {
        data: {
          email: user.email,
          password: user.password,
        },
      });

      if (response.ok()) {
        return;
      }

      const message = await response.text();
      lastError = new Error(`HTTP ${response.status()} ${message}`);
    } catch (error) {
      lastError = error;
    }

    await page.waitForTimeout(1000 + attempt * 500);
  }

  expect(lastError, `Login failed for ${userType}`).toBeNull();
}

/**
 * Helper to check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // Check for common logged-in indicators
  const hasUserMenu = await page.locator('[data-testid="user-menu"]').count();
  const hasLogoutButton = await page.locator('text=Logout, text=Sign out, text=Log out').count();

  return hasUserMenu > 0 || hasLogoutButton > 0;
}

/**
 * Helper to logout
 */
export async function logout(page: Page) {
  // Try common logout patterns
  const logoutButton = page.locator('text=Logout, text=Sign out, text=Log out').first();
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
  }

  // Wait for redirect to auth or home
  await page.waitForURL((url) =>
    url.pathname === '/' || url.pathname.includes('/auth')
  );
}

export { expect };
