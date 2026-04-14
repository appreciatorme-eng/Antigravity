import type { SupabaseClient } from "@supabase/supabase-js";
import type { TimeWindow } from "./adapters";
import type { ResolvedAdminDateRange } from "@/lib/admin/date-range";
import {
  buildDashboardClientMap,
  buildDashboardCollectionsWorkspaceData,
  buildDashboardOutstandingSnapshot,
  buildDashboardRevenueSeries,
  buildDashboardTripStatusMap,
  decorateDashboardTrips,
  resolveWonCommercialStage,
  resolveDashboardProposalRows,
  filterDashboardInvoicesByTrip,
} from "@/lib/admin/dashboard-business-state";
import { loadDashboardSourceBundle, type AdminQueryClient } from "@/lib/admin/dashboard-selectors";
import { filterCanonicalPipelineProposals } from "@/lib/proposals/pipeline-integrity";
import { isLostProposal, isWonProposal, isWonTripStatus } from "@/lib/admin/proposal-outcomes";

// ---------------------------------------------------------------------------
// Shared types for drill-through data
// ---------------------------------------------------------------------------

export interface DrillRow {
  id: string;
  title: string;
  subtitle: string;
  amountLabel: string;
  status: string;
  dateLabel: string;
  href: string;
}

export interface DrillSummary {
  label: string;
  primaryValue: string;
  secondaryValue: string;
  windowLabel: string;
}

export interface DrillResult {
  summary: DrillSummary;
  rows: DrillRow[];
}

interface ItineraryLite {
  destination: string | null;
  trip_title: string | null;
  raw_data?: {
    pricing?: {
      total_cost?: number | null;
      per_person_cost?: number | null;
      pax_count?: number | null;
    } | null;
    financial_summary?: {
      payment_status?: string | null;
    } | null;
  } | null;
}

interface InvoiceDrillRow {
  id: string;
  created_at: string | null;
  total_amount: number;
  balance_amount?: number | null;
  status: string;
  invoice_number: string;
  trip_id?: string | null;
}

interface TripDrillRow {
  id: string;
  created_at: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  itineraries: ItineraryLite | ItineraryLite[] | null;
}

interface ProposalDrillRow {
  id: string;
  title: string;
  status: string | null;
  total_price: number | null;
  client_selected_price: number | null;
  created_at: string | null;
  viewed_at: string | null;
  trip_id?: string | null;
  trips?:
    | {
        id?: string | null;
        status?: string | null;
      }
    | {
        id?: string | null;
        status?: string | null;
      }[]
    | null;
}

interface PaymentLinkDrillRow {
  id: string;
  status: string | null;
  amount_paise: number | null;
  paid_at: string | null;
  proposal_id: string | null;
}

interface ClientDrillRow {
  id: string;
  created_at: string | null;
  profiles:
    | {
        full_name: string | null;
        email: string | null;
        lifecycle_stage: string | null;
      }
    | {
        full_name: string | null;
        email: string | null;
        lifecycle_stage: string | null;
      }[]
    | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(value: string | null): string {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getItinerary(value: TripDrillRow["itineraries"]): ItineraryLite | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] || null;
  return value;
}

function getClientProfile(
  value: ClientDrillRow["profiles"],
): { full_name: string | null; email: string | null; lifecycle_stage: string | null } | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    return value[0] || null;
  }
  return value;
}

function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatRangeDateLabel(range: ResolvedAdminDateRange): string {
  return range.label;
}

function getProposalValue(proposal: ProposalDrillRow): number {
  return Number(proposal.client_selected_price ?? proposal.total_price ?? 0);
}

function getTripQuotedTotal(trip: TripDrillRow): number {
  const itinerary = getItinerary(trip.itineraries);
  const pricing = itinerary?.raw_data?.pricing;
  const totalCost = Number(pricing?.total_cost || 0);
  if (totalCost > 0) return totalCost;
  const perPersonCost = Number(pricing?.per_person_cost || 0);
  const paxCount = Number(pricing?.pax_count || 0);
  if (perPersonCost > 0 && paxCount > 0) {
    return perPersonCost * paxCount;
  }
  return 0;
}

function isMissingDeletedAtError(message: string | null | undefined): boolean {
  const normalized = (message || "").toLowerCase();
  return normalized.includes("deleted_at") && normalized.includes("column");
}

async function loadDashboardCommercialState(
  supabase: SupabaseClient,
  orgId: string,
  range: ResolvedAdminDateRange,
) {
  const sources = await loadDashboardSourceBundle({
    client: supabase as unknown as AdminQueryClient,
    organizationId: orgId,
    followUpWindowStartIso: range.fromISO,
    followUpWindowEndIso: range.toExclusiveISO,
  });

  const clientMap = buildDashboardClientMap(sources.profiles.rows);
  const tripStatusMap = buildDashboardTripStatusMap(sources.trips.rows);
  const trips = decorateDashboardTrips({
    trips: sources.trips.rows,
    itineraries: sources.itineraries.rows,
    clientMap,
  });
  const proposals = resolveDashboardProposalRows({
    proposals: sources.proposals.rows,
    tripStatusMap,
    clientMap,
    enforceLinkedTripPresence: sources.trips.health !== "failed",
  });
  const invoices = filterDashboardInvoicesByTrip({
    invoices: sources.invoices.rows,
    tripStatusMap,
    enforceLinkedTripPresence: sources.trips.health !== "failed",
  });

  return {
    sources,
    trips,
    proposals,
    invoices,
  };
}

