import type { ResolvedAdminDateRange } from "@/lib/admin/date-range";
import type { DashboardPipelineStage } from "@/lib/admin/dashboard-overview-types";
import type {
  InvoicePaymentSelectorRow,
  InvoiceSelectorRow,
  ItinerarySelectorRow,
  PaymentLinkSelectorRow,
  ProfileSelectorRow,
  ProposalSelectorRow,
  TripSelectorRow,
} from "@/lib/admin/dashboard-selectors";
import {
  computeProposalRisk,
  normalizeStatus,
  safeTitle,
} from "@/lib/admin/insights";
import { isLostProposal, isWonProposal } from "@/lib/admin/proposal-outcomes";
import {
  buildRangeBucketKeys,
  formatCompactINR,
  formatDateLabel,
  getBucketKey,
  getBucketLabel,
  getBusinessEventIso,
  getInvoicePaidEventIso,
  getProposalValue,
  hasWonTripStatus,
  isActiveTripStatus,
  isBookedTripStatus,
  isPaidInvoice,
  safeDate,
} from "@/lib/admin/operator-state";
import type {
  RevenueChartItemPoint,
  RevenueChartPoint,
} from "@/components/analytics/RevenueChart";

export type ClientMeta = {
  fullName: string | null;
  email: string | null;
};

export type TripBusinessRow = TripSelectorRow & {
  clientName: string | null;
  destination: string | null;
  tripTitle: string | null;
  eventIso: string | null;
  isBooked: boolean;
  isActive: boolean;
  isWon: boolean;
};

export type ProposalBusinessRow = ProposalSelectorRow & {
  clientName: string | null;
  clientEmail: string | null;
  linkedTripStatus: string | null;
  lifecycle: "open" | "won" | "lost";
  value: number;
  eventIso: string | null;
  hasLiveLinkedTrip: boolean;
};

export type BookedEventRow = {
  ownerId: string;
  amount: number;
  eventIso: string;
  item: RevenueChartItemPoint;
};

export type CashEventRow = {
  ownerId: string;
  amount: number;
  eventIso: string;
  item: RevenueChartItemPoint;
};

const PROPOSAL_STAGE_LABELS: Record<DashboardPipelineStage["key"], string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  paid: "Paid",
  lost: "Lost",
};

function normalizeJoinedTripStatus(
  trips: ProposalSelectorRow["trips"],
): string | null {
  if (Array.isArray(trips)) {
    return trips[0]?.status || null;
  }
  return trips?.status || null;
}

function getPositiveMax(values: Array<number | null | undefined>): number {
  return values.reduce<number>((max, value) => {
    const numeric = Number(value || 0);
    return numeric > max ? numeric : max;
  }, 0);
}

function getTripTitle(trip: TripBusinessRow): string {
  return safeTitle(
    trip.tripTitle || trip.destination || "Untitled trip",
    "Untitled trip",
  );
}

function getTripSubtitle(trip: TripBusinessRow): string {
  const parts = [trip.destination, trip.clientName].filter(Boolean);
  return parts.length > 0 ? parts.join(" • ") : "Trip record";
}

function createSeriesItem(params: {
  id: string;
  kind: RevenueChartItemPoint["kind"];
  title: string;
  subtitle: string;
  href: string;
  status: string;
  amountLabel: string;
  dateLabel: string;
}): RevenueChartItemPoint {
  return { ...params };
}

function getProposalOwnerKey(proposal: ProposalBusinessRow): string {
  return proposal.trip_id ? `trip:${proposal.trip_id}` : `proposal:${proposal.id}`;
}

function getTripOwnerKey(tripId: string): string {
  return `trip:${tripId}`;
}

function sortByEventDesc<T extends { eventIso: string | null; created_at?: string | null }>(
  rows: T[],
): T[] {
  return [...rows].sort((left, right) => {
    const leftTime =
      safeDate(left.eventIso || left.created_at || null)?.getTime() || 0;
    const rightTime =
      safeDate(right.eventIso || right.created_at || null)?.getTime() || 0;
    return rightTime - leftTime;
  });
}

