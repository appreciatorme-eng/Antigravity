import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const configDir = __dirname;
const appDir = path.resolve(configDir, '..');
const resolvedBaseUrl =
  process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'http://127.0.0.1:3100';

/**
 * GoBuddy Adventures - Playwright E2E Test Configuration
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
      },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
      dependencies: ['setup'],
    },

    /* Test against mobile viewports */
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
      },
      dependencies: ['setup'],
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command:
      process.env.PLAYWRIGHT_DEV_COMMAND ||
      `cd "${appDir}" && /opt/homebrew/opt/node@22/bin/npx next dev --webpack --port 3100`,
    url: resolvedBaseUrl,
    reuseExistingServer: false,
    timeout: Number(process.env.PLAYWRIGHT_WEB_SERVER_TIMEOUT || 120 * 1000),
  },
});
