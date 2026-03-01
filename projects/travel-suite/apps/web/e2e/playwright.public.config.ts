import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const configDir = __dirname;
const appDir = path.resolve(configDir, "..");
const publicBaseUrl = process.env.BASE_URL || "http://localhost:3100";
const testCronSecret = process.env.PLAYWRIGHT_TEST_CRON_SECRET || "playwright-cron-secret";

export default defineConfig({
  testDir: "./tests",
  testMatch: /public-api\.contract\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"]],
  use: {
    baseURL: publicBaseUrl,
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: {
    command:
      process.env.PLAYWRIGHT_DEV_COMMAND ||
      `cd "${appDir}" && CRON_SECRET="${testCronSecret}" /opt/homebrew/opt/node@22/bin/npx next dev --webpack --port 3100`,
    url: publicBaseUrl,
    reuseExistingServer: false,
    timeout: 120 * 1000,
  },
});
