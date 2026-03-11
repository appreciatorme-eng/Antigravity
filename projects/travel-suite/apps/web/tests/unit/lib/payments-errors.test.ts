// Unit tests for payments/errors.ts — covers PaymentServiceError, toPaymentServiceError,
// and paymentErrorHttpStatus across all error codes and input types.

import { describe, it, expect } from "vitest";
import {
    PaymentServiceError,
    toPaymentServiceError,
    paymentErrorHttpStatus,
} from "../../../src/lib/payments/errors";

describe("PaymentServiceError", () => {
    it("constructs with required fields", () => {
        const err = new PaymentServiceError({
            code: "payments_invalid_input",
            message: "Bad input",
            operation: "create_order",
        });
        expect(err).toBeInstanceOf(Error);
        expect(err).toBeInstanceOf(PaymentServiceError);
        expect(err.name).toBe("PaymentServiceError");
        expect(err.code).toBe("payments_invalid_input");
        expect(err.message).toBe("Bad input");
        expect(err.operation).toBe("create_order");
        expect(err.cause).toBeUndefined();
    });

    it("constructs with optional tags and cause", () => {
        const cause = new Error("original");
        const err = new PaymentServiceError({
            code: "payments_db_error",
            message: "DB failure",
            operation: "record_payment",
            tags: { retryable: true, severity: "high" },
            cause,
        });
        expect(err.cause).toBe(cause);
        expect(err.tags.retryable).toBe(true);
        expect(err.tags.severity).toBe("high");
        expect(err.tags.operation).toBe("record_payment");
    });

    it("includes operation in tags automatically", () => {
        const err = new PaymentServiceError({
            code: "payments_config_error",
            message: "Config missing",
            operation: "create_subscription",
        });
        expect(err.tags.operation).toBe("create_subscription");
    });
});

describe("toPaymentServiceError", () => {
    const fallback = {
        code: "payments_unknown_error" as const,
        message: "Unknown error",
        operation: "create_order" as const,
    };

    it("passes through an existing PaymentServiceError unchanged", () => {
        const original = new PaymentServiceError({
            code: "payments_invalid_input",
            message: "Already a PSE",
            operation: "verify_webhook_signature",
        });
        const result = toPaymentServiceError(original, fallback);
        expect(result).toBe(original);
    });

    it("wraps Error with 'not found' message as payments_not_found", () => {
        const err = new Error("Resource not found in database");
        const result = toPaymentServiceError(err, fallback);
        expect(result.code).toBe("payments_not_found");
        expect(result.cause).toBe(err);
    });

    it("wraps Error with 'signature' message as payments_webhook_signature_invalid", () => {
        const err = new Error("Invalid signature provided");
        const result = toPaymentServiceError(err, fallback);
        expect(result.code).toBe("payments_webhook_signature_invalid");
    });

    it("wraps Error with 'supabase' message as payments_db_error", () => {
        const err = new Error("Supabase query failed");
        const result = toPaymentServiceError(err, fallback);
        expect(result.code).toBe("payments_db_error");
    });

    it("wraps Error with 'database' message as payments_db_error", () => {
        const err = new Error("database connection timeout");
        const result = toPaymentServiceError(err, fallback);
        expect(result.code).toBe("payments_db_error");
    });

    it("wraps Error with 'relation' message as payments_db_error", () => {
        const err = new Error("relation does not exist");
        const result = toPaymentServiceError(err, fallback);
        expect(result.code).toBe("payments_db_error");
    });

    it("wraps Error with 'column' message as payments_db_error", () => {
        const err = new Error("column order_id does not exist");
        const result = toPaymentServiceError(err, fallback);
        expect(result.code).toBe("payments_db_error");
    });

    it("wraps Error with 'razorpay' message as payments_provider_error", () => {
        const err = new Error("Razorpay API timeout");
        const result = toPaymentServiceError(err, fallback);
        expect(result.code).toBe("payments_provider_error");
    });

    it("wraps Error with 'provider' message as payments_provider_error", () => {
        const err = new Error("provider unavailable");
        const result = toPaymentServiceError(err, fallback);
        expect(result.code).toBe("payments_provider_error");
    });

    it("wraps Error with 'api' message as payments_provider_error", () => {
        const err = new Error("API rate limit exceeded");
        const result = toPaymentServiceError(err, fallback);
        expect(result.code).toBe("payments_provider_error");
    });

    it("wraps generic Error as fallback code", () => {
        const err = new Error("something completely unexpected");
        const result = toPaymentServiceError(err, fallback);
        expect(result.code).toBe(fallback.code);
        expect(result.message).toBe(err.message);
        expect(result.cause).toBe(err);
    });

    it("wraps non-Error (string) as fallback", () => {
        const result = toPaymentServiceError("oops", fallback);
        expect(result.code).toBe(fallback.code);
        expect(result.message).toBe(fallback.message);
    });

    it("wraps null as fallback", () => {
        const result = toPaymentServiceError(null, fallback);
        expect(result.code).toBe(fallback.code);
    });
});

describe("paymentErrorHttpStatus", () => {
    it("maps payments_invalid_input to 400", () => {
        const err = new PaymentServiceError({
            code: "payments_invalid_input",
            message: "x",
            operation: "create_order",
        });
        expect(paymentErrorHttpStatus(err)).toBe(400);
    });

    it("maps payments_not_found to 404", () => {
        const err = new PaymentServiceError({
            code: "payments_not_found",
            message: "x",
            operation: "create_order",
        });
        expect(paymentErrorHttpStatus(err)).toBe(404);
    });

    it("maps payments_webhook_signature_invalid to 401", () => {
        const err = new PaymentServiceError({
            code: "payments_webhook_signature_invalid",
            message: "x",
            operation: "verify_webhook_signature",
        });
        expect(paymentErrorHttpStatus(err)).toBe(401);
    });

    it("maps payments_config_error to 503", () => {
        const err = new PaymentServiceError({
            code: "payments_config_error",
            message: "x",
            operation: "create_order",
        });
        expect(paymentErrorHttpStatus(err)).toBe(503);
    });

    it("maps payments_provider_error to 500", () => {
        const err = new PaymentServiceError({
            code: "payments_provider_error",
            message: "x",
            operation: "create_order",
        });
        expect(paymentErrorHttpStatus(err)).toBe(500);
    });

    it("maps payments_db_error to 500", () => {
        const err = new PaymentServiceError({
            code: "payments_db_error",
            message: "x",
            operation: "record_payment",
        });
        expect(paymentErrorHttpStatus(err)).toBe(500);
    });

    it("maps payments_unknown_error to 500", () => {
        const err = new PaymentServiceError({
            code: "payments_unknown_error",
            message: "x",
            operation: "create_order",
        });
        expect(paymentErrorHttpStatus(err)).toBe(500);
    });
});