// ---------------------------------------------------------------------------
// Existing loaders (migrated from drill-through page.tsx)
// ---------------------------------------------------------------------------

export async function loadRevenueDrill(
  supabase: SupabaseClient,
  orgId: string,
  win: TimeWindow,
): Promise<DrillResult> {
  const { data, error } = await supabase
    .from("invoices")
    .select("id, invoice_number, total_amount, status, created_at")
    .eq("organization_id", orgId)
    .gte("created_at", win.startISO)
    .lt("created_at", win.endISO)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  const invoiceRows = (data || []) as InvoiceDrillRow[];
  const paidRows = invoiceRows.filter((inv) => (inv.status || "").toLowerCase() === "paid");
  const total = paidRows.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

  return {
    summary: {
      label: "Paid invoice revenue",
      primaryValue: formatINR(total),
      secondaryValue: `${paidRows.length} paid invoice${paidRows.length === 1 ? "" : "s"}`,
      windowLabel: win.label,
    },
    rows: invoiceRows.map((inv) => ({
      id: inv.id,
      title: `Invoice ${inv.invoice_number}`,
      subtitle: `Status: ${(inv.status || "pending").toUpperCase()}`,
      amountLabel: formatINR(Number(inv.total_amount || 0)),
      status: inv.status || "pending",
      dateLabel: formatDate(inv.created_at),
      href: "/admin/billing",
    })),
  };
}

export async function loadBookedValueDrill(
  supabase: SupabaseClient,
  orgId: string,
  range: ResolvedAdminDateRange,
): Promise<DrillResult> {
  const sources = await loadDashboardSourceBundle({
    client: supabase as unknown as AdminQueryClient,
    organizationId: orgId,
    followUpWindowStartIso: range.fromISO,
    followUpWindowEndIso: range.toExclusiveISO,
  });

  const clientMap = buildDashboardClientMap(sources.profiles.rows);
  const tripStatusMap = buildDashboardTripStatusMap(sources.trips.rows);
  const trips = decorateDashboardTrips({
    trips: sources.trips.rows,
    itineraries: sources.itineraries.rows,
    clientMap,
  });
  const proposals = resolveDashboardProposalRows({
    proposals: sources.proposals.rows,
    tripStatusMap,
    clientMap,
    enforceLinkedTripPresence: sources.trips.health !== "failed",
  });
  const invoices = filterDashboardInvoicesByTrip({
    invoices: sources.invoices.rows,
    tripStatusMap,
    enforceLinkedTripPresence: sources.trips.health !== "failed",
  });

  const series = buildDashboardRevenueSeries({
    range,
    proposals,
    trips,
    invoices,
    paymentLinks: sources.paymentLinks.rows,
    invoicePayments: sources.invoicePayments.rows,
    commercialPayments: sources.commercialPayments.rows,
  });

  const seen = new Set<string>();
  const rows: DrillRow[] = [];

  for (const point of [...series].reverse()) {
    for (const item of point.cashItems || []) {
      const ownerKey = `${item.kind}:${item.id}`;
      if (seen.has(ownerKey)) continue;
      seen.add(ownerKey);

      rows.push({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        amountLabel: item.amountLabel,
        status: item.status,
        dateLabel: item.dateLabel,
        href: item.href,
      });
    }
  }

  const totalCollectedCash = series.reduce(
    (sum, point) => sum + Number(point.cashCollected || 0),
    0,
  );

  return {
    summary: {
      label: "Collected cash contributors",
      primaryValue: formatINR(totalCollectedCash),
      secondaryValue: `${rows.length} payment${rows.length === 1 ? "" : "s"} contributing to revenue`,
      windowLabel: formatRangeDateLabel(range),
    },
    rows,
  };
}

