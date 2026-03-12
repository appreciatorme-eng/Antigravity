import "server-only";

import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/config/env";
import type { Database, Json } from "@/lib/database.types";
import { paymentService } from "@/lib/payments/payment-service";
import {
  buildPaymentUrl,
  type CreatePaymentLinkInput,
  type PaymentEvent,
  type PaymentEventType,
  type PaymentLinkData,
  type PaymentLinkStatus,
} from "@/lib/payments/payment-links";

type AdminDbClient = SupabaseClient<Database>;
type PaymentLinkRow = Database["public"]["Tables"]["payment_links"]["Row"];
type PaymentEventRow = Database["public"]["Tables"]["payment_events"]["Row"];

type SerializedExtras = {
  baseUrl?: string;
  proposalTitle?: string | null;
  organizationName?: string | null;
};

const PAYMENT_LINK_COLUMNS =
  "id, token, organization_id, proposal_id, booking_id, client_id, client_name, client_phone, client_email, amount_paise, currency, description, status, razorpay_order_id, razorpay_payment_id, expires_at, viewed_at, paid_at, reminder_sent_at, created_at, created_by, updated_at" as const;

const PAYMENT_EVENT_PREFIX = "payment_link.";

function isPaymentEventType(value: string): value is PaymentEventType {
  return (
    value === "created" ||
    value === "sent" ||
    value === "viewed" ||
    value === "reminder_sent" ||
    value === "paid" ||
    value === "expired" ||
    value === "cancelled"
  );
}

function sanitizeMetadata(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;

  const pairs = Object.entries(value).flatMap(([key, entry]) => {
    if (typeof entry !== "string" || !entry.trim()) return [];
    return [[key, entry]];
  });

  return pairs.length > 0 ? Object.fromEntries(pairs) : undefined;
}

function mapEventRow(row: Pick<PaymentEventRow, "event_type" | "created_at" | "metadata">): PaymentEvent | null {
  const rawType = row.event_type.startsWith(PAYMENT_EVENT_PREFIX)
    ? row.event_type.slice(PAYMENT_EVENT_PREFIX.length)
    : row.event_type;

  if (!isPaymentEventType(rawType)) return null;

  return {
    type: rawType,
    timestamp: row.created_at || new Date().toISOString(),
    metadata: sanitizeMetadata(row.metadata),
  };
}

async function loadLinkEvents(
  admin: AdminDbClient,
  paymentLinkId: string,
): Promise<PaymentEvent[]> {
  const { data, error } = await admin
    .from("payment_events")
    .select("event_type, created_at, metadata")
    .eq("payment_link_id", paymentLinkId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || [])
    .map(mapEventRow)
    .filter((event): event is PaymentEvent => event !== null);
}

async function loadLinkMetadata(
  admin: AdminDbClient,
  link: PaymentLinkRow,
): Promise<{ proposalTitle: string | null; organizationName: string | null }> {
  let proposalTitle: string | null = null;
  if (link.proposal_id) {
    const { data: proposal } = await admin
      .from("proposals")
      .select("title")
      .eq("id", link.proposal_id)
      .maybeSingle();

    proposalTitle = proposal?.title || null;
  }

  let organizationName: string | null = null;
  const { data: organization } = await admin
    .from("organizations")
    .select("name")
    .eq("id", link.organization_id)
    .maybeSingle();

  organizationName = organization?.name || null;

  return { proposalTitle, organizationName };
}

