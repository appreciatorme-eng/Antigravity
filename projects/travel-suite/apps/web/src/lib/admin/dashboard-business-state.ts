import type { ResolvedAdminDateRange } from "@/lib/admin/date-range";
import type {
  DashboardCollectionsBucket,
  DashboardCollectionsBucketKey,
  DashboardCollectionsNextAction,
  DashboardCollectionsPriorityRow,
  DashboardCollectionsSnapshotMetric,
  DashboardPipelineStage,
} from "@/lib/admin/dashboard-overview-types";
import type {
  CommercialPaymentSelectorRow,
  FollowUpSelectorRow,
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
import { filterCanonicalPipelineProposals } from "@/lib/proposals/pipeline-integrity";
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
  isDueSoonInvoice,
  isOverdueInvoice,
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
  financialPaymentStatus: string | null;
  financialPaymentSource: string | null;
  manualPaidAmount: number;
  financialEventIso: string | null;
  quotedTotal: number;
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

type ResolvedWonStage = Extract<
  DashboardPipelineStage["key"],
  "approved" | "partially_paid" | "fully_paid"
>;

type InvoiceTripSummary = {
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
};

type CommercialTripSummary = {
  totalPaid: number;
  latestPaymentDate: string | null;
};

type CollectionPriorityRowInternal = Omit<
  DashboardCollectionsPriorityRow,
  "outstandingAmount"
> & {
  outstandingAmount: number;
  bucketKey: DashboardCollectionsBucketKey;
  sortRank: number;
};

export type DashboardCollectionsWorkspaceData = {
  nextBestAction: DashboardCollectionsNextAction | null;
  snapshot: {
    collectedThisWindow: DashboardCollectionsSnapshotMetric;
    outstanding: DashboardCollectionsSnapshotMetric;
    overdue: DashboardCollectionsSnapshotMetric;
    expectedIn7Days: DashboardCollectionsSnapshotMetric;
  };
  buckets: DashboardCollectionsBucket[];
  priorityRows: DashboardCollectionsPriorityRow[];
  bucketRows: Record<DashboardCollectionsBucketKey, DashboardCollectionsPriorityRow[]>;
};

function stripCollectionPriorityRowMeta(
  row: CollectionPriorityRowInternal,
): DashboardCollectionsPriorityRow {
  return {
    id: row.id,
    recordType: row.recordType,
    title: row.title,
    clientName: row.clientName,
    outstandingAmount: row.outstandingAmount,
    dueDate: row.dueDate,
    urgency: row.urgency,
    paymentStage: row.paymentStage,
    followUpState: row.followUpState,
    primaryHref: row.primaryHref,
    primaryLabel: row.primaryLabel,
    secondaryHref: row.secondaryHref,
    secondaryLabel: row.secondaryLabel,
  };
}

export const PROPOSAL_STAGE_LABELS: Record<DashboardPipelineStage["key"], string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  approved: "Approved",
  partially_paid: "Partially Paid",
  fully_paid: "Fully Paid",
  lost: "Lost",
};

function normalizeFinancialPaymentStatus(value: string | null | undefined): string | null {
  const normalized = normalizeStatus(value, "");
  if (normalized === "paid") return "paid";
  if (normalized === "partially_paid" || normalized === "partial") {
    return "partially_paid";
  }
  if (normalized === "approved") return "approved";
  if (normalized === "unpaid") return "unpaid";
  return null;
}

function deriveQuotedTotal(itinerary: ItinerarySelectorRow | null): number {
  const pricing = itinerary?.raw_data?.pricing;
  const totalCost = Number(pricing?.total_cost || 0);
  if (totalCost > 0) {
    return totalCost;
  }

  const perPersonCost = Number(pricing?.per_person_cost || 0);
  const paxCount = Number(pricing?.pax_count || 0);
  if (perPersonCost > 0 && paxCount > 0) {
    return perPersonCost * paxCount;
  }

  return 0;
}

function buildInvoiceSummaryByTrip(
  invoices: InvoiceSelectorRow[],
): Map<string, InvoiceTripSummary> {
  const invoiceSummaryByTrip = new Map<string, InvoiceTripSummary>();

  for (const invoice of invoices) {
    if (!invoice.trip_id) continue;
    const normalizedStatus = normalizeStatus(invoice.status, "");
    if (normalizedStatus === "draft" || normalizedStatus === "cancelled") {
      continue;
    }
    const current = invoiceSummaryByTrip.get(invoice.trip_id) || {
      totalAmount: 0,
      paidAmount: 0,
      balanceAmount: 0,
    };

    current.totalAmount += Number(invoice.total_amount || 0);
    current.paidAmount += Number(invoice.total_amount || 0) - Number(invoice.balance_amount || 0);
    current.balanceAmount += Number(invoice.balance_amount || 0);
    invoiceSummaryByTrip.set(invoice.trip_id, current);
  }

  return invoiceSummaryByTrip;
}

function buildCommercialPaymentSummaryByTrip(
  payments: CommercialPaymentSelectorRow[],
): Map<string, CommercialTripSummary> {
  const byTrip = new Map<string, CommercialTripSummary>();

  for (const payment of payments) {
    if (!payment.trip_id || payment.deleted_at) continue;
    const normalizedStatus = normalizeStatus(payment.status, "");
    if (normalizedStatus !== "completed" && normalizedStatus !== "captured") {
      continue;
    }

    const current = byTrip.get(payment.trip_id) || {
      totalPaid: 0,
      latestPaymentDate: null,
    };

    current.totalPaid += Number(payment.amount || 0);
    const candidateDate = payment.payment_date || payment.created_at;
    if (
      candidateDate &&
      (!current.latestPaymentDate ||
        new Date(candidateDate).getTime() >
          new Date(current.latestPaymentDate).getTime())
    ) {
      current.latestPaymentDate = candidateDate;
    }

    byTrip.set(payment.trip_id, current);
  }

  return byTrip;
}

