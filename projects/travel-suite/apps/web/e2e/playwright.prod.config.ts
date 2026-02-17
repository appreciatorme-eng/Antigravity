import { defineConfig, devices } from '@playwright/test';

/**
 * Production Config
 * Extends basic settings but points to production URL and disables local web server.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 2,
  workers: 1, // Be gentle on prod
  reporter: [['list']],
  
  use: {
    baseURL: 'https://travelsuite-rust.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