function serializePaymentLink(
  link: PaymentLinkRow,
  events: PaymentEvent[],
  extras: SerializedExtras = {},
): PaymentLinkData {
  return {
    id: link.id,
    token: link.token,
    proposalId: link.proposal_id,
    bookingId: link.booking_id,
    clientId: link.client_id,
    clientName: link.client_name,
    clientPhone: link.client_phone,
    clientEmail: link.client_email,
    amount: link.amount_paise,
    currency: (link.currency === "USD" ? "USD" : "INR") as "INR" | "USD",
    description: link.description,
    createdAt: link.created_at,
    expiresAt: link.expires_at,
    viewedAt: link.viewed_at,
    paidAt: link.paid_at,
    status: link.status as PaymentLinkStatus,
    razorpayOrderId: link.razorpay_order_id,
    razorpayPaymentId: link.razorpay_payment_id,
    paymentUrl: buildPaymentUrl(link.token, extras.baseUrl),
    proposalTitle: extras.proposalTitle,
    organizationName: extras.organizationName,
    events,
  };
}

export async function appendPaymentLinkEvent(
  admin: AdminDbClient,
  args: {
    organizationId: string;
    paymentLinkId: string;
    event: PaymentEventType;
    amountPaisa?: number;
    currency?: string;
    status?: PaymentLinkStatus;
    metadata?: Record<string, string>;
  },
) {
  const { error } = await admin.from("payment_events").insert({
    organization_id: args.organizationId,
    payment_link_id: args.paymentLinkId,
    event_type: `${PAYMENT_EVENT_PREFIX}${args.event}`,
    amount:
      typeof args.amountPaisa === "number" && Number.isFinite(args.amountPaisa)
        ? args.amountPaisa / 100
        : null,
    currency: args.currency || "INR",
    status: args.status || null,
    metadata: (args.metadata || null) as Json | null,
  });

  if (error) {
    throw error;
  }
}