function buildPaidLinkAmountByTrip(params: {
  proposals: ProposalBusinessRow[];
  paymentLinks: PaymentLinkSelectorRow[];
}): Map<string, number> {
  const proposalById = new Map(
    params.proposals.map((proposal) => [proposal.id, proposal]),
  );
  const paidLinkAmountByTrip = new Map<string, number>();

  for (const link of params.paymentLinks) {
    if (normalizeStatus(link.status, "") !== "paid" || !link.proposal_id) continue;
    const proposal = proposalById.get(link.proposal_id);
    if (!proposal?.trip_id) continue;
    const amount = Number(link.amount_paise || 0) / 100;
    paidLinkAmountByTrip.set(
      proposal.trip_id,
      (paidLinkAmountByTrip.get(proposal.trip_id) || 0) + amount,
    );
  }

  return paidLinkAmountByTrip;
}

export function resolveWonCommercialStage(params: {
  tripFinancialPaymentStatus?: string | null;
  commercialPaidAmount?: number | null;
  invoiceSummary?: InvoiceTripSummary | null;
  paidLinkAmount?: number | null;
  targetAmount?: number | null;
}): ResolvedWonStage {
  const financialStatus = normalizeFinancialPaymentStatus(
    params.tripFinancialPaymentStatus,
  );
  if (financialStatus === "paid") return "fully_paid";
  if (financialStatus === "partially_paid") return "partially_paid";
  if (financialStatus === "approved") return "approved";
  if (financialStatus === "unpaid") return "approved";

  const commercialPaidAmount = Number(params.commercialPaidAmount || 0);
  if (commercialPaidAmount > 0) {
    const targetAmount = getPositiveMax([
      params.targetAmount,
      params.invoiceSummary?.totalAmount,
    ]);
    if (targetAmount > 0 && commercialPaidAmount >= targetAmount) {
      return "fully_paid";
    }
    return "partially_paid";
  }

  const invoiceSummary = params.invoiceSummary;
  if (invoiceSummary && invoiceSummary.totalAmount > 0) {
    if (invoiceSummary.balanceAmount <= 0) return "fully_paid";
    if (invoiceSummary.paidAmount > 0) return "partially_paid";
    return "approved";
  }

  const paidLinkAmount = Number(params.paidLinkAmount || 0);
  if (paidLinkAmount > 0) {
    const targetAmount = getPositiveMax([params.targetAmount]);
    if (targetAmount > 0 && paidLinkAmount >= targetAmount) {
      return "fully_paid";
    }
    return "partially_paid";
  }

  return "approved";
}

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

export function resolveCommercialTargetAmount(params: {
  trip?: TripBusinessRow | null;
  invoiceSummary?: InvoiceTripSummary | null;
  proposalValue?: number | null;
}): number {
  const tripQuotedTotal = Number(params.trip?.quotedTotal || 0);
  if (tripQuotedTotal > 0) return tripQuotedTotal;

  const invoiceTotal = Number(params.invoiceSummary?.totalAmount || 0);
  if (invoiceTotal > 0) return invoiceTotal;

  const proposalValue = Number(params.proposalValue || 0);
  if (proposalValue > 0) return proposalValue;

  return 0;
}

function getTripManualCashAmount(trip: TripBusinessRow): number {
  const source = normalizeStatus(trip.financialPaymentSource, "");
  const status = normalizeFinancialPaymentStatus(trip.financialPaymentStatus);
  if (source !== "manual_cash") return 0;
  if (status !== "paid" && status !== "partially_paid") return 0;
  return Number(trip.manualPaidAmount || 0);
}

function getCollectedCommercialAmount(params: {
  trip?: TripBusinessRow | null;
  invoiceSummary?: InvoiceTripSummary | null;
  paidLinkAmount?: number | null;
  commercialPaidAmount?: number | null;
}): number {
  const commercialPaidAmount = Number(params.commercialPaidAmount || 0);
  if (commercialPaidAmount > 0) return commercialPaidAmount;

  const invoicePaidAmount = Number(params.invoiceSummary?.paidAmount || 0);
  if (invoicePaidAmount > 0) return invoicePaidAmount;

  const paidLinkAmount = Number(params.paidLinkAmount || 0);
  if (paidLinkAmount > 0) return paidLinkAmount;

  if (params.trip) {
    const manualCashAmount = getTripManualCashAmount(params.trip);
    if (manualCashAmount > 0) return manualCashAmount;
  }

  return 0;
}

