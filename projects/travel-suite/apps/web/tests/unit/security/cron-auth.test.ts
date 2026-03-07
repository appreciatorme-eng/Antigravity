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