async function expireIfNeeded(admin: AdminDbClient, link: PaymentLinkRow) {
  if (!link.expires_at) return link;
  if (link.status === "paid" || link.status === "cancelled" || link.status === "expired") {
    return link;
  }

  if (new Date(link.expires_at) >= new Date()) {
    return link;
  }

  const { data, error } = await admin
    .from("payment_links")
    .update({
      status: "expired",
      updated_at: new Date().toISOString(),
    })
    .eq("id", link.id)
    .select(PAYMENT_LINK_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  await appendPaymentLinkEvent(admin, {
    organizationId: data.organization_id,
    paymentLinkId: data.id,
    event: "expired",
    amountPaisa: data.amount_paise,
    currency: data.currency,
    status: "expired",
  });

  return data;
}

export async function getPaymentLinkByToken(
  admin: AdminDbClient,
  token: string,
  baseUrl?: string,
): Promise<PaymentLinkData | null> {
  const { data, error } = await admin
    .from("payment_links")
    .select(PAYMENT_LINK_COLUMNS)
    .eq("token", token)
    .maybeSingle();

  if (error) {
    // payment_links table may not exist in all environments
    if (error.code === "PGRST205" || error.code === "42P01") return null;
    throw error;
  }
  if (!data) return null;

  const link = await expireIfNeeded(admin, data);
  const [events, metadata] = await Promise.all([
    loadLinkEvents(admin, link.id),
    loadLinkMetadata(admin, link),
  ]);

  return serializePaymentLink(link, events, {
    baseUrl,
    proposalTitle: metadata.proposalTitle,
    organizationName: metadata.organizationName,
  });
}

export async function createPaymentLinkRecord(
  admin: AdminDbClient,
  args: CreatePaymentLinkInput & {
    organizationId: string;
    createdBy: string;
    baseUrl?: string;
  },
) {
  const currency = args.currency || "INR";
  const expiresAt = args.expiresInHours
    ? new Date(Date.now() + args.expiresInHours * 60 * 60 * 1000).toISOString()
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const order = await paymentService.createOrder(
    args.amount / 100,
    currency,
    args.organizationId,
    {
      source: "payment_link",
      ...(args.proposalId ? { proposal_id: args.proposalId } : {}),
      ...(args.bookingId ? { booking_id: args.bookingId } : {}),
      ...(args.clientId ? { client_id: args.clientId } : {}),
    },
  );

  const { data, error } = await admin
    .from("payment_links")
    .insert({
      organization_id: args.organizationId,
      proposal_id: args.proposalId || null,
      booking_id: args.bookingId || null,
      client_id: args.clientId || null,
      client_name: args.clientName || null,
      client_phone: args.clientPhone || null,
      client_email: args.clientEmail || null,
      amount_paise: args.amount,
      currency,
      description: args.description,
      status: "pending",
      razorpay_order_id: order.id,
      expires_at: expiresAt,
      created_by: args.createdBy,
    })
    .select(PAYMENT_LINK_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  await appendPaymentLinkEvent(admin, {
    organizationId: args.organizationId,
    paymentLinkId: data.id,
    event: "created",
    amountPaisa: data.amount_paise,
    currency: data.currency,
    status: "pending",
    metadata: {
      token: data.token,
      razorpay_order_id: order.id,
    },
  });

  const [events, metadata] = await Promise.all([
    loadLinkEvents(admin, data.id),
    loadLinkMetadata(admin, data),
  ]);

  return {
    order,
    link: serializePaymentLink(data, events, {
      baseUrl: args.baseUrl,
      proposalTitle: metadata.proposalTitle,
      organizationName: metadata.organizationName,
    }),
  };
}

export async function recordPaymentLinkEvent(
  admin: AdminDbClient,
  args: {
    token: string;
    event: PaymentEventType;
    metadata?: Record<string, string>;
    razorpayPaymentId?: string | null;
    baseUrl?: string;
    _callerVerified?: boolean;
  },
) {
  if ((args.event === "paid" || args.event === "cancelled") && !args._callerVerified) {
    throw new Error(
      `Payment state "${args.event}" must come through verified webhook — use _callerVerified: true from signature-checked callers only`
    );
  }

  const { data, error } = await admin
    .from("payment_links")
    .select(PAYMENT_LINK_COLUMNS)
    .eq("token", args.token)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) return null;

  const nextStatus: PaymentLinkStatus =
    args.event === "paid"
      ? "paid"
      : args.event === "viewed" && data.status === "pending"
      ? "viewed"
      : args.event === "expired"
      ? "expired"
      : args.event === "cancelled"
      ? "cancelled"
      : (data.status as PaymentLinkStatus);

  const updatePayload: Database["public"]["Tables"]["payment_links"]["Update"] = {
    status: nextStatus,
    updated_at: new Date().toISOString(),
  };

  if (args.event === "viewed") {
    updatePayload.viewed_at = new Date().toISOString();
  }

  if (args.event === "paid") {
    updatePayload.paid_at = new Date().toISOString();
    updatePayload.razorpay_payment_id = args.razorpayPaymentId || null;
  }

  const { data: updated, error: updateError } = await admin
    .from("payment_links")
    .update(updatePayload)
    .eq("id", data.id)
    .select(PAYMENT_LINK_COLUMNS)
    .single();

  if (updateError) {
    throw updateError;
  }

  await appendPaymentLinkEvent(admin, {
    organizationId: updated.organization_id,
    paymentLinkId: updated.id,
    event: args.event,
    amountPaisa: updated.amount_paise,
    currency: updated.currency,
    status: nextStatus,
    metadata: {
      ...(args.metadata || {}),
      ...(args.razorpayPaymentId ? { razorpay_payment_id: args.razorpayPaymentId } : {}),
    },
  });

  const [events, metadata] = await Promise.all([
    loadLinkEvents(admin, updated.id),
    loadLinkMetadata(admin, updated),
  ]);

  return serializePaymentLink(updated, events, {
    baseUrl: args.baseUrl,
    proposalTitle: metadata.proposalTitle,
    organizationName: metadata.organizationName,
  });
}

export function verifyRazorpayPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
) {
  const secret = env.razorpay.keySecret;
  if (!secret) {
    throw new Error("RAZORPAY_KEY_SECRET is not configured");
  }

  const digest = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const expected = Buffer.from(digest, "utf8");
  const received = Buffer.from(signature, "utf8");

  if (expected.length !== received.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, received);
}