function resolveStageDisplayValue(params: {
  stageKey: DashboardPipelineStage["key"];
  proposalValue?: number | null;
  targetAmount?: number | null;
  collectedAmount?: number | null;
}): number {
  const collectedAmount = Number(params.collectedAmount || 0);
  const targetAmount = getPositiveMax([params.targetAmount, params.proposalValue]);

  if (params.stageKey === "partially_paid") {
    return collectedAmount > 0 ? collectedAmount : targetAmount;
  }

  if (params.stageKey === "fully_paid") {
    return targetAmount > 0 ? targetAmount : collectedAmount;
  }

  return Number(params.proposalValue || 0);
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

type CollectionFollowUpMeta = {
  label: string;
  scheduledFor: string | null;
  href: string;
  dueWithin7Days: boolean;
  score: number;
};

function isCollectionFollowUp(notificationType: string | null | undefined): boolean {
  const normalized = normalizeStatus(notificationType, "");
  return (
    normalized.includes("invoice") ||
    normalized.includes("payment") ||
    normalized.includes("follow_up")
  );
}

function buildCollectionFollowUpMap(params: {
  followUps: FollowUpSelectorRow[];
  now: Date;
}): Map<string, CollectionFollowUpMeta> {
  const map = new Map<string, CollectionFollowUpMeta>();
  const windowEnd = new Date(params.now.getTime() + 7 * 24 * 60 * 60 * 1000);

  for (const followUp of params.followUps) {
    if (!followUp.trip_id || !isCollectionFollowUp(followUp.notification_type)) continue;
    const scheduled = safeDate(followUp.scheduled_for);
    const normalizedStatus = normalizeStatus(followUp.status, "");
    const isFailed = normalizedStatus === "failed";
    const isPastDue = Boolean(scheduled && scheduled.getTime() < params.now.getTime());
    const dueWithin7Days = Boolean(
      scheduled &&
        scheduled.getTime() >= params.now.getTime() &&
        scheduled.getTime() <= windowEnd.getTime(),
    );
    const label = isFailed
      ? "Reminder failed"
      : isPastDue
        ? "Reminder overdue"
        : scheduled
          ? `Reminder ${formatDateLabel(followUp.scheduled_for)}`
          : "Reminder scheduled";

    const candidate: CollectionFollowUpMeta = {
      label,
      scheduledFor: followUp.scheduled_for,
      href: "/admin/notifications",
      dueWithin7Days,
      score: isFailed ? 3 : isPastDue ? 2 : dueWithin7Days ? 1 : 0,
    };

    const existing = map.get(followUp.trip_id);
    if (!existing || candidate.score > existing.score) {
      map.set(followUp.trip_id, candidate);
      continue;
    }

    if (
      candidate.score === existing.score &&
      candidate.scheduledFor &&
      (!existing.scheduledFor ||
        new Date(candidate.scheduledFor).getTime() <
          new Date(existing.scheduledFor).getTime())
    ) {
      map.set(followUp.trip_id, candidate);
    }
  }

  return map;
}

function buildCollectionBucketHref(
  key: DashboardCollectionsBucketKey,
  range: ResolvedAdminDateRange,
): string {
  const params = new URLSearchParams({
    type:
      key === "overdue_invoices"
        ? "collections_overdue"
        : key === "due_this_week"
          ? "collections_due_soon"
          : key === "partially_paid_trips"
            ? "collections_partial"
            : "collections_approved_unpaid",
    preset: range.preset,
    from: range.from,
    to: range.to,
  });
  return `/analytics/drill-through?${params.toString()}`;
}

function createCollectionPriorityRow(params: {
  bucketKey: DashboardCollectionsBucketKey;
  id: string;
  recordType: "trip" | "invoice";
  title: string;
  clientName: string | null;
  outstandingAmount: number;
  dueDate: string | null;
  urgency: DashboardCollectionsPriorityRow["urgency"];
  paymentStage: DashboardCollectionsPriorityRow["paymentStage"];
  followUpState: string | null;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string | null;
  secondaryLabel?: string | null;
}): CollectionPriorityRowInternal {
  const sortRank =
    params.bucketKey === "overdue_invoices"
      ? 0
      : params.bucketKey === "due_this_week"
        ? 1
        : params.bucketKey === "partially_paid_trips"
          ? 2
          : 3;

  return {
    id: params.id,
    recordType: params.recordType,
    title: params.title,
    clientName: params.clientName,
    outstandingAmount: Number(params.outstandingAmount.toFixed(2)),
    dueDate: params.dueDate,
    urgency: params.urgency,
    paymentStage: params.paymentStage,
    followUpState: params.followUpState,
    primaryHref: params.primaryHref,
    primaryLabel: params.primaryLabel,
    secondaryHref: params.secondaryHref || null,
    secondaryLabel: params.secondaryLabel || null,
    bucketKey: params.bucketKey,
    sortRank,
  };
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
      financialPaymentStatus:
        itinerary?.raw_data?.financial_summary?.payment_status || null,
      financialPaymentSource:
        itinerary?.raw_data?.financial_summary?.payment_source || null,
      manualPaidAmount: Number(
        itinerary?.raw_data?.financial_summary?.manual_paid_amount || 0,
      ),
      financialEventIso:
        itinerary?.raw_data?.financial_summary?.payment_date ||
        itinerary?.updated_at ||
        trip.updated_at ||
        trip.created_at,
      quotedTotal: deriveQuotedTotal(itinerary),
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

export function buildDashboardPipelineSummary(params: {
  proposals: ProposalBusinessRow[];
  trips?: TripBusinessRow[];
  invoices?: InvoiceSelectorRow[];
  paymentLinks?: PaymentLinkSelectorRow[];
  commercialPayments?: CommercialPaymentSelectorRow[];
}) {
  const proposals = params.proposals;
  const trips = params.trips ?? [];
  const invoices = params.invoices ?? [];
  const paymentLinks = params.paymentLinks ?? [];
  const commercialPayments = params.commercialPayments ?? [];
  const canonicalProposals = filterCanonicalPipelineProposals(proposals);
  const stageMap: Record<DashboardPipelineStage["key"], { count: number; value: number }> = {
    draft: { count: 0, value: 0 },
    sent: { count: 0, value: 0 },
    viewed: { count: 0, value: 0 },
    approved: { count: 0, value: 0 },
    partially_paid: { count: 0, value: 0 },
    fully_paid: { count: 0, value: 0 },
    lost: { count: 0, value: 0 },
  };
  const tripById = new Map(trips.map((trip) => [trip.id, trip]));
  const invoiceSummaryByTrip = buildInvoiceSummaryByTrip(invoices);
  const paidLinkAmountByTrip = buildPaidLinkAmountByTrip({
    proposals: canonicalProposals,
    paymentLinks,
  });
  const commercialPaymentSummaryByTrip =
    buildCommercialPaymentSummaryByTrip(commercialPayments);

  let high = 0;
  let medium = 0;
  let low = 0;

  const openProposals = canonicalProposals.filter((proposal) =>
    isOpenDashboardProposal(proposal),
  );
  const orgMedian =
    openProposals.length > 0
      ? openProposals.reduce((sum, proposal) => sum + proposal.value, 0) /
        Math.max(openProposals.length, 1)
      : 0;

  for (const proposal of canonicalProposals) {
    const status = normalizeStatus(proposal.status, "draft");
    const linkedTrip = proposal.trip_id ? tripById.get(proposal.trip_id) || null : null;
    const invoiceSummary = proposal.trip_id
      ? invoiceSummaryByTrip.get(proposal.trip_id) || null
      : null;
    const paidLinkAmount = proposal.trip_id
      ? paidLinkAmountByTrip.get(proposal.trip_id) || 0
      : 0;
    const commercialPaidAmount = proposal.trip_id
      ? (commercialPaymentSummaryByTrip.get(proposal.trip_id)?.totalPaid ||
        (linkedTrip ? getTripManualCashAmount(linkedTrip) : 0))
      : 0;
    const targetAmount = resolveCommercialTargetAmount({
      trip: linkedTrip,
      invoiceSummary,
      proposalValue: proposal.value,
    });
    const key: DashboardPipelineStage["key"] = proposal.lifecycle === "won"
      ? resolveWonCommercialStage({
          tripFinancialPaymentStatus: linkedTrip?.financialPaymentStatus,
          commercialPaidAmount,
          invoiceSummary,
          paidLinkAmount,
          targetAmount,
        })
      : proposal.lifecycle === "lost"
        ? "lost"
        : status === "sent" || status === "viewed" || status === "draft"
          ? (status as DashboardPipelineStage["key"])
          : "draft";

    stageMap[key].count += 1;
    stageMap[key].value += resolveStageDisplayValue({
      stageKey: key,
      proposalValue: proposal.value,
      targetAmount,
      collectedAmount: getCollectedCommercialAmount({
        trip: linkedTrip,
        invoiceSummary,
        paidLinkAmount,
        commercialPaidAmount,
      }),
    });
  }

  const proposalOwnedWonTripIds = new Set(
    canonicalProposals
      .filter(
        (proposal) =>
          proposal.lifecycle === "won" &&
          Boolean(proposal.trip_id) &&
          proposal.hasLiveLinkedTrip,
      )
      .map((proposal) => proposal.trip_id as string),
  );

  for (const trip of trips) {
    if (!trip.isWon) continue;
    if (proposalOwnedWonTripIds.has(trip.id)) continue;
    const invoiceSummary = invoiceSummaryByTrip.get(trip.id) || null;
    const paidLinkAmount = paidLinkAmountByTrip.get(trip.id) || 0;
    const commercialPaidAmount =
      commercialPaymentSummaryByTrip.get(trip.id)?.totalPaid ||
      getTripManualCashAmount(trip);
    const targetAmount = resolveCommercialTargetAmount({
      trip,
      invoiceSummary,
    });
    const key = resolveWonCommercialStage({
      tripFinancialPaymentStatus: trip.financialPaymentStatus,
      commercialPaidAmount,
      invoiceSummary,
      paidLinkAmount,
      targetAmount,
    });
    stageMap[key].count += 1;
    stageMap[key].value += resolveStageDisplayValue({
      stageKey: key,
      proposalValue: trip.quotedTotal,
      targetAmount,
      collectedAmount: getCollectedCommercialAmount({
        trip,
        invoiceSummary,
        paidLinkAmount,
        commercialPaidAmount,
      }),
    });
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
  commercialPayments: CommercialPaymentSelectorRow[];
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
  const tripById = new Map(params.trips.map((trip) => [trip.id, trip]));
  const invoiceSummaryByTrip = buildInvoiceSummaryByTrip(params.invoices);
  const linkedProposalByTrip = new Map<string, ProposalBusinessRow>();
  for (const proposal of sortByEventDesc(params.proposals)) {
    if (!proposal.trip_id || linkedProposalByTrip.has(proposal.trip_id)) continue;
    linkedProposalByTrip.set(proposal.trip_id, proposal);
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

  const commercialPaymentSummaryByTrip =
    buildCommercialPaymentSummaryByTrip(params.commercialPayments);
  const useCanonicalCash = params.commercialPayments.some(
    (payment) => !payment.deleted_at,
  );
  const manualCashFallbackTripIds = new Set<string>();

  const bookedOwnerKeys = new Set<string>();

  for (const proposal of sortByEventDesc(params.proposals)) {
    if (proposal.lifecycle !== "won" || !proposal.eventIso) continue;
    if (!safeDate(proposal.eventIso)) continue;

    const linkedTrip = proposal.trip_id
      ? tripById.get(proposal.trip_id) || null
      : null;
    const invoiceSummary = proposal.trip_id
      ? invoiceSummaryByTrip.get(proposal.trip_id) || null
      : null;
    const targetAmount = resolveCommercialTargetAmount({
      trip: linkedTrip,
      invoiceSummary,
      proposalValue: proposal.value,
    });
    if (!targetAmount || !Number.isFinite(targetAmount) || targetAmount <= 0) continue;

    const key = getBucketKey(proposal.eventIso, params.range.granularity);
    if (!key || !buckets.has(key)) continue;
    const ownerId = getProposalOwnerKey(proposal);
    if (bookedOwnerKeys.has(ownerId)) continue;

    bookedOwnerKeys.add(ownerId);
    const bucket = buckets.get(key)!;
    bucket.bookedValue = Number(bucket.bookedValue || 0) + targetAmount;
    bucket.bookedItems = [
      ...(bucket.bookedItems || []),
      createSeriesItem({
        id: proposal.id,
        kind: linkedTrip ? "trip" : "proposal",
        title: linkedTrip?.tripTitle || safeTitle(proposal.title, "Won proposal"),
        subtitle:
          linkedTrip?.destination ||
          linkedTrip?.clientName ||
          proposal.clientName ||
          proposal.clientEmail ||
          "Client handoff completed",
        href: linkedTrip ? `/trips/${linkedTrip.id}` : `/proposals/${proposal.id}`,
        status: linkedTrip?.status || normalizeStatus(proposal.status, "converted"),
        amountLabel: formatCompactINR(targetAmount),
        dateLabel: formatDateLabel(proposal.eventIso),
      }),
    ];
  }

  if (useCanonicalCash) {
    for (const payment of params.commercialPayments) {
      const normalizedStatus = normalizeStatus(payment.status, "");
      if (
        payment.deleted_at ||
        (normalizedStatus !== "completed" && normalizedStatus !== "captured")
      ) {
        continue;
      }
      const eventIso = payment.payment_date || payment.created_at;
      const key = getBucketKey(eventIso, params.range.granularity);
      if (!key || !buckets.has(key)) continue;

      const amount = Number(payment.amount || 0);
      const resolvedTripId = payment.trip_id || null;
      const title =
        payment.source === "manual_cash"
          ? "Manual cash received"
          : payment.source === "payment_link"
            ? "Paid payment link"
            : "Invoice payment received";
      const bucket = buckets.get(key)!;
      bucket.cashCollected = Number(bucket.cashCollected || 0) + amount;
      bucket.cashItems = [
        ...(bucket.cashItems || []),
        createSeriesItem({
          id: payment.id,
          kind: "invoice",
          title,
          subtitle: resolvedTripId
            ? `Trip ${resolvedTripId.slice(0, 8)}`
            : "Commercial payment recorded",
          href: resolvedTripId ? `/trips/${resolvedTripId}` : "/admin/revenue",
          status: normalizedStatus || "completed",
          amountLabel: formatCompactINR(amount),
          dateLabel: formatDateLabel(eventIso),
        }),
      ];
    }
  } else {
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

    for (const trip of params.trips) {
      const amount = getTripManualCashAmount(trip);
      const eventIso = trip.financialEventIso || trip.eventIso;
      if (amount <= 0 || !eventIso) continue;
      const key = getBucketKey(eventIso, params.range.granularity);
      if (!key || !buckets.has(key)) continue;
      if (manualCashFallbackTripIds.has(trip.id)) continue;

      manualCashFallbackTripIds.add(trip.id);
      const bucket = buckets.get(key)!;
      bucket.cashCollected = Number(bucket.cashCollected || 0) + amount;
      bucket.cashItems = [
        ...(bucket.cashItems || []),
        createSeriesItem({
          id: trip.id,
          kind: "trip",
          title: "Manual cash received",
          subtitle: getTripSubtitle(trip),
          href: `/trips/${trip.id}`,
          status: normalizeStatus(trip.financialPaymentStatus, "paid"),
          amountLabel: formatCompactINR(amount),
          dateLabel: formatDateLabel(eventIso),
        }),
      ];
    }
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
      resolveCommercialTargetAmount({
        trip,
        invoiceSummary: invoiceSummaryByTrip.get(trip.id) || null,
        proposalValue: linkedProposal?.value,
      }),
      paymentLinkValueByTrip.get(trip.id),
      commercialPaymentSummaryByTrip.get(trip.id)?.totalPaid,
      getTripManualCashAmount(trip),
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

export function buildDashboardOutstandingSnapshot(params: {
  proposals: ProposalBusinessRow[];
  trips: TripBusinessRow[];
  invoices: InvoiceSelectorRow[];
  paymentLinks: PaymentLinkSelectorRow[];
  commercialPayments: CommercialPaymentSelectorRow[];
}): {
  totalOutstanding: number;
  items: RevenueChartItemPoint[];
} {
  const canonicalProposals = filterCanonicalPipelineProposals(params.proposals);
  const tripById = new Map(params.trips.map((trip) => [trip.id, trip]));
  const invoiceSummaryByTrip = buildInvoiceSummaryByTrip(params.invoices);
  const paidLinkAmountByTrip = buildPaidLinkAmountByTrip({
    proposals: canonicalProposals,
    paymentLinks: params.paymentLinks,
  });
  const commercialPaymentSummaryByTrip =
    buildCommercialPaymentSummaryByTrip(params.commercialPayments);
  const invoiceByTrip = new Map<string, InvoiceSelectorRow>();

  for (const invoice of params.invoices) {
    if (!invoice.trip_id) continue;
    const existing = invoiceByTrip.get(invoice.trip_id) || null;
    if (!existing) {
      invoiceByTrip.set(invoice.trip_id, invoice);
      continue;
    }
    const existingTime = safeDate(existing.due_date || existing.created_at || null)?.getTime() || 0;
    const candidateTime = safeDate(invoice.due_date || invoice.created_at || null)?.getTime() || 0;
    if (candidateTime > existingTime) {
      invoiceByTrip.set(invoice.trip_id, invoice);
    }
  }

  const items: RevenueChartItemPoint[] = [];
  const seenOwners = new Set<string>();
  let totalOutstanding = 0;

  for (const proposal of canonicalProposals) {
    if (proposal.lifecycle !== "won") continue;
    const linkedTrip = proposal.trip_id ? tripById.get(proposal.trip_id) || null : null;
    const invoiceSummary = proposal.trip_id
      ? invoiceSummaryByTrip.get(proposal.trip_id) || null
      : null;
    const paidLinkAmount = proposal.trip_id ? paidLinkAmountByTrip.get(proposal.trip_id) || 0 : 0;
    const commercialPaidAmount = proposal.trip_id
      ? (commercialPaymentSummaryByTrip.get(proposal.trip_id)?.totalPaid ||
        (linkedTrip ? getTripManualCashAmount(linkedTrip) : 0))
      : 0;
    const targetAmount = resolveCommercialTargetAmount({
      trip: linkedTrip,
      invoiceSummary,
      proposalValue: proposal.value,
    });
    const collectedAmount = getCollectedCommercialAmount({
      trip: linkedTrip,
      invoiceSummary,
      paidLinkAmount,
      commercialPaidAmount,
    });
    const outstanding = Math.max(targetAmount - collectedAmount, 0);
    const ownerId = getProposalOwnerKey(proposal);

    if (outstanding <= 0 || seenOwners.has(ownerId)) continue;
    seenOwners.add(ownerId);
    totalOutstanding += outstanding;

    const linkedInvoice = proposal.trip_id ? invoiceByTrip.get(proposal.trip_id) || null : null;
    if (linkedInvoice && Number(linkedInvoice.balance_amount || 0) > 0) {
      items.push(
        createSeriesItem({
          id: linkedInvoice.id,
          kind: "invoice",
          title: `Invoice ${linkedInvoice.invoice_number || linkedInvoice.id.slice(0, 8)}`,
          subtitle:
            linkedTrip?.tripTitle ||
            proposal.title ||
            linkedTrip?.destination ||
            proposal.clientName ||
            "Outstanding invoice",
          href: "/admin/invoices",
          status: normalizeStatus(linkedInvoice.status, "pending"),
          amountLabel: formatCompactINR(outstanding),
          dateLabel: formatDateLabel(linkedInvoice.due_date || linkedInvoice.created_at),
        }),
      );
      continue;
    }

    items.push(
      createSeriesItem({
        id: proposal.id,
        kind: "proposal",
        title: linkedTrip?.tripTitle || safeTitle(proposal.title, "Won proposal"),
        subtitle:
          linkedTrip?.destination ||
          linkedTrip?.clientName ||
          proposal.clientName ||
          proposal.clientEmail ||
          "Outstanding balance",
        href: linkedTrip ? `/trips/${linkedTrip.id}` : `/proposals/${proposal.id}`,
        status: linkedTrip?.status || normalizeStatus(proposal.status, "converted"),
        amountLabel: formatCompactINR(outstanding),
        dateLabel: formatDateLabel(proposal.eventIso),
      }),
    );
  }

  const proposalOwnedWonTripIds = new Set(
    canonicalProposals
      .filter(
        (proposal) =>
          proposal.lifecycle === "won" &&
          Boolean(proposal.trip_id) &&
          proposal.hasLiveLinkedTrip,
      )
      .map((proposal) => proposal.trip_id as string),
  );

  for (const trip of params.trips) {
    if (!trip.isWon) continue;
    if (proposalOwnedWonTripIds.has(trip.id)) continue;

    const invoiceSummary = invoiceSummaryByTrip.get(trip.id) || null;
    const paidLinkAmount = paidLinkAmountByTrip.get(trip.id) || 0;
    const commercialPaidAmount =
      commercialPaymentSummaryByTrip.get(trip.id)?.totalPaid || getTripManualCashAmount(trip);
    const targetAmount = resolveCommercialTargetAmount({
      trip,
      invoiceSummary,
    });
    const collectedAmount = getCollectedCommercialAmount({
      trip,
      invoiceSummary,
      paidLinkAmount,
      commercialPaidAmount,
    });
    const outstanding = Math.max(targetAmount - collectedAmount, 0);
    const ownerId = getTripOwnerKey(trip.id);

    if (outstanding <= 0 || seenOwners.has(ownerId)) continue;
    seenOwners.add(ownerId);
    totalOutstanding += outstanding;

    const linkedInvoice = invoiceByTrip.get(trip.id) || null;
    if (linkedInvoice && Number(linkedInvoice.balance_amount || 0) > 0) {
      items.push(
        createSeriesItem({
          id: linkedInvoice.id,
          kind: "invoice",
          title: `Invoice ${linkedInvoice.invoice_number || linkedInvoice.id.slice(0, 8)}`,
          subtitle: getTripTitle(trip),
          href: "/admin/invoices",
          status: normalizeStatus(linkedInvoice.status, "pending"),
          amountLabel: formatCompactINR(outstanding),
          dateLabel: formatDateLabel(linkedInvoice.due_date || linkedInvoice.created_at),
        }),
      );
      continue;
    }

    items.push(
      createSeriesItem({
        id: trip.id,
        kind: "trip",
        title: getTripTitle(trip),
        subtitle: getTripSubtitle(trip),
        href: `/trips/${trip.id}`,
        status: normalizeStatus(trip.status, "planned"),
        amountLabel: formatCompactINR(outstanding),
        dateLabel: formatDateLabel(trip.eventIso),
      }),
    );
  }

  return {
    totalOutstanding: Number(totalOutstanding.toFixed(2)),
    items,
  };
}

export function buildDashboardCollectionsWorkspaceData(params: {
  range: ResolvedAdminDateRange;
  proposals: ProposalBusinessRow[];
  trips: TripBusinessRow[];
  invoices: InvoiceSelectorRow[];
  paymentLinks: PaymentLinkSelectorRow[];
  commercialPayments: CommercialPaymentSelectorRow[];
  followUps: FollowUpSelectorRow[];
  collectedThisWindow: number;
  now: Date;
}): DashboardCollectionsWorkspaceData {
  const canonicalProposals = filterCanonicalPipelineProposals(params.proposals);
  const tripById = new Map(params.trips.map((trip) => [trip.id, trip]));
  const invoiceSummaryByTrip = buildInvoiceSummaryByTrip(params.invoices);
  const paidLinkAmountByTrip = buildPaidLinkAmountByTrip({
    proposals: canonicalProposals,
    paymentLinks: params.paymentLinks,
  });
  const commercialPaymentSummaryByTrip =
    buildCommercialPaymentSummaryByTrip(params.commercialPayments);
  const followUpByTrip = buildCollectionFollowUpMap({
    followUps: params.followUps,
    now: params.now,
  });
  const overdueRows: CollectionPriorityRowInternal[] = [];
  const dueSoonRows: CollectionPriorityRowInternal[] = [];
  const partialRows: CollectionPriorityRowInternal[] = [];
  const approvedRows: CollectionPriorityRowInternal[] = [];
  const invoiceTripIdsWithBuckets = new Set<string>();

  for (const invoice of params.invoices) {
    const trip = invoice.trip_id ? tripById.get(invoice.trip_id) || null : null;
    const followUp = invoice.trip_id ? followUpByTrip.get(invoice.trip_id) || null : null;
    const outstandingAmount = Number(invoice.balance_amount || 0);
    if (outstandingAmount <= 0) continue;

    let bucketKey: DashboardCollectionsBucketKey | null = null;
    let urgency: DashboardCollectionsPriorityRow["urgency"] = "warning";
    let paymentStage: DashboardCollectionsPriorityRow["paymentStage"] = "due_soon";

    if (isOverdueInvoice(invoice, params.now)) {
      bucketKey = "overdue_invoices";
      urgency = "critical";
      paymentStage = "overdue";
    } else if (isDueSoonInvoice(invoice, params.now, 7)) {
      bucketKey = "due_this_week";
      urgency = "warning";
      paymentStage = "due_soon";
    }

    if (!bucketKey) continue;
    if (invoice.trip_id) invoiceTripIdsWithBuckets.add(invoice.trip_id);

    const row = createCollectionPriorityRow({
      bucketKey,
      id: invoice.id,
      recordType: "invoice",
      title: `Invoice ${invoice.invoice_number || invoice.id.slice(0, 8)}`,
      clientName: trip?.clientName || null,
      outstandingAmount,
      dueDate: invoice.due_date,
      urgency,
      paymentStage,
      followUpState: followUp?.label || null,
      primaryHref: "/admin/invoices",
      primaryLabel: "Open Invoice",
      secondaryHref: "/admin/notifications",
      secondaryLabel: followUp ? "Open Reminder" : "Send Reminder",
    });

    if (bucketKey === "overdue_invoices") {
      overdueRows.push(row);
    } else {
      dueSoonRows.push(row);
    }
  }

  const proposalOwnedWonTripIds = new Set(
    canonicalProposals
      .filter(
        (proposal) =>
          proposal.lifecycle === "won" &&
          Boolean(proposal.trip_id) &&
          proposal.hasLiveLinkedTrip,
      )
      .map((proposal) => proposal.trip_id as string),
  );

  for (const trip of params.trips) {
    if (!trip.isWon) continue;
    const proposal = canonicalProposals.find((item) => item.trip_id === trip.id) || null;
    const invoiceSummary = invoiceSummaryByTrip.get(trip.id) || null;
    const paidLinkAmount = paidLinkAmountByTrip.get(trip.id) || 0;
    const commercialPaidAmount =
      commercialPaymentSummaryByTrip.get(trip.id)?.totalPaid || getTripManualCashAmount(trip);
    const targetAmount = resolveCommercialTargetAmount({
      trip,
      invoiceSummary,
      proposalValue: proposal?.value,
    });
    const collectedAmount = getCollectedCommercialAmount({
      trip,
      invoiceSummary,
      paidLinkAmount,
      commercialPaidAmount,
    });
    const outstandingAmount = Math.max(targetAmount - collectedAmount, 0);

    if (outstandingAmount <= 0) continue;
    if (!proposalOwnedWonTripIds.has(trip.id) && !trip.isWon) continue;

    const stage = resolveWonCommercialStage({
      tripFinancialPaymentStatus: trip.financialPaymentStatus,
      commercialPaidAmount,
      invoiceSummary,
      paidLinkAmount,
      targetAmount,
    });
    if (stage !== "partially_paid" && stage !== "approved") continue;

    const followUp = followUpByTrip.get(trip.id) || null;
    const row = createCollectionPriorityRow({
      bucketKey: stage === "partially_paid" ? "partially_paid_trips" : "approved_unpaid_trips",
      id: trip.id,
      recordType: "trip",
      title: getTripTitle(trip),
      clientName: trip.clientName,
      outstandingAmount,
      dueDate: followUp?.scheduledFor || trip.start_date || null,
      urgency: stage === "partially_paid" ? "warning" : "attention",
      paymentStage: stage === "partially_paid" ? "partially_paid" : "approved",
      followUpState: followUp?.label || null,
      primaryHref: `/trips/${trip.id}?tab=financials`,
      primaryLabel: "Open Financials",
      secondaryHref: "/admin/notifications",
      secondaryLabel: followUp ? "Open Reminder" : "Send Reminder",
    });

    if (invoiceTripIdsWithBuckets.has(trip.id)) continue;

    if (stage === "partially_paid") {
      partialRows.push(row);
    } else {
      approvedRows.push(row);
    }
  }

  overdueRows.sort((left, right) => right.outstandingAmount - left.outstandingAmount);
  dueSoonRows.sort((left, right) => right.outstandingAmount - left.outstandingAmount);
  partialRows.sort((left, right) => right.outstandingAmount - left.outstandingAmount);
  approvedRows.sort((left, right) => right.outstandingAmount - left.outstandingAmount);

  const expectedTripRows = [...partialRows, ...approvedRows].filter((row) => {
    if (invoiceTripIdsWithBuckets.has(row.id)) return false;
    const followUp = followUpByTrip.get(row.id);
    return Boolean(followUp?.dueWithin7Days);
  });

  const priorityRows = [
    ...overdueRows,
    ...dueSoonRows,
    ...partialRows,
    ...approvedRows,
  ]
    .sort((left, right) => {
      if (left.sortRank !== right.sortRank) return left.sortRank - right.sortRank;
      return right.outstandingAmount - left.outstandingAmount;
    })
    .slice(0, 5)
    .map(stripCollectionPriorityRowMeta);

  const bucketRows = {
    overdue_invoices: overdueRows.map(stripCollectionPriorityRowMeta),
    due_this_week: dueSoonRows.map(stripCollectionPriorityRowMeta),
    partially_paid_trips: partialRows.map(stripCollectionPriorityRowMeta),
    approved_unpaid_trips: approvedRows.map(stripCollectionPriorityRowMeta),
  };

  const overdueAmount = overdueRows.reduce((sum, row) => sum + row.outstandingAmount, 0);
  const dueSoonAmount = dueSoonRows.reduce((sum, row) => sum + row.outstandingAmount, 0);
  const partialAmount = partialRows.reduce((sum, row) => sum + row.outstandingAmount, 0);
  const approvedAmount = approvedRows.reduce((sum, row) => sum + row.outstandingAmount, 0);
  const expectedTripAmount = expectedTripRows.reduce(
    (sum, row) => sum + row.outstandingAmount,
    0,
  );
  const outstandingAmount = overdueAmount + dueSoonAmount + partialAmount + approvedAmount;

  const buckets: DashboardCollectionsBucket[] = [
    {
      key: "overdue_invoices",
      label: "Overdue Invoices",
      amount: Number(overdueAmount.toFixed(2)),
      count: overdueRows.length,
      href: buildCollectionBucketHref("overdue_invoices", params.range),
    },
    {
      key: "due_this_week",
      label: "Due This Week",
      amount: Number(dueSoonAmount.toFixed(2)),
      count: dueSoonRows.length,
      href: buildCollectionBucketHref("due_this_week", params.range),
    },
    {
      key: "partially_paid_trips",
      label: "Partially Paid Trips",
      amount: Number(partialAmount.toFixed(2)),
      count: partialRows.length,
      href: buildCollectionBucketHref("partially_paid_trips", params.range),
    },
    {
      key: "approved_unpaid_trips",
      label: "Approved but Unpaid Trips",
      amount: Number(approvedAmount.toFixed(2)),
      count: approvedRows.length,
      href: buildCollectionBucketHref("approved_unpaid_trips", params.range),
    },
  ];

  const nextBestAction = overdueRows.length > 0
    ? {
        title: `Collect ${formatCompactINR(overdueAmount)} from ${overdueRows.length} overdue invoice${overdueRows.length === 1 ? "" : "s"} before following up on trips.`,
        href: buildCollectionBucketHref("overdue_invoices", params.range),
        actionLabel: "Open overdue invoices",
      }
    : dueSoonRows.length > 0
      ? {
          title: `Recover ${formatCompactINR(dueSoonAmount)} due this week before it slips overdue.`,
          href: buildCollectionBucketHref("due_this_week", params.range),
          actionLabel: "Open due this week",
        }
      : partialRows.length > 0
        ? {
            title: `Follow up on ${partialRows.length} partially paid trip${partialRows.length === 1 ? "" : "s"} to close the remaining balance.`,
            href: buildCollectionBucketHref("partially_paid_trips", params.range),
            actionLabel: "Open partially paid trips",
          }
        : approvedRows.length > 0
          ? {
              title: `Convert ${approvedRows.length} approved trip${approvedRows.length === 1 ? "" : "s"} into collected cash with reminders and invoices.`,
              href: buildCollectionBucketHref("approved_unpaid_trips", params.range),
              actionLabel: "Open approved trips",
            }
          : null;

  return {
    nextBestAction,
    snapshot: {
      collectedThisWindow: {
        label: "Collected This Window",
        amount: Number(params.collectedThisWindow.toFixed(2)),
        count: null,
        href: `/analytics/drill-through?${new URLSearchParams({
          type: "booked",
          preset: params.range.preset,
          from: params.range.from,
          to: params.range.to,
        }).toString()}`,
      },
      outstanding: {
        label: "Outstanding",
        amount: Number(outstandingAmount.toFixed(2)),
        count: overdueRows.length + dueSoonRows.length + partialRows.length + approvedRows.length,
        href: `/analytics/drill-through?${new URLSearchParams({
          type: "collections_outstanding",
          preset: params.range.preset,
          from: params.range.from,
          to: params.range.to,
        }).toString()}`,
      },
      overdue: {
        label: "Overdue",
        amount: Number(overdueAmount.toFixed(2)),
        count: overdueRows.length,
        href: buildCollectionBucketHref("overdue_invoices", params.range),
      },
      expectedIn7Days: {
        label: "Expected in 7 Days",
        amount: Number((dueSoonAmount + expectedTripAmount).toFixed(2)),
        count: dueSoonRows.length + expectedTripRows.length,
        href: buildCollectionBucketHref("due_this_week", params.range),
      },
    },
    buckets,
    priorityRows,
    bucketRows,
  };
}

export function resolveDashboardDefaultRevenueMetric(params: {
  bookedValue: number;
  cashCollected: number;
  tripCount: number;
}): "booked" | "cash" | "trips" {
  if (params.cashCollected > 0) return "cash";
  if (params.bookedValue > 0) return "booked";
  if (params.tripCount > 0) return "trips";
  return "booked";
}
