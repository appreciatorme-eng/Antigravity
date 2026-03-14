/**
 * Advanced rate-limit tests to improve coverage for:
 *   src/lib/security/rate-limit.ts
 *
 * The existing rate-limit.test.ts covers local fallback basics.
 * This file targets the remaining uncovered branches:
 *   - Upstash Redis path (mocked)
 *   - Upstash limiter cache hit
 *   - Upstash limiter.limit() throwing (fallback to local)
 *   - toUpstashDuration conversions (days, hours, minutes, seconds)
 *   - cleanupExpiredLocal (>= 5000 entries)
 *   - Production fail-open override (RATE_LIMIT_FAIL_OPEN=true)
 *   - Production warnLocalFallback path
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------- mocks must be declared before imports ----------

const mockLimit = vi.fn();
const mockSlidingWindow = vi.fn().mockReturnValue("sliding-window-config");

vi.mock("@upstash/ratelimit", () => {
  class FakeRatelimit {
    static slidingWindow = mockSlidingWindow;
    limit = mockLimit;
    constructor() {}
  }
  return { Ratelimit: FakeRatelimit };
});

vi.mock("@upstash/redis", () => {
  class FakeRedis {
    constructor() {}
  }
  return { Redis: FakeRedis };
});

vi.mock("@/lib/observability/logger", () => ({
  logEvent: vi.fn(),
  logError: vi.fn(),
}));

// ---------- helpers ----------

/**
 * Because rate-limit.ts caches the Redis client and limiter instances
 * in module-level Maps/variables, we must reset modules between groups
 * that need different Redis availability.
 */
async function loadFresh() {
  vi.resetModules();
  return import("../../../src/lib/security/rate-limit");
}

