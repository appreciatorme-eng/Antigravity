import { NextResponse } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";

const enforceRateLimitMock = vi.fn();

vi.mock("@/lib/security/rate-limit", () => ({
  enforceRateLimit: enforceRateLimitMock,
}));

async function loadModule() {
  vi.resetModules();
  return import("../../../src/lib/security/public-rate-limit");
}

beforeEach(() => {
  vi.clearAllMocks();
});

it("prefers the first forwarded IP address", async () => {
  const { getRequestIp } = await loadModule();

  expect(
    getRequestIp({
      headers: new Headers({
        "x-forwarded-for": "203.0.113.10, 10.0.0.1",
        "x-real-ip": "198.51.100.5",
      }),
    }),
  ).toBe("203.0.113.10");
});

it("falls back to x-real-ip and unknown", async () => {
  const { getRequestIp } = await loadModule();

  expect(
    getRequestIp({
      headers: new Headers({
        "x-real-ip": "198.51.100.5",
      }),
    }),
  ).toBe("198.51.100.5");

  expect(getRequestIp({ headers: new Headers() })).toBe("unknown");
});

it("sets standard rate limit headers", async () => {
  const { withRateLimitHeaders } = await loadModule();
  const response = withRateLimitHeaders(new NextResponse(null), {
    success: false,
    limit: 10,
    remaining: 0,
    reset: 123456,
  });

  expect(response.headers.get("x-ratelimit-limit")).toBe("10");
  // x-ratelimit-remaining removed (L-01: exposes remaining count to attackers)
  expect(response.headers.get("x-ratelimit-remaining")).toBeNull();
  expect(response.headers.get("x-ratelimit-reset")).toBe("123456");
});

it("returns null when the public route is under the limit", async () => {
  enforceRateLimitMock.mockResolvedValueOnce({
    success: true,
    limit: 20,
    remaining: 19,
    reset: Date.now() + 60_000,
  });

  const { enforcePublicRouteRateLimit } = await loadModule();
  const result = await enforcePublicRouteRateLimit(
    new Request("http://localhost", {
      headers: {
        "x-forwarded-for": "203.0.113.10",
      },
    }),
    {
      identifier: "share",
      limit: 20,
      windowMs: 60_000,
      prefix: "unit:public",
      message: "Too many requests",
    },
  );

  expect(result).toBeNull();
  expect(enforceRateLimitMock).toHaveBeenCalledWith({
    identifier: "203.0.113.10:share",
    limit: 20,
    windowMs: 60_000,
    prefix: "unit:public",
  });
});

it("returns a 429 response with retry and rate limit headers when blocked", async () => {
  enforceRateLimitMock.mockResolvedValueOnce({
    success: false,
    limit: 5,
    remaining: 0,
    reset: Date.now() + 30_000,
  });

  const { enforcePublicRouteRateLimit } = await loadModule();
  const response = await enforcePublicRouteRateLimit(
    new Request("http://localhost", {
      headers: {
        "x-real-ip": "198.51.100.5",
      },
    }),
    {
      identifier: "share",
      limit: 5,
      windowMs: 60_000,
      prefix: "unit:public",
      message: "Too many public requests",
    },
  );

  expect(response?.status).toBe(429);
  expect(response?.headers.get("retry-after")).toBeTruthy();
  expect(response?.headers.get("x-ratelimit-limit")).toBe("5");
  await expect(response?.json()).resolves.toEqual({
    data: null,
    error: "Too many public requests",
  });
});
