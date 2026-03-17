import { defineConfig, devices } from '@playwright/test';
import { config as loadDotenv } from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

// Load e2e/.env before resolving any env-dependent config values so that
// PLAYWRIGHT_BASE_URL, TEST_ADMIN_EMAIL, etc. are available at config-eval time.
// This is required because Playwright's own .env auto-load runs after the config
// module is evaluated, which is too late for top-level const assignments.
loadDotenv({ path: path.join(__dirname, '.env'), override: false });

const configDir = __dirname;
const appDir = path.resolve(configDir, '..');
const resolvedBaseUrl =
  process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'http://127.0.0.1:3100';

// Check if admin auth state exists - if not, tests will run unauthenticated
// and middleware will redirect to /auth, which is expected for setup issues
const adminAuthPath = path.join(__dirname, '.auth', 'admin.json');
const hasAdminAuth = fs.existsSync(adminAuthPath);

/**
 * TripBuilt - Playwright E2E Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: resolvedBaseUrl,

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    /* Setup project for authentication */
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use admin auth state for authenticated tests (if available)
        ...(hasAdminAuth ? { storageState: adminAuthPath } : {}),
      },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        // Use admin auth state for authenticated tests (if available)
        ...(hasAdminAuth ? { storageState: adminAuthPath } : {}),
      },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        // Use admin auth state for authenticated tests (if available)
        ...(hasAdminAuth ? { storageState: adminAuthPath } : {}),
      },
      dependencies: ['setup'],
    },

    /* Test against mobile viewports */
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        // Use admin auth state for authenticated tests (if available)
        ...(hasAdminAuth ? { storageState: adminAuthPath } : {}),
      },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
        // Use admin auth state for authenticated tests (if available)
        ...(hasAdminAuth ? { storageState: adminAuthPath } : {}),
      },
      dependencies: ['setup'],
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command:
      process.env.PLAYWRIGHT_DEV_COMMAND ||
      `cd "${appDir}" && npx next dev --webpack --port 3100`,
    url: resolvedBaseUrl,
    reuseExistingServer: !process.env.CI,
    timeout: Number(process.env.PLAYWRIGHT_WEB_SERVER_TIMEOUT || 120 * 1000),
  },
});
