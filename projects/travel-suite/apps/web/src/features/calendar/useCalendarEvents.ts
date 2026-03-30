"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type {
  CalendarEvent,
  TripEventData,
  InvoiceEventData,
  PaymentEventData,
  ProposalEventData,
  SocialPostEventData,
  ConciergeEventData,
} from "./types";
import { getStatusVariant } from "./utils";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const calendarKeys = {
  all: ["calendar"] as const,
  events: (month: number, year: number) =>
    [...calendarKeys.all, "events", year, month] as const,
};
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

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

type SupabaseClient = ReturnType<typeof createClient>;

/**
 * Helper to query a Supabase table that does not yet exist in the generated
 * database types (e.g. calendar_events). Casts through `unknown` once so
 * every call site stays free of explicit-any.
 */
function untypedFrom(supabase: SupabaseClient, table: string) {
  return (supabase as unknown as { from: (t: string) => ReturnType<SupabaseClient["from"]> }).from(table);
}

async function getOrgId(supabase: SupabaseClient): Promise<string> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error("Not authenticated");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.organization_id) {
    throw new Error("No organization found");
  }

  return profile.organization_id;
}

// ---------------------------------------------------------------------------
// Row shapes for joined Supabase queries (avoids `any` in map callbacks)
// ---------------------------------------------------------------------------

interface TripRow {
  id: string;
  client_id: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  // trips.client_id → profiles.id (not clients table)
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
  // invoices.client_id → profiles.id (not clients table)
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

// ---------------------------------------------------------------------------
// Fetch + normalise: Trips
// ---------------------------------------------------------------------------

async function fetchTrips(
  supabase: SupabaseClient,
  orgId: string,
  windowStart: string,
  windowEnd: string,
): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from("trips")
    .select(
      "*, profiles(full_name), itineraries(destination, trip_title, duration_days)",
    )
    .eq("organization_id", orgId)
    .gte("end_date", windowStart)
    .lte("start_date", windowEnd);

  if (error) throw error;

  return ((data ?? []) as unknown as TripRow[]).map((trip) => {
    const client = trip.profiles;
    const itinerary = trip.itineraries;

    const entityData: TripEventData = {
      type: "trip",
      clientName: client?.full_name ?? "Unknown Client",
      clientId: trip.client_id ?? null,
      destination: itinerary?.destination ?? null,
      tripTitle: itinerary?.trip_title ?? null,
      durationDays: itinerary?.duration_days ?? null,
    };

    return {
      id: trip.id,
      type: "trip" as const,
      title:
        itinerary?.trip_title ??
        itinerary?.destination ??
        "Untitled Trip",
      subtitle: client?.full_name ?? "Unknown Client",
      startDate: trip.start_date ?? new Date().toISOString(),
      endDate: trip.end_date ?? null,
      status: trip.status ?? "draft",
      statusVariant: getStatusVariant(trip.status ?? "draft"),
      amount: null,
      currency: null,
      href: `/trips/${trip.id}`,
      drillHref: "/analytics/drill-through?type=bookings",
      entityData,
    };
  });
}

// ---------------------------------------------------------------------------
// Fetch + normalise: Invoices
// ---------------------------------------------------------------------------

