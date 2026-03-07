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

function createMaybeSingleBuilder<T>(result: T) {
  return {
    eq: vi.fn(() => ({
      maybeSingle: vi.fn().mockResolvedValue({ data: result, error: null }),
    })),
  };
}

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

it("returns a normalized success envelope after the proposal RPC flow completes", async () => {
  const adminClient = {
    from: vi.fn((table: string) => {
      if (table === "tour_templates") {
        return {
          select: vi.fn(() =>
            createMaybeSingleBuilder({
              id: "11111111-1111-1111-1111-111111111111",
              organization_id: "org-1",
            })
          ),
        };
      }

      if (table === "profiles") {
        return {
          select: vi.fn(() =>
            createMaybeSingleBuilder({
              organization_id: "org-1",
            })
          ),
        };
      }

      if (table === "add_ons") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            })),
          })),
        };
      }

      if (table === "proposals") {
        return {
          update: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ error: null }),
          })),
        };
      }

      return {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
    }),
    rpc: vi.fn((name: string) => {
      if (name === "clone_template_to_proposal") {
        return Promise.resolve({
          data: "33333333-3333-4333-8333-333333333333",
          error: null,
        });
      }

      if (name === "calculate_proposal_price") {
        return Promise.resolve({ data: null, error: null });
      }

      return Promise.resolve({ data: null, error: null });
    }),
  };

  requireAdminMock.mockResolvedValue({
    ok: true,
    userId: "admin-1",
    organizationId: "org-1",
    adminClient,
  });
  enforceRateLimitMock.mockResolvedValue({ success: true });
  getFeatureLimitStatusMock
    .mockResolvedValueOnce({
      allowed: true,
      feature: "proposals",
      label: "proposals",
      tier: "pro",
      used: 1,
      limit: 10,
      remaining: 9,
      resetAt: null,
      upgradePlan: null,
    })
    .mockResolvedValueOnce({
      allowed: true,
      feature: "proposals",
      label: "proposals",
      tier: "pro",
      used: 2,
      limit: 10,
      remaining: 8,
      resetAt: null,
      upgradePlan: null,
    });

  const { POST } = await loadRoute();
  const response = await POST(
    new NextRequest("http://localhost/api/proposals/create", {
      method: "POST",
      body: JSON.stringify({
        templateId: "11111111-1111-4111-8111-111111111111",
        clientId: "22222222-2222-4222-8222-222222222222",
        expirationDays: 0,
      }),
      headers: { "content-type": "application/json" },
    })
  );
  const payload = await response.json();

  expect(response.status).toBe(200);
  expect(payload).toEqual({
    data: {
      proposalId: "33333333-3333-4333-8333-333333333333",
      limit: {
        allowed: true,
        feature: "proposals",
        label: "proposals",
        tier: "pro",
        used: 2,
        limit: 10,
        remaining: 8,
        resetAt: null,
        upgradePlan: null,
      },
    },
    error: null,
  });
  expect(adminClient.rpc).toHaveBeenCalledWith("clone_template_to_proposal", {
    p_template_id: "11111111-1111-4111-8111-111111111111",
    p_client_id: "22222222-2222-4222-8222-222222222222",
    p_created_by: "admin-1",
  });
  expect(adminClient.rpc).toHaveBeenCalledWith("calculate_proposal_price", {
    p_proposal_id: "33333333-3333-4333-8333-333333333333",
  });
});
