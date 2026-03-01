import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

// Narrowed query client for the subset of methods used in this route.
type AdminQueryClient = Pick<SupabaseClient, "from">;

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

type FollowUpRow = {
  id: string;
  notification_type: string | null;
  status: string | null;
  scheduled_for: string;
  trip_id: string | null;
  recipient_phone: string | null;
  recipient_email: string | null;
};

type DailyOpsBoard = {
  at_risk_departures: number;
  pending_payments: number;
  expiring_quotes_24h: number;
  overdue_follow_ups: number;
};

type OutcomeEventMetric = {
  key: "time_saved_hours" | "recovered_revenue_inr" | "response_sla_pct";
  label: string;
  value: number;
  unit: "hours" | "inr" | "percent";
  window: string;
};

type UpgradePrompt = {
  id: string;
  title: string;
  detail: string;
  trigger: string;
  cta_label: string;
  cta_path: string;
  priority: number;
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

function chunkValues<T>(values: T[], size: number): T[][] {
  if (values.length === 0) return [];
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function normalizeFollowUpRows(rows: FollowUpRow[]): FollowUpRow[] {
  return [...rows]
    .sort((left, right) => new Date(left.scheduled_for).getTime() - new Date(right.scheduled_for).getTime())
    .slice(0, 150);
}

async function queryFollowUpsByColumn(params: {
  client: AdminQueryClient;
  column: "user_id" | "trip_id";
  ids: string[];
  windowStartIso: string;
  windowEndIso: string;
}): Promise<{ data: FollowUpRow[]; error: PostgrestError | null }> {
  const chunks = chunkValues(params.ids, 200);
  const collected: FollowUpRow[] = [];

  for (const chunk of chunks) {
    const { data, error } = await params.client
      .from("notification_queue")
      .select("id,notification_type,status,scheduled_for,trip_id,recipient_phone,recipient_email")
      .or("status.eq.pending,status.eq.queued,status.eq.retry,status.eq.failed")
      .gte("scheduled_for", params.windowStartIso)
      .lte("scheduled_for", params.windowEndIso)
      .in(params.column, chunk)
      .order("scheduled_for", { ascending: true })
      .limit(150);

    if (error) {
      return { data: [], error };
    }

    collected.push(...((data || []) as FollowUpRow[]));
  }

  return {
    data: normalizeFollowUpRows(collected),
    error: null,
  };
}

async function fetchScopedFollowUps(params: {
  client: AdminQueryClient;
  organizationId: string;
  windowStartIso: string;
  windowEndIso: string;
}): Promise<{ data: FollowUpRow[]; error: PostgrestError | null }> {
  const [orgUsersResult, orgTripsResult] = await Promise.all([
    params.client.from("profiles").select("id").eq("organization_id", params.organizationId).limit(5000),
    params.client.from("trips").select("id").eq("organization_id", params.organizationId).limit(5000),
  ]);

  if (orgUsersResult.error) {
    return { data: [], error: orgUsersResult.error };
  }

  if (orgTripsResult.error) {
    return { data: [], error: orgTripsResult.error };
  }

  const userIds = (orgUsersResult.data || []).map((row) => row.id).filter(Boolean);
  const tripIds = (orgTripsResult.data || []).map((row) => row.id).filter(Boolean);

  const [byUser, byTrip] = await Promise.all([
    queryFollowUpsByColumn({
      client: params.client,
      column: "user_id",
      ids: userIds,
      windowStartIso: params.windowStartIso,
      windowEndIso: params.windowEndIso,
    }),
    queryFollowUpsByColumn({
      client: params.client,
      column: "trip_id",
      ids: tripIds,
      windowStartIso: params.windowStartIso,
      windowEndIso: params.windowEndIso,
    }),
  ]);

  if (byUser.error) {
    return { data: [], error: byUser.error };
  }

  if (byTrip.error) {
    return { data: [], error: byTrip.error };
  }

  const deduped = new Map<string, FollowUpRow>();
  for (const entry of [...byUser.data, ...byTrip.data]) {
    deduped.set(entry.id, entry);
  }

  return {
    data: normalizeFollowUpRows(Array.from(deduped.values())),
    error: null,
  };
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
  const paidInvoiceWindowStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [tripsResult, invoicesResult, proposalsResult, paidInvoicesResult] = await Promise.all([
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
      .from("invoices")
      .select("id,total_amount,created_at")
      .eq("organization_id", organizationId)
      .eq("status", "paid")
      .gte("created_at", paidInvoiceWindowStart.toISOString())
      .order("created_at", { ascending: false })
      .limit(500),
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

  if (paidInvoicesResult.error) {
    return NextResponse.json({ error: paidInvoicesResult.error.message }, { status: 500 });
  }

  const followupsResult = await fetchScopedFollowUps({
    client: admin.adminClient,
    organizationId,
    windowStartIso: followupWindowStart.toISOString(),
    windowEndIso: followupWindowEnd.toISOString(),
  });

  if (followupsResult.error) {
    return NextResponse.json({ error: followupsResult.error.message }, { status: 500 });
  }

  const trips = tripsResult.data || [];
  const invoices = invoicesResult.data || [];
  const proposals = proposalsResult.data || [];
  const paidInvoices = paidInvoicesResult.data || [];
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
      ? admin.adminClient.from("itineraries").select("id,trip_title,destination").in("id", itineraryIds)
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

  const atRiskDepartures = departures.filter((departure) => {
    const status = departure.status.toLowerCase();
    const requiresAttention = status !== "confirmed" && status !== "active" && status !== "in_progress";
    return requiresAttention && typeof departure.days_until_departure === "number" && departure.days_until_departure <= 1;
  }).length;

  const recoveredRevenueInr = paidInvoices.reduce((sum, invoice) => {
    return sum + asNumber(invoice.total_amount);
  }, 0);

  const estimatedTimeSavedHours = Number(((followUps.length * 0.12) + (expiringQuotes.length * 0.18)).toFixed(1));
  const responseSlaPct =
    summary.follow_ups_due > 0
      ? Number((((summary.follow_ups_due - summary.overdue_follow_ups) / summary.follow_ups_due) * 100).toFixed(1))
      : 100;

  const dailyOpsBoard: DailyOpsBoard = {
    at_risk_departures: atRiskDepartures,
    pending_payments: summary.pending_payments,
    expiring_quotes_24h: summary.urgent_quotes,
    overdue_follow_ups: summary.overdue_follow_ups,
  };

  const outcomeEvents: OutcomeEventMetric[] = [
    {
      key: "time_saved_hours",
      label: "Estimated operator time saved",
      value: estimatedTimeSavedHours,
      unit: "hours",
      window: "daily projection",
    },
    {
      key: "recovered_revenue_inr",
      label: "Recovered revenue from paid invoices",
      value: Number(recoveredRevenueInr.toFixed(2)),
      unit: "inr",
      window: "last 30 days",
    },
    {
      key: "response_sla_pct",
      label: "Response SLA adherence",
      value: responseSlaPct,
      unit: "percent",
      window: "follow-up window",
    },
  ];

  const upgradePrompts: UpgradePrompt[] = [];

  if (summary.pending_payments >= 5 && recoveredRevenueInr < 200000) {
    upgradePrompts.push({
      id: "collections-automation-upgrade",
      title: "Collections workload is constraining recovered revenue",
      detail: "Payment reminders are accumulating faster than recovery velocity.",
      trigger: `${summary.pending_payments} pending payments · ₹${Math.round(recoveredRevenueInr).toLocaleString("en-IN")} recovered`,
      cta_label: "Enable collections automation",
      cta_path: "/admin/billing",
      priority: 1,
    });
  }

  if (responseSlaPct < 90) {
    upgradePrompts.push({
      id: "sla-automation-upgrade",
      title: "Response SLA is slipping below target",
      detail: "Overdue follow-ups indicate manual dispatch latency during busy windows.",
      trigger: `${responseSlaPct.toFixed(1)}% SLA adherence`,
      cta_label: "Upgrade for SLA workflows",
      cta_path: "/admin/billing",
      priority: 2,
    });
  }

  if (atRiskDepartures >= 3 || summary.urgent_quotes >= 4) {
    upgradePrompts.push({
      id: "ops-scale-upgrade",
      title: "Daily operations are hitting multi-queue pressure",
      detail: "Departure risk and urgent quotes are high enough to justify automation scale-up.",
      trigger: `${atRiskDepartures} at-risk departures · ${summary.urgent_quotes} urgent quotes`,
      cta_label: "Scale command center capacity",
      cta_path: "/admin/billing",
      priority: 3,
    });
  }

  upgradePrompts.sort((left, right) => left.priority - right.priority);

  return NextResponse.json({
    generated_at: now.toISOString(),
    day_window: {
      start: dayStart.toISOString(),
      end: dayEnd.toISOString(),
    },
    summary,
    daily_ops_board: dailyOpsBoard,
    outcome_events: outcomeEvents,
    upgrade_prompts: upgradePrompts,
    departures,
    pending_payments: pendingPayments,
    expiring_quotes: expiringQuotes,
    follow_ups: followUps,
  });
}
