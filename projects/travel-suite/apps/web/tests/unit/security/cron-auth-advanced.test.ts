/**
 * Advanced cron-auth tests to improve coverage for:
 *   src/lib/security/cron-auth.ts
 *
 * The existing cron-auth.test.ts covers basic bearer/header/replay scenarios.
 * This file targets the remaining uncovered branches:
 *   - HMAC signature-based auth (isSignedCronRequest)
 *   - Clock skew rejection
 *   - Missing signature fields
 *   - NOTIFICATION_CRON_SECRET as alternative secret
 *   - Replay fingerprint: fallback to nonce, then minute-bucket
 *   - Custom secretHeaderNames option
 *   - Custom maxClockSkewMs / replayWindowMs
 *   - cleanupExpiredLocalReplay (>= 4096 entries)
 *   - Redis replay detection path (mocked)
 *   - Redis replay detection error fallback
 *   - isCronSecretHeader with empty/null values
 */

import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------- mocks ----------

const mockRedisSet = vi.fn();

vi.mock("@upstash/redis", () => {
  class FakeRedis {
    set = mockRedisSet;
    constructor() {}
  }
  return { Redis: FakeRedis };
});

vi.mock("@/lib/observability/logger", () => ({
  logError: vi.fn(),
  logEvent: vi.fn(),
}));

// safe-equal uses real crypto, no need to mock

// ---------- helpers ----------

const ENV_KEYS = [
  "CRON_SECRET",
  "NOTIFICATION_CRON_SECRET",
  "CRON_SIGNING_SECRET",
  "NOTIFICATION_SIGNING_SECRET",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
];

const savedEnv: Record<string, string | undefined> = {};

function saveEnv() {
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
  }
}

function restoreEnv() {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = savedEnv[key];
    }
  }
}

function clearAllCronEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

async function loadFresh() {
  vi.resetModules();
  return import("../../../src/lib/security/cron-auth");
}

function makeSignedRequest(
  url: string,
  signingSecret: string,
  opts?: { method?: string; clockOffsetMs?: number; nonce?: string; idempotencyKey?: string }
): Request {
  const method = opts?.method ?? "POST";
  const nonce = opts?.nonce ?? `nonce-${Math.random()}`;
  const ts = String(Date.now() + (opts?.clockOffsetMs ?? 0));
  const { pathname } = new URL(url);
  const payload = `${ts}:${nonce}:${method}:${pathname}`;
  const signature = createHmac("sha256", signingSecret).update(payload).digest("hex");

  const headers: Record<string, string> = {
    "x-cron-ts": ts,
    "x-cron-nonce": nonce,
    "x-cron-signature": signature,
  };
  if (opts?.idempotencyKey) {
    headers["x-cron-idempotency-key"] = opts.idempotencyKey;
  }

  return new Request(url, { method, headers });
}

// ---------- tests ----------

beforeEach(() => {
  saveEnv();
  clearAllCronEnv();
  vi.clearAllMocks();
});

afterEach(() => {
  restoreEnv();
  vi.useRealTimers();
});

