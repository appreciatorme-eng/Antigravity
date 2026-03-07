import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";

const requireAdminMock = vi.fn();
const getFeatureLimitStatusMock = vi.fn();
const enforceRateLimitMock = vi.fn();

vi.mock("@/lib/auth/admin", () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock("@/lib/subscriptions/limits", () => ({
  getFeatureLimitStatus: getFeatureLimitStatusMock,
}));

vi.mock("@/lib/security/rate-limit", () => ({
  enforceRateLimit: enforceRateLimitMock,
}));

async function loadRoute() {
  vi.resetModules();
  return import("../../../src/app/api/_handlers/proposals/create/route");
}

beforeEach(() => {
  vi.clearAllMocks();
});

it("returns the admin auth response when unauthenticated", async () => {
  requireAdminMock.mockResolvedValue({
    ok: false,
    response: Response.json({ error: "Unauthorized" }, { status: 401 }),
  });

  const { POST } = await loadRoute();
  const response = await POST(
    new NextRequest("http://localhost/api/proposals/create", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    })
  );

  expect(response.status).toBe(401);
});

it("returns 429 when the proposal create rate limit is exceeded", async () => {
  requireAdminMock.mockResolvedValue({
    ok: true,
    userId: "admin-1",
    organizationId: "org-1",
    adminClient: {},
  });
  enforceRateLimitMock.mockResolvedValue({ success: false });

  const { POST } = await loadRoute();
  const response = await POST(
    new NextRequest("http://localhost/api/proposals/create", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    })
  );

  expect(response.status).toBe(429);
});

it("returns 400 for an invalid proposal payload", async () => {
  requireAdminMock.mockResolvedValue({
    ok: true,
    userId: "admin-1",
    organizationId: "org-1",
    adminClient: {},
  });
  enforceRateLimitMock.mockResolvedValue({ success: true });

  const { POST } = await loadRoute();
  const response = await POST(
    new NextRequest("http://localhost/api/proposals/create", {
      method: "POST",
      body: JSON.stringify({ templateId: "not-a-uuid" }),
      headers: { "content-type": "application/json" },
    })
  );

  expect(response.status).toBe(400);
});
