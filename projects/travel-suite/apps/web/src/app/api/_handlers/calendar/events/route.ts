import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { logError } from "@/lib/observability/logger";
import { getStatusVariant } from "@/features/calendar/utils";
import type {
  CalendarEvent,
  ConciergeEventData,
  FollowUpEventData,
  InvoiceEventData,
  PaymentEventData,
  PersonalEventData,
  ProposalEventData,
  SocialPostEventData,
  TripEventData,
} from "@/features/calendar/types";

type AdminSuccess = Extract<Awaited<ReturnType<typeof requireAdmin>>, { ok: true }>;
type AdminClient = AdminSuccess["adminClient"];

type CalendarSource =
  | "trips"
  | "invoices"
  | "payments"
  | "proposals"
  | "follow_ups"
  | "social_posts"
  | "concierge"
  | "personal";

type CalendarSourceError = {
  source: CalendarSource;
};

type CalendarEventsPayload = {
  year: number;
  month: number;
  summary: {
    trips: number;
    invoices: number;
    payments: number;
    proposals: number;
    followUps: number;
    socialPosts: number;
    concierge: number;
    personal: number;
  };
  sourceErrors: CalendarSourceError[];
  events: CalendarEvent[];
};

type TripRow = {
  id: string;
  itinerary_id: string | null;
  client_id: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
};

type InvoiceRow = {
  id: string;
  invoice_number: string;
  due_date: string | null;
  status: string | null;
  total_amount: number | null;
  paid_amount: number | null;
  balance_amount: number | null;
  trip_id: string | null;
  currency: string | null;
  client_id: string | null;
};

type PaymentRow = {
  id: string;
  invoice_id: string;
  payment_date: string;
  amount: number | null;
  currency: string | null;
  method: string | null;
  reference: string | null;
  status: string | null;
};

type PaymentInvoiceLookupRow = {
  id: string;
  invoice_number: string;
  trip_id: string | null;
  organization_id: string | null;
};

type ProposalRow = {
  id: string;
  title: string | null;
  client_id: string;
  total_price: number | null;
  viewed_at: string | null;
  expires_at: string | null;
  status: string | null;
  created_at: string | null;
};

type SocialPostRow = {
  id: string;
  caption_instagram: string | null;
  caption_facebook: string | null;
  source: string | null;
  template_id: string | null;
  status: string | null;
  created_at: string;
};

type ConciergeRow = {
  id: string;
  message: string;
  type: string | null;
  trip_id: string | null;
  client_id: string | null;
  response: string | null;
  status: string | null;
  created_at: string | null;
};

type FollowUpRow = {
  id: string;
  notification_type: string | null;
  status: string | null;
  scheduled_for: string;
  trip_id: string | null;
  recipient_phone: string | null;
  recipient_email: string | null;
};

type PersonalEventRow = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  start_time: string;
  end_time?: string | null;
  all_day?: boolean;
  category?: "meeting" | "task" | "reminder" | "personal" | "other";
  status?: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
};

type ItineraryLookupRow = {
  id: string;
  trip_title: string | null;
  destination: string | null;
  duration_days: number | null;
};

const SOCIAL_POST_SELECT = [
  "caption_facebook",
  "caption_instagram",
  "created_at",
  "id",
  "source",
  "status",
  "template_id",
].join(", ");

const CONCIERGE_SELECT = [
  "id",
  "message",
  "type",
  "trip_id",
  "client_id",
  "response",
  "status",
  "created_at",
].join(",");

const PERSONAL_EVENT_SELECT = [
  "all_day",
  "category",
  "description",
  "end_time",
  "id",
  "location",
  "start_time",
  "status",
  "title",
].join(", ");

function untypedFrom(client: AdminClient, table: string) {
  return (client as unknown as { from: (t: string) => ReturnType<AdminClient["from"]> }).from(table);
}

function formatDateOnly(date: Date): string {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function getMonthWindow(year: number, month: number) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const last = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  const paddedStart = new Date(first);
  const paddedEnd = new Date(last);
  paddedStart.setUTCDate(paddedStart.getUTCDate() - 7);
  paddedEnd.setUTCDate(paddedEnd.getUTCDate() + 7);

  return {
    startDateOnly: formatDateOnly(paddedStart),
    endDateOnly: formatDateOnly(paddedEnd),
    startIso: paddedStart.toISOString(),
    endIso: paddedEnd.toISOString(),
  };
}

