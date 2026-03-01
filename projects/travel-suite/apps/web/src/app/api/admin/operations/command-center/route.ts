import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";

type DepartureItem = {
  trip_id: string;
  title: string;
  destination: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  client_name: string;
  days_until_departure: number | null;
};

type PendingPaymentItem = {
  invoice_id: string;
  invoice_number: string;
  status: string;
  due_date: string | null;
  balance_amount: number;
  total_amount: number;
  client_name: string;
  is_overdue: boolean;
};

type ExpiringQuoteItem = {
  proposal_id: string;
  title: string;
  status: string;
  expires_at: string | null;
  total_price: number;
  client_name: string;
  hours_to_expiry: number | null;
};

type FollowUpItem = {
  queue_id: string;
  notification_type: string;
  status: string;
  scheduled_for: string;
  trip_id: string | null;
  recipient: string | null;
  overdue: boolean;
};

function startOfUtcDay(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfUtcDay(date = new Date()): Date {
  const start = startOfUtcDay(date);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

function asNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function valueOrUnknown(value: string | null | undefined): string {
  const text = (value || "").trim();
  return text.length > 0 ? text : "Unknown";
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  const now = new Date();
  const organizationId = admin.organizationId;

  if (!organizationId) {
    return NextResponse.json({ error: "Organization not configured" }, { status: 400 });
  }

  const dayStart = startOfUtcDay(now);
  const dayEnd = endOfUtcDay(now);
  const departuresEnd = new Date(dayEnd.getTime() + 48 * 60 * 60 * 1000);
  const quoteExpiryEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const followupWindowStart = new Date(now.getTime() - 12 * 60 * 60 * 1000);
  const followupWindowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const [tripsResult, invoicesResult, proposalsResult, followupsResult] = await Promise.all([
    admin.adminClient
      .from("trips")
      .select("id,itinerary_id,client_id,status,start_date,end_date")
      .eq("organization_id", organizationId)
      .not("start_date", "is", null)
      .gte("start_date", dayStart.toISOString())
      .lte("start_date", departuresEnd.toISOString())
      .order("start_date", { ascending: true })
      .limit(100),
    admin.adminClient
      .from("invoices")
      .select("id,invoice_number,status,due_date,balance_amount,total_amount,client_id")
      .eq("organization_id", organizationId)
      .gt("balance_amount", 0)
      .order("due_date", { ascending: true })
      .limit(150),
    admin.adminClient
      .from("proposals")
      .select("id,title,status,expires_at,total_price,client_id")
      .eq("organization_id", organizationId)
      .not("expires_at", "is", null)
      .lte("expires_at", quoteExpiryEnd.toISOString())
      .order("expires_at", { ascending: true })
      .limit(150),
    admin.adminClient
      .from("notification_queue")
      .select("id,notification_type,status,scheduled_for,trip_id,recipient_phone,recipient_email")
      .or("status.eq.pending,status.eq.queued,status.eq.retry,status.eq.failed")
      .gte("scheduled_for", followupWindowStart.toISOString())
      .lte("scheduled_for", followupWindowEnd.toISOString())
      .order("scheduled_for", { ascending: true })
      .limit(150),
  ]);

  if (tripsResult.error) {
    return NextResponse.json({ error: tripsResult.error.message }, { status: 500 });
  }

  if (invoicesResult.error) {
    return NextResponse.json({ error: invoicesResult.error.message }, { status: 500 });
  }

  if (proposalsResult.error) {
    return NextResponse.json({ error: proposalsResult.error.message }, { status: 500 });
  }

  if (followupsResult.error) {
    return NextResponse.json({ error: followupsResult.error.message }, { status: 500 });
  }

  const trips = tripsResult.data || [];
  const invoices = invoicesResult.data || [];
  const proposals = proposalsResult.data || [];
  const followups = followupsResult.data || [];

  const itineraryIds = Array.from(
    new Set(trips.map((trip) => trip.itinerary_id).filter((id): id is string => Boolean(id)))
  );

  const clientIds = Array.from(
    new Set(
      [
        ...trips.map((trip) => trip.client_id),
        ...invoices.map((invoice) => invoice.client_id),
        ...proposals.map((proposal) => proposal.client_id),
      ].filter((id): id is string => Boolean(id))
    )
  );

  const [itineraryTitlesResult, clientProfilesResult] = await Promise.all([
    itineraryIds.length > 0
      ? admin.adminClient
          .from("itineraries")
          .select("id,trip_title,destination")
          .in("id", itineraryIds)
      : Promise.resolve({ data: [], error: null }),
    clientIds.length > 0
      ? admin.adminClient.from("profiles").select("id,full_name").in("id", clientIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (itineraryTitlesResult.error) {
    return NextResponse.json({ error: itineraryTitlesResult.error.message }, { status: 500 });
  }

  if (clientProfilesResult.error) {
    return NextResponse.json({ error: clientProfilesResult.error.message }, { status: 500 });
  }

  const itineraryMap = new Map(
    (itineraryTitlesResult.data || []).map((itinerary) => [
      itinerary.id,
      {
        title: itinerary.trip_title || "Untitled itinerary",
        destination: itinerary.destination || "Destination pending",
      },
    ])
  );

  const clientMap = new Map(
    (clientProfilesResult.data || []).map((profile) => [profile.id, valueOrUnknown(profile.full_name)])
  );

  const departures: DepartureItem[] = trips.map((trip) => {
    const itinerary = trip.itinerary_id ? itineraryMap.get(trip.itinerary_id) : null;
    const startDate = trip.start_date;
    const daysUntil = startDate
      ? Math.ceil((new Date(startDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      : null;

    return {
      trip_id: trip.id,
      title: itinerary?.title || "Untitled itinerary",
      destination: itinerary?.destination || "Destination pending",
      status: valueOrUnknown(trip.status),
      start_date: startDate,
      end_date: trip.end_date,
      client_name: trip.client_id ? clientMap.get(trip.client_id) || "Client" : "Client",
      days_until_departure: daysUntil,
    };
  });

  const pendingPayments: PendingPaymentItem[] = invoices.map((invoice) => {
    const dueDate = invoice.due_date ? new Date(invoice.due_date) : null;
    return {
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      status: valueOrUnknown(invoice.status),
      due_date: invoice.due_date,
      balance_amount: asNumber(invoice.balance_amount),
      total_amount: asNumber(invoice.total_amount),
      client_name: invoice.client_id ? clientMap.get(invoice.client_id) || "Client" : "Client",
      is_overdue: Boolean(dueDate && dueDate.getTime() < now.getTime()),
    };
  });

  const expiringQuotes: ExpiringQuoteItem[] = proposals
    .filter((proposal) => {
      const status = (proposal.status || "").toLowerCase();
      return status !== "won" && status !== "closed" && status !== "cancelled";
    })
    .map((proposal) => {
      const expiresAt = proposal.expires_at;
      const hoursToExpiry = expiresAt
        ? Math.round((new Date(expiresAt).getTime() - now.getTime()) / (60 * 60 * 1000))
        : null;

      return {
        proposal_id: proposal.id,
        title: proposal.title || "Untitled proposal",
        status: valueOrUnknown(proposal.status),
        expires_at: expiresAt,
        total_price: asNumber(proposal.total_price),
        client_name: proposal.client_id ? clientMap.get(proposal.client_id) || "Client" : "Client",
        hours_to_expiry: hoursToExpiry,
      };
    });

  const followUps: FollowUpItem[] = followups.map((entry) => {
    const scheduledAt = new Date(entry.scheduled_for);
    const recipient = entry.recipient_phone || entry.recipient_email || null;

    return {
      queue_id: entry.id,
      notification_type: valueOrUnknown(entry.notification_type),
      status: valueOrUnknown(entry.status),
      scheduled_for: entry.scheduled_for,
      trip_id: entry.trip_id,
      recipient,
      overdue: scheduledAt.getTime() < now.getTime(),
    };
  });

  const summary = {
    departures_window: departures.length,
    pending_payments: pendingPayments.length,
    expiring_quotes: expiringQuotes.length,
    follow_ups_due: followUps.length,
    overdue_invoices: pendingPayments.filter((invoice) => invoice.is_overdue).length,
    urgent_quotes: expiringQuotes.filter(
      (quote) => typeof quote.hours_to_expiry === "number" && quote.hours_to_expiry <= 24
    ).length,
    overdue_follow_ups: followUps.filter((entry) => entry.overdue).length,
  };

  return NextResponse.json({
    generated_at: now.toISOString(),
    day_window: {
      start: dayStart.toISOString(),
      end: dayEnd.toISOString(),
    },
    summary,
    departures,
    pending_payments: pendingPayments,
    expiring_quotes: expiringQuotes,
    follow_ups: followUps,
  });
}
