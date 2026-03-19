import { defineConfig, devices } from '@playwright/test';
import { config as loadDotenv } from 'dotenv';
import path from 'node:path';

/**
 * Production Config
 * Extends basic settings but points to production URL and disables local web server.
 */
loadDotenv({ path: path.join(__dirname, '.env'), override: false });
process.env.E2E_TARGET ??= 'prod';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 2,
  workers: 1, // Be gentle on prod
  reporter: [['list']],
  
  use: {
    baseURL: process.env.BASE_URL || 'https://www.tripbuilt.com',
    // Keep disk usage tiny (prod runs happen in a constrained environment).
    // Override via CLI flags if you need artifacts for debugging.
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      // Use the locally installed Google Chrome to avoid downloading Playwright browsers.
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
      dependencies: ['setup'],
    },
  ],
});
