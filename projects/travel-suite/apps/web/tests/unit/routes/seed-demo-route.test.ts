import { NextRequest } from "next/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const requireAdminMock = vi.fn();
const enforceRateLimitMock = vi.fn();
const passesMutationCsrfGuardMock = vi.fn();

vi.mock("@/lib/auth/admin", () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock("@/lib/security/rate-limit", () => ({
  enforceRateLimit: enforceRateLimitMock,
}));

vi.mock("@/lib/security/admin-mutation-csrf", () => ({
  passesMutationCsrfGuard: passesMutationCsrfGuardMock,
}));

const originalNodeEnv = process.env.NODE_ENV;
const originalAllowSeedInProd = process.env.ALLOW_SEED_IN_PROD;
const originalAdminCronSecret = process.env.ADMIN_CRON_SECRET;

async function loadRoute() {
  vi.resetModules();
  return import("../../../src/app/api/_handlers/admin/seed-demo/route");
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NODE_ENV = "development";
  delete process.env.ALLOW_SEED_IN_PROD;
  delete process.env.ADMIN_CRON_SECRET;
});

afterEach(() => {
  if (originalNodeEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = originalNodeEnv;
  }

  if (originalAllowSeedInProd === undefined) {
    delete process.env.ALLOW_SEED_IN_PROD;
  } else {
    process.env.ALLOW_SEED_IN_PROD = originalAllowSeedInProd;
  }

  if (originalAdminCronSecret === undefined) {
    delete process.env.ADMIN_CRON_SECRET;
  } else {
    process.env.ADMIN_CRON_SECRET = originalAdminCronSecret;
  }
});

it("returns 403 in production unless explicitly enabled", async () => {
  process.env.NODE_ENV = "production";
  const { POST } = await loadRoute();

  const response = await POST(
    new NextRequest("http://localhost/api/admin/seed-demo", { method: "POST" })
  );

  expect(response.status).toBe(403);
});

it("returns the admin auth failure response unchanged", async () => {
  requireAdminMock.mockResolvedValue({
    ok: false,
    response: Response.json({ error: "Unauthorized" }, { status: 401 }),
  });

  const { POST } = await loadRoute();
  const response = await POST(
    new NextRequest("http://localhost/api/admin/seed-demo", { method: "POST" })
  );

  expect(response.status).toBe(401);
});

it("returns 403 when the cron secret is required but missing", async () => {
  process.env.ADMIN_CRON_SECRET = "expected-secret";
  requireAdminMock.mockResolvedValue({
    ok: true,
    userId: "admin-user",
    adminClient: {},
  });
  enforceRateLimitMock.mockResolvedValue({ success: true });
  passesMutationCsrfGuardMock.mockReturnValue(true);

  const { POST } = await loadRoute();
  const response = await POST(
    new NextRequest("http://localhost/api/admin/seed-demo", { method: "POST" })
  );

  expect(response.status).toBe(403);
});
