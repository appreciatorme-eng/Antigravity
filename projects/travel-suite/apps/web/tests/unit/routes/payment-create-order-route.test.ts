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

function makeAuthenticatedClient(orgId: string | null = "org-1") {
  const singleMock = vi.fn().mockResolvedValue({
    data: orgId ? { organization_id: orgId } : null,
    error: orgId ? null : { message: "not found" },
  });
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ single: singleMock })),
      })),
    })),
  };
}

it("returns 503 when payments integration is disabled", async () => {
  isPaymentsIntegrationEnabledMock.mockReturnValue(false);

  const { POST } = await loadRoute();
  const response = await POST(
    new NextRequest("http://localhost/api/payments/create-order", {
      method: "POST",
      body: JSON.stringify({ amount: 500 }),
      headers: { "content-type": "application/json" },
    })
  );

  expect(response.status).toBe(503);
  const payload = await response.json();
  expect(payload.data).toBeNull();
});

it("returns 429 when rate limit is exceeded", async () => {
  enforceRateLimitMock.mockResolvedValue({ success: false });
  createClientMock.mockResolvedValue(makeAuthenticatedClient());

  const { POST } = await loadRoute();
  const response = await POST(
    new NextRequest("http://localhost/api/payments/create-order", {
      method: "POST",
      body: JSON.stringify({ amount: 500 }),
      headers: { "content-type": "application/json" },
    })
  );

  expect(response.status).toBe(429);
});

it("returns 404 when organization_id is missing from profile", async () => {
  createClientMock.mockResolvedValue(makeAuthenticatedClient(null));

  const { POST } = await loadRoute();
  const response = await POST(
    new NextRequest("http://localhost/api/payments/create-order", {
      method: "POST",
      body: JSON.stringify({ amount: 500 }),
      headers: { "content-type": "application/json" },
    })
  );

  expect(response.status).toBe(404);
});

it("returns 400 when amount is zero", async () => {
  createClientMock.mockResolvedValue(makeAuthenticatedClient());

  const { POST } = await loadRoute();
  const response = await POST(
    new NextRequest("http://localhost/api/payments/create-order", {
      method: "POST",
      body: JSON.stringify({ amount: 0 }),
      headers: { "content-type": "application/json" },
    })
  );

  expect(response.status).toBe(400);
  const payload = await response.json();
  expect(payload.error.toLowerCase()).toContain("amount");
});

it("returns 400 when both invoice_id and subscription_id are provided", async () => {
  createClientMock.mockResolvedValue(makeAuthenticatedClient());

  const { POST } = await loadRoute();
  const response = await POST(
    new NextRequest("http://localhost/api/payments/create-order", {
      method: "POST",
      body: JSON.stringify({ amount: 1000, invoice_id: "inv-1", subscription_id: "sub-1" }),
      headers: { "content-type": "application/json" },
    })
  );

  expect(response.status).toBe(400);
});

it("handles PaymentServiceError from createOrder with correct status", async () => {
  createClientMock.mockResolvedValue(makeAuthenticatedClient());
  const { POST } = await loadRoute();
  const { PaymentServiceError: FreshPSE } = await import("../../../src/lib/payments/errors");
  createOrderMock.mockRejectedValue(
    new FreshPSE({
      code: "payments_config_error",
      message: "Razorpay not configured",
      operation: "create_order",
    })
  );
  const response = await POST(
    new NextRequest("http://localhost/api/payments/create-order", {
      method: "POST",
      body: JSON.stringify({ amount: 1000 }),
      headers: { "content-type": "application/json" },
    })
  );

  expect(response.status).toBe(503);
});

it("returns 500 for unexpected errors from createOrder", async () => {
  createClientMock.mockResolvedValue(makeAuthenticatedClient());
  createOrderMock.mockRejectedValue(new Error("Unexpected failure"));

  const { POST } = await loadRoute();
  const response = await POST(
    new NextRequest("http://localhost/api/payments/create-order", {
      method: "POST",
      body: JSON.stringify({ amount: 1000 }),
      headers: { "content-type": "application/json" },
    })
  );

  expect(response.status).toBe(500);
});
