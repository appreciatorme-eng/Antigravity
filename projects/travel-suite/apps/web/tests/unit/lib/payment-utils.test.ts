// Unit tests for payment-utils.ts — pure utility functions: severity, state, error wrapping.
// No network calls, no database, no mocking required for severityForCode/resolveCompanyState.

vi.mock("@/lib/observability/logger", () => ({ logError: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

import { PaymentServiceError } from "../../../src/lib/payments/errors";
import {
  severityForCode,
  resolveCompanyState,
  wrapPaymentError,
} from "../../../src/lib/payments/payment-utils";

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

// ---------------------------------------------------------------------------
// severityForCode
// ---------------------------------------------------------------------------
describe("severityForCode", () => {
  it("returns 'critical' for payments_config_error", () => {
    expect(severityForCode("payments_config_error")).toBe("critical");
  });

  it("returns 'high' for payments_webhook_signature_invalid", () => {
    expect(severityForCode("payments_webhook_signature_invalid")).toBe("high");
  });

  it("returns 'high' for payments_provider_error", () => {
    expect(severityForCode("payments_provider_error")).toBe("high");
  });

  it("returns 'high' for payments_db_error", () => {
    expect(severityForCode("payments_db_error")).toBe("high");
  });

  it("returns 'medium' for payments_not_found", () => {
    expect(severityForCode("payments_not_found")).toBe("medium");
  });

  it("returns 'medium' for payments_invalid_input", () => {
    expect(severityForCode("payments_invalid_input")).toBe("medium");
  });

  it("returns 'low' for any other code", () => {
    expect(severityForCode("payments_unknown_error")).toBe("low");
  });
});

// ---------------------------------------------------------------------------
// resolveCompanyState
// ---------------------------------------------------------------------------
describe("resolveCompanyState", () => {
  it("returns 'MAHARASHTRA' when called with no args", () => {
    expect(resolveCompanyState()).toBe("MAHARASHTRA");
  });

  it("returns 'MAHARASHTRA' when called with null", () => {
    expect(resolveCompanyState(null)).toBe("MAHARASHTRA");
  });

  it("uppercases the defaultState param when provided", () => {
    expect(resolveCompanyState("karnataka")).toBe("KARNATAKA");
  });

  it("prefers GST_COMPANY_STATE env var over defaultState", () => {
    vi.stubEnv("GST_COMPANY_STATE", "goa");
    expect(resolveCompanyState("karnataka")).toBe("GOA");
    vi.unstubAllEnvs();
  });

  it("prefers NEXT_PUBLIC_GST_COMPANY_STATE as secondary fallback", () => {
    vi.stubEnv("NEXT_PUBLIC_GST_COMPANY_STATE", "delhi");
    expect(resolveCompanyState("karnataka")).toBe("DELHI");
    vi.unstubAllEnvs();
  });

  it("uppercases GST_COMPANY_STATE in the result", () => {
    vi.stubEnv("GST_COMPANY_STATE", "tamil nadu");
    expect(resolveCompanyState()).toBe("TAMIL NADU");
    vi.unstubAllEnvs();
  });
});

// ---------------------------------------------------------------------------
// wrapPaymentError
// ---------------------------------------------------------------------------
describe("wrapPaymentError", () => {
  const fallback = {
    code: "payments_unknown_error" as const,
    operation: "create_order" as const,
    context: "admin" as const,
    message: "fallback message",
  };

  it("always throws a PaymentServiceError", () => {
    expect(() => wrapPaymentError(new Error("boom"), fallback)).toThrow(
      PaymentServiceError,
    );
  });

  it("preserves an existing PaymentServiceError unchanged", () => {
    const existing = new PaymentServiceError({
      code: "payments_config_error",
      message: "original",
      operation: "verify_webhook_signature",
    });

    try {
      wrapPaymentError(existing, fallback);
    } catch (thrown) {
      expect(thrown).toBeInstanceOf(PaymentServiceError);
      const err = thrown as PaymentServiceError;
      expect(err.code).toBe("payments_config_error");
      expect(err.message).toBe("original");
      expect(err.operation).toBe("verify_webhook_signature");
    }
  });

  it("wraps a plain Error using the fallback code", () => {
    try {
      wrapPaymentError(new Error("something broke"), fallback);
    } catch (thrown) {
      expect(thrown).toBeInstanceOf(PaymentServiceError);
      const err = thrown as PaymentServiceError;
      expect(err.code).toBe("payments_unknown_error");
      expect(err.operation).toBe("create_order");
      expect(err.tags.context).toBe("admin");
    }
  });
});