async function fetchInvoices(
  supabase: SupabaseClient,
  orgId: string,
  windowStart: string,
  windowEnd: string,
): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from("invoices")
    .select("*, profiles(full_name)")
    .eq("organization_id", orgId)
    .gte("due_date", windowStart)
    .lte("due_date", windowEnd);

  if (error) throw error;

  return ((data ?? []) as unknown as InvoiceRow[]).map((invoice) => {
    const client = invoice.profiles;

    const entityData: InvoiceEventData = {
      type: "invoice",
      invoiceNumber: invoice.invoice_number,
      clientName: client?.full_name ?? "Unknown Client",
      totalAmount: invoice.total_amount ?? 0,
      paidAmount: invoice.paid_amount ?? 0,
      balanceAmount: invoice.balance_amount ?? 0,
      tripId: invoice.trip_id ?? null,
    };

    return {
      id: invoice.id,
      type: "invoice" as const,
      title: `Invoice ${invoice.invoice_number}`,
      subtitle: client?.full_name ?? "Unknown Client",
      startDate: invoice.due_date ?? new Date().toISOString(),
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

// ---------------------------------------------------------------------------
// Fetch + normalise: Payments
// ---------------------------------------------------------------------------

async function fetchPayments(
  supabase: SupabaseClient,
  orgId: string,
  windowStart: string,
  windowEnd: string,
): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from("invoice_payments")
    .select("*, invoices(invoice_number, trip_id, organization_id)")
    .gte("payment_date", windowStart)
    .lte("payment_date", windowEnd);

  if (error) throw error;

  // Client-side filter: only keep rows belonging to the org
  const allPayments = (data ?? []) as unknown as PaymentRow[];
  const orgRows = allPayments.filter((row) => {
    return row.invoices?.organization_id === orgId;
  });

  return orgRows.map((payment) => {
    const invoice = payment.invoices;

    const invoiceNumber = invoice?.invoice_number ?? "N/A";

    const entityData: PaymentEventData = {
      type: "payment",
      invoiceId: payment.invoice_id,
      invoiceNumber,
      method: payment.method ?? null,
      reference: payment.reference ?? null,
    };

    return {
      id: payment.id,
      type: "payment" as const,
      title: `Payment — ${invoiceNumber}`,
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

// ---------------------------------------------------------------------------
// Fetch + normalise: Proposals
// ---------------------------------------------------------------------------

async function fetchProposals(
  supabase: SupabaseClient,
  orgId: string,
  windowStart: string,
  windowEnd: string,
): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from("proposals")
    .select("*, clients(full_name)")
    .eq("organization_id", orgId)
    .gte("created_at", windowStart)
    .lte("created_at", windowEnd);

  if (error) throw error;

  return ((data ?? []) as unknown as ProposalRow[]).map((proposal) => {
    const client = proposal.clients;

    const entityData: ProposalEventData = {
      type: "proposal",
      clientName: client?.full_name ?? "Unknown Client",
      clientId: proposal.client_id,
      totalPrice: proposal.total_price ?? null,
      viewedAt: proposal.viewed_at ?? null,
      expiresAt: proposal.expires_at ?? null,
    };

    return {
      id: proposal.id,
      type: "proposal" as const,
      title: proposal.title ?? "Proposal",
      subtitle: client?.full_name ?? "Unknown Client",
      startDate: proposal.created_at ?? new Date().toISOString(),
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

// ---------------------------------------------------------------------------
// Fetch + normalise: Social Posts
// ---------------------------------------------------------------------------

async function fetchSocialPosts(
  supabase: SupabaseClient,
  orgId: string,
  windowStart: string,
  windowEnd: string,
): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from("social_posts")
    .select(SOCIAL_POST_CALENDAR_SELECT)
    .eq("organization_id", orgId)
    .gte("created_at", windowStart)
    .lte("created_at", windowEnd);

  if (error) throw error;

  return ((data ?? []) as unknown as SocialPostRow[]).map((post) => {
    const caption =
      post.caption_instagram ?? post.caption_facebook ?? null;
    const truncatedCaption = caption
      ? caption.length > 40
        ? `${caption.slice(0, 40)}...`
        : caption
      : "Untitled Post";

    const entityData: SocialPostEventData = {
      type: "social_post",
      caption,
      platform: post.source ?? null,
      templateId: post.template_id ?? null,
    };

    return {
      id: post.id,
      type: "social_post" as const,
      title: truncatedCaption,
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

// ---------------------------------------------------------------------------
// Fetch + normalise: Concierge Requests
// ---------------------------------------------------------------------------

async function fetchConciergeRequests(
  supabase: SupabaseClient,
  orgId: string,
  windowStart: string,
  windowEnd: string,
): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from("concierge_requests")
    .select(CONCIERGE_REQUEST_CALENDAR_SELECT)
    .gte("created_at", windowStart)
    .lte("created_at", windowEnd);

  if (error) throw error;

  // Client-side filter: only keep requests from clients in this org
  const allRequests = (data ?? []) as unknown as ConciergeRow[];
  const orgRows = allRequests.filter((row) => {
    return row.clients?.organization_id === orgId;
  });

  return orgRows.map((request) => {
    const client = request.clients;

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
      type: "concierge" as const,
      title: request.type ?? "Concierge Request",
      subtitle: client?.full_name ?? "Unknown Client",
      startDate: request.created_at ?? new Date().toISOString(),
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

// ---------------------------------------------------------------------------
// Fetch + normalise: Personal Events
// ---------------------------------------------------------------------------

async function fetchPersonalEvents(
  supabase: SupabaseClient,
  orgId: string,
  windowStart: string,
  windowEnd: string,
): Promise<CalendarEvent[]> {
  const { data, error } = await untypedFrom(supabase, "calendar_events")
    .select(PERSONAL_EVENT_SELECT)
    .eq("organization_id", orgId)
    .gte("start_time", windowStart)
    .lte("start_time", windowEnd);

  if (error) throw error;

  type PersonalCategory = "meeting" | "task" | "reminder" | "personal" | "other";
  interface CalendarEventRow {
    id: string;
    title: string;
    description?: string | null;
    location?: string | null;
    start_time: string;
    end_time?: string | null;
    all_day?: boolean;
    category?: PersonalCategory;
    status?: string;
  }
  return ((data ?? []) as unknown as CalendarEventRow[]).map((row) => ({
    id: row.id,
    type: "personal" as const,
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
      type: "personal" as const,
      description: row.description ?? null,
      location: row.location ?? null,
      category: row.category ?? "personal",
      allDay: row.all_day ?? false,
    },
  }));
}

// ---------------------------------------------------------------------------
// Main hook
// ---------------------------------------------------------------------------

export function useCalendarEvents(month: number, year: number) {
  return useQuery({
    queryKey: calendarKeys.events(month, year),
    queryFn: async (): Promise<CalendarEvent[]> => {
      const supabase = createClient();
      const orgId = await getOrgId(supabase);

      // Build a padded window: 7 days before first of month to 7 days after last
      const firstOfMonth = new Date(year, month, 1);
      const lastOfMonth = new Date(year, month + 1, 0);

      const windowStart = new Date(firstOfMonth);
      windowStart.setDate(windowStart.getDate() - 7);

      const windowEnd = new Date(lastOfMonth);
      windowEnd.setDate(windowEnd.getDate() + 7);

      const startIso = windowStart.toISOString();
      const endIso = windowEnd.toISOString();

      // Fire all fetches in parallel; tolerate individual failures
      const results = await Promise.allSettled([
        fetchTrips(supabase, orgId, startIso, endIso),
        fetchInvoices(supabase, orgId, startIso, endIso),
        fetchPayments(supabase, orgId, startIso, endIso),
        fetchProposals(supabase, orgId, startIso, endIso),
        fetchSocialPosts(supabase, orgId, startIso, endIso),
        fetchConciergeRequests(supabase, orgId, startIso, endIso),
        fetchPersonalEvents(supabase, orgId, startIso, endIso),
      ]);

      // Merge all fulfilled results into a single array
      const events: CalendarEvent[] = results.flatMap((result) =>
        result.status === "fulfilled" ? result.value : [],
      );

      return events;
    },
    staleTime: 30_000,
  });
}
