import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";

const createClientMock = vi.fn();
const createOrderMock = vi.fn();
const enforceRateLimitMock = vi.fn();
const getIntegrationDisabledMessageMock = vi.fn(() => "Payments disabled");
const isPaymentsIntegrationEnabledMock = vi.fn(() => true);

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/payments/payment-service", () => ({
  paymentService: {
    createOrder: createOrderMock,
  },
}));

vi.mock("@/lib/integrations", () => ({
  getIntegrationDisabledMessage: getIntegrationDisabledMessageMock,
  isPaymentsIntegrationEnabled: isPaymentsIntegrationEnabledMock,
}));

vi.mock("@/lib/security/rate-limit", () => ({
  enforceRateLimit: enforceRateLimitMock,
}));

async function loadRoute() {
  vi.resetModules();
  return import("../../../src/app/api/_handlers/payments/create-order/route");
}

beforeEach(() => {
  vi.clearAllMocks();
  isPaymentsIntegrationEnabledMock.mockReturnValue(true);
  enforceRateLimitMock.mockResolvedValue({ success: true });
});

it("returns a normalized unauthorized error envelope", async () => {
  createClientMock.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  });

  const { POST } = await loadRoute();
  const response = await POST(
    new NextRequest("http://localhost/api/payments/create-order", {
      method: "POST",
      body: JSON.stringify({ amount: 1000 }),
      headers: { "content-type": "application/json" },
    })
  );
  const payload = await response.json();

  expect(response.status).toBe(401);
  expect(payload).toEqual({
    data: null,
    error: "Unauthorized",
  });
});

it("returns the created order in the normalized success envelope", async () => {
  createClientMock.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { organization_id: "org-1" },
            error: null,
          }),
        })),
      })),
    })),
  });
  createOrderMock.mockResolvedValue({
    id: "order_123",
    amount: 5000,
    currency: "INR",
  });

  const { POST } = await loadRoute();
  const response = await POST(
    new NextRequest("http://localhost/api/payments/create-order", {
      method: "POST",
      body: JSON.stringify({ amount: 5000 }),
      headers: { "content-type": "application/json" },
    })
  );
  const payload = await response.json();

  expect(response.status).toBe(200);
  expect(payload).toEqual({
    data: {
      order: {
        id: "order_123",
        amount: 5000,
        currency: "INR",
      },
    },
    error: null,
  });
  expect(createOrderMock).toHaveBeenCalledWith(5000, "INR", "org-1", {});
});