export function buildDashboardClientMap(
  profiles: ProfileSelectorRow[],
): Map<string, ClientMeta> {
  return new Map(
    profiles.map((profile) => [
      profile.id,
      {
        fullName: profile.full_name || null,
        email: profile.email || null,
      },
    ]),
  );
}

export function buildDashboardTripStatusMap(
  trips: TripSelectorRow[],
): Map<string, string | null> {
  return new Map(trips.map((trip) => [trip.id, trip.status]));
}

export function decorateDashboardTrips(params: {
  trips: TripSelectorRow[];
  itineraries: ItinerarySelectorRow[];
  clientMap: Map<string, ClientMeta>;
}): TripBusinessRow[] {
  const itineraryMap = new Map(
    params.itineraries.map((itinerary) => [itinerary.id, itinerary]),
  );

  return params.trips.map((trip) => {
    const itinerary = trip.itinerary_id
      ? itineraryMap.get(trip.itinerary_id) || null
      : null;
    const client = trip.client_id
      ? params.clientMap.get(trip.client_id) || null
      : null;

    return {
      ...trip,
      clientName: client?.fullName || null,
      destination: itinerary?.destination || trip.destination || null,
      tripTitle: itinerary?.trip_title || trip.name || null,
      eventIso: getBusinessEventIso(trip.created_at, trip.updated_at),
      isBooked: isBookedTripStatus(trip.status),
      isActive: isActiveTripStatus(trip.status),
      isWon: hasWonTripStatus(trip.status),
    };
  });
}

export function resolveDashboardProposalRows(params: {
  proposals: ProposalSelectorRow[];
  tripStatusMap: Map<string, string | null>;
  clientMap: Map<string, ClientMeta>;
  enforceLinkedTripPresence?: boolean;
}): ProposalBusinessRow[] {
  return params.proposals
    .map((proposal) => {
    const linkedTripStatus = proposal.trip_id
      ? params.tripStatusMap.get(proposal.trip_id) || null
      : normalizeJoinedTripStatus(proposal.trips);
    const hasLiveLinkedTrip = proposal.trip_id
      ? params.tripStatusMap.has(proposal.trip_id)
      : true;
    const lifecycle: ProposalBusinessRow["lifecycle"] =
      isWonProposal(proposal) || hasWonTripStatus(linkedTripStatus)
        ? "won"
        : isLostProposal(proposal)
          ? "lost"
          : "open";
    const client = proposal.client_id
      ? params.clientMap.get(proposal.client_id) || null
      : null;

    return {
      ...proposal,
      clientName: client?.fullName || null,
      clientEmail: client?.email || null,
      linkedTripStatus,
      lifecycle,
      value: getProposalValue(proposal),
      eventIso: getBusinessEventIso(proposal.created_at, proposal.updated_at),
      hasLiveLinkedTrip,
    };
  })
    .filter((proposal) =>
      params.enforceLinkedTripPresence === false
        ? true
        : proposal.trip_id
          ? proposal.hasLiveLinkedTrip
          : true,
    );
}

export function filterDashboardInvoicesByTrip(params: {
  invoices: InvoiceSelectorRow[];
  tripStatusMap: Map<string, string | null>;
  enforceLinkedTripPresence?: boolean;
}): InvoiceSelectorRow[] {
  if (params.enforceLinkedTripPresence === false) {
    return params.invoices;
  }

  return params.invoices.filter((invoice) =>
    invoice.trip_id ? params.tripStatusMap.has(invoice.trip_id) : true,
  );
}

export function isOpenDashboardProposal(
  proposal: ProposalBusinessRow,
): boolean {
  return proposal.lifecycle === "open";
}

