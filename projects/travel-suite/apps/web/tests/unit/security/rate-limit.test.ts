import { afterEach, expect, it, vi } from "vitest";

import { enforceRateLimit } from "../../../src/lib/security/rate-limit";

afterEach(() => {
  vi.useRealTimers();
});

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
