/**
 * Unit tests for the create-order payment handler:
 *   src/app/api/_handlers/payments/create-order/route.ts
 *
 * Covers:
 *   - Successful order creation
 *   - Payments integration disabled
 *   - Auth failure
 *   - Rate limit exceeded
 *   - Invalid/malformed request body
 *   - Zod validation failures (missing amount, invalid currency, etc.)
 *   - Providing both invoice_id and subscription_id
 *   - Invoice not found
 *   - Invoice amount validation (partial payment)
 *   - Subscription not found
 *   - Razorpay/PaymentService errors
 *   - Generic unexpected errors
 */

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------- mock values ----------

const mockRequireAdmin = vi.fn();
const mockCreateClient = vi.fn();
const mockCreateOrder = vi.fn();
const mockEnforceRateLimit = vi.fn();
const mockIsPaymentsEnabled = vi.fn();
const mockGetDisabledMessage = vi.fn();

// ---------- mocks ----------

vi.mock("@/lib/auth/admin", () => ({
  requireAdmin: (...args: unknown[]) => mockRequireAdmin(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

vi.mock("@/lib/payments/payment-service", () => ({
  paymentService: {
    createOrder: (...args: unknown[]) => mockCreateOrder(...args),
  },
}));

vi.mock("@/lib/security/rate-limit", () => ({
  enforceRateLimit: (...args: unknown[]) => mockEnforceRateLimit(...args),
}));

vi.mock("@/lib/integrations", () => ({
  isPaymentsIntegrationEnabled: () => mockIsPaymentsEnabled(),
  getIntegrationDisabledMessage: (...args: unknown[]) => mockGetDisabledMessage(...args),
}));

vi.mock("@/lib/payments/errors", async () => {
  const actual = await vi.importActual<typeof import("@/lib/payments/errors")>(
    "@/lib/payments/errors"
  );
  return actual;
});

// ---------- helpers ----------

function buildRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/payments/create-order", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

function buildBadJsonRequest(): NextRequest {
  return new NextRequest("http://localhost/api/payments/create-order", {
    method: "POST",
    body: "not-json{{{",
    headers: { "content-type": "application/json" },
  });
}

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn(),
};

async function loadRoute() {
  return import(
    "../../../src/app/api/_handlers/payments/create-order/route"
  );
}

// ---------- setup ----------

beforeEach(() => {
  vi.clearAllMocks();

  // Default: payments enabled, auth passes, rate limit passes
  mockIsPaymentsEnabled.mockReturnValue(true);
  mockGetDisabledMessage.mockReturnValue("Payments disabled");

  mockRequireAdmin.mockResolvedValue({
    ok: true,
    userId: "user-123",
    organizationId: "org-456",
  });

  mockEnforceRateLimit.mockResolvedValue({
    success: true,
    limit: 10,
    remaining: 9,
    reset: Date.now() + 3_600_000,
  });

  mockCreateClient.mockResolvedValue(mockSupabase);

  // Reset supabase chain
  mockSupabase.from.mockReturnThis();
  mockSupabase.select.mockReturnThis();
  mockSupabase.eq.mockReturnThis();
  mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });
});

// ---------- tests ----------

describe("POST /api/payments/create-order", () => {
  describe("successful order creation", () => {
    it("creates an order with valid input", async () => {
      const fakeOrder = { id: "order_abc", amount: 50000, currency: "INR" };
      mockCreateOrder.mockResolvedValueOnce(fakeOrder);

      const { POST } = await loadRoute();
      const response = await POST(
        buildRequest({ amount: 500, currency: "INR" })
      );
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.data.order).toEqual(fakeOrder);
      expect(payload.error).toBeNull();
      expect(mockCreateOrder).toHaveBeenCalledWith(
        500,
        "INR",
        "org-456",
        expect.any(Object)
      );
    });

    it("defaults currency to INR when not specified", async () => {
      mockCreateOrder.mockResolvedValueOnce({ id: "order_def" });

      const { POST } = await loadRoute();
      await POST(buildRequest({ amount: 100 }));

      expect(mockCreateOrder).toHaveBeenCalledWith(
        100,
        "INR",
        "org-456",
        expect.any(Object)
      );
    });

    it("passes invoice_id in notes when provided", async () => {
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: { id: "inv-1", organization_id: "org-456", total_amount: 100, status: "pending" },
        error: null,
      });
      mockCreateOrder.mockResolvedValueOnce({ id: "order_inv" });

      const { POST } = await loadRoute();
      await POST(
        buildRequest({ amount: 100, invoice_id: "inv-1" })
      );

      expect(mockCreateOrder).toHaveBeenCalledWith(
        100,
        "INR",
        "org-456",
        expect.objectContaining({ invoice_id: "inv-1" })
      );
    });

    it("passes subscription_id in notes when provided", async () => {
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: { id: "sub-1", organization_id: "org-456" },
        error: null,
      });
      mockCreateOrder.mockResolvedValueOnce({ id: "order_sub" });

      const { POST } = await loadRoute();
      await POST(
        buildRequest({ amount: 200, subscription_id: "sub-1" })
      );

      expect(mockCreateOrder).toHaveBeenCalledWith(
        200,
        "INR",
        "org-456",
        expect.objectContaining({ subscription_id: "sub-1" })
      );
    });
  });

  describe("payments integration disabled", () => {
    it("returns 503 when payments integration is disabled", async () => {
      mockIsPaymentsEnabled.mockReturnValue(false);
      mockGetDisabledMessage.mockReturnValue("Payments not configured");

      const { POST } = await loadRoute();
      const response = await POST(
        buildRequest({ amount: 100 })
      );
      const payload = await response.json();

      expect(response.status).toBe(503);
      expect(payload.error).toBe("Payments not configured");
      expect(payload.disabled).toBe(true);
    });
  });

  describe("authentication", () => {
    it("returns auth error response when requireAdmin fails", async () => {
      const authResponse = Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
      mockRequireAdmin.mockResolvedValue({
        ok: false,
        response: authResponse,
      });

      const { POST } = await loadRoute();
      const response = await POST(
        buildRequest({ amount: 100 })
      );

      expect(response.status).toBe(401);
    });
  });

  describe("rate limiting", () => {
    it("returns 429 when rate limit exceeded", async () => {
      mockEnforceRateLimit.mockResolvedValue({
        success: false,
        limit: 10,
        remaining: 0,
        reset: Date.now() + 3_600_000,
      });

      const { POST } = await loadRoute();
      const response = await POST(
        buildRequest({ amount: 100 })
      );
      const payload = await response.json();

      expect(response.status).toBe(429);
      expect(payload.error).toContain("Too many");
    });
  });

  describe("request body validation", () => {
    it("returns 400 for malformed JSON", async () => {
      const { POST } = await loadRoute();
      const response = await POST(buildBadJsonRequest());
      const payload = await response.json();

      expect(response.status).toBe(400);
      expect(payload.error).toBe("Invalid request body");
    });

    it("returns 400 for missing amount", async () => {
      const { POST } = await loadRoute();
      const response = await POST(
        buildRequest({ currency: "INR" })
      );

      expect(response.status).toBe(400);
    });

    it("returns 400 for negative amount", async () => {
      const { POST } = await loadRoute();
      const response = await POST(
        buildRequest({ amount: -100 })
      );
      const payload = await response.json();

      expect(response.status).toBe(400);
      expect(payload.error).toContain("positive");
    });

    it("returns 400 for zero amount", async () => {
      const { POST } = await loadRoute();
      const response = await POST(
        buildRequest({ amount: 0 })
      );

      expect(response.status).toBe(400);
    });

    it("returns 400 for invalid currency", async () => {
      const { POST } = await loadRoute();
      const response = await POST(
        buildRequest({ amount: 100, currency: "EUR" })
      );

      expect(response.status).toBe(400);
    });

    it("returns 400 when both invoice_id and subscription_id provided", async () => {
      const { POST } = await loadRoute();
      const response = await POST(
        buildRequest({ amount: 100, invoice_id: "inv-1", subscription_id: "sub-1" })
      );
      const payload = await response.json();

      expect(response.status).toBe(400);
      expect(payload.error).toContain("either");
    });
  });

  describe("invoice validation", () => {
    it("returns 404 when invoice not found", async () => {
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const { POST } = await loadRoute();
      const response = await POST(
        buildRequest({ amount: 100, invoice_id: "inv-missing" })
      );
      const payload = await response.json();

      expect(response.status).toBe(404);
      expect(payload.error).toContain("Invoice not found");
    });

    it("returns 404 when supabase returns an error for invoice", async () => {
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: { message: "DB error" },
      });

      const { POST } = await loadRoute();
      const response = await POST(
        buildRequest({ amount: 100, invoice_id: "inv-err" })
      );

      expect(response.status).toBe(404);
    });

    it("returns 400 when amount is below invoice total and partial not allowed", async () => {
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: {
          id: "inv-1",
          organization_id: "org-456",
          total_amount: 1000,
          status: "pending",
        },
        error: null,
      });

      const { POST } = await loadRoute();
      const response = await POST(
        buildRequest({ amount: 500, invoice_id: "inv-1" })
      );
      const payload = await response.json();

      expect(response.status).toBe(400);
      expect(payload.error).toContain("below invoice total");
      expect(payload.min_amount).toBe(1000);
    });

    it("allows partial payment when allow_partial is true", async () => {
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: {
          id: "inv-1",
          organization_id: "org-456",
          total_amount: 1000,
          status: "pending",
        },
        error: null,
      });
      mockCreateOrder.mockResolvedValueOnce({ id: "order_partial" });

      const { POST } = await loadRoute();
      const response = await POST(
        buildRequest({ amount: 500, invoice_id: "inv-1", allow_partial: true })
      );

      expect(response.status).toBe(200);
    });

    it("allows full amount even when invoice total is set", async () => {
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: {
          id: "inv-1",
          organization_id: "org-456",
          total_amount: 500,
          status: "pending",
        },
        error: null,
      });
      mockCreateOrder.mockResolvedValueOnce({ id: "order_full" });

      const { POST } = await loadRoute();
      const response = await POST(
        buildRequest({ amount: 500, invoice_id: "inv-1" })
      );

      expect(response.status).toBe(200);
    });
  });

  describe("subscription validation", () => {
    it("returns 404 when subscription not found", async () => {
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const { POST } = await loadRoute();
      const response = await POST(
        buildRequest({ amount: 100, subscription_id: "sub-missing" })
      );
      const payload = await response.json();

      expect(response.status).toBe(404);
      expect(payload.error).toContain("Subscription not found");
    });

    it("returns 404 when supabase returns an error for subscription", async () => {
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: { message: "DB error" },
      });

      const { POST } = await loadRoute();
      const response = await POST(
        buildRequest({ amount: 100, subscription_id: "sub-err" })
      );

      expect(response.status).toBe(404);
    });
  });

  describe("payment service errors", () => {
    it("returns mapped HTTP status for PaymentServiceError", async () => {
      const { PaymentServiceError } = await import(
        "../../../src/lib/payments/errors"
      );

      mockCreateOrder.mockRejectedValueOnce(
        new PaymentServiceError({
          code: "payments_provider_error",
          message: "Razorpay API failed",
          operation: "create_order",
        })
      );

      const { POST } = await loadRoute();
      const response = await POST(
        buildRequest({ amount: 100 })
      );
      const payload = await response.json();

      expect(response.status).toBe(500);
      expect(payload.error).toBe("Failed to create payment order");
    });

    it("returns 503 for config errors", async () => {
      const { PaymentServiceError } = await import(
        "../../../src/lib/payments/errors"
      );

      mockCreateOrder.mockRejectedValueOnce(
        new PaymentServiceError({
          code: "payments_config_error",
          message: "Razorpay not configured",
          operation: "create_order",
        })
      );

      const { POST } = await loadRoute();
      const response = await POST(
        buildRequest({ amount: 100 })
      );

      expect(response.status).toBe(503);
    });

    it("returns 500 for unexpected non-PaymentServiceError errors", async () => {
      mockCreateOrder.mockRejectedValueOnce(new Error("Something broke"));

      const { POST } = await loadRoute();
      const response = await POST(
        buildRequest({ amount: 100 })
      );
      const payload = await response.json();

      expect(response.status).toBe(500);
      expect(payload.error).toBe("Failed to create payment order");
    });
  });
});
