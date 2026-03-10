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

it("fails closed when no secret is configured (returns false)", () => {
  expect(hasValidSeedDemoCronSecret(undefined, null)).toBe(false);
  expect(hasValidSeedDemoCronSecret(undefined, "anything")).toBe(false);
});

it("validates the cron secret correctly when configured", () => {
  expect(hasValidSeedDemoCronSecret("expected", "expected")).toBe(true);
  expect(hasValidSeedDemoCronSecret("expected", " expected ")).toBe(true);
  expect(hasValidSeedDemoCronSecret("expected", "wrong")).toBe(false);
  expect(hasValidSeedDemoCronSecret("expected", null)).toBe(false);
  expect(hasValidSeedDemoCronSecret("expected", "")).toBe(false);
});
