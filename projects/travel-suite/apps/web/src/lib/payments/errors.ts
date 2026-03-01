export type PaymentOperation =
  | "verify_webhook_signature"
  | "ensure_customer"
  | "create_subscription"
  | "cancel_subscription"
  | "create_invoice"
  | "record_payment"
  | "handle_subscription_charged"
  | "handle_payment_failed"
  | "notify_subscription_paused"
  | "log_payment_event"
  | "get_current_subscription"
  | "check_tier_limit"
  | "create_order";

export type PaymentErrorCode =
  | "payments_config_error"
  | "payments_invalid_input"
  | "payments_not_found"
  | "payments_provider_error"
  | "payments_db_error"
  | "payments_webhook_signature_invalid"
  | "payments_unknown_error";

export interface PaymentErrorTags {
  operation?: PaymentOperation;
  context?: "user_session" | "admin";
  retryable?: boolean;
  severity?: "low" | "medium" | "high" | "critical";
  [key: string]: string | number | boolean | undefined;
}

export class PaymentServiceError extends Error {
  readonly code: PaymentErrorCode;
  readonly operation: PaymentOperation;
  readonly tags: PaymentErrorTags;
  readonly cause?: unknown;

  constructor(params: {
    code: PaymentErrorCode;
    message: string;
    operation: PaymentOperation;
    tags?: PaymentErrorTags;
    cause?: unknown;
  }) {
    super(params.message);
    this.name = "PaymentServiceError";
    this.code = params.code;
    this.operation = params.operation;
    this.tags = {
      operation: params.operation,
      ...(params.tags || {}),
    };
    this.cause = params.cause;
  }
}

export function toPaymentServiceError(
  error: unknown,
  fallback: {
    code: PaymentErrorCode;
    message: string;
    operation: PaymentOperation;
    tags?: PaymentErrorTags;
  }
): PaymentServiceError {
  if (error instanceof PaymentServiceError) {
    return error;
  }

  if (error instanceof Error) {
    const normalizedMessage = error.message.toLowerCase();

    if (normalizedMessage.includes("not found")) {
      return new PaymentServiceError({
        code: "payments_not_found",
        message: error.message,
        operation: fallback.operation,
        tags: fallback.tags,
        cause: error,
      });
    }

    if (normalizedMessage.includes("signature")) {
      return new PaymentServiceError({
        code: "payments_webhook_signature_invalid",
        message: error.message,
        operation: fallback.operation,
        tags: fallback.tags,
        cause: error,
      });
    }

    if (
      normalizedMessage.includes("supabase") ||
      normalizedMessage.includes("database") ||
      normalizedMessage.includes("relation") ||
      normalizedMessage.includes("column")
    ) {
      return new PaymentServiceError({
        code: "payments_db_error",
        message: error.message,
        operation: fallback.operation,
        tags: fallback.tags,
        cause: error,
      });
    }

    if (
      normalizedMessage.includes("razorpay") ||
      normalizedMessage.includes("provider") ||
      normalizedMessage.includes("api")
    ) {
      return new PaymentServiceError({
        code: "payments_provider_error",
        message: error.message,
        operation: fallback.operation,
        tags: fallback.tags,
        cause: error,
      });
    }

    return new PaymentServiceError({
      code: fallback.code,
      message: error.message,
      operation: fallback.operation,
      tags: fallback.tags,
      cause: error,
    });
  }

  return new PaymentServiceError({
    code: fallback.code,
    message: fallback.message,
    operation: fallback.operation,
    tags: fallback.tags,
    cause: error,
  });
}

export function paymentErrorHttpStatus(error: PaymentServiceError): number {
  switch (error.code) {
    case "payments_invalid_input":
      return 400;
    case "payments_not_found":
      return 404;
    case "payments_webhook_signature_invalid":
      return 401;
    case "payments_config_error":
      return 503;
    case "payments_db_error":
    case "payments_provider_error":
    case "payments_unknown_error":
    default:
      return 500;
  }
}
