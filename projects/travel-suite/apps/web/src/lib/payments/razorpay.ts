import crypto from "node:crypto";

type Currency = "INR" | "USD";

export interface Order {
  id: string;
  entity: "order";
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: Currency;
  receipt: string | null;
  status: "created" | "attempted" | "paid";
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export interface Payment {
  id: string;
  entity: "payment";
  amount: number;
  currency: Currency;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  order_id: string;
  method: "upi" | "card" | "netbanking" | "wallet";
  captured: boolean;
  email?: string;
  contact?: string;
  created_at: number;
}

export interface Subscription {
  id: string;
  entity: "subscription";
  plan_id: string;
  customer_id?: string;
  status:
    | "created"
    | "authenticated"
    | "active"
    | "paused"
    | "cancelled"
    | "completed"
    | "expired";
  current_start: number;
  current_end: number;
  ended_at: number | null;
  quantity: number;
  notes: Record<string, string>;
  charge_at: number;
  start_at: number;
  end_at: number;
  auth_attempts: number;
  total_count: number;
  paid_count: number;
  created_at: number;
}

export interface Customer {
  id: string;
  entity: "customer";
  name: string;
  email: string;
  contact?: string;
  gstin?: string;
  notes: Record<string, string>;
  created_at: number;
}

export interface Invoice {
  id: string;
  entity: "invoice";
  customer_id: string;
  subscription_id?: string;
  order_id?: string;
  line_items: Array<{
    name: string;
    amount: number;
    quantity: number;
  }>;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: Currency;
  status: "issued" | "paid" | "partially_paid" | "expired" | "cancelled";
  created_at: number;
  paid_at: number | null;
}

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured");
  }

  return { keyId, keySecret };
}

async function requestRazorpay<T>(
  path: string,
  method: "GET" | "POST",
  body?: Record<string, unknown>
): Promise<T> {
  const { keyId, keySecret } = getRazorpayCredentials();
  const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload === "object"
        ? JSON.stringify(payload)
        : response.statusText || "Razorpay request failed";
    throw new Error(`Razorpay API error (${response.status}): ${message}`);
  }

  return payload as T;
}

function validateWebhookSignature(body: string, signature: string, secret?: string) {
  const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET must be configured");
  }

  const digest = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");
  const expected = Buffer.from(digest, "utf8");
  const received = Buffer.from(signature, "utf8");
  if (expected.length !== received.length) {
    return false;
  }
  return crypto.timingSafeEqual(expected, received);
}

export const razorpay = {
  orders: {
    async create(options: {
      amount: number;
      currency: Currency;
      receipt?: string;
      notes?: Record<string, string>;
    }): Promise<Order> {
      return requestRazorpay<Order>("/orders", "POST", options);
    },

    async fetch(orderId: string): Promise<Order> {
      return requestRazorpay<Order>(`/orders/${encodeURIComponent(orderId)}`, "GET");
    },
  },

  payments: {
    async fetch(paymentId: string): Promise<Payment> {
      return requestRazorpay<Payment>(`/payments/${encodeURIComponent(paymentId)}`, "GET");
    },
  },

  subscriptions: {
    async create(options: {
      plan_id: string;
      customer_notify: 0 | 1;
      total_count?: number;
      quantity?: number;
      notes?: Record<string, string>;
      start_at?: number;
    }): Promise<Subscription> {
      return requestRazorpay<Subscription>("/subscriptions", "POST", options);
    },

    async cancel(subscriptionId: string, cancelAtCycleEnd: boolean): Promise<Subscription> {
      return requestRazorpay<Subscription>(
        `/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
        "POST",
        { cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0 }
      );
    },
  },

  customers: {
    async create(options: {
      name: string;
      email: string;
      contact?: string;
      gstin?: string;
      notes?: Record<string, string>;
    }): Promise<Customer> {
      return requestRazorpay<Customer>("/customers", "POST", options);
    },
  },

  invoices: {
    async create(options: {
      type?: "invoice";
      description?: string;
      customer_id?: string;
      line_items: Array<{
        name: string;
        amount: number;
        quantity: number;
      }>;
      currency?: Currency;
      notes?: Record<string, string>;
      expire_by?: number;
      sms_notify?: 0 | 1;
      email_notify?: 0 | 1;
    }): Promise<Invoice> {
      return requestRazorpay<Invoice>("/invoices", "POST", options);
    },
  },

  webhooks: {
    validateSignature: validateWebhookSignature,
  },
};
