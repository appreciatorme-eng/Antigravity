import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const configDir = __dirname;
const appDir = path.resolve(configDir, "..");

export default defineConfig({
  testDir: "./tests",
  testMatch: /pwa-offline-sync\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3100",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
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
      `cd "${appDir}" && /opt/homebrew/opt/node@22/bin/npx next dev --webpack --port 3100`,
    url: "http://localhost:3100",
    reuseExistingServer: true,
    timeout: 300 * 1000,
  },
});