export async function loadWonValueDrill(
  supabase: SupabaseClient,
  orgId: string,
  range: ResolvedAdminDateRange,
): Promise<DrillResult> {
  const sources = await loadDashboardSourceBundle({
    client: supabase as unknown as AdminQueryClient,
    organizationId: orgId,
    followUpWindowStartIso: range.fromISO,
    followUpWindowEndIso: range.toExclusiveISO,
  });

  const clientMap = buildDashboardClientMap(sources.profiles.rows);
  const tripStatusMap = buildDashboardTripStatusMap(sources.trips.rows);
  const trips = decorateDashboardTrips({
    trips: sources.trips.rows,
    itineraries: sources.itineraries.rows,
    clientMap,
  });
  const proposals = resolveDashboardProposalRows({
    proposals: sources.proposals.rows,
    tripStatusMap,
    clientMap,
    enforceLinkedTripPresence: sources.trips.health !== "failed",
  });
  const invoices = filterDashboardInvoicesByTrip({
    invoices: sources.invoices.rows,
    tripStatusMap,
    enforceLinkedTripPresence: sources.trips.health !== "failed",
  });

  const series = buildDashboardRevenueSeries({
    range,
    proposals,
    trips,
    invoices,
    paymentLinks: sources.paymentLinks.rows,
    invoicePayments: sources.invoicePayments.rows,
    commercialPayments: sources.commercialPayments.rows,
  });

  const proposalById = new Map(proposals.map((proposal) => [proposal.id, proposal]));
  const tripById = new Map(trips.map((trip) => [trip.id, trip]));
  const seen = new Set<string>();
  const rows: DrillRow[] = [];

  for (const point of [...series].reverse()) {
    for (const item of point.bookedItems || []) {
      const ownerKey = `${item.kind}:${item.id}`;
      if (seen.has(ownerKey)) continue;
      seen.add(ownerKey);

      if (item.kind === "proposal") {
        const proposal = proposalById.get(item.id) || null;
        const linkedTrip = proposal?.trip_id ? tripById.get(proposal.trip_id) || null : null;

        rows.push({
          id: item.id,
          title: linkedTrip?.tripTitle || item.title,
          subtitle: linkedTrip?.destination || linkedTrip?.clientName || item.subtitle,
          amountLabel: item.amountLabel,
          status: linkedTrip?.status || item.status,
          dateLabel: item.dateLabel,
          href: linkedTrip ? `/trips/${linkedTrip.id}` : item.href,
        });
        continue;
      }

      rows.push({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        amountLabel: item.amountLabel,
        status: item.status,
        dateLabel: item.dateLabel,
        href: item.href,
      });
    }
  }

  const totalWonValue = series.reduce(
    (sum, point) => sum + Number(point.bookedValue || 0),
    0,
  );

  return {
    summary: {
      label: "Won value contributors",
      primaryValue: formatINR(totalWonValue),
      secondaryValue: `${rows.length} linked record${rows.length === 1 ? "" : "s"} contributing to won value`,
      windowLabel: formatRangeDateLabel(range),
    },
    rows,
  };
}

export async function loadOutstandingDrill(
  supabase: SupabaseClient,
  orgId: string,
  range: ResolvedAdminDateRange,
): Promise<DrillResult> {
  const sources = await loadDashboardSourceBundle({
    client: supabase as unknown as AdminQueryClient,
    organizationId: orgId,
    followUpWindowStartIso: range.fromISO,
    followUpWindowEndIso: range.toExclusiveISO,
  });

  const clientMap = buildDashboardClientMap(sources.profiles.rows);
  const tripStatusMap = buildDashboardTripStatusMap(sources.trips.rows);
  const trips = decorateDashboardTrips({
    trips: sources.trips.rows,
    itineraries: sources.itineraries.rows,
    clientMap,
  });
  const proposals = resolveDashboardProposalRows({
    proposals: sources.proposals.rows,
    tripStatusMap,
    clientMap,
    enforceLinkedTripPresence: sources.trips.health !== "failed",
  });
  const invoices = filterDashboardInvoicesByTrip({
    invoices: sources.invoices.rows,
    tripStatusMap,
    enforceLinkedTripPresence: sources.trips.health !== "failed",
  });

  const outstanding = buildDashboardOutstandingSnapshot({
    proposals,
    trips,
    invoices,
    paymentLinks: sources.paymentLinks.rows,
    commercialPayments: sources.commercialPayments.rows,
  });

  return {
    summary: {
      label: "Outstanding balance contributors",
      primaryValue: formatINR(outstanding.totalOutstanding),
      secondaryValue: `${outstanding.items.length} linked record${outstanding.items.length === 1 ? "" : "s"} contributing to outstanding balance`,
      windowLabel: formatRangeDateLabel(range),
    },
    rows: outstanding.items.map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      amountLabel: item.amountLabel,
      status: item.status,
      dateLabel: item.dateLabel,
      href: item.href,
    })),
  };
}

async function loadCollectionsBucketDrill(params: {
  supabase: SupabaseClient;
  orgId: string;
  range: ResolvedAdminDateRange;
  bucketKey:
    | "overdue_invoices"
      | "due_this_week"
      | "partially_paid_trips"
      | "approved_unpaid_trips";
  summaryLabel: string;
  rowLabel: string;
}): Promise<DrillResult> {
  const { sources, trips, proposals, invoices } = await loadDashboardCommercialState(
    params.supabase,
    params.orgId,
    params.range,
  );
  const series = buildDashboardRevenueSeries({
    range: params.range,
    proposals,
    trips,
    invoices,
    paymentLinks: sources.paymentLinks.rows,
    invoicePayments: sources.invoicePayments.rows,
    commercialPayments: sources.commercialPayments.rows,
  });
  const totalCollectedCash = series.reduce(
    (sum, point) => sum + Number(point.cashCollected || 0),
    0,
  );
  const workspace = buildDashboardCollectionsWorkspaceData({
    range: params.range,
    proposals,
    trips,
    invoices,
    paymentLinks: sources.paymentLinks.rows,
    commercialPayments: sources.commercialPayments.rows,
    followUps: sources.followUps.rows,
    collectedThisWindow: totalCollectedCash,
    now: new Date(),
  });
  const bucket = workspace.buckets.find((item) => item.key === params.bucketKey);
  const rows = (workspace.bucketRows[params.bucketKey] || []).map((row) => ({
    id: row.id,
    title: row.title,
    subtitle: row.clientName || row.followUpState || "Collection record",
    amountLabel: formatINR(Number(row.outstandingAmount || 0)),
    status: row.paymentStage,
    dateLabel: row.dueDate ? formatDate(row.dueDate) : "N/A",
    href: row.primaryHref,
  }));

  return {
    summary: {
      label: params.summaryLabel,
      primaryValue: formatINR(Number(bucket?.amount || 0)),
      secondaryValue: `${rows.length} ${params.rowLabel}${rows.length === 1 ? "" : "s"}`,
      windowLabel: formatRangeDateLabel(params.range),
    },
    rows,
  };
}