describe("HMAC signature-based auth", () => {
  it("authorizes a correctly signed request", async () => {
    process.env.CRON_SIGNING_SECRET = "test-signing-secret";

    const { authorizeCronRequest } = await loadFresh();
    const request = makeSignedRequest(
      "http://localhost/api/cron/signed-test",
      "test-signing-secret",
      { idempotencyKey: `sig-ok-${Date.now()}-${Math.random()}` }
    );

    const result = await authorizeCronRequest(request);

    expect(result.authorized).toBe(true);
    expect(result.mode).toBe("signature");
  });

  it("rejects a request with wrong signing secret", async () => {
    process.env.CRON_SIGNING_SECRET = "correct-secret";

    const { authorizeCronRequest } = await loadFresh();
    const request = makeSignedRequest(
      "http://localhost/api/cron/wrong-sig",
      "wrong-secret",
      { idempotencyKey: `sig-wrong-${Date.now()}-${Math.random()}` }
    );

    const result = await authorizeCronRequest(request);

    expect(result.authorized).toBe(false);
    expect(result.status).toBe(401);
  });

  it("rejects a request beyond clock skew tolerance", async () => {
    process.env.CRON_SIGNING_SECRET = "clock-secret";

    const { authorizeCronRequest } = await loadFresh();
    // 10 minutes in the past, default skew is 5 minutes
    const request = makeSignedRequest(
      "http://localhost/api/cron/stale",
      "clock-secret",
      {
        clockOffsetMs: -10 * 60_000,
        idempotencyKey: `sig-stale-${Date.now()}-${Math.random()}`,
      }
    );

    const result = await authorizeCronRequest(request);

    expect(result.authorized).toBe(false);
    expect(result.status).toBe(401);
  });

  it("rejects a request with missing signature headers", async () => {
    process.env.CRON_SIGNING_SECRET = "missing-headers-secret";

    const { authorizeCronRequest } = await loadFresh();
    const request = new Request("http://localhost/api/cron/no-sig", {
      method: "POST",
      headers: {
        "x-cron-ts": String(Date.now()),
        // missing x-cron-signature and x-cron-nonce
      },
    });

    const result = await authorizeCronRequest(request);

    expect(result.authorized).toBe(false);
    expect(result.status).toBe(401);
  });

  it("rejects when timestamp is not a valid number", async () => {
    process.env.CRON_SIGNING_SECRET = "ts-invalid";

    const { authorizeCronRequest } = await loadFresh();
    const request = new Request("http://localhost/api/cron/bad-ts", {
      method: "POST",
      headers: {
        "x-cron-ts": "not-a-number",
        "x-cron-nonce": "nonce-1",
        "x-cron-signature": "some-sig",
      },
    });

    const result = await authorizeCronRequest(request);

    expect(result.authorized).toBe(false);
    expect(result.status).toBe(401);
  });

  it("respects custom maxClockSkewMs option", async () => {
    process.env.CRON_SIGNING_SECRET = "custom-skew";

    const { authorizeCronRequest } = await loadFresh();
    // 2 seconds in the past, custom skew of 1 second
    const request = makeSignedRequest(
      "http://localhost/api/cron/tight-skew",
      "custom-skew",
      {
        clockOffsetMs: -2_000,
        idempotencyKey: `sig-skew-${Date.now()}-${Math.random()}`,
      }
    );

    const result = await authorizeCronRequest(request, { maxClockSkewMs: 1_000 });

    expect(result.authorized).toBe(false);
    expect(result.status).toBe(401);
  });

  it("uses x-cron-timestamp as alternative to x-cron-ts", async () => {
    process.env.CRON_SIGNING_SECRET = "alt-ts-secret";

    const { authorizeCronRequest } = await loadFresh();
    const ts = String(Date.now());
    const nonce = `alt-nonce-${Math.random()}`;
    const pathname = "/api/cron/alt-ts";
    const payload = `${ts}:${nonce}:POST:${pathname}`;
    const signature = createHmac("sha256", "alt-ts-secret").update(payload).digest("hex");

    const request = new Request(`http://localhost${pathname}`, {
      method: "POST",
      headers: {
        "x-cron-timestamp": ts,
        "x-cron-nonce": nonce,
        "x-cron-signature": signature,
        "x-cron-idempotency-key": `alt-${Date.now()}-${Math.random()}`,
      },
    });

    const result = await authorizeCronRequest(request);

    expect(result.authorized).toBe(true);
    expect(result.mode).toBe("signature");
  });
});

describe("NOTIFICATION_CRON_SECRET", () => {
  it("accepts NOTIFICATION_CRON_SECRET as an alternative secret", async () => {
    process.env.NOTIFICATION_CRON_SECRET = "notif-secret";

    const { authorizeCronRequest } = await loadFresh();
    const request = new Request("http://localhost/api/cron/notif", {
      method: "POST",
      headers: {
        authorization: "Bearer notif-secret",
        "x-cron-idempotency-key": `notif-${Date.now()}-${Math.random()}`,
      },
    });

    const result = await authorizeCronRequest(request);

    expect(result.authorized).toBe(true);
    expect(result.mode).toBe("bearer");
  });
});