async function buildProfileMap(
  client: AdminClient,
  organizationId: string,
  ids: Array<string | null | undefined>,
): Promise<Map<string, string>> {
  const uniqueIds = Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
  if (uniqueIds.length === 0) {
    return new Map();
  }

  const { data, error } = await client
    .from("profiles")
    .select("id,full_name")
    .eq("organization_id", organizationId)
    .in("id", uniqueIds);

  if (error) {
    throw error;
  }

  return new Map(
    ((data ?? []) as ProfileRow[]).map((row) => [row.id, row.full_name || "Unknown Client"]),
  );
}

async function buildItineraryMap(
  client: AdminClient,
  ids: Array<string | null | undefined>,
): Promise<Map<string, ItineraryLookupRow>> {
  const uniqueIds = Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
  if (uniqueIds.length === 0) {
    return new Map();
  }

  const { data, error } = await client
    .from("itineraries")
    .select("id,trip_title,destination,duration_days")
    .in("id", uniqueIds);

  if (error) {
    throw error;
  }

  return new Map(((data ?? []) as ItineraryLookupRow[]).map((row) => [row.id, row]));
}

async function fetchTrips(
  client: AdminClient,
  organizationId: string,
  startDateOnly: string,
  endDateOnly: string,
): Promise<CalendarEvent[]> {
  const { data, error } = await client
    .from("trips")
    .select("id,itinerary_id,client_id,start_date,end_date,status")
    .eq("organization_id", organizationId)
    .not("start_date", "is", null)
    .gte("start_date", startDateOnly)
    .lte("start_date", endDateOnly)
    .order("start_date", { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as TripRow[];
  const [profileMap, itineraryMap] = await Promise.all([
    buildProfileMap(client, organizationId, rows.map((row) => row.client_id)),
    buildItineraryMap(client, rows.map((row) => row.itinerary_id)),
  ]);

  return rows.map((row) => {
    const itinerary = row.itinerary_id ? itineraryMap.get(row.itinerary_id) : null;
    const entityData: TripEventData = {
      type: "trip",
      clientName: row.client_id ? profileMap.get(row.client_id) || "Unknown Client" : "Unknown Client",
      clientId: row.client_id,
      destination: itinerary?.destination ?? null,
      tripTitle: itinerary?.trip_title ?? null,
      durationDays: itinerary?.duration_days ?? null,
    };

    return {
      id: row.id,
      type: "trip",
      title: itinerary?.trip_title ?? itinerary?.destination ?? "Untitled Trip",
      subtitle: entityData.clientName,
      startDate: row.start_date ?? startDateOnly,
      endDate: row.end_date ?? null,
      status: row.status ?? "draft",
      statusVariant: getStatusVariant(row.status ?? "draft"),
      amount: null,
      currency: null,
      href: `/trips/${row.id}`,
      drillHref: null,
      entityData,
    };
  });
}

async function fetchInvoices(
  client: AdminClient,
  organizationId: string,
  startDateOnly: string,
  endDateOnly: string,
): Promise<CalendarEvent[]> {
  const { data, error } = await client
    .from("invoices")
    .select("id,invoice_number,due_date,status,total_amount,paid_amount,balance_amount,trip_id,currency,client_id")
    .eq("organization_id", organizationId)
    .not("due_date", "is", null)
    .gte("due_date", startDateOnly)
    .lte("due_date", endDateOnly)
    .order("due_date", { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as InvoiceRow[];
  const profileMap = await buildProfileMap(client, organizationId, rows.map((row) => row.client_id));

  return rows.map((row) => {
    const clientName = row.client_id ? profileMap.get(row.client_id) || "Unknown Client" : "Unknown Client";
    const entityData: InvoiceEventData = {
      type: "invoice",
      invoiceNumber: row.invoice_number,
      clientName,
      totalAmount: row.total_amount ?? 0,
      paidAmount: row.paid_amount ?? 0,
      balanceAmount: row.balance_amount ?? 0,
      tripId: row.trip_id ?? null,
    };

    return {
      id: row.id,
      type: "invoice",
      title: `Invoice ${row.invoice_number}`,
      subtitle: clientName,
      startDate: row.due_date ?? startDateOnly,
      endDate: null,
      status: row.status ?? "draft",
      statusVariant: getStatusVariant(row.status ?? "draft"),
      amount: row.total_amount ?? null,
      currency: row.currency ?? "INR",
      href: "/admin/invoices",
      drillHref: null,
      entityData,
    };
  });
}

async function fetchPayments(
  client: AdminClient,
  organizationId: string,
  startIso: string,
  endIso: string,
): Promise<CalendarEvent[]> {
  const { data, error } = await client
    .from("invoice_payments")
    .select("id,invoice_id,payment_date,amount,currency,method,reference,status")
    .gte("payment_date", startIso)
    .lte("payment_date", endIso)
    .order("payment_date", { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as PaymentRow[];
  const invoiceIds = Array.from(new Set(rows.map((row) => row.invoice_id).filter(Boolean)));
  let invoiceMap = new Map<string, PaymentInvoiceLookupRow>();

  if (invoiceIds.length > 0) {
    const { data: invoices, error: invoiceError } = await client
      .from("invoices")
      .select("id,invoice_number,trip_id,organization_id")
      .eq("organization_id", organizationId)
      .in("id", invoiceIds);

    if (invoiceError) {
      throw invoiceError;
    }

    invoiceMap = new Map(
      ((invoices ?? []) as PaymentInvoiceLookupRow[]).map((row) => [row.id, row]),
    );
  }

  return rows.flatMap((row) => {
    const invoice = invoiceMap.get(row.invoice_id);
    if (!invoice) {
      return [];
    }

    const entityData: PaymentEventData = {
      type: "payment",
      invoiceId: row.invoice_id,
      invoiceNumber: invoice.invoice_number,
      method: row.method ?? null,
      reference: row.reference ?? null,
    };

    return [{
      id: row.id,
      type: "payment" as const,
      title: `Payment — ${invoice.invoice_number}`,
      subtitle: row.method ?? "Payment",
      startDate: row.payment_date,
      endDate: null,
      status: row.status ?? "completed",
      statusVariant: getStatusVariant(row.status ?? "completed"),
      amount: row.amount ?? null,
      currency: row.currency ?? "INR",
      href: "/admin/invoices",
      drillHref: null,
      entityData,
    }];
  });
}

async function fetchProposals(
  client: AdminClient,
  organizationId: string,
  startIso: string,
  endIso: string,
): Promise<CalendarEvent[]> {
  const { data, error } = await client
    .from("proposals")
    .select("id,title,client_id,total_price,viewed_at,expires_at,status,created_at")
    .eq("organization_id", organizationId)
    .not("expires_at", "is", null)
    .gte("expires_at", startIso)
    .lte("expires_at", endIso)
    .order("expires_at", { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as ProposalRow[];
  const profileMap = await buildProfileMap(client, organizationId, rows.map((row) => row.client_id));

  return rows.map((row) => {
    const clientName = profileMap.get(row.client_id) || "Unknown Client";
    const entityData: ProposalEventData = {
      type: "proposal",
      clientName,
      clientId: row.client_id,
      totalPrice: row.total_price ?? null,
      viewedAt: row.viewed_at ?? null,
      expiresAt: row.expires_at ?? null,
    };

    return {
      id: row.id,
      type: "proposal",
      title: row.title ?? "Proposal",
      subtitle: clientName,
      startDate: row.expires_at ?? row.created_at ?? startIso,
      endDate: null,
      status: row.status ?? "draft",
      statusVariant: getStatusVariant(row.status ?? "draft"),
      amount: row.total_price ?? null,
      currency: "INR",
      href: `/proposals/${row.id}`,
      drillHref: null,
      entityData,
    };
  });
}

async function fetchSocialPosts(
  client: AdminClient,
  organizationId: string,
  startIso: string,
  endIso: string,
): Promise<CalendarEvent[]> {
  const { data, error } = await client
    .from("social_posts")
    .select(SOCIAL_POST_SELECT)
    .eq("organization_id", organizationId)
    .gte("created_at", startIso)
    .lte("created_at", endIso)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as SocialPostRow[]).map((row) => {
    const caption = row.caption_instagram ?? row.caption_facebook ?? null;
    const title = caption ? (caption.length > 40 ? `${caption.slice(0, 40)}...` : caption) : "Untitled Post";
    const entityData: SocialPostEventData = {
      type: "social_post",
      caption,
      platform: row.source ?? null,
      templateId: row.template_id ?? null,
    };

    return {
      id: row.id,
      type: "social_post",
      title,
      subtitle: row.source ?? "Social Post",
      startDate: row.created_at,
      endDate: null,
      status: row.status ?? "draft",
      statusVariant: getStatusVariant(row.status ?? "draft"),
      amount: null,
      currency: null,
      href: "/social",
      drillHref: null,
      entityData,
    };
  });
}

async function fetchConciergeRequests(
  client: AdminClient,
  organizationId: string,
  startIso: string,
  endIso: string,
): Promise<CalendarEvent[]> {
  const { data, error } = await client
    .from("concierge_requests")
    .select(CONCIERGE_SELECT)
    .gte("created_at", startIso)
    .lte("created_at", endIso)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as unknown as ConciergeRow[];
  const profileMap = await buildProfileMap(client, organizationId, rows.map((row) => row.client_id));

  return rows.flatMap((row) => {
    if (!row.client_id || !profileMap.has(row.client_id)) {
      return [];
    }

    const entityData: ConciergeEventData = {
      type: "concierge",
      message: row.message,
      requestType: row.type ?? "general",
      tripId: row.trip_id ?? null,
      clientId: row.client_id,
      response: row.response ?? null,
    };

    return [{
      id: row.id,
      type: "concierge" as const,
      title: row.type ?? "Concierge Request",
      subtitle: profileMap.get(row.client_id) || "Unknown Client",
      startDate: row.created_at ?? startIso,
      endDate: null,
      status: row.status ?? "pending",
      statusVariant: getStatusVariant(row.status ?? "pending"),
      amount: null,
      currency: null,
      href: "/concierge",
      drillHref: null,
      entityData,
    }];
  });
}

async function fetchPersonalEvents(
  client: AdminClient,
  organizationId: string,
  startIso: string,
  endIso: string,
): Promise<CalendarEvent[]> {
  const { data, error } = await untypedFrom(client, "calendar_events")
    .select(PERSONAL_EVENT_SELECT)
    .eq("organization_id", organizationId)
    .gte("start_time", startIso)
    .lte("start_time", endIso)
    .order("start_time", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as PersonalEventRow[]).map((row) => {
    const entityData: PersonalEventData = {
      type: "personal",
      description: row.description ?? null,
      location: row.location ?? null,
      category: row.category ?? "personal",
      allDay: row.all_day ?? false,
    };

    return {
      id: row.id,
      type: "personal",
      title: row.title,
      subtitle:
        row.category === "meeting"
          ? "Meeting"
          : row.category === "task"
            ? "Task"
            : row.category === "reminder"
              ? "Reminder"
              : "Personal",
      startDate: row.start_time,
      endDate: row.end_time ?? null,
      status: row.status ?? "active",
      statusVariant: getStatusVariant(row.status ?? "active"),
      amount: null,
      currency: null,
      href: "#",
      drillHref: null,
      entityData,
    };
  });
}

async function queryFollowUpsByColumn(
  client: AdminClient,
  column: "user_id" | "trip_id",
  ids: string[],
  startIso: string,
  endIso: string,
): Promise<FollowUpRow[]> {
  const rows: FollowUpRow[] = [];

  for (let index = 0; index < ids.length; index += 200) {
    const chunk = ids.slice(index, index + 200);
    if (chunk.length === 0) {
      continue;
    }

    const { data, error } = await untypedFrom(client, "notification_queue")
      .select("id,notification_type,status,scheduled_for,trip_id,recipient_phone,recipient_email")
      .or("status.eq.pending,status.eq.queued,status.eq.retry,status.eq.failed")
      .gte("scheduled_for", startIso)
      .lte("scheduled_for", endIso)
      .in(column, chunk)
      .order("scheduled_for", { ascending: true })
      .limit(150);

    if (error) {
      throw error;
    }

    rows.push(...((data ?? []) as unknown as FollowUpRow[]));
  }

  return rows;
}

async function fetchFollowUps(
  client: AdminClient,
  organizationId: string,
  startIso: string,
  endIso: string,
): Promise<CalendarEvent[]> {
  const [profilesResult, tripsResult] = await Promise.all([
    client.from("profiles").select("id").eq("organization_id", organizationId).limit(5000),
    client.from("trips").select("id").eq("organization_id", organizationId).limit(5000),
  ]);

  if (profilesResult.error) {
    throw profilesResult.error;
  }
  if (tripsResult.error) {
    throw tripsResult.error;
  }

  const userIds = (profilesResult.data || []).map((row) => row.id).filter(Boolean);
  const tripIds = (tripsResult.data || []).map((row) => row.id).filter(Boolean);

  const [byUser, byTrip] = await Promise.all([
    queryFollowUpsByColumn(client, "user_id", userIds, startIso, endIso),
    queryFollowUpsByColumn(client, "trip_id", tripIds, startIso, endIso),
  ]);

  const deduped = new Map<string, FollowUpRow>();
  for (const row of [...byUser, ...byTrip]) {
    deduped.set(row.id, row);
  }

  return Array.from(deduped.values())
    .sort((left, right) => new Date(left.scheduled_for).getTime() - new Date(right.scheduled_for).getTime())
    .map((row) => {
      const recipient = row.recipient_phone || row.recipient_email || null;
      const entityData: FollowUpEventData = {
        type: "follow_up",
        notificationType: row.notification_type ?? "follow_up",
        recipient,
        tripId: row.trip_id ?? null,
        overdue: new Date(row.scheduled_for).getTime() < Date.now(),
      };

      return {
        id: row.id,
        type: "follow_up",
        title: (row.notification_type || "Follow-up").replace(/_/g, " "),
        subtitle: recipient || "Pending recipient",
        startDate: row.scheduled_for,
        endDate: null,
        status: row.status ?? "pending",
        statusVariant: getStatusVariant(row.status ?? "pending"),
        amount: null,
        currency: null,
        href: "/admin/notifications",
        drillHref: null,
        entityData,
      };
    });
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.ok) {
      return admin.response;
    }

    if (!admin.organizationId) {
      return apiError("Organization not configured", 400);
    }

    const params = request.nextUrl.searchParams;
    const now = new Date();
    const year = Number(params.get("year") ?? now.getUTCFullYear());
    const month = Number(params.get("month") ?? now.getUTCMonth() + 1);

    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
      return apiError("Invalid year or month", 400);
    }

    const { startDateOnly, endDateOnly, startIso, endIso } = getMonthWindow(year, month);
    const sourceLoaders: Array<[CalendarSource, () => Promise<CalendarEvent[]>]> = [
      ["trips", () => fetchTrips(admin.adminClient, admin.organizationId!, startDateOnly, endDateOnly)],
      ["invoices", () => fetchInvoices(admin.adminClient, admin.organizationId!, startDateOnly, endDateOnly)],
      ["payments", () => fetchPayments(admin.adminClient, admin.organizationId!, startIso, endIso)],
      ["proposals", () => fetchProposals(admin.adminClient, admin.organizationId!, startIso, endIso)],
      ["follow_ups", () => fetchFollowUps(admin.adminClient, admin.organizationId!, startIso, endIso)],
      ["social_posts", () => fetchSocialPosts(admin.adminClient, admin.organizationId!, startIso, endIso)],
      ["concierge", () => fetchConciergeRequests(admin.adminClient, admin.organizationId!, startIso, endIso)],
      ["personal", () => fetchPersonalEvents(admin.adminClient, admin.organizationId!, startIso, endIso)],
    ];

    const results = await Promise.allSettled(sourceLoaders.map(([, loader]) => loader()));
    const sourceErrors: CalendarSourceError[] = [];
    const events: CalendarEvent[] = [];

    results.forEach((result, index) => {
      const [source] = sourceLoaders[index];
      if (result.status === "fulfilled") {
        events.push(...result.value);
        return;
      }

      sourceErrors.push({ source });
      logError(`[/api/calendar/events:GET] ${source} source failed`, result.reason);
    });

    const payload: CalendarEventsPayload = {
      year,
      month,
      summary: {
        trips: events.filter((event) => event.type === "trip").length,
        invoices: events.filter((event) => event.type === "invoice").length,
        payments: events.filter((event) => event.type === "payment").length,
        proposals: events.filter((event) => event.type === "proposal").length,
        followUps: events.filter((event) => event.type === "follow_up").length,
        socialPosts: events.filter((event) => event.type === "social_post").length,
        concierge: events.filter((event) => event.type === "concierge").length,
        personal: events.filter((event) => event.type === "personal").length,
      },
      sourceErrors,
      events: events.sort((left, right) => {
        return new Date(left.startDate).getTime() - new Date(right.startDate).getTime();
      }),
    };

    return NextResponse.json(payload);
  } catch (error) {
    logError("[/api/calendar/events:GET] Unhandled error", error);
    return NextResponse.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
