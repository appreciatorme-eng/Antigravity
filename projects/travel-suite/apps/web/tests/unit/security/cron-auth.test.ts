import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
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

test("authorizeCronRequest fails closed when cron credentials are not configured", async () => {
  delete process.env.CRON_SECRET;
  delete process.env.NOTIFICATION_CRON_SECRET;
  delete process.env.CRON_SIGNING_SECRET;
  delete process.env.NOTIFICATION_SIGNING_SECRET;

  const request = new Request("http://localhost/api/social/process-queue", { method: "POST" });
  const result = await authorizeCronRequest(request);

  assert.equal(result.authorized, false);
  assert.equal(result.status, 401);
  assert.equal(result.reason, "Unauthorized cron request");
});

test("authorizeCronRequest accepts configured bearer secret", async () => {
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

  assert.equal(result.authorized, true);
  assert.equal(result.status, 200);
  assert.equal(result.mode, "bearer");
});

test("authorizeCronRequest rejects invalid bearer secret", async () => {
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

  assert.equal(result.authorized, false);
  assert.equal(result.status, 401);
});

test("helpers validate cron bearer and header secrets", () => {
  process.env.CRON_SECRET = "unit-secret";
  assert.equal(isCronSecretBearer("Bearer unit-secret"), true);
  assert.equal(isCronSecretBearer("Bearer wrong"), false);
  assert.equal(isCronSecretHeader("unit-secret"), true);
  assert.equal(isCronSecretHeader("wrong"), false);
});