describe("NOTIFICATION_SIGNING_SECRET", () => {
  it("accepts NOTIFICATION_SIGNING_SECRET for HMAC signature auth", async () => {
    process.env.NOTIFICATION_SIGNING_SECRET = "notif-sign-secret";

    const { authorizeCronRequest } = await loadFresh();
    const request = makeSignedRequest(
      "http://localhost/api/cron/notif-sign",
      "notif-sign-secret",
      { idempotencyKey: `notifsig-${Date.now()}-${Math.random()}` }
    );

    const result = await authorizeCronRequest(request);

    expect(result.authorized).toBe(true);
    expect(result.mode).toBe("signature");
  });
});

describe("custom secretHeaderNames option", () => {
  it("reads secret from custom header names", async () => {
    process.env.CRON_SECRET = "custom-header-secret";

    const { authorizeCronRequest } = await loadFresh();
    const request = new Request("http://localhost/api/cron/custom-header", {
      method: "POST",
      headers: {
        "x-my-secret": "custom-header-secret",
        "x-cron-idempotency-key": `custom-hdr-${Date.now()}-${Math.random()}`,
      },
    });

    const result = await authorizeCronRequest(request, {
      secretHeaderNames: ["x-my-secret"],
    });

    expect(result.authorized).toBe(true);
    expect(result.mode).toBe("header");
  });
});

describe("replay fingerprint fallback", () => {
  it("uses nonce as fingerprint when idempotency key is absent", async () => {
    process.env.CRON_SECRET = "replay-nonce-secret";

    const { authorizeCronRequest } = await loadFresh();
    const nonce = `unique-nonce-${Date.now()}-${Math.random()}`;

    const request = new Request("http://localhost/api/cron/nonce-replay", {
      method: "POST",
      headers: {
        authorization: "Bearer replay-nonce-secret",
        "x-cron-nonce": nonce,
        // no idempotency key
      },
    });

    const result = await authorizeCronRequest(request);

    expect(result.authorized).toBe(true);
    expect(result.replayKey).toContain(nonce);
  });

  it("uses minute-bucket fingerprint when both idempotency key and nonce are absent", async () => {
    process.env.CRON_SECRET = "replay-bucket-secret";

    const { authorizeCronRequest } = await loadFresh();

    const request = new Request("http://localhost/api/cron/bucket-replay", {
      method: "POST",
      headers: {
        authorization: "Bearer replay-bucket-secret",
        // no idempotency key, no nonce
      },
    });

    const result = await authorizeCronRequest(request);

    expect(result.authorized).toBe(true);
    // Minute-bucket key format: mode:pathname:method:ts_or_bucket
    expect(result.replayKey).toContain("bearer:/api/cron/bucket-replay:POST:");
  });
});

