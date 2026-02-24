import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const configDir = __dirname;
const appDir = path.resolve(configDir, "..");

export default defineConfig({
  testDir: "./tests",
  testMatch: /public-api\.contract\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3100",
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
      `cd "${appDir}" && /opt/homebrew/opt/node@22/bin/npx next dev --webpack --port 3100`,
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120 * 1000,
  },
});