export function buildDashboardPipelineSummary(
  proposals: ProposalBusinessRow[],
) {
  const stageMap: Record<DashboardPipelineStage["key"], { count: number; value: number }> = {
    draft: { count: 0, value: 0 },
    sent: { count: 0, value: 0 },
    viewed: { count: 0, value: 0 },
    paid: { count: 0, value: 0 },
    lost: { count: 0, value: 0 },
  };

  let high = 0;
  let medium = 0;
  let low = 0;

  const openProposals = proposals.filter((proposal) =>
    isOpenDashboardProposal(proposal),
  );
  const orgMedian =
    openProposals.length > 0
      ? openProposals.reduce((sum, proposal) => sum + proposal.value, 0) /
        Math.max(openProposals.length, 1)
      : 0;

  for (const proposal of proposals) {
    const status = normalizeStatus(proposal.status, "draft");
    const key: DashboardPipelineStage["key"] =
      proposal.lifecycle === "won"
        ? "paid"
        : proposal.lifecycle === "lost"
          ? "lost"
          : status === "sent" || status === "viewed" || status === "draft"
            ? (status as DashboardPipelineStage["key"])
            : "draft";

    stageMap[key].count += 1;
    stageMap[key].value += proposal.value;
  }

  for (const proposal of openProposals) {
    const risk = computeProposalRisk({
      status: proposal.status,
      createdAt: proposal.created_at,
      updatedAt: proposal.updated_at,
      expiresAt: proposal.expires_at,
      viewedAt: proposal.viewed_at,
      totalPrice: proposal.value,
      orgMedianPrice: orgMedian,
    });

    if (risk.level === "high") high += 1;
    else if (risk.level === "medium") medium += 1;
    else low += 1;
  }

  return {
    stages: (Object.keys(stageMap) as DashboardPipelineStage["key"][]).map(
      (key) => ({
        key,
        label: PROPOSAL_STAGE_LABELS[key],
        count: stageMap[key].count,
        value: stageMap[key].value,
      }),
    ),
    risk: { high, medium, low },
  };
}