describe("Redis replay detection", () => {
  beforeEach(() => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://fake.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "fake-token");
  });

  it("claims replay key via Redis SET NX", async () => {
    process.env.CRON_SECRET = "redis-replay-secret";
    mockRedisSet.mockResolvedValueOnce("OK");

    const { authorizeCronRequest } = await loadFresh();
    const request = new Request("http://localhost/api/cron/redis-replay", {
      method: "POST",
      headers: {
        authorization: "Bearer redis-replay-secret",
        "x-cron-idempotency-key": `redis-${Date.now()}-${Math.random()}`,
      },
    });

    const result = await authorizeCronRequest(request);

    expect(result.authorized).toBe(true);
    expect(mockRedisSet).toHaveBeenCalledWith(
      expect.stringContaining("cron-replay:"),
      "1",
      expect.objectContaining({ nx: true, ex: expect.any(Number) })
    );
  });

  it("detects replay when Redis SET NX returns null", async () => {
    process.env.CRON_SECRET = "redis-dup-secret";
    mockRedisSet.mockResolvedValueOnce(null); // key already exists

    const { authorizeCronRequest } = await loadFresh();
    const idempotencyKey = `redis-dup-${Date.now()}-${Math.random()}`;
    const request = new Request("http://localhost/api/cron/redis-dup", {
      method: "POST",
      headers: {
        authorization: "Bearer redis-dup-secret",
        "x-cron-idempotency-key": idempotencyKey,
      },
    });

    const result = await authorizeCronRequest(request);

    expect(result.authorized).toBe(false);
    expect(result.status).toBe(409);
    expect(result.reason).toBe("Replay detected");
  });

  it("falls back to local replay detection when Redis throws", async () => {
    process.env.CRON_SECRET = "redis-err-secret";
    mockRedisSet.mockRejectedValueOnce(new Error("Redis timeout"));

    const { authorizeCronRequest } = await loadFresh();
    const request = new Request("http://localhost/api/cron/redis-err", {
      method: "POST",
      headers: {
        authorization: "Bearer redis-err-secret",
        "x-cron-idempotency-key": `redis-err-${Date.now()}-${Math.random()}`,
      },
    });

    const result = await authorizeCronRequest(request);

    // First local claim should succeed
    expect(result.authorized).toBe(true);
  });

  it("logs critical error when Redis throws in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.CRON_SECRET = "redis-prod-err";
    mockRedisSet.mockRejectedValueOnce(new Error("Redis down"));

    const { authorizeCronRequest } = await loadFresh();
    const { logError } = await import("../../../src/lib/observability/logger");

    const request = new Request("http://localhost/api/cron/redis-prod-err", {
      method: "POST",
      headers: {
        authorization: "Bearer redis-prod-err",
        "x-cron-idempotency-key": `redis-prod-${Date.now()}-${Math.random()}`,
      },
    });

    await authorizeCronRequest(request);

    expect(logError).toHaveBeenCalledWith(
      expect.stringContaining("CRITICAL"),
      null,
    );
  });
});

describe("cleanupExpiredLocalReplay", () => {
  it("evicts expired replay keys when map exceeds 4096 entries", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-07T00:00:00.000Z"));
    process.env.CRON_SECRET = "cleanup-secret";

    const { authorizeCronRequest } = await loadFresh();

    // Fill 4097+ unique replay keys
    const promises: Promise<unknown>[] = [];
    for (let i = 0; i < 4097; i++) {
      const req = new Request("http://localhost/api/cron/cleanup", {
        method: "POST",
        headers: {
          authorization: "Bearer cleanup-secret",
          "x-cron-idempotency-key": `cleanup-${i}`,
        },
      });
      promises.push(authorizeCronRequest(req));
    }
    await Promise.all(promises);

    // Advance past replay window (default 10 minutes)
    vi.advanceTimersByTime(11 * 60_000);

    // Next request should trigger cleanup and succeed
    const req = new Request("http://localhost/api/cron/post-cleanup", {
      method: "POST",
      headers: {
        authorization: "Bearer cleanup-secret",
        "x-cron-idempotency-key": `post-cleanup-${Math.random()}`,
      },
    });

    const result = await authorizeCronRequest(req);
    expect(result.authorized).toBe(true);
  });
});

describe("isCronSecretHeader edge cases", () => {
  it("returns false for empty string", async () => {
    process.env.CRON_SECRET = "some-secret";
    const { isCronSecretHeader } = await loadFresh();
    expect(isCronSecretHeader("")).toBe(false);
  });

  it("returns false for null", async () => {
    process.env.CRON_SECRET = "some-secret";
    const { isCronSecretHeader } = await loadFresh();
    expect(isCronSecretHeader(null)).toBe(false);
  });

  it("returns false for undefined", async () => {
    process.env.CRON_SECRET = "some-secret";
    const { isCronSecretHeader } = await loadFresh();
    expect(isCronSecretHeader(undefined)).toBe(false);
  });

  it("trims whitespace before comparing", async () => {
    process.env.CRON_SECRET = "trimmed-secret";
    const { isCronSecretHeader } = await loadFresh();
    expect(isCronSecretHeader("  trimmed-secret  ")).toBe(true);
  });
});

describe("isCronSecretBearer edge cases", () => {
  it("returns false for null", async () => {
    process.env.CRON_SECRET = "some-secret";
    const { isCronSecretBearer } = await loadFresh();
    expect(isCronSecretBearer(null)).toBe(false);
  });
});
