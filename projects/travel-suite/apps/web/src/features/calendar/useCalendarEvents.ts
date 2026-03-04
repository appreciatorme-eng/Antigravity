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

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

type SupabaseClient = ReturnType<typeof createClient>;

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
      "*, clients(full_name), itineraries(destination, trip_title, duration_days)",
    )
    .eq("organization_id", orgId)
    .gte("end_date", windowStart)
    .lte("start_date", windowEnd);

  if (error) throw error;

  return (data ?? []).map((trip: any) => {
    const client = trip.clients as { full_name?: string } | null;
    const itinerary = trip.itineraries as {
      trip_title?: string;
      destination?: string;
      duration_days?: number;
    } | null;

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
    .select("*, clients(full_name)")
    .eq("organization_id", orgId)
    .gte("due_date", windowStart)
    .lte("due_date", windowEnd);

  if (error) throw error;

  return (data ?? []).map((invoice: any) => {
    const client = invoice.clients as { full_name?: string } | null;

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
  const orgRows = (data ?? []).filter((row: any) => {
    const invoice = row.invoices as { organization_id?: string } | null;
    return invoice?.organization_id === orgId;
  });

  return orgRows.map((payment: any) => {
    const invoice = payment.invoices as {
      invoice_number?: string;
      trip_id?: string;
    } | null;

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

  return (data ?? []).map((proposal: any) => {
    const client = proposal.clients as { full_name?: string } | null;

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
    .select("*")
    .eq("organization_id", orgId)
    .gte("created_at", windowStart)
    .lte("created_at", windowEnd);

  if (error) throw error;

  return (data ?? []).map((post: any) => {
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
    .select("*, clients(full_name, organization_id)")
    .gte("created_at", windowStart)
    .lte("created_at", windowEnd);

  if (error) throw error;

  // Client-side filter: only keep requests from clients in this org
  const orgRows = (data ?? []).filter((row: any) => {
    const client = row.clients as { organization_id?: string } | null;
    return client?.organization_id === orgId;
  });

  return orgRows.map((request: any) => {
    const client = request.clients as { full_name?: string } | null;

    const entityData: ConciergeEventData = {
      type: "concierge",
      message: request.message,
      requestType: request.type,
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
