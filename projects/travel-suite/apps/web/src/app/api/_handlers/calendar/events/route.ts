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

type AdminClient = NonNullable<Extract<Awaited<ReturnType<typeof requireAdmin>>, { ok: true }>["adminClient"]>;

const SOCIAL_POST_CALENDAR_SELECT = [
  "caption_facebook",
  "caption_instagram",
  "created_at",
  "id",
  "source",
  "status",
  "template_id",
].join(", ");

const CONCIERGE_REQUEST_CALENDAR_SELECT = [
  "client_id",
  "created_at",
  "id",
  "message",
  "response",
  "status",
  "trip_id",
  "type",
  "clients(full_name,organization_id)",
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

function formatDateOnly(date: Date) {
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
  paddedStart.setUTCDate(paddedStart.getUTCDate() - 7);
  const paddedEnd = new Date(last);
  paddedEnd.setUTCDate(paddedEnd.getUTCDate() + 7);

  return {
    startDateOnly: formatDateOnly(paddedStart),
    endDateOnly: formatDateOnly(paddedEnd),
    startIso: paddedStart.toISOString(),
    endIso: paddedEnd.toISOString(),
  };
}

interface TripRow {
  id: string;
  client_id: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  profiles: { full_name?: string } | null;
  itineraries: { trip_title?: string; destination?: string; duration_days?: number } | null;
}

interface InvoiceRow {
  id: string;
  invoice_number: string;
  due_date: string | null;
  status: string | null;
  total_amount: number | null;
  paid_amount: number | null;
  balance_amount: number | null;
  trip_id: string | null;
  currency: string | null;
  profiles: { full_name?: string } | null;
}

interface PaymentRow {
  id: string;
  invoice_id: string;
  payment_date: string;
  amount: number | null;
  currency: string | null;
  method: string | null;
  reference: string | null;
  status: string | null;
  invoices: { invoice_number?: string; trip_id?: string; organization_id?: string } | null;
}

interface ProposalRow {
  id: string;
  title: string | null;
  client_id: string;
  total_price: number | null;
  viewed_at: string | null;
  expires_at: string | null;
  status: string | null;
  created_at: string | null;
  clients: { full_name?: string } | null;
}

interface SocialPostRow {
  id: string;
  caption_instagram: string | null;
  caption_facebook: string | null;
  source: string | null;
  template_id: string | null;
  status: string | null;
  created_at: string;
}

interface ConciergeRow {
  id: string;
  message: string;
  type: string | null;
  trip_id: string | null;
  client_id: string;
  response: string | null;
  status: string | null;
  created_at: string | null;
  clients: { full_name?: string; organization_id?: string } | null;
}

interface FollowUpRow {
  id: string;
  notification_type: string | null;
  status: string | null;
  scheduled_for: string;
  trip_id: string | null;
  recipient_phone: string | null;
  recipient_email: string | null;
}

interface PersonalEventRow {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  start_time: string;
  end_time?: string | null;
  all_day?: boolean;
  category?: "meeting" | "task" | "reminder" | "personal" | "other";
  status?: string;
}

async function fetchTrips(
  client: AdminClient,
  orgId: string,
  startDateOnly: string,
  endDateOnly: string,
): Promise<CalendarEvent[]> {
  const { data, error } = await client
    .from("trips")
    .select("*, profiles(full_name), itineraries(destination, trip_title, duration_days)")
    .eq("organization_id", orgId)
    .not("start_date", "is", null)
    .gte("start_date", startDateOnly)
    .lte("start_date", endDateOnly);

  if (error) throw error;

  return ((data ?? []) as unknown as TripRow[]).map((trip) => {
    const entityData: TripEventData = {
      type: "trip",
      clientName: trip.profiles?.full_name ?? "Unknown Client",
      clientId: trip.client_id ?? null,
      destination: trip.itineraries?.destination ?? null,
      tripTitle: trip.itineraries?.trip_title ?? null,
      durationDays: trip.itineraries?.duration_days ?? null,
    };

    return {
      id: trip.id,
      type: "trip",
      title: trip.itineraries?.trip_title ?? trip.itineraries?.destination ?? "Untitled Trip",
      subtitle: trip.profiles?.full_name ?? "Unknown Client",
      startDate: trip.start_date ?? startDateOnly,
      endDate: trip.end_date ?? null,
      status: trip.status ?? "draft",
      statusVariant: getStatusVariant(trip.status ?? "draft"),
      amount: null,
      currency: null,
      href: `/trips/${trip.id}`,
      drillHref: null,
      entityData,
    };
  });
}

async function fetchInvoices(
  client: AdminClient,
  orgId: string,
  startDateOnly: string,
  endDateOnly: string,
): Promise<CalendarEvent[]> {
  const { data, error } = await client
    .from("invoices")
    .select("*, profiles(full_name)")
    .eq("organization_id", orgId)
    .not("due_date", "is", null)
    .gte("due_date", startDateOnly)
    .lte("due_date", endDateOnly);

  if (error) throw error;

  return ((data ?? []) as unknown as InvoiceRow[]).map((invoice) => {
    const entityData: InvoiceEventData = {
      type: "invoice",
      invoiceNumber: invoice.invoice_number,
      clientName: invoice.profiles?.full_name ?? "Unknown Client",
      totalAmount: invoice.total_amount ?? 0,
      paidAmount: invoice.paid_amount ?? 0,
      balanceAmount: invoice.balance_amount ?? 0,
      tripId: invoice.trip_id ?? null,
    };

    return {
      id: invoice.id,
      type: "invoice",
      title: `Invoice ${invoice.invoice_number}`,
      subtitle: invoice.profiles?.full_name ?? "Unknown Client",
      startDate: invoice.due_date ?? startDateOnly,
      endDate: null,
      status: invoice.status ?? "draft",
      statusVariant: getStatusVariant(invoice.status ?? "draft"),
      amount: invoice.total_amount ?? null,
      currency: invoice.currency ?? "INR",
      href: "/admin/invoices",
      drillHref: null,
      entityData,
    };
  });
}

async function fetchPayments(
  client: AdminClient,
  orgId: string,
  startIso: string,
  endIso: string,
): Promise<CalendarEvent[]> {
  const { data, error } = await client
    .from("invoice_payments")
    .select("*, invoices(invoice_number, trip_id, organization_id)")
    .gte("payment_date", startIso)
    .lte("payment_date", endIso);

  if (error) throw error;

  return ((data ?? []) as unknown as PaymentRow[])
    .filter((payment) => payment.invoices?.organization_id === orgId)
    .map((payment) => {
      const entityData: PaymentEventData = {
        type: "payment",
        invoiceId: payment.invoice_id,
        invoiceNumber: payment.invoices?.invoice_number ?? "N/A",
        method: payment.method ?? null,
        reference: payment.reference ?? null,
      };

      return {
        id: payment.id,
        type: "payment",
        title: `Payment — ${payment.invoices?.invoice_number ?? "N/A"}`,
        subtitle: payment.method ?? "Payment",
        startDate: payment.payment_date,
        endDate: null,
        status: payment.status ?? "completed",
        statusVariant: getStatusVariant(payment.status ?? "completed"),
        amount: payment.amount ?? null,
        currency: payment.currency ?? "INR",
        href: "/admin/invoices",
        drillHref: null,
        entityData,
      };
    });
}

async function fetchProposals(
  client: AdminClient,
  orgId: string,
  startIso: string,
  endIso: string,
): Promise<CalendarEvent[]> {
  const { data, error } = await client
    .from("proposals")
    .select("*, clients(full_name)")
    .eq("organization_id", orgId)
    .not("expires_at", "is", null)
    .gte("expires_at", startIso)
    .lte("expires_at", endIso);

  if (error) throw error;

  return ((data ?? []) as unknown as ProposalRow[]).map((proposal) => {
    const entityData: ProposalEventData = {
      type: "proposal",
      clientName: proposal.clients?.full_name ?? "Unknown Client",
      clientId: proposal.client_id,
      totalPrice: proposal.total_price ?? null,
      viewedAt: proposal.viewed_at ?? null,
      expiresAt: proposal.expires_at ?? null,
    };

    return {
      id: proposal.id,
      type: "proposal",
      title: proposal.title ?? "Proposal",
      subtitle: proposal.clients?.full_name ?? "Unknown Client",
      startDate: proposal.expires_at ?? proposal.created_at ?? startIso,
      endDate: null,
      status: proposal.status ?? "draft",
      statusVariant: getStatusVariant(proposal.status ?? "draft"),
      amount: proposal.total_price ?? null,
      currency: null,
      href: `/proposals/${proposal.id}`,
      drillHref: null,
      entityData,
    };
  });
}

async function fetchSocialPosts(
  client: AdminClient,
  orgId: string,
  startIso: string,
  endIso: string,
): Promise<CalendarEvent[]> {
  const { data, error } = await client
    .from("social_posts")
    .select(SOCIAL_POST_CALENDAR_SELECT)
    .eq("organization_id", orgId)
    .gte("created_at", startIso)
    .lte("created_at", endIso);

  if (error) throw error;

  return ((data ?? []) as unknown as SocialPostRow[]).map((post) => {
    const caption = post.caption_instagram ?? post.caption_facebook ?? null;
    const entityData: SocialPostEventData = {
      type: "social_post",
      caption,
      platform: post.source ?? null,
      templateId: post.template_id ?? null,
    };

    return {
      id: post.id,
      type: "social_post",
      title: caption ? (caption.length > 40 ? `${caption.slice(0, 40)}...` : caption) : "Untitled Post",
      subtitle: post.source ?? "Social Post",
      startDate: post.created_at,
      endDate: null,
      status: post.status ?? "draft",
      statusVariant: getStatusVariant(post.status ?? "draft"),
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
  orgId: string,
  startIso: string,
  endIso: string,
): Promise<CalendarEvent[]> {
  const { data, error } = await client
    .from("concierge_requests")
    .select(CONCIERGE_REQUEST_CALENDAR_SELECT)
    .gte("created_at", startIso)
    .lte("created_at", endIso);

  if (error) throw error;

  return ((data ?? []) as unknown as ConciergeRow[])
    .filter((row) => row.clients?.organization_id === orgId)
    .map((request) => {
      const entityData: ConciergeEventData = {
        type: "concierge",
        message: request.message,
        requestType: request.type ?? "general",
        tripId: request.trip_id ?? null,
        clientId: request.client_id,
        response: request.response ?? null,
      };

      return {
        id: request.id,
        type: "concierge",
        title: request.type ?? "Concierge Request",
        subtitle: request.clients?.full_name ?? "Unknown Client",
        startDate: request.created_at ?? startIso,
        endDate: null,
        status: request.status ?? "pending",
        statusVariant: getStatusVariant(request.status ?? "pending"),
        amount: null,
        currency: null,
        href: "/concierge",
        drillHref: null,
        entityData,
      };
    });
}

async function fetchPersonalEvents(
  client: AdminClient,
  orgId: string,
  startIso: string,
  endIso: string,
): Promise<CalendarEvent[]> {
  const { data, error } = await untypedFrom(client, "calendar_events")
    .select(PERSONAL_EVENT_SELECT)
    .eq("organization_id", orgId)
    .gte("start_time", startIso)
    .lte("start_time", endIso);

  if (error) throw error;

  return ((data ?? []) as unknown as PersonalEventRow[]).map((row) => ({
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
    entityData: {
      type: "personal",
      description: row.description ?? null,
      location: row.location ?? null,
      category: row.category ?? "personal",
      allDay: row.all_day ?? false,
    } satisfies PersonalEventData,
  }));
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
    if (chunk.length === 0) continue;

    const { data, error } = await untypedFrom(client, "notification_queue")
      .select("id,notification_type,status,scheduled_for,trip_id,recipient_phone,recipient_email")
      .or("status.eq.pending,status.eq.queued,status.eq.retry,status.eq.failed")
      .gte("scheduled_for", startIso)
      .lte("scheduled_for", endIso)
      .in(column, chunk)
      .order("scheduled_for", { ascending: true })
      .limit(150);

    if (error) throw error;
    rows.push(...((data ?? []) as unknown as FollowUpRow[]));
  }

  return rows;
}

async function fetchFollowUps(
  client: AdminClient,
  orgId: string,
  startIso: string,
  endIso: string,
): Promise<CalendarEvent[]> {
  const [orgUsersResult, orgTripsResult] = await Promise.all([
    client.from("profiles").select("id").eq("organization_id", orgId).limit(5000),
    client.from("trips").select("id").eq("organization_id", orgId).limit(5000),
  ]);

  if (orgUsersResult.error) throw orgUsersResult.error;
  if (orgTripsResult.error) throw orgTripsResult.error;

  const userIds = (orgUsersResult.data || []).map((row) => row.id).filter(Boolean);
  const tripIds = (orgTripsResult.data || []).map((row) => row.id).filter(Boolean);

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
    if (!admin.ok) return admin.response;

    const params = request.nextUrl.searchParams;
    const now = new Date();
    const year = Number(params.get("year") ?? now.getUTCFullYear());
    const month = Number(params.get("month") ?? now.getUTCMonth() + 1);

    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
      return apiError("Invalid year or month", 400);
    }

    if (!admin.organizationId) {
      return apiError("Organization not configured", 400);
    }

    const { startDateOnly, endDateOnly, startIso, endIso } = getMonthWindow(year, month);
    const results = await Promise.all([
      fetchTrips(admin.adminClient, admin.organizationId, startDateOnly, endDateOnly),
      fetchInvoices(admin.adminClient, admin.organizationId, startDateOnly, endDateOnly),
      fetchPayments(admin.adminClient, admin.organizationId, startIso, endIso),
      fetchProposals(admin.adminClient, admin.organizationId, startIso, endIso),
      fetchFollowUps(admin.adminClient, admin.organizationId, startIso, endIso),
      fetchSocialPosts(admin.adminClient, admin.organizationId, startIso, endIso),
      fetchConciergeRequests(admin.adminClient, admin.organizationId, startIso, endIso),
      fetchPersonalEvents(admin.adminClient, admin.organizationId, startIso, endIso),
    ]);

    const events = results.flat().sort((left, right) => {
      return new Date(left.startDate).getTime() - new Date(right.startDate).getTime();
    });

    return NextResponse.json({
      year,
      month,
      summary: {
        trips: events.filter((event) => event.type === "trip").length,
        invoices: events.filter((event) => event.type === "invoice").length,
        payments: events.filter((event) => event.type === "payment").length,
        proposals: events.filter((event) => event.type === "proposal").length,
        followUps: events.filter((event) => event.type === "follow_up").length,
      },
      events,
    });
  } catch (error) {
    logError("[/api/calendar/events:GET] Unhandled error", error);
    return NextResponse.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