export async function loadCollectionsOutstandingDrill(
  supabase: SupabaseClient,
  orgId: string,
  range: ResolvedAdminDateRange,
): Promise<DrillResult> {
  const { sources, trips, proposals, invoices } = await loadDashboardCommercialState(
    supabase,
    orgId,
    range,
  );
  const series = buildDashboardRevenueSeries({
    range,
    proposals,
    trips,
    invoices,
    paymentLinks: sources.paymentLinks.rows,
    invoicePayments: sources.invoicePayments.rows,
    commercialPayments: sources.commercialPayments.rows,
  });
  const totalCollectedCash = series.reduce(
    (sum, point) => sum + Number(point.cashCollected || 0),
    0,
  );
  const workspace = buildDashboardCollectionsWorkspaceData({
    range,
    proposals,
    trips,
    invoices,
    paymentLinks: sources.paymentLinks.rows,
    commercialPayments: sources.commercialPayments.rows,
    followUps: sources.followUps.rows,
    collectedThisWindow: totalCollectedCash,
    now: new Date(),
  });
  const rows = [
    ...workspace.bucketRows.overdue_invoices,
    ...workspace.bucketRows.due_this_week,
    ...workspace.bucketRows.partially_paid_trips,
    ...workspace.bucketRows.approved_unpaid_trips,
  ].map((row) => ({
    id: row.id,
    title: row.title,
    subtitle: row.clientName || row.followUpState || "Collection record",
    amountLabel: formatINR(Number(row.outstandingAmount || 0)),
    status: row.paymentStage,
    dateLabel: row.dueDate ? formatDate(row.dueDate) : "N/A",
    href: row.primaryHref,
  }));

  return {
    summary: {
      label: "Collections outstanding contributors",
      primaryValue: formatINR(Number(workspace.snapshot.outstanding.amount || 0)),
      secondaryValue: `${rows.length} linked record${rows.length === 1 ? "" : "s"} contributing to collectible outstanding`,
      windowLabel: formatRangeDateLabel(range),
    },
    rows,
  };
}

export async function loadCollectionsOverdueDrill(
  supabase: SupabaseClient,
  orgId: string,
  range: ResolvedAdminDateRange,
): Promise<DrillResult> {
  return loadCollectionsBucketDrill({
    supabase,
    orgId,
    range,
    bucketKey: "overdue_invoices",
    summaryLabel: "Overdue invoice contributors",
    rowLabel: "overdue invoice record",
  });
}

export async function loadCollectionsDueSoonDrill(
  supabase: SupabaseClient,
  orgId: string,
  range: ResolvedAdminDateRange,
): Promise<DrillResult> {
  return loadCollectionsBucketDrill({
    supabase,
    orgId,
    range,
    bucketKey: "due_this_week",
    summaryLabel: "Due this week contributors",
    rowLabel: "due-soon collection record",
  });
}

export async function loadCollectionsPartialDrill(
  supabase: SupabaseClient,
  orgId: string,
  range: ResolvedAdminDateRange,
): Promise<DrillResult> {
  return loadCollectionsBucketDrill({
    supabase,
    orgId,
    range,
    bucketKey: "partially_paid_trips",
    summaryLabel: "Partially paid trip contributors",
    rowLabel: "partially paid trip",
  });
}

export async function loadCollectionsApprovedUnpaidDrill(
  supabase: SupabaseClient,
  orgId: string,
  range: ResolvedAdminDateRange,
): Promise<DrillResult> {
  return loadCollectionsBucketDrill({
    supabase,
    orgId,
    range,
    bucketKey: "approved_unpaid_trips",
    summaryLabel: "Approved but unpaid trip contributors",
    rowLabel: "approved unpaid trip",
  });
}

export async function loadBookingsDrill(
  supabase: SupabaseClient,
  orgId: string,
  win: TimeWindow,
): Promise<DrillResult> {
  const { data, error } = await supabase
    .from("trips")
    .select("id, status, start_date, end_date, created_at, itineraries(destination, trip_title)")
    .eq("organization_id", orgId)
    .gte("created_at", win.startISO)
    .lt("created_at", win.endISO)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  const tripRows = (data || []) as TripDrillRow[];

  return {
    summary: {
      label: "Trips created",
      primaryValue: `${tripRows.length}`,
      secondaryValue: "Bookings in selected window",
      windowLabel: win.label,
    },
    rows: tripRows.map((trip) => {
      const itin = getItinerary(trip.itineraries);
      return {
        id: trip.id,
        title: itin?.trip_title || itin?.destination || "Trip record",
        subtitle: `${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}`,
        amountLabel: (trip.status || "draft").replace(/_/g, " "),
        status: trip.status || "draft",
        dateLabel: formatDate(trip.created_at),
        href: `/trips/${trip.id}`,
      };
    }),
  };
}

