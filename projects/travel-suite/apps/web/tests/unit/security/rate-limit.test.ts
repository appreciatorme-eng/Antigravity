import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { enforceRateLimit } from "../../../src/lib/security/rate-limit";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("local in-memory fallback (no Upstash)", () => {
it("enforces the local rate limiter when Upstash is not configured", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-03-07T00:00:00.000Z"));

  const options = {
    identifier: "user-1",
    limit: 2,
    windowMs: 1_000,
    prefix: "unit:rate-limit",
  };

  await expect(enforceRateLimit(options)).resolves.toMatchObject({
    success: true,
    remaining: 1,
  });
  await expect(enforceRateLimit(options)).resolves.toMatchObject({
    success: true,
    remaining: 0,
  });
  await expect(enforceRateLimit(options)).resolves.toMatchObject({
    success: false,
    remaining: 0,
  });

  vi.advanceTimersByTime(1_001);

  await expect(enforceRateLimit(options)).resolves.toMatchObject({
    success: true,
    remaining: 1,
  });
});

it("isolates rate limits per identifier", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-03-07T01:00:00.000Z"));
  const base = { limit: 1, windowMs: 60_000, prefix: "unit:isolation" };

  const a = await enforceRateLimit({ ...base, identifier: "user-a" });
  const b = await enforceRateLimit({ ...base, identifier: "user-b" });

  expect(a.success).toBe(true);
  expect(b.success).toBe(true);

  const a2 = await enforceRateLimit({ ...base, identifier: "user-a" });
  expect(a2.success).toBe(false);
  expect(a2.remaining).toBe(0);
});

it("isolates rate limits per prefix", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-03-07T02:00:00.000Z"));
  const id = "shared-user";
  const opts1 = { identifier: id, limit: 1, windowMs: 60_000, prefix: "unit:prefixA" };
  const opts2 = { identifier: id, limit: 1, windowMs: 60_000, prefix: "unit:prefixB" };

  const r1 = await enforceRateLimit(opts1);
  const r2 = await enforceRateLimit(opts2);
  expect(r1.success).toBe(true);
  expect(r2.success).toBe(true);
});

it("returns correct limit and reset fields", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-03-07T03:00:00.000Z"));
  const now = Date.now();
  const windowMs = 5_000;

  const result = await enforceRateLimit({
    identifier: "user-reset",
    limit: 10,
    windowMs,
    prefix: "unit:reset-fields",
  });

  expect(result.limit).toBe(10);
  expect(result.reset).toBeGreaterThanOrEqual(now + windowMs - 100);
  expect(result.remaining).toBe(9);
});

it("logs a warning to console when Upstash is not configured in dev", async () => {
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;

  await enforceRateLimit({
    identifier: "warn-user",
    limit: 5,
    windowMs: 10_000,
    prefix: "unit:warn-test",
  });

  expect(warnSpy).toHaveBeenCalled();
  warnSpy.mockRestore();
});

it("fail-closed: rejects request when Upstash is not configured in production", async () => {
  vi.stubEnv("NODE_ENV", "production");
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  const result = await enforceRateLimit({
    identifier: "prod-warn-user",
    limit: 5,
    windowMs: 10_000,
    prefix: "unit:prod-warn-test",
  });

  expect(result.success).toBe(false);
  expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("FAIL-CLOSED"));
  errorSpy.mockRestore();
});

});
