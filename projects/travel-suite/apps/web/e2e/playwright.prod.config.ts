import { defineConfig, devices } from '@playwright/test';

/**
 * Production Config
 * Extends basic settings but points to production URL and disables local web server.
 */
process.env.E2E_TARGET ??= 'prod';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 2,
  workers: 1, // Be gentle on prod
  reporter: [['list']],
  
  use: {
    baseURL: process.env.BASE_URL || 'https://travelsuite-rust.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
});
