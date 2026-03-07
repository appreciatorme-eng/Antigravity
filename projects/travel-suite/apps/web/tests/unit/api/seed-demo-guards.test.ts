import { expect, it } from "vitest";

import {
  hasValidSeedDemoCronSecret,
  isSeedDemoBlockedInProduction,
} from "../../../src/app/api/_handlers/admin/seed-demo/guards";

it("blocks seed-demo in production unless explicitly allowed", () => {
  expect(isSeedDemoBlockedInProduction("production", undefined)).toBe(true);
  expect(isSeedDemoBlockedInProduction("production", "false")).toBe(true);
  expect(isSeedDemoBlockedInProduction("production", "true")).toBe(false);
  expect(isSeedDemoBlockedInProduction("development", undefined)).toBe(false);
});

it("validates the optional cron secret correctly", () => {
  expect(hasValidSeedDemoCronSecret(undefined, null)).toBe(true);
  expect(hasValidSeedDemoCronSecret("expected", "expected")).toBe(true);
  expect(hasValidSeedDemoCronSecret("expected", " expected ")).toBe(true);
  expect(hasValidSeedDemoCronSecret("expected", "wrong")).toBe(false);
});