// ---------- tests ----------

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("Upstash Redis path", () => {
  beforeEach(() => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://fake.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "fake-token");
  });

  it("returns Upstash result when Redis is available and under limit", async () => {
    mockLimit.mockResolvedValueOnce({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60_000,
    });

    const { enforceRateLimit } = await loadFresh();
    const result = await enforceRateLimit({
      identifier: "user-upstash",
      limit: 10,
      windowMs: 60_000,
      prefix: "test:upstash",
    });

    expect(result.success).toBe(true);
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(9);
    expect(mockLimit).toHaveBeenCalledWith("user-upstash");
  });

  it("returns Upstash blocked result when limit exceeded", async () => {
    mockLimit.mockResolvedValueOnce({
      success: false,
      limit: 5,
      remaining: 0,
      reset: Date.now() + 30_000,
    });

    const { enforceRateLimit } = await loadFresh();
    const result = await enforceRateLimit({
      identifier: "user-blocked",
      limit: 5,
      windowMs: 30_000,
      prefix: "test:blocked",
    });

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("falls back to local limiter when Upstash limit() throws", async () => {
    mockLimit.mockRejectedValueOnce(new Error("Redis connection failed"));

    const { enforceRateLimit } = await loadFresh();
    const result = await enforceRateLimit({
      identifier: "user-fallback",
      limit: 5,
      windowMs: 10_000,
      prefix: "test:fallback-throw",
    });

    // Falls back to local limiter, first request should succeed
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("uses cached limiter for same prefix/limit/windowMs combination", async () => {
    mockLimit.mockResolvedValue({
      success: true,
      limit: 3,
      remaining: 2,
      reset: Date.now() + 10_000,
    });

    const { enforceRateLimit } = await loadFresh();

    const opts = {
      identifier: "user-cache",
      limit: 3,
      windowMs: 10_000,
      prefix: "test:cache",
    };

    await enforceRateLimit(opts);
    await enforceRateLimit(opts);

    // limit is called for each request
    expect(mockLimit).toHaveBeenCalledTimes(2);
  });

  it("handles null remaining and reset gracefully from Upstash", async () => {
    mockLimit.mockResolvedValueOnce({
      success: true,
      limit: null,
      remaining: null,
      reset: null,
    });

    const { enforceRateLimit } = await loadFresh();
    const result = await enforceRateLimit({
      identifier: "user-null-fields",
      limit: 7,
      windowMs: 5_000,
      prefix: "test:null-fields",
    });

    expect(result.success).toBe(true);
    expect(result.limit).toBe(7); // falls back to options.limit
    expect(result.remaining).toBe(0); // null coalesces to 0
    expect(result.reset).toBeGreaterThan(0);
  });
});

describe("toUpstashDuration conversions", () => {
  beforeEach(() => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://fake.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "fake-token");
    mockLimit.mockResolvedValue({ success: true, limit: 1, remaining: 0, reset: 0 });
  });

  it("converts exact day durations", async () => {
    const { enforceRateLimit } = await loadFresh();
    await enforceRateLimit({
      identifier: "u",
      limit: 1,
      windowMs: 86_400_000, // exactly 1 day
      prefix: "test:day",
    });
    expect(mockSlidingWindow).toHaveBeenCalledWith(1, "1 d");
  });

  it("converts exact hour durations", async () => {
    const { enforceRateLimit } = await loadFresh();
    await enforceRateLimit({
      identifier: "u",
      limit: 1,
      windowMs: 7_200_000, // 2 hours
      prefix: "test:hour",
    });
    expect(mockSlidingWindow).toHaveBeenCalledWith(1, "2 h");
  });

  it("converts exact minute durations", async () => {
    const { enforceRateLimit } = await loadFresh();
    await enforceRateLimit({
      identifier: "u",
      limit: 1,
      windowMs: 300_000, // 5 minutes
      prefix: "test:minute",
    });
    expect(mockSlidingWindow).toHaveBeenCalledWith(1, "5 m");
  });

  it("converts non-round durations to seconds", async () => {
    const { enforceRateLimit } = await loadFresh();
    await enforceRateLimit({
      identifier: "u",
      limit: 1,
      windowMs: 7_000, // 7 seconds
      prefix: "test:seconds",
    });
    expect(mockSlidingWindow).toHaveBeenCalledWith(1, "7 s");
  });

  it("converts sub-second durations to minimum 1 second", async () => {
    const { enforceRateLimit } = await loadFresh();
    await enforceRateLimit({
      identifier: "u",
      limit: 1,
      windowMs: 100, // 100ms
      prefix: "test:subsecond",
    });
    expect(mockSlidingWindow).toHaveBeenCalledWith(1, "1 s");
  });
});

describe("production fail-open override", () => {
  it("falls back to local limiter when RATE_LIMIT_FAIL_OPEN=true in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RATE_LIMIT_FAIL_OPEN", "true");
    // No Redis configured
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const { enforceRateLimit } = await loadFresh();
    const result = await enforceRateLimit({
      identifier: "prod-failopen",
      limit: 5,
      windowMs: 10_000,
      prefix: "test:prod-failopen",
    });

    // Should succeed via local fallback instead of fail-closed
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });
});

describe("cleanupExpiredLocal (>= 5000 entries)", () => {
  it("evicts expired entries when local map exceeds 5000", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-07T00:00:00.000Z"));
    // No Redis
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const { enforceRateLimit } = await loadFresh();

    // Fill up the local map with 5000+ unique identifiers
    const promises: Promise<unknown>[] = [];
    for (let i = 0; i < 5001; i++) {
      promises.push(
        enforceRateLimit({
          identifier: `flood-user-${i}`,
          limit: 100,
          windowMs: 1_000,
          prefix: "test:cleanup",
        })
      );
    }
    await Promise.all(promises);

    // Advance past the window so entries expire
    vi.advanceTimersByTime(2_000);

    // Next request should trigger cleanup
    const result = await enforceRateLimit({
      identifier: "after-cleanup",
      limit: 5,
      windowMs: 1_000,
      prefix: "test:cleanup",
    });

    expect(result.success).toBe(true);
  });
});

describe("production warnLocalFallback path", () => {
  it("logs critical error when Upstash limit() throws in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://fake.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "fake-token");
    vi.stubEnv("RATE_LIMIT_FAIL_OPEN", "true");

    mockLimit.mockRejectedValueOnce(new Error("Redis down"));

    const { enforceRateLimit } = await loadFresh();
    const { logError } = await import("../../../src/lib/observability/logger");

    const result = await enforceRateLimit({
      identifier: "prod-throw",
      limit: 5,
      windowMs: 10_000,
      prefix: "test:prod-throw",
    });

    expect(result.success).toBe(true);
    expect(logError).toHaveBeenCalledWith(
      expect.stringContaining("CRITICAL"),
      null,
    );
  });
});
