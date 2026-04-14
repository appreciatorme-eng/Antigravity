import {
  formatPaymentAmount,
  getStatusColor,
  isExpired,
  type CreatePaymentLinkInput,
  type PaymentEvent,
  type PaymentLinkData,
} from "@/lib/payments/payment-links";

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | { data?: T; error?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error || "Request failed");
  }

  if (payload && "data" in payload && payload.data !== undefined) {
    return payload.data;
  }

  return payload as T;
}

export async function createPaymentLink(
  data: CreatePaymentLinkInput,
): Promise<PaymentLinkData> {
  const response = await fetch("/api/payments/links", {
    // eslint-disable-next-line no-restricted-syntax -- server-side call, not a client mutation
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      currency: "INR",
      ...data,
    }),
  });

  const payload = await parseJsonResponse<{ link: PaymentLinkData }>(response);
  return payload.link;
}

export async function getPaymentLink(token: string): Promise<PaymentLinkData | null> {
  const response = await fetch(`/api/payments/links/${token}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  const payload = await parseJsonResponse<{ link: PaymentLinkData }>(response);
  return payload.link;
}

export async function recordEvent(
  token: string,
  event: PaymentEvent,
): Promise<PaymentLinkData | null> {
  const response = await fetch(`/api/payments/track/${token}`, {
    // eslint-disable-next-line no-restricted-syntax -- server-side call, not a client mutation
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event: event.type,
      metadata: event.metadata,
    }),
  });

  if (response.status === 404) {
    return null;
  }

  return parseJsonResponse<PaymentLinkData>(response);
}

export async function markPaymentLinkPaid(
  token: string,
  razorpayPaymentId: string,
): Promise<PaymentLinkData | null> {
  return recordEvent(token, {
    type: "paid",
    timestamp: new Date().toISOString(),
    metadata: {
      razorpay_payment_id: razorpayPaymentId,
    },
  });
}

export { formatPaymentAmount, getStatusColor, isExpired };
export type { CreatePaymentLinkInput, PaymentEvent, PaymentLinkData };