export function buildDashboardRevenueSeries(params: {
  range: ResolvedAdminDateRange;
  proposals: ProposalBusinessRow[];
  trips: TripBusinessRow[];
  invoices: InvoiceSelectorRow[];
  paymentLinks: PaymentLinkSelectorRow[];
  invoicePayments: InvoicePaymentSelectorRow[];
}): RevenueChartPoint[] {
  const buckets = new Map<string, RevenueChartPoint>(
    buildRangeBucketKeys(params.range).map((key) => [
      key,
      {
        monthKey: key,
        label: getBucketLabel(key, params.range.granularity),
        revenue: 0,
        bookings: 0,
        bookedValue: 0,
        cashCollected: 0,
        tripCount: 0,
        bookedItems: [],
        cashItems: [],
        tripItems: [],
        trips: [],
      },
    ]),
  );

  const proposalById = new Map(
    params.proposals.map((proposal) => [proposal.id, proposal]),
  );
  const linkedProposalByTrip = new Map<string, ProposalBusinessRow>();
  for (const proposal of sortByEventDesc(params.proposals)) {
    if (!proposal.trip_id || linkedProposalByTrip.has(proposal.trip_id)) continue;
    linkedProposalByTrip.set(proposal.trip_id, proposal);
  }

  const invoiceValueByTrip = new Map<string, number>();
  for (const invoice of params.invoices) {
    if (!invoice.trip_id) continue;
    const existing = invoiceValueByTrip.get(invoice.trip_id) || 0;
    invoiceValueByTrip.set(
      invoice.trip_id,
      Math.max(existing, Number(invoice.total_amount || 0)),
    );
  }

  const paymentLinkValueByTrip = new Map<string, number>();
  for (const link of params.paymentLinks) {
    if (normalizeStatus(link.status, "") !== "paid") continue;
    if (!link.proposal_id) continue;
    const linkedProposal = proposalById.get(link.proposal_id) || null;
    if (!linkedProposal?.trip_id) continue;
    const existing = paymentLinkValueByTrip.get(linkedProposal.trip_id) || 0;
    paymentLinkValueByTrip.set(
      linkedProposal.trip_id,
      Math.max(existing, Number(link.amount_paise || 0) / 100),
    );
  }

  const bookedOwnerKeys = new Set<string>();

  for (const proposal of sortByEventDesc(params.proposals)) {
    if (proposal.lifecycle !== "won" || !proposal.eventIso) continue;
    if (!proposal.value || !Number.isFinite(proposal.value) || proposal.value <= 0) continue;
    if (!safeDate(proposal.eventIso)) continue;
    const key = getBucketKey(proposal.eventIso, params.range.granularity);
    if (!key || !buckets.has(key)) continue;
    const ownerId = getProposalOwnerKey(proposal);
    if (bookedOwnerKeys.has(ownerId)) continue;

    bookedOwnerKeys.add(ownerId);
    const bucket = buckets.get(key)!;
    bucket.bookedValue = Number(bucket.bookedValue || 0) + proposal.value;
    bucket.bookedItems = [
      ...(bucket.bookedItems || []),
      createSeriesItem({
        id: proposal.id,
        kind: "proposal",
        title: safeTitle(proposal.title, "Won proposal"),
        subtitle:
          proposal.clientName || proposal.clientEmail || "Client handoff completed",
        href: `/proposals/${proposal.id}`,
        status: normalizeStatus(proposal.status, "converted"),
        amountLabel: formatCompactINR(proposal.value),
        dateLabel: formatDateLabel(proposal.eventIso),
      }),
    ];
  }

  const paymentInvoiceIds = new Set(
    params.invoicePayments
      .filter(
        (payment) =>
          normalizeStatus(payment.status, "completed") === "completed" &&
          Boolean(payment.invoice_id),
      )
      .map((payment) => payment.invoice_id as string),
  );

  for (const link of params.paymentLinks) {
    if (normalizeStatus(link.status, "") !== "paid" || !link.paid_at) continue;
    const key = getBucketKey(link.paid_at, params.range.granularity);
    if (!key || !buckets.has(key)) continue;
    const amount = Number(link.amount_paise || 0) / 100;
    const linkedProposal = link.proposal_id
      ? proposalById.get(link.proposal_id) || null
      : null;
    const resolvedTripId = linkedProposal?.trip_id || null;
    const bucket = buckets.get(key)!;
    bucket.cashCollected = Number(bucket.cashCollected || 0) + amount;
    bucket.cashItems = [
      ...(bucket.cashItems || []),
      createSeriesItem({
        id: link.id,
        kind: "invoice",
        title: "Paid payment link",
        subtitle: resolvedTripId
          ? `Trip ${resolvedTripId.slice(0, 8)}`
          : "Client payment captured",
        href: resolvedTripId ? `/trips/${resolvedTripId}` : "/admin/revenue",
        status: "paid",
        amountLabel: formatCompactINR(amount),
        dateLabel: formatDateLabel(link.paid_at || link.created_at),
      }),
    ];
  }

  for (const payment of params.invoicePayments) {
    if (
      normalizeStatus(payment.status, "completed") !== "completed" ||
      !payment.payment_date
    ) {
      continue;
    }
    const key = getBucketKey(payment.payment_date, params.range.granularity);
    if (!key || !buckets.has(key)) continue;

    const amount = Number(payment.amount || 0);
    const bucket = buckets.get(key)!;
    bucket.cashCollected = Number(bucket.cashCollected || 0) + amount;
    bucket.cashItems = [
      ...(bucket.cashItems || []),
      createSeriesItem({
        id: payment.id,
        kind: "invoice",
        title: "Invoice payment received",
        subtitle: payment.invoice_id
          ? `Invoice ${payment.invoice_id.slice(0, 8)}`
          : "Recorded payment",
        href: "/admin/revenue",
        status: normalizeStatus(payment.status, "completed"),
        amountLabel: formatCompactINR(amount),
        dateLabel: formatDateLabel(payment.payment_date || payment.created_at),
      }),
    ];
  }

  for (const invoice of params.invoices) {
    if (!isPaidInvoice(invoice) || paymentInvoiceIds.has(invoice.id)) continue;
    const eventIso = getInvoicePaidEventIso(invoice);
    if (!eventIso) continue;
    const key = getBucketKey(eventIso, params.range.granularity);
    if (!key || !buckets.has(key)) continue;
    const amount = Number(invoice.total_amount || 0);
    const bucket = buckets.get(key)!;
    bucket.cashCollected = Number(bucket.cashCollected || 0) + amount;
    bucket.cashItems = [
      ...(bucket.cashItems || []),
      createSeriesItem({
        id: invoice.id,
        kind: "invoice",
        title: `Invoice ${invoice.invoice_number || invoice.id.slice(0, 8)}`,
        subtitle: invoice.trip_id
          ? `Trip ${invoice.trip_id.slice(0, 8)}`
          : "Paid invoice",
        href: "/admin/invoices",
        status: normalizeStatus(invoice.status, "paid"),
        amountLabel: formatCompactINR(amount),
        dateLabel: formatDateLabel(eventIso),
      }),
    ];
  }

  for (const trip of sortByEventDesc(params.trips)) {
    if (!trip.isBooked || !trip.eventIso) continue;
    const key = getBucketKey(trip.eventIso, params.range.granularity);
    if (!key || !buckets.has(key)) continue;

    const bucket = buckets.get(key)!;
    bucket.tripCount = Number(bucket.tripCount || 0) + 1;
    bucket.bookings = Number(bucket.bookings || 0) + 1;
    bucket.tripItems = [
      ...(bucket.tripItems || []),
      createSeriesItem({
        id: trip.id,
        kind: "trip",
        title: getTripTitle(trip),
        subtitle: getTripSubtitle(trip),
        href: `/trips/${trip.id}`,
        status: normalizeStatus(trip.status, "planned"),
        amountLabel: formatDateLabel(trip.start_date),
        dateLabel: formatDateLabel(trip.eventIso),
      }),
    ];
    bucket.trips = [
      ...(bucket.trips || []),
      {
        id: trip.id,
        title: getTripTitle(trip),
        destination: trip.destination || "Destination pending",
        clientName: trip.clientName || "Client pending",
        status: normalizeStatus(trip.status, "planned"),
        startDate: trip.start_date,
        endDate: trip.end_date,
        createdAt: trip.created_at,
      },
    ];

    const ownerId = getTripOwnerKey(trip.id);
    if (bookedOwnerKeys.has(ownerId)) continue;

    const linkedProposal = linkedProposalByTrip.get(trip.id) || null;
    const bookedFallbackAmount = getPositiveMax([
      linkedProposal?.value,
      invoiceValueByTrip.get(trip.id),
      paymentLinkValueByTrip.get(trip.id),
    ]);

    if (bookedFallbackAmount <= 0) continue;

    bookedOwnerKeys.add(ownerId);
    bucket.bookedValue = Number(bucket.bookedValue || 0) + bookedFallbackAmount;
    bucket.bookedItems = [
      ...(bucket.bookedItems || []),
      createSeriesItem({
        id: trip.id,
        kind: "trip",
        title: getTripTitle(trip),
        subtitle: getTripSubtitle(trip),
        href: `/trips/${trip.id}`,
        status: normalizeStatus(trip.status, "planned"),
        amountLabel: formatCompactINR(bookedFallbackAmount),
        dateLabel: formatDateLabel(trip.eventIso),
      }),
    ];
  }

  return Array.from(buckets.values()).map((bucket) => ({
    ...bucket,
    revenue: Number((bucket.cashCollected || 0).toFixed(2)),
    bookings: Number(bucket.tripCount || 0),
    bookedValue: Number((bucket.bookedValue || 0).toFixed(2)),
    cashCollected: Number((bucket.cashCollected || 0).toFixed(2)),
    tripCount: Number(bucket.tripCount || 0),
  }));
}

export function resolveDashboardDefaultRevenueMetric(params: {
  bookedValue: number;
  cashCollected: number;
  tripCount: number;
}): "booked" | "cash" | "trips" {
  if (params.bookedValue > 0) return "booked";
  if (params.cashCollected > 0) return "cash";
  if (params.tripCount > 0) return "trips";
  return "booked";
}