export async function loadConversionDrill(
  supabase: SupabaseClient,
  orgId: string,
  win: TimeWindow,
): Promise<DrillResult> {
  const { data, error } = await supabase
    .from("proposals")
    .select("id, title, status, total_price, client_selected_price, created_at, viewed_at")
    .eq("organization_id", orgId)
    .gte("created_at", win.startISO)
    .lt("created_at", win.endISO)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  const proposalRows = (data || []) as ProposalDrillRow[];
  const approvedCount = proposalRows.filter((p) =>
    ["approved", "accepted", "confirmed"].includes((p.status || "").toLowerCase())
  ).length;
  const conversionRate = proposalRows.length > 0 ? (approvedCount / proposalRows.length) * 100 : 0;

  return {
    summary: {
      label: "Proposal conversion",
      primaryValue: `${conversionRate.toFixed(1)}%`,
      secondaryValue: `${approvedCount}/${proposalRows.length} approved`,
      windowLabel: win.label,
    },
    rows: proposalRows.map((p) => ({
      id: p.id,
      title: p.title,
      subtitle: p.viewed_at ? "Viewed by client" : "Awaiting client view",
      amountLabel: formatINR(getProposalValue(p)),
      status: p.status || "draft",
      dateLabel: formatDate(p.created_at),
      href: `/proposals/${p.id}`,
    })),
  };
}

export async function loadClientsDrill(
  supabase: SupabaseClient,
  orgId: string,
  win: TimeWindow,
): Promise<DrillResult> {
  return loadConversionDrill(supabase, orgId, win);
}

// ---------------------------------------------------------------------------
// New loaders
// ---------------------------------------------------------------------------

export async function loadDestinationsDrill(
  supabase: SupabaseClient,
  orgId: string,
  win: TimeWindow,
  destination?: string | null,
): Promise<DrillResult> {
  const { data, error } = await supabase
    .from("trips")
    .select("id, status, start_date, end_date, created_at, itineraries(destination, trip_title)")
    .eq("organization_id", orgId)
    .gte("created_at", win.startISO)
    .lt("created_at", win.endISO)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;

  const tripRows = (data || []) as TripDrillRow[];
  const filtered = destination
    ? tripRows.filter((t) => getItinerary(t.itineraries)?.destination === destination)
    : tripRows;

  const destMap = new Map<string, number>();
  for (const trip of filtered) {
    const dest = getItinerary(trip.itineraries)?.destination || "Unknown";
    destMap.set(dest, (destMap.get(dest) || 0) + 1);
  }

  return {
    summary: {
      label: destination ? `Trips to ${destination}` : "All destinations",
      primaryValue: `${filtered.length}`,
      secondaryValue: `${destMap.size} unique destination${destMap.size === 1 ? "" : "s"}`,
      windowLabel: win.label,
    },
    rows: filtered.map((trip) => {
      const itin = getItinerary(trip.itineraries);
      return {
        id: trip.id,
        title: itin?.trip_title || itin?.destination || "Trip record",
        subtitle: `${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}`,
        amountLabel: itin?.destination || "N/A",
        status: trip.status || "draft",
        dateLabel: formatDate(trip.created_at),
        href: `/trips/${trip.id}`,
      };
    }),
  };
}

export async function loadDestinationRevenueDrill(
  supabase: SupabaseClient,
  orgId: string,
  win: TimeWindow,
  destination?: string | null,
): Promise<DrillResult> {
  const { data: invoices, error: invErr } = await supabase
    .from("invoices")
    .select("id, invoice_number, total_amount, status, created_at, trip_id")
    .eq("organization_id", orgId)
    .gte("created_at", win.startISO)
    .lt("created_at", win.endISO)
    .order("created_at", { ascending: false })
    .limit(200);

  if (invErr) throw invErr;

  let invoiceRows = (invoices || []) as InvoiceDrillRow[];

  if (destination) {
    const { data: trips } = await supabase
      .from("trips")
      .select("id, itineraries(destination)")
      .eq("organization_id", orgId);

    const tripDestMap = new Map<string, string>();
    for (const trip of (trips || []) as Array<{ id: string; itineraries: ItineraryLite | ItineraryLite[] | null }>) {
      const itin = Array.isArray(trip.itineraries) ? trip.itineraries[0] : trip.itineraries;
      if (itin?.destination) tripDestMap.set(trip.id, itin.destination);
    }

    invoiceRows = invoiceRows.filter((inv) => tripDestMap.get(inv.trip_id || "") === destination);
  }

  const paidTotal = invoiceRows
    .filter((inv) => (inv.status || "").toLowerCase() === "paid")
    .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

  return {
    summary: {
      label: destination ? `Revenue from ${destination}` : "Revenue by all destinations",
      primaryValue: formatINR(paidTotal),
      secondaryValue: `${invoiceRows.length} invoice${invoiceRows.length === 1 ? "" : "s"}`,
      windowLabel: win.label,
    },
    rows: invoiceRows.map((inv) => ({
      id: inv.id,
      title: `Invoice ${inv.invoice_number}`,
      subtitle: `Status: ${(inv.status || "pending").toUpperCase()}`,
      amountLabel: formatINR(Number(inv.total_amount || 0)),
      status: inv.status || "pending",
      dateLabel: formatDate(inv.created_at),
      href: "/admin/billing",
    })),
  };
}

