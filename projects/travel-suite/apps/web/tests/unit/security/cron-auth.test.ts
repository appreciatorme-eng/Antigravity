import { afterEach, expect, it } from "vitest";
import { authorizeCronRequest, isCronSecretBearer, isCronSecretHeader } from "../../../src/lib/security/cron-auth";

const envKeys = [
  "CRON_SECRET",
  "NOTIFICATION_CRON_SECRET",
  "CRON_SIGNING_SECRET",
  "NOTIFICATION_SIGNING_SECRET",
];

const originalEnv: Partial<Record<(typeof envKeys)[number], string | undefined>> = {};
for (const key of envKeys) {
  originalEnv[key] = process.env[key];
}

function resetCronEnv() {
  for (const key of envKeys) {
    const value = originalEnv[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

afterEach(() => {
  resetCronEnv();
});

it("authorizeCronRequest fails closed when cron credentials are not configured", async () => {
  delete process.env.CRON_SECRET;
  delete process.env.NOTIFICATION_CRON_SECRET;
  delete process.env.CRON_SIGNING_SECRET;
  delete process.env.NOTIFICATION_SIGNING_SECRET;

  const request = new Request("http://localhost/api/social/process-queue", { method: "POST" });
  const result = await authorizeCronRequest(request);

  expect(result.authorized).toBe(false);
  expect(result.status).toBe(401);
  expect(result.reason).toBe("Unauthorized cron request");
});

it("authorizeCronRequest accepts configured bearer secret", async () => {
  process.env.CRON_SECRET = "unit-cron-secret";
  delete process.env.NOTIFICATION_CRON_SECRET;
  delete process.env.CRON_SIGNING_SECRET;
  delete process.env.NOTIFICATION_SIGNING_SECRET;

  const request = new Request("http://localhost/api/social/process-queue", {
    method: "POST",
    headers: {
      authorization: "Bearer unit-cron-secret",
      "x-cron-idempotency-key": `unit-${Date.now()}-${Math.random()}`,
    },
  });

  const result = await authorizeCronRequest(request);

  expect(result.authorized).toBe(true);
  expect(result.status).toBe(200);
  expect(result.mode).toBe("bearer");
});

it("authorizeCronRequest rejects invalid bearer secret", async () => {
  process.env.CRON_SECRET = "unit-cron-secret";
  delete process.env.NOTIFICATION_CRON_SECRET;

  const request = new Request("http://localhost/api/social/process-queue", {
    method: "POST",
    headers: {
      authorization: "Bearer wrong-secret",
      "x-cron-idempotency-key": `unit-${Date.now()}-${Math.random()}`,
    },
  });

  const result = await authorizeCronRequest(request);

  expect(result.authorized).toBe(false);
  expect(result.status).toBe(401);
});

it("helpers validate cron bearer and header secrets", () => {
  process.env.CRON_SECRET = "unit-secret";
  expect(isCronSecretBearer("Bearer unit-secret")).toBe(true);
  expect(isCronSecretBearer("Bearer wrong")).toBe(false);
  expect(isCronSecretHeader("unit-secret")).toBe(true);
  expect(isCronSecretHeader("wrong")).toBe(false);
});

it("authorizeCronRequest accepts x-cron-secret header mode", async () => {
  process.env.CRON_SECRET = "header-cron-secret";
  delete process.env.NOTIFICATION_CRON_SECRET;
  delete process.env.CRON_SIGNING_SECRET;
  delete process.env.NOTIFICATION_SIGNING_SECRET;

  const request = new Request("http://localhost/api/cron/test", {
    method: "POST",
    headers: {
      "x-cron-secret": "header-cron-secret",
      "x-cron-idempotency-key": `unit-header-${Date.now()}-${Math.random()}`,
    },
  });

  const result = await authorizeCronRequest(request);
  expect(result.authorized).toBe(true);
  expect(result.mode).toBe("header");
});

it("authorizeCronRequest rejects wrong x-cron-secret header", async () => {
  process.env.CRON_SECRET = "correct-secret";
  delete process.env.NOTIFICATION_CRON_SECRET;
  delete process.env.CRON_SIGNING_SECRET;
  delete process.env.NOTIFICATION_SIGNING_SECRET;

  const request = new Request("http://localhost/api/cron/test", {
    method: "POST",
    headers: {
      "x-cron-secret": "wrong-secret",
      "x-cron-idempotency-key": `unit-header-wrong-${Date.now()}-${Math.random()}`,
    },
  });

  const result = await authorizeCronRequest(request);
  expect(result.authorized).toBe(false);
  expect(result.status).toBe(401);
});

it("authorizeCronRequest detects replay attack (same idempotency key)", async () => {
  process.env.CRON_SECRET = "replay-test-secret";
  delete process.env.NOTIFICATION_CRON_SECRET;
  delete process.env.CRON_SIGNING_SECRET;
  delete process.env.NOTIFICATION_SIGNING_SECRET;

  const idempotencyKey = `replay-key-${Date.now()}-${Math.random()}`;
  const makeReq = () =>
    new Request("http://localhost/api/cron/replay-test", {
      method: "POST",
      headers: {
        authorization: "Bearer replay-test-secret",
        "x-cron-idempotency-key": idempotencyKey,
      },
    });

  const first = await authorizeCronRequest(makeReq());
  expect(first.authorized).toBe(true);

  const second = await authorizeCronRequest(makeReq());
  expect(second.authorized).toBe(false);
  expect(second.status).toBe(409);
  expect(second.reason).toBe("Replay detected");
});

it("isCronSecretBearer returns false for non-Bearer prefix", () => {
  process.env.CRON_SECRET = "my-secret";
  expect(isCronSecretBearer("Basic my-secret")).toBe(false);
  expect(isCronSecretBearer("my-secret")).toBe(false);
  expect(isCronSecretBearer("")).toBe(false);
});

it("isCronSecretBearer returns false when no secrets configured", () => {
  delete process.env.CRON_SECRET;
  delete process.env.NOTIFICATION_CRON_SECRET;
  expect(isCronSecretBearer("Bearer anything")).toBe(false);
});

it("isCronSecretHeader returns false when no secrets configured", () => {
  delete process.env.CRON_SECRET;
  delete process.env.NOTIFICATION_CRON_SECRET;
  expect(isCronSecretHeader("anything")).toBe(false);
});