export async function loadSeasonDrill(
  supabase: SupabaseClient,
  orgId: string,
  season: string | null,
): Promise<DrillResult> {
  const peakMonths = [10, 11, 12, 1, 2];
  const offMonths = [3, 4, 5, 6, 7, 8, 9];
  const targetMonths = season === "off" ? offMonths : peakMonths;

  const { data, error } = await supabase
    .from("invoices")
    .select("id, invoice_number, total_amount, status, created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;

  const allInvoices = (data || []) as InvoiceDrillRow[];
  const filtered = allInvoices.filter((inv) => {
    if (!inv.created_at) return false;
    const month = new Date(inv.created_at).getMonth() + 1;
    return targetMonths.includes(month);
  });

  const paidTotal = filtered
    .filter((inv) => (inv.status || "").toLowerCase() === "paid")
    .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

  const seasonLabel = season === "off" ? "Off-Season (Mar — Sep)" : "Peak Season (Oct — Feb)";

  return {
    summary: {
      label: seasonLabel,
      primaryValue: formatINR(paidTotal),
      secondaryValue: `${filtered.length} invoice${filtered.length === 1 ? "" : "s"} in ${seasonLabel.toLowerCase()}`,
      windowLabel: "All time",
    },
    rows: filtered.map((inv) => ({
      id: inv.id,
      title: `Invoice ${inv.invoice_number}`,
      subtitle: `Status: ${(inv.status || "pending").toUpperCase()}`,
      amountLabel: formatINR(Number(inv.total_amount || 0)),
      status: inv.status || "pending",
      dateLabel: formatDate(inv.created_at),
      href: "/admin/billing",
    })),
  };
}

export async function loadPipelineDrill(
  supabase: SupabaseClient,
  orgId: string,
  win: TimeWindow,
  status?: string | null,
  statusGroup?: string | null,
  limit = 50,
): Promise<DrillResult> {
  const isOpenPipeline = statusGroup === "open";
  const isApprovedPipeline = statusGroup === "approved";
  const isPartiallyPaidPipeline = statusGroup === "partially_paid";
  const isFullyPaidPipeline = statusGroup === "fully_paid";
  const isLostPipeline = statusGroup === "lost";
  const isAllPipeline = statusGroup === "all";
  const openStatuses = ["draft", "sent", "viewed"];
  const proposalSelect =
    "id, title, status, total_price, client_selected_price, created_at, viewed_at, trip_id, trips:trip_id(id,status)";

  const buildQuery = (includeSoftDeleteFilter: boolean) => {
    let query = supabase
      .from("proposals")
      .select(proposalSelect)
      .eq("organization_id", orgId);

    if (includeSoftDeleteFilter) {
      query = query.is("deleted_at", null);
    }

    query = query
      .order("created_at", { ascending: false })
      .limit(Math.max(1, Math.min(limit, 100)));

    if (isOpenPipeline) {
      return status ? query.eq("status", status) : query.in("status", openStatuses);
    }

    if (
      isApprovedPipeline ||
      isPartiallyPaidPipeline ||
      isFullyPaidPipeline ||
      isLostPipeline ||
      isAllPipeline
    ) {
      if (status) {
        return query.eq("status", status);
      }
      return query;
    }

    let datedQuery = query.gte("created_at", win.startISO).lt("created_at", win.endISO);
    if (status) {
      datedQuery = datedQuery.eq("status", status);
    }
    return datedQuery;
  };

  let { data, error } = await buildQuery(true);

  if (error && isMissingDeletedAtError(error.message)) {
    const fallback = await buildQuery(false);
    data = fallback.data;
    error = fallback.error;
  }

  if (error) throw error;

  const rawProposalRows = (data || []) as ProposalDrillRow[];
  const canonicalProposals = filterCanonicalPipelineProposals(rawProposalRows);

  const openProposalRows = canonicalProposals.filter((proposal) =>
    openStatuses.includes((proposal.status || "").toLowerCase()),
  );
  const wonProposalRows = canonicalProposals.filter((proposal) => isWonProposal(proposal));
  const lostProposalRows = canonicalProposals.filter((proposal) => isLostProposal(proposal));

  let tripRows: TripDrillRow[] = [];
  if (
    isApprovedPipeline ||
    isPartiallyPaidPipeline ||
    isFullyPaidPipeline ||
    isAllPipeline
  ) {
    const { data: trips, error: tripsError } = await supabase
      .from("trips")
      .select("id, status, start_date, end_date, created_at, itineraries(destination, trip_title, raw_data)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(Math.max(1, Math.min(limit, 100)));

    if (tripsError) throw tripsError;
    tripRows = ((trips || []) as TripDrillRow[]).filter((trip) =>
      isWonTripStatus(trip.status),
    );
  }

  let invoiceRows: InvoiceDrillRow[] = [];
  if (
    isApprovedPipeline ||
    isPartiallyPaidPipeline ||
    isFullyPaidPipeline ||
    isAllPipeline
  ) {
    const { data: invoices, error: invoicesError } = await supabase
      .from("invoices")
      .select("id, invoice_number, total_amount, balance_amount, status, trip_id, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(Math.max(1, Math.min(limit * 4, 500)));

    if (invoicesError) throw invoicesError;
    invoiceRows = ((invoices || []) as Array<InvoiceDrillRow & { balance_amount?: number | null }>)
      .map((invoice) => ({
        ...invoice,
        total_amount: Number(invoice.total_amount || 0),
        balance_amount: Number(invoice.balance_amount || 0),
      })) as unknown as InvoiceDrillRow[];
  }

  let paymentLinkRows: PaymentLinkDrillRow[] = [];
  if (
    isApprovedPipeline ||
    isPartiallyPaidPipeline ||
    isFullyPaidPipeline ||
    isAllPipeline
  ) {
    const { data: paymentLinks, error: paymentLinksError } = await supabase
      .from("payment_links")
      .select("id, status, amount_paise, paid_at, proposal_id")
      .eq("organization_id", orgId)
      .order("paid_at", { ascending: false })
      .limit(Math.max(1, Math.min(limit * 4, 500)));

    if (paymentLinksError) throw paymentLinksError;
    paymentLinkRows = (paymentLinks || []) as PaymentLinkDrillRow[];
  }

  const proposalById = new Map(canonicalProposals.map((proposal) => [proposal.id, proposal]));
  const tripById = new Map(tripRows.map((trip) => [trip.id, trip]));
  const invoiceSummaryByTrip = new Map<
    string,
    { totalAmount: number; paidAmount: number; balanceAmount: number }
  >();
  for (const invoice of invoiceRows as Array<InvoiceDrillRow & { balance_amount?: number | null }>) {
    if (!invoice.trip_id) continue;
    const normalizedStatus = (invoice.status || "").toLowerCase();
    if (normalizedStatus === "draft" || normalizedStatus === "cancelled") {
      continue;
    }
    const current = invoiceSummaryByTrip.get(invoice.trip_id) || {
      totalAmount: 0,
      paidAmount: 0,
      balanceAmount: 0,
    };
    current.totalAmount += Number(invoice.total_amount || 0);
    current.balanceAmount += Number(invoice.balance_amount || 0);
    current.paidAmount +=
      Number(invoice.total_amount || 0) - Number(invoice.balance_amount || 0);
    invoiceSummaryByTrip.set(invoice.trip_id, current);
  }

  const paidLinkAmountByTrip = new Map<string, number>();
  for (const link of paymentLinkRows) {
    if ((link.status || "").toLowerCase() !== "paid" || !link.proposal_id) continue;
    const proposal = proposalById.get(link.proposal_id);
    if (!proposal?.trip_id) continue;
    paidLinkAmountByTrip.set(
      proposal.trip_id,
      (paidLinkAmountByTrip.get(proposal.trip_id) || 0) +
        Number(link.amount_paise || 0) / 100,
    );
  }

  const getWonStageForProposal = (proposal: ProposalDrillRow) => {
    const linkedTrip = proposal.trip_id ? tripById.get(proposal.trip_id) || null : null;
    return resolveWonCommercialStage({
      tripFinancialPaymentStatus:
        getItinerary(linkedTrip?.itineraries || null)?.raw_data?.financial_summary?.payment_status ||
        null,
      invoiceSummary: proposal.trip_id
        ? invoiceSummaryByTrip.get(proposal.trip_id) || null
        : null,
      paidLinkAmount: proposal.trip_id ? paidLinkAmountByTrip.get(proposal.trip_id) || 0 : 0,
      targetAmount: Math.max(
        getProposalValue(proposal),
        linkedTrip ? getTripQuotedTotal(linkedTrip) : 0,
      ),
    });
  };

  const getWonStageForTrip = (trip: TripDrillRow) =>
    resolveWonCommercialStage({
      tripFinancialPaymentStatus:
        getItinerary(trip.itineraries)?.raw_data?.financial_summary?.payment_status || null,
      invoiceSummary: invoiceSummaryByTrip.get(trip.id) || null,
      paidLinkAmount: paidLinkAmountByTrip.get(trip.id) || 0,
      targetAmount: Math.max(
        getTripQuotedTotal(trip),
        invoiceSummaryByTrip.get(trip.id)?.totalAmount || 0,
      ),
    });

  const proposalOwnedTripIds = new Set(
    wonProposalRows
      .map((proposal) => proposal.trip_id)
      .filter((tripId): tripId is string => Boolean(tripId)),
  );

  const standaloneWonTripRows = tripRows.filter(
    (trip) => !proposalOwnedTripIds.has(trip.id),
  );

  const proposalToDrillRow = (proposal: ProposalDrillRow): DrillRow => ({
    id: proposal.id,
    title: proposal.title,
    subtitle: proposal.viewed_at ? "Viewed by client" : "Awaiting client view",
    amountLabel: formatINR(getProposalValue(proposal)),
    status: proposal.status || "draft",
    dateLabel: formatDate(proposal.created_at),
    href: `/proposals/${proposal.id}`,
  });

  const tripToDrillRow = (trip: TripDrillRow): DrillRow => {
    const itinerary = getItinerary(trip.itineraries);
    return {
      id: trip.id,
      title: itinerary?.trip_title || itinerary?.destination || "Won trip",
      subtitle: itinerary?.destination || "Commercially won trip",
      amountLabel: (trip.status || "paid").replace(/_/g, " "),
      status: trip.status || "paid",
      dateLabel: formatDate(trip.created_at),
      href: `/trips/${trip.id}`,
    };
  };

  const selectedProposalRows = isOpenPipeline
    ? openProposalRows
    : isApprovedPipeline
      ? wonProposalRows.filter((proposal) => getWonStageForProposal(proposal) === "approved")
      : isPartiallyPaidPipeline
        ? wonProposalRows.filter((proposal) => getWonStageForProposal(proposal) === "partially_paid")
        : isFullyPaidPipeline
          ? wonProposalRows.filter((proposal) => getWonStageForProposal(proposal) === "fully_paid")
      : isLostPipeline
        ? lostProposalRows
        : isAllPipeline
          ? canonicalProposals
          : canonicalProposals;

  const rows: DrillRow[] = [
    ...selectedProposalRows.map(proposalToDrillRow),
    ...((isApprovedPipeline || isPartiallyPaidPipeline || isFullyPaidPipeline || isAllPipeline)
      ? standaloneWonTripRows
          .filter((trip) => {
            if (isAllPipeline) return true;
            const stage = getWonStageForTrip(trip);
            return (
              (isApprovedPipeline && stage === "approved") ||
              (isPartiallyPaidPipeline && stage === "partially_paid") ||
              (isFullyPaidPipeline && stage === "fully_paid")
            );
          })
          .map(tripToDrillRow)
      : []),
  ];

  const proposalValueTotal = selectedProposalRows.reduce(
    (sum, proposal) => sum + getProposalValue(proposal),
    0,
  );

  const statusLabel = isOpenPipeline
    ? status
      ? status.replace(/_/g, " ")
      : "open pipeline"
    : isApprovedPipeline
      ? "approved pipeline"
      : isPartiallyPaidPipeline
        ? "partially paid pipeline"
        : isFullyPaidPipeline
          ? "fully paid pipeline"
      : isLostPipeline
        ? "lost pipeline"
        : isAllPipeline
          ? "pipeline"
          : status
            ? status.replace(/_/g, " ")
            : "all";

  return {
    summary: {
      label: `${statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)} proposals`,
      primaryValue: isOpenPipeline ? formatINR(proposalValueTotal) : `${rows.length}`,
      secondaryValue:
        isOpenPipeline
          ? `${rows.length} proposal${rows.length === 1 ? "" : "s"} contributing to pipeline value`
          : `${formatINR(proposalValueTotal)} proposal-owned value`,
      windowLabel:
        isOpenPipeline ||
        isApprovedPipeline ||
        isPartiallyPaidPipeline ||
        isFullyPaidPipeline ||
        isLostPipeline ||
        isAllPipeline
          ? `Latest ${rows.length}`
          : win.label,
    },
    rows,
  };
}

export async function loadOperationsDrill(
  supabase: SupabaseClient,
  orgId: string,
  subtype: string | null,
): Promise<DrillResult> {
  if (subtype === "trips") {
    const { data, error } = await supabase
      .from("trips")
      .select("id, status, start_date, end_date, created_at, itineraries(destination, trip_title)")
      .eq("organization_id", orgId)
      .in("status", ["planned", "confirmed", "in_progress", "active"])
      .order("start_date", { ascending: true })
      .limit(100);

    if (error) throw error;
    const tripRows = (data || []) as TripDrillRow[];

    return {
      summary: {
        label: "Ongoing trips",
        primaryValue: `${tripRows.length}`,
        secondaryValue: "Currently active trips",
        windowLabel: "Current",
      },
      rows: tripRows.map((trip) => {
        const itin = getItinerary(trip.itineraries);
        return {
          id: trip.id,
          title: itin?.trip_title || itin?.destination || "Trip",
          subtitle: `${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}`,
          amountLabel: (trip.status || "active").replace(/_/g, " "),
          status: trip.status || "active",
          dateLabel: formatDate(trip.created_at),
          href: `/trips/${trip.id}`,
        };
      }),
    };
  }

  // Default: clients
  let clientQuery = await supabase
    .from("clients")
    .select("id, created_at, profiles!clients_id_fkey(full_name, email, lifecycle_stage)")
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (clientQuery.error && isMissingDeletedAtError(clientQuery.error.message)) {
    clientQuery = await supabase
      .from("clients")
      .select("id, created_at, profiles!clients_id_fkey(full_name, email, lifecycle_stage)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(100);
  }

  if (clientQuery.error) throw clientQuery.error;
  const clientRows = ((clientQuery.data || []) as ClientDrillRow[])
    .map((row) => ({
      ...row,
      profile: getClientProfile(row.profiles),
    }))
    .filter((row) => row.profile !== null);

  return {
    summary: {
      label: "Active clients",
      primaryValue: `${clientRows.length}`,
      secondaryValue: "All clients in organization",
      windowLabel: "Current",
    },
    rows: clientRows.map((c) => ({
      id: c.id,
      title: c.profile?.full_name || c.profile?.email || "Client",
      subtitle: c.profile?.email || "",
      amountLabel: (c.profile?.lifecycle_stage || "active").replace(/_/g, " "),
      status: c.profile?.lifecycle_stage || "active",
      dateLabel: formatDate(c.created_at),
      href: `/clients/${c.id}`,
    })),
  };
}
