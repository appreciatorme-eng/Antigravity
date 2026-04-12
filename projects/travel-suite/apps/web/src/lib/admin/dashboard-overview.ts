import type { SupabaseClient } from "@supabase/supabase-js";
import type { ResolvedAdminDateRange } from "@/lib/admin/date-range";
import type {
  DashboardAiInsightCard,
  DashboardCalendarPreview,
  DashboardHealth,
  DashboardHealthSourceKey,
  DashboardKpis,
  DashboardOverview,
  DashboardPipelineStage,
  DashboardQueueItem,
  DashboardScorecardMetric,
} from "@/lib/admin/dashboard-overview-types";
import {
  computeProposalRisk,
  normalizeStatus,
  safeTitle,
} from "@/lib/admin/insights";
import {
  addUtcDays,
  buildRangeBucketKeys,
  formatCalendarDay,
  formatCompactINR,
  formatDateLabel,
  getBucketKey,
  getBucketLabel,
  getBusinessEventIso,
  getFallbackTripWinRate,
  getInvoicePaidEventIso,
  getProposalLifecycle,
  getProposalValue,
  getResolvedWinRate,
  hasWonTripStatus,
  isActiveTripStatus,
  isBookedTripStatus,
  isCollectibleInvoice,
  isDueSoonInvoice,
  isInRange,
  isOverdueInvoice,
  isPaidInvoice,
  isOpenProposal,
  safeDate,
  startOfUtcDay,
} from "@/lib/admin/operator-state";
import type { RevenueChartItemPoint, RevenueChartPoint } from "@/components/analytics/RevenueChart";

type AdminQueryClient = Pick<SupabaseClient, "from">;

type ProposalRow = {
  id: string;
  title: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  viewed_at: string | null;
  expires_at: string | null;
  total_price: number | null;
  client_selected_price: number | null;
  client_id: string | null;
  trip_id: string | null;
  trips?: { status?: string | null } | { status?: string | null }[] | null;
};

type TripRow = {
  id: string;
  itinerary_id: string | null;
  client_id: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  start_date: string | null;
  end_date: string | null;
};

type InvoiceRow = {
  id: string;
  invoice_number: string | null;
  status: string | null;
  due_date: string | null;
  balance_amount: number | null;
  total_amount: number | null;
  created_at: string | null;
  updated_at: string | null;
  paid_at: string | null;
  client_id: string | null;
  trip_id: string | null;
};

type PaymentLinkRow = {
  id: string;
  status: string | null;
  amount_paise: number | null;
  paid_at: string | null;
  created_at: string | null;
  trip_id: string | null;
};

type InvoicePaymentRow = {
  id: string;
  status: string | null;
  amount: number | null;
  payment_date: string | null;
  created_at: string | null;
  invoice_id: string | null;
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

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
};

type ItineraryRow = {
  id: string;
  trip_title: string | null;
  destination: string | null;
};

type QuerySourceResult<T> = {
  rows: T[];
  health: "ok" | "failed";
  message: string | null;
};

type FollowUpResult = {
  rows: FollowUpRow[];
  health: "ok" | "failed";
  message: string | null;
};

type ClientMeta = {
  fullName: string | null;
  email: string | null;
};

type TripDecorated = TripRow & {
  clientName: string | null;
  destination: string | null;
  tripTitle: string | null;
};

const FOLLOW_UP_ACTIVE_STATUSES = new Set(["pending", "queued", "retry", "failed"]);
const PROPOSAL_STAGE_LABELS: Record<DashboardPipelineStage["key"], string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  paid: "Paid",
  lost: "Lost",
};

function chunkValues<T>(values: T[], size: number): T[][] {
  if (values.length === 0) return [];
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function sourceMessage(label: string): string {
  return `${label} data is temporarily unavailable, so parts of the dashboard may be partial.`;
}

function resolveSettledRows<T>(
  result: PromiseSettledResult<{ data: T[] | null; error: { message?: string | null } | null }>,
  label: string,
): QuerySourceResult<T> {
  if (result.status === "rejected") {
    return {
      rows: [],
      health: "failed",
      message: sourceMessage(label),
    };
  }

  if (result.value.error) {
    return {
      rows: [],
      health: "failed",
      message: sourceMessage(label),
    };
  }

  return {
    rows: (result.value.data || []) as T[],
    health: "ok",
    message: null,
  };
}

async function queryFollowUpsByColumn(params: {
  client: AdminQueryClient;
  column: "user_id" | "trip_id";
  ids: string[];
  windowStartIso: string;
  windowEndIso: string;
}): Promise<{ data: FollowUpRow[]; error: Error | null }> {
  const rows: FollowUpRow[] = [];

  for (const chunk of chunkValues(params.ids, 200)) {
    const { data, error } = await params.client
      .from("notification_queue")
      .select("id,notification_type,status,scheduled_for,trip_id,recipient_phone,recipient_email")
      .in(params.column, chunk)
      .gte("scheduled_for", params.windowStartIso)
      .lte("scheduled_for", params.windowEndIso)
      .limit(500);

    if (error) {
      return {
        data: [],
        error: new Error(error.message || "Failed to fetch follow-ups"),
      };
    }

    rows.push(
      ...(((data || []) as FollowUpRow[]).filter((row) =>
        FOLLOW_UP_ACTIVE_STATUSES.has(normalizeStatus(row.status, "")),
      )),
    );
  }

  const deduped = new Map<string, FollowUpRow>();
  for (const row of rows) {
    deduped.set(row.id, row);
  }

  return {
    data: Array.from(deduped.values()).sort(
      (left, right) =>
        new Date(left.scheduled_for).getTime() -
        new Date(right.scheduled_for).getTime(),
    ),
    error: null,
  };
}

async function fetchFollowUps(params: {
  client: AdminQueryClient;
  userIds: string[];
  tripIds: string[];
  windowStartIso: string;
  windowEndIso: string;
}): Promise<FollowUpResult> {
  const [byUser, byTrip] = await Promise.all([
    params.userIds.length
      ? queryFollowUpsByColumn({
          client: params.client,
          column: "user_id",
          ids: params.userIds,
          windowStartIso: params.windowStartIso,
          windowEndIso: params.windowEndIso,
        })
      : Promise.resolve({ data: [], error: null }),
    params.tripIds.length
      ? queryFollowUpsByColumn({
          client: params.client,
          column: "trip_id",
          ids: params.tripIds,
          windowStartIso: params.windowStartIso,
          windowEndIso: params.windowEndIso,
        })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (byUser.error || byTrip.error) {
    return {
      rows: [],
      health: "failed",
      message: sourceMessage("Follow-up"),
    };
  }

  const deduped = new Map<string, FollowUpRow>();
  for (const row of [...byUser.data, ...byTrip.data]) {
    deduped.set(row.id, row);
  }

  return {
    rows: Array.from(deduped.values()).sort(
      (left, right) =>
        new Date(left.scheduled_for).getTime() -
        new Date(right.scheduled_for).getTime(),
    ),
    health: "ok",
    message: null,
  };
}

function buildHealth(input: {
  proposals: QuerySourceResult<ProposalRow>;
  trips: QuerySourceResult<TripRow>;
  invoices: QuerySourceResult<InvoiceRow>;
  payments: QuerySourceResult<PaymentLinkRow | InvoicePaymentRow>;
  followUps: FollowUpResult;
  profiles: QuerySourceResult<ProfileRow>;
  itineraries: QuerySourceResult<ItineraryRow>;
}): DashboardHealth {
  const sources: DashboardHealth["sources"] = {
    proposals: input.proposals.health,
    trips: input.trips.health,
    invoices: input.invoices.health,
    payments: input.payments.health,
    followUps: input.followUps.health,
    profiles: input.profiles.health,
    itineraries: input.itineraries.health,
  };

  const messages = [
    input.proposals.message,
    input.trips.message,
    input.invoices.message,
    input.payments.message,
    input.followUps.message,
    input.profiles.message,
    input.itineraries.message,
  ].filter((message): message is string => Boolean(message));

  const states = Object.values(sources);
  const overall =
    states.every((state) => state === "ok")
      ? "ok"
      : states.every((state) => state === "failed")
        ? "failed"
        : "partial";

  return { overall, sources, messages };
}

function buildClientMap(profiles: ProfileRow[]): Map<string, ClientMeta> {
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

function decorateTrips(
  trips: TripRow[],
  itineraries: ItineraryRow[],
  clientMap: Map<string, ClientMeta>,
): TripDecorated[] {
  const itineraryMap = new Map(
    itineraries.map((itinerary) => [itinerary.id, itinerary]),
  );

  return trips.map((trip) => {
    const itinerary = trip.itinerary_id
      ? itineraryMap.get(trip.itinerary_id) || null
      : null;
    const client = trip.client_id ? clientMap.get(trip.client_id) || null : null;

    return {
      ...trip,
      clientName: client?.fullName || null,
      destination: itinerary?.destination || null,
      tripTitle: itinerary?.trip_title || null,
    };
  });
}

function getTripTitle(trip: TripDecorated): string {
  return safeTitle(
    trip.tripTitle || trip.destination || "Untitled trip",
    "Untitled trip",
  );
}

function getTripSubtitle(trip: TripDecorated): string {
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

function buildSeries(
  range: ResolvedAdminDateRange,
  proposals: ProposalRow[],
  trips: TripDecorated[],
  invoices: InvoiceRow[],
  paymentLinks: PaymentLinkRow[],
  invoicePayments: InvoicePaymentRow[],
  clientMap: Map<string, ClientMeta>,
): RevenueChartPoint[] {
  const buckets = new Map<string, RevenueChartPoint>(
    buildRangeBucketKeys(range).map((key) => [
      key,
      {
        monthKey: key,
        label: getBucketLabel(key, range.granularity),
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

  for (const proposal of proposals) {
    if (getProposalLifecycle(proposal) !== "won") continue;
    const eventIso = getBusinessEventIso(proposal.created_at, proposal.updated_at);
    if (!isInRange(eventIso, range)) continue;

    const key = getBucketKey(eventIso, range.granularity);
    if (!key || !buckets.has(key)) continue;

    const amount = getProposalValue(proposal);
    const client = proposal.client_id
      ? clientMap.get(proposal.client_id) || null
      : null;
    const bucket = buckets.get(key)!;
    bucket.bookedValue = (bucket.bookedValue || 0) + amount;
    bucket.bookedItems = [
      ...(bucket.bookedItems || []),
      createSeriesItem({
        id: proposal.id,
        kind: "proposal",
        title: safeTitle(proposal.title, "Won proposal"),
        subtitle:
          client?.fullName || client?.email || "Client handoff completed",
        href: `/proposals/${proposal.id}`,
        status: normalizeStatus(proposal.status, "converted"),
        amountLabel: formatCompactINR(amount),
        dateLabel: formatDateLabel(eventIso),
      }),
    ];
  }

  const paymentInvoiceIds = new Set(
    invoicePayments
      .filter(
        (payment) =>
          normalizeStatus(payment.status, "completed") === "completed" &&
          Boolean(payment.invoice_id),
      )
      .map((payment) => payment.invoice_id as string),
  );

  for (const link of paymentLinks) {
    if (normalizeStatus(link.status, "") !== "paid") continue;
    if (!isInRange(link.paid_at, range)) continue;

    const key = getBucketKey(link.paid_at, range.granularity);
    if (!key || !buckets.has(key)) continue;

    const amount = Number(link.amount_paise || 0) / 100;
    const bucket = buckets.get(key)!;
    bucket.cashCollected = (bucket.cashCollected || 0) + amount;
    bucket.cashItems = [
      ...(bucket.cashItems || []),
      createSeriesItem({
        id: link.id,
        kind: "invoice",
        title: "Paid payment link",
        subtitle: link.trip_id ? `Trip ${link.trip_id.slice(0, 8)}` : "Client payment captured",
        href: link.trip_id ? `/trips/${link.trip_id}` : "/admin/revenue",
        status: "paid",
        amountLabel: formatCompactINR(amount),
        dateLabel: formatDateLabel(link.paid_at || link.created_at),
      }),
    ];
  }

  for (const payment of invoicePayments) {
    if (normalizeStatus(payment.status, "completed") !== "completed") continue;
    if (!isInRange(payment.payment_date, range)) continue;

    const key = getBucketKey(payment.payment_date, range.granularity);
    if (!key || !buckets.has(key)) continue;

    const amount = Number(payment.amount || 0);
    const bucket = buckets.get(key)!;
    bucket.cashCollected = (bucket.cashCollected || 0) + amount;
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

  for (const invoice of invoices) {
    if (!isPaidInvoice(invoice)) continue;
    if (paymentInvoiceIds.has(invoice.id)) continue;
    const eventIso = getInvoicePaidEventIso(invoice);
    if (!isInRange(eventIso, range)) continue;

    const key = getBucketKey(eventIso, range.granularity);
    if (!key || !buckets.has(key)) continue;

    const client = invoice.client_id
      ? clientMap.get(invoice.client_id) || null
      : null;
    const amount = Number(invoice.total_amount || 0);
    const bucket = buckets.get(key)!;
    bucket.cashCollected = (bucket.cashCollected || 0) + amount;
    bucket.cashItems = [
      ...(bucket.cashItems || []),
      createSeriesItem({
        id: invoice.id,
        kind: "invoice",
        title: `Invoice ${invoice.invoice_number || invoice.id.slice(0, 8)}`,
        subtitle: client?.fullName || client?.email || "Paid invoice",
        href: "/admin/invoices",
        status: normalizeStatus(invoice.status, "paid"),
        amountLabel: formatCompactINR(amount),
        dateLabel: formatDateLabel(eventIso),
      }),
    ];
  }

  for (const trip of trips) {
    if (!isBookedTripStatus(trip.status)) continue;
    const eventIso = getBusinessEventIso(trip.created_at, trip.updated_at);
    if (!isInRange(eventIso, range)) continue;

    const key = getBucketKey(eventIso, range.granularity);
    if (!key || !buckets.has(key)) continue;

    const bucket = buckets.get(key)!;
    bucket.tripCount = (bucket.tripCount || 0) + 1;
    bucket.bookings = (bucket.bookings || 0) + 1;
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
        dateLabel: formatDateLabel(eventIso),
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
  }

  return Array.from(buckets.values()).map((bucket) => ({
    ...bucket,
    revenue: Number((bucket.cashCollected || 0).toFixed(2)),
    bookings: bucket.tripCount || 0,
    bookedValue: Number((bucket.bookedValue || 0).toFixed(2)),
    cashCollected: Number((bucket.cashCollected || 0).toFixed(2)),
    tripCount: bucket.tripCount || 0,
  }));
}

function buildPipelineSummary(proposals: ProposalRow[]) {
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

  const openProposals = proposals.filter((proposal) => isOpenProposal(proposal));
  const orgMedian =
    openProposals.length > 0
      ? openProposals.reduce((sum, proposal) => sum + getProposalValue(proposal), 0) /
        Math.max(openProposals.length, 1)
      : 0;

  for (const proposal of proposals) {
    const lifecycle = getProposalLifecycle(proposal);
    const status = normalizeStatus(proposal.status, "draft");
    const key: DashboardPipelineStage["key"] =
      lifecycle === "won"
        ? "paid"
        : lifecycle === "lost"
          ? "lost"
          : status === "sent" || status === "viewed" || status === "draft"
            ? (status as DashboardPipelineStage["key"])
            : "draft";

    stageMap[key].count += 1;
    stageMap[key].value += getProposalValue(proposal);
  }

  for (const proposal of openProposals) {
    const risk = computeProposalRisk({
      status: proposal.status,
      createdAt: proposal.created_at,
      updatedAt: proposal.updated_at,
      expiresAt: proposal.expires_at,
      viewedAt: proposal.viewed_at,
      totalPrice: getProposalValue(proposal),
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

function buildActionQueue(params: {
  proposals: ProposalRow[];
  trips: TripDecorated[];
  invoices: InvoiceRow[];
  followUps: FollowUpRow[];
  now: Date;
}): {
  summary: DashboardOverview["actionQueue"]["summary"];
  items: DashboardQueueItem[];
} {
  const items: DashboardQueueItem[] = [];

  const overdueInvoices = params.invoices.filter((invoice) =>
    isOverdueInvoice(invoice, params.now),
  );
  const dueSoonInvoices = params.invoices.filter((invoice) =>
    isDueSoonInvoice(invoice, params.now, 7),
  );
  const expiringQuotes = params.proposals.filter((proposal) => {
    if (!isOpenProposal(proposal)) return false;
    const expiresAt = safeDate(proposal.expires_at);
    if (!expiresAt) return false;
    return expiresAt.getTime() <= addUtcDays(startOfUtcDay(params.now), 7).getTime();
  });
  const atRiskDepartures = params.trips.filter((trip) => {
    const startDate = safeDate(trip.start_date);
    if (!startDate) return false;
    const daysOut =
      (startOfUtcDay(startDate).getTime() - startOfUtcDay(params.now).getTime()) /
      (1000 * 60 * 60 * 24);
    return (
      daysOut >= 0 &&
      daysOut <= 2 &&
      !["confirmed", "in_progress", "active", "paid", "completed"].includes(
        normalizeStatus(trip.status, ""),
      )
    );
  });

  const followUpsDue = params.followUps.filter((followUp) => {
    const scheduled = safeDate(followUp.scheduled_for);
    if (!scheduled) return false;
    return (
      scheduled.getTime() <= addUtcDays(startOfUtcDay(params.now), 1).getTime() ||
      normalizeStatus(followUp.status, "") === "failed"
    );
  });

  for (const invoice of overdueInvoices) {
    items.push({
      id: `invoice:${invoice.id}`,
      type: "payment",
      title: `Invoice ${invoice.invoice_number || invoice.id.slice(0, 8)} overdue`,
      subtitle: "Collection requires operator action",
      urgency: "critical",
      href: "/admin/invoices",
      actionLabel: "Collect now",
      meta: `${formatCompactINR(Number(invoice.balance_amount || 0))} overdue`,
    });
  }

  for (const invoice of dueSoonInvoices) {
    items.push({
      id: `invoice-due:${invoice.id}`,
      type: "payment",
      title: `Invoice ${invoice.invoice_number || invoice.id.slice(0, 8)} due soon`,
      subtitle: "Pending payment follow-up",
      urgency: "warning",
      href: "/admin/invoices",
      actionLabel: "Review invoice",
      meta: `Due ${formatDateLabel(invoice.due_date)}`,
    });
  }

  for (const proposal of expiringQuotes) {
    const expiresAt = safeDate(proposal.expires_at);
    const hoursRemaining = expiresAt
      ? Math.round((expiresAt.getTime() - params.now.getTime()) / (1000 * 60 * 60))
      : null;
    items.push({
      id: `proposal:${proposal.id}`,
      type: "quote",
      title: safeTitle(proposal.title, "Proposal expiring"),
      subtitle: "Client decision window is closing",
      urgency: hoursRemaining !== null && hoursRemaining <= 24 ? "critical" : "warning",
      href: `/proposals/${proposal.id}`,
      actionLabel: "Follow up",
      meta:
        hoursRemaining !== null && hoursRemaining <= 24
          ? `${Math.max(hoursRemaining, 1)}h left`
          : `Expires ${formatDateLabel(proposal.expires_at)}`,
    });
  }

  for (const trip of atRiskDepartures) {
    const startDate = safeDate(trip.start_date);
    const daysOut = startDate
      ? Math.round(
          (startOfUtcDay(startDate).getTime() - startOfUtcDay(params.now).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;
    items.push({
      id: `trip:${trip.id}`,
      type: "departure",
      title: `${getTripTitle(trip)} needs confirmation`,
      subtitle: trip.clientName || trip.destination || "Upcoming departure",
      urgency: "critical",
      href: `/trips/${trip.id}`,
      actionLabel: "Open trip",
      meta: daysOut === null ? "Upcoming" : daysOut === 0 ? "Today" : `D-${daysOut}`,
    });
  }

  for (const followUp of followUpsDue) {
    const scheduledAt = safeDate(followUp.scheduled_for);
    items.push({
      id: `followup:${followUp.id}`,
      type: "followup",
      title: safeTitle(
        (followUp.notification_type || "follow_up").replace(/_/g, " "),
        "Follow-up due",
      ),
      subtitle: followUp.recipient_email || followUp.recipient_phone || "Pending outreach",
      urgency:
        normalizeStatus(followUp.status, "") === "failed" ||
        (scheduledAt ? scheduledAt.getTime() < params.now.getTime() : false)
          ? "critical"
          : "warning",
      href: "/admin/notifications",
      actionLabel: "Review follow-up",
      meta:
        normalizeStatus(followUp.status, "") === "failed"
          ? "Failed"
          : `Scheduled ${formatDateLabel(followUp.scheduled_for)}`,
    });
  }

  items.sort((left, right) => {
    if (left.urgency !== right.urgency) {
      return left.urgency === "critical" ? -1 : 1;
    }
    return left.title.localeCompare(right.title);
  });

  return {
    summary: {
      overdueInvoices: overdueInvoices.length,
      dueSoonInvoices: dueSoonInvoices.length,
      expiringQuotes: expiringQuotes.length,
      atRiskDepartures: atRiskDepartures.length,
      followUpsDue: followUpsDue.length,
    },
    items,
  };
}

function buildBriefingSentence(params: {
  queue: DashboardOverview["actionQueue"];
  overdueAmount: number;
}): string {
  const parts: string[] = [];

  if ((params.queue.summary.overdueInvoices || 0) > 0) {
    parts.push(
      `${params.queue.summary.overdueInvoices} overdue invoice${params.queue.summary.overdueInvoices === 1 ? "" : "s"} (${formatCompactINR(params.overdueAmount)})`,
    );
  }

  if ((params.queue.summary.dueSoonInvoices || 0) > 0) {
    parts.push(
      `${params.queue.summary.dueSoonInvoices} invoice${params.queue.summary.dueSoonInvoices === 1 ? "" : "s"} due soon`,
    );
  }

  if ((params.queue.summary.expiringQuotes || 0) > 0) {
    parts.push(
      `${params.queue.summary.expiringQuotes} quote${params.queue.summary.expiringQuotes === 1 ? "" : "s"} nearing expiry`,
    );
  }

  if ((params.queue.summary.atRiskDepartures || 0) > 0) {
    parts.push(
      `${params.queue.summary.atRiskDepartures} departure${params.queue.summary.atRiskDepartures === 1 ? "" : "s"} need confirmation`,
    );
  }

  if ((params.queue.summary.followUpsDue || 0) > 0) {
    parts.push(
      `${params.queue.summary.followUpsDue} follow-up${params.queue.summary.followUpsDue === 1 ? "" : "s"} due`,
    );
  }

  if (parts.length === 0) {
    return "All clear — no urgent operator actions right now.";
  }

  return `Focus first on ${parts.join(", ")}.`;
}

function buildCalendarPreview(params: {
  proposals: ProposalRow[];
  trips: TripDecorated[];
  invoices: InvoiceRow[];
  followUps: FollowUpRow[];
  now: Date;
  health: DashboardHealth;
}): DashboardCalendarPreview {
  const start = startOfUtcDay(params.now);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addUtcDays(start, index);
    return {
      date: formatCalendarDay(date),
      label: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
      dayLabel:
        index === 0
          ? "Today"
          : date.toLocaleDateString("en-US", {
              weekday: "short",
              timeZone: "UTC",
            }),
      isToday: index === 0,
      departures: 0,
      payments: 0,
      followUps: 0,
      quotes: 0,
    };
  });

  const dayMap = new Map(days.map((day) => [day.date, day]));

  for (const trip of params.trips) {
    const startDate = safeDate(trip.start_date);
    if (!startDate) continue;
    const key = formatCalendarDay(startDate);
    const day = dayMap.get(key);
    if (!day) continue;
    if (!["cancelled"].includes(normalizeStatus(trip.status, ""))) {
      day.departures += 1;
    }
  }

  for (const invoice of params.invoices) {
    if (!isCollectibleInvoice(invoice) || !invoice.due_date) continue;
    const dueDate = safeDate(invoice.due_date);
    if (!dueDate) continue;
    const day = dayMap.get(formatCalendarDay(dueDate));
    if (!day) continue;
    day.payments += 1;
  }

  for (const proposal of params.proposals) {
    if (!isOpenProposal(proposal) || !proposal.expires_at) continue;
    const expiresAt = safeDate(proposal.expires_at);
    if (!expiresAt) continue;
    const day = dayMap.get(formatCalendarDay(expiresAt));
    if (!day) continue;
    day.quotes += 1;
  }

  for (const followUp of params.followUps) {
    const scheduled = safeDate(followUp.scheduled_for);
    if (!scheduled) continue;
    const day = dayMap.get(formatCalendarDay(scheduled));
    if (!day) continue;
    day.followUps += 1;
  }

  const sourceErrors = (
    ["trips", "invoices", "followUps", "proposals"] as DashboardHealthSourceKey[]
  )
    .filter((key) => params.health.sources[key] !== "ok")
    .map((source) => ({ source }));

  return {
    days,
    hasAnyEvents: days.some(
      (day) => day.departures + day.payments + day.followUps + day.quotes > 0,
    ),
    sourceErrors,
  };
}

function buildAiInsights(params: {
  kpis: DashboardKpis;
  pipeline: DashboardOverview["pipeline"];
  actionQueue: DashboardOverview["actionQueue"];
  revenue: DashboardOverview["revenue"];
  dataFootprint: number;
}): DashboardAiInsightCard[] {
  if (params.dataFootprint <= 0) {
    return [];
  }

  const cards: DashboardAiInsightCard[] = [];

  if ((params.kpis.overdueAmount || 0) > 0) {
    cards.push({
      id: "ai-overdue-cash",
      category: "cash",
      source: "Invoices",
      title: "Overdue cash needs recovery",
      value: formatCompactINR(params.kpis.overdueAmount || 0),
      description: `${params.kpis.overdueInvoices || 0} overdue invoice${params.kpis.overdueInvoices === 1 ? "" : "s"} are blocking collections right now.`,
      href: "/admin/invoices",
    });
  }

  const cashGap =
    Number(params.revenue.totals.bookedValue || 0) -
    Number(params.revenue.totals.cashCollected || 0);
  if (cashGap > 0) {
    cards.push({
      id: "ai-booked-vs-cash",
      category: "cash",
      source: "Revenue",
      title: "Booked value is ahead of collections",
      value: formatCompactINR(cashGap),
      description: "Use invoices and reminders to convert booked business into collected cash.",
      href: "/admin/revenue",
    });
  }

  if ((params.pipeline.risk.high || 0) > 0) {
    cards.push({
      id: "ai-high-risk-pipeline",
      category: "pipeline",
      source: "Proposals",
      title: "High-risk quotes need operator follow-up",
      value: `${params.pipeline.risk.high} high risk`,
      description: "Recent pricing, expiry, or stale-view signals suggest a tighter quote recovery push is needed.",
      href: "/analytics/drill-through?type=pipeline&status_group=open&limit=50",
    });
  }

  if ((params.actionQueue.summary.followUpsDue || 0) > 0) {
    cards.push({
      id: "ai-followups",
      category: "operations",
      source: "Notifications",
      title: "Follow-up queue needs attention",
      value: `${params.actionQueue.summary.followUpsDue} due`,
      description: "Pending and overdue follow-ups are starting to drift away from the commercial pipeline.",
      href: "/admin/notifications",
    });
  }

  if ((params.kpis.departureCount || 0) > 0 && (params.actionQueue.summary.atRiskDepartures || 0) > 0) {
    cards.push({
      id: "ai-departures-risk",
      category: "operations",
      source: "Trips",
      title: "Upcoming departures need tighter control",
      value: `${params.actionQueue.summary.atRiskDepartures} at risk`,
      description: "At least one near-term departure still lacks the operational status expected before travel day.",
      href: "/admin/operations",
    });
  }

  return cards.slice(0, 4);
}

function buildScorecard(params: {
  revenue: DashboardOverview["revenue"];
  kpis: DashboardKpis;
  actionQueue: DashboardOverview["actionQueue"];
}): DashboardScorecardMetric[] {
  return [
    {
      key: "booked",
      label: "Booked Value",
      current: params.kpis.bookedValue !== null ? formatCompactINR(params.kpis.bookedValue) : "—",
      delta: null,
    },
    {
      key: "cash",
      label: "Collected Cash",
      current: params.kpis.cashCollected !== null ? formatCompactINR(params.kpis.cashCollected) : "—",
      delta: null,
    },
    {
      key: "pipeline",
      label: "Open Pipeline",
      current: params.kpis.openPipelineValue !== null ? formatCompactINR(params.kpis.openPipelineValue) : "—",
      delta: null,
    },
    {
      key: "winRate",
      label: "Win Rate",
      current:
        params.kpis.winRate !== null
          ? `${params.kpis.winRate.toFixed(1)}%`
          : "—",
      delta: null,
    },
    {
      key: "overdue",
      label: "Overdue Invoices",
      current: String(params.kpis.overdueInvoices ?? 0),
      delta: null,
    },
    {
      key: "followups",
      label: "Follow-ups Due",
      current: String(params.actionQueue.summary.followUpsDue ?? 0),
      delta: null,
    },
  ];
}

export async function buildDashboardOverview(params: {
  adminClient: AdminQueryClient;
  organizationId: string;
  range: ResolvedAdminDateRange;
}): Promise<DashboardOverview> {
  const now = new Date();
  const followUpWindowStart = addUtcDays(startOfUtcDay(now), -7).toISOString();
  const followUpWindowEnd = addUtcDays(startOfUtcDay(now), 8).toISOString();

  const [
    proposalsSettled,
    tripsSettled,
    invoicesSettled,
    paymentLinksSettled,
    invoicePaymentsSettled,
    profilesSettled,
  ] = await Promise.allSettled([
    params.adminClient
      .from("proposals")
      .select(
        "id,title,status,created_at,updated_at,viewed_at,expires_at,total_price,client_selected_price,client_id,trip_id,trips:trip_id(status)",
      )
      .eq("organization_id", params.organizationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5000),
    params.adminClient
      .from("trips")
      .select("id,itinerary_id,client_id,status,created_at,updated_at,start_date,end_date")
      .eq("organization_id", params.organizationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5000),
    params.adminClient
      .from("invoices")
      .select("id,invoice_number,status,due_date,balance_amount,total_amount,created_at,updated_at,paid_at,client_id,trip_id")
      .eq("organization_id", params.organizationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5000),
    params.adminClient
      .from("payment_links")
      .select("id,status,amount_paise,paid_at,created_at,trip_id")
      .eq("organization_id", params.organizationId)
      .order("created_at", { ascending: false })
      .limit(5000),
    params.adminClient
      .from("invoice_payments")
      .select("id,status,amount,payment_date,created_at,invoice_id")
      .eq("organization_id", params.organizationId)
      .order("created_at", { ascending: false })
      .limit(5000),
    params.adminClient
      .from("profiles")
      .select("id,full_name,email,role")
      .eq("organization_id", params.organizationId)
      .limit(5000),
  ]);

  const proposalsResult = resolveSettledRows<ProposalRow>(
    proposalsSettled,
    "Proposal",
  );
  const tripsResult = resolveSettledRows<TripRow>(tripsSettled, "Trip");
  const invoicesResult = resolveSettledRows<InvoiceRow>(invoicesSettled, "Invoice");
  const paymentLinksResult = resolveSettledRows<PaymentLinkRow>(
    paymentLinksSettled,
    "Payment",
  );
  const invoicePaymentsResult = resolveSettledRows<InvoicePaymentRow>(
    invoicePaymentsSettled,
    "Payment",
  );
  const profilesResult = resolveSettledRows<ProfileRow>(profilesSettled, "Profile");

  const itineraryIds = Array.from(
    new Set(
      tripsResult.rows
        .map((trip) => trip.itinerary_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const itinerariesSettled = await Promise.allSettled([
    itineraryIds.length
      ? params.adminClient
          .from("itineraries")
          .select("id,trip_title,destination")
          .in("id", itineraryIds)
          .limit(Math.max(itineraryIds.length, 1))
      : Promise.resolve({ data: [], error: null }),
  ]);

  const itinerariesResult = resolveSettledRows<ItineraryRow>(
    itinerariesSettled[0],
    "Itinerary",
  );

  const followUpsResult = await fetchFollowUps({
    client: params.adminClient,
    userIds: profilesResult.rows.map((profile) => profile.id),
    tripIds: tripsResult.rows.map((trip) => trip.id),
    windowStartIso: followUpWindowStart,
    windowEndIso: followUpWindowEnd,
  });

  const health = buildHealth({
    proposals: proposalsResult,
    trips: tripsResult,
    invoices: invoicesResult,
    payments: {
      rows: [...paymentLinksResult.rows, ...invoicePaymentsResult.rows],
      health:
        paymentLinksResult.health === "failed" || invoicePaymentsResult.health === "failed"
          ? "failed"
          : "ok",
      message:
        paymentLinksResult.message || invoicePaymentsResult.message || null,
    },
    followUps: followUpsResult,
    profiles: profilesResult,
    itineraries: itinerariesResult,
  });

  const clientMap = buildClientMap(profilesResult.rows);
  const decoratedTrips = decorateTrips(
    tripsResult.rows,
    itinerariesResult.rows,
    clientMap,
  );

  const series = buildSeries(
    params.range,
    proposalsResult.rows,
    decoratedTrips,
    invoicesResult.rows,
    paymentLinksResult.rows,
    invoicePaymentsResult.rows,
    clientMap,
  );

  const pipeline = buildPipelineSummary(proposalsResult.rows);
  const actionQueue = buildActionQueue({
    proposals: proposalsResult.rows,
    trips: decoratedTrips,
    invoices: invoicesResult.rows,
    followUps: followUpsResult.rows,
    now,
  });

  const totalBookedValue = series.reduce(
    (sum, point) => sum + Number(point.bookedValue || 0),
    0,
  );
  const totalCashCollected = series.reduce(
    (sum, point) => sum + Number(point.cashCollected || 0),
    0,
  );
  const totalTripCount = series.reduce(
    (sum, point) => sum + Number(point.tripCount || 0),
    0,
  );

  const openPipelineValue = proposalsResult.rows
    .filter((proposal) => isOpenProposal(proposal))
    .reduce((sum, proposal) => sum + getProposalValue(proposal), 0);
  const openProposalCount = proposalsResult.rows.filter((proposal) =>
    isOpenProposal(proposal),
  ).length;

  const overdueInvoices = invoicesResult.rows.filter((invoice) =>
    isOverdueInvoice(invoice, now),
  );
  const overdueAmount = overdueInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.balance_amount || 0),
    0,
  );

  const upcomingDepartures = decoratedTrips.filter((trip) => {
    if (!isActiveTripStatus(trip.status)) return false;
    const startDate = safeDate(trip.start_date);
    if (!startDate) return false;
    const daysOut =
      (startOfUtcDay(startDate).getTime() - startOfUtcDay(now).getTime()) /
      (1000 * 60 * 60 * 24);
    return daysOut >= 0 && daysOut <= 7;
  }).length;

  const proposalsInWindow = proposalsResult.rows.filter((proposal) => {
    const eventIso = getBusinessEventIso(proposal.created_at, proposal.updated_at);
    return isInRange(eventIso, params.range);
  });
  const proposalWins = proposalsInWindow.filter((proposal) =>
    getProposalLifecycle(proposal) === "won",
  ).length;
  const proposalLosses = proposalsInWindow.filter((proposal) =>
    getProposalLifecycle(proposal) === "lost",
  ).length;

  const tripsInWindow = decoratedTrips.filter((trip) => {
    const eventIso = getBusinessEventIso(trip.created_at, trip.updated_at);
    return isInRange(eventIso, params.range);
  });
  const wonTripsInWindow = tripsInWindow.filter((trip) =>
    hasWonTripStatus(trip.status),
  ).length;

  const winRate =
    getResolvedWinRate(proposalWins, proposalLosses) ??
    getFallbackTripWinRate(wonTripsInWindow, tripsInWindow.length);

  const kpis: DashboardKpis = {
    bookedValue:
      health.sources.proposals === "failed" && health.sources.trips === "failed"
        ? null
        : Number(totalBookedValue.toFixed(2)),
    cashCollected:
      health.sources.payments === "failed" && health.sources.invoices === "failed"
        ? null
        : Number(totalCashCollected.toFixed(2)),
    openPipelineValue:
      health.sources.proposals === "failed"
        ? null
        : Number(openPipelineValue.toFixed(2)),
    overdueAmount:
      health.sources.invoices === "failed"
        ? null
        : Number(overdueAmount.toFixed(2)),
    overdueInvoices:
      health.sources.invoices === "failed" ? null : overdueInvoices.length,
    departureCount:
      health.sources.trips === "failed" ? null : upcomingDepartures,
    winRate,
    openProposalCount:
      health.sources.proposals === "failed" ? null : openProposalCount,
    wins:
      health.sources.proposals === "failed" && health.sources.trips === "failed"
        ? null
        : proposalWins > 0
          ? proposalWins
          : wonTripsInWindow,
    followUpsDue:
      health.sources.followUps === "failed"
        ? null
        : actionQueue.summary.followUpsDue,
  };

  const revenueNarrative: string[] = [];
  if (totalBookedValue > 0) {
    revenueNarrative.push(
      `Booked value in this window is ${formatCompactINR(totalBookedValue)} across ${totalTripCount} trip${totalTripCount === 1 ? "" : "s"}.`,
    );
  }
  if (totalCashCollected > 0) {
    revenueNarrative.push(
      `Collected cash is ${formatCompactINR(totalCashCollected)} from paid invoices and payment links.`,
    );
  }
  if (openPipelineValue > 0) {
    revenueNarrative.push(
      `Open pipeline still holds ${formatCompactINR(openPipelineValue)} of proposal value awaiting conversion.`,
    );
  }
  if (revenueNarrative.length === 0) {
    revenueNarrative.push(
      "No booked or collected activity landed in the selected window yet.",
    );
  }

  const overview: DashboardOverview = {
    generatedAt: new Date().toISOString(),
    health,
    actionQueue: {
      total: actionQueue.items.length,
      summary: actionQueue.summary,
      items: actionQueue.items,
    },
    briefing: {
      sentence: buildBriefingSentence({
        queue: {
          total: actionQueue.items.length,
          summary: actionQueue.summary,
          items: actionQueue.items,
        },
        overdueAmount,
      }),
    },
    kpis,
    revenue: {
      defaultMetric: "booked",
      totals: {
        bookedValue: Number(totalBookedValue.toFixed(2)),
        cashCollected: Number(totalCashCollected.toFixed(2)),
        tripCount: totalTripCount,
        openPipelineValue: Number(openPipelineValue.toFixed(2)),
      },
      series,
      narrative: revenueNarrative,
    },
    customerPulse: {
      proposalCount:
        health.sources.proposals === "failed" ? null : proposalsInWindow.length,
      winRate,
      wins:
        health.sources.proposals === "failed" && health.sources.trips === "failed"
          ? null
          : proposalWins > 0
            ? proposalWins
            : wonTripsInWindow,
      followUpsDue:
        health.sources.followUps === "failed"
          ? null
          : actionQueue.summary.followUpsDue,
    },
    pipeline,
    scorecard: buildScorecard({
      revenue: {
        defaultMetric: "booked",
        totals: {
          bookedValue: Number(totalBookedValue.toFixed(2)),
          cashCollected: Number(totalCashCollected.toFixed(2)),
          tripCount: totalTripCount,
          openPipelineValue: Number(openPipelineValue.toFixed(2)),
        },
        series,
        narrative: revenueNarrative,
      },
      kpis,
      actionQueue: {
        total: actionQueue.items.length,
        summary: actionQueue.summary,
        items: actionQueue.items,
      },
    }),
    aiInsights: buildAiInsights({
      kpis,
      pipeline,
      actionQueue: {
        total: actionQueue.items.length,
        summary: actionQueue.summary,
        items: actionQueue.items,
      },
      revenue: {
        defaultMetric: "booked",
        totals: {
          bookedValue: Number(totalBookedValue.toFixed(2)),
          cashCollected: Number(totalCashCollected.toFixed(2)),
          tripCount: totalTripCount,
          openPipelineValue: Number(openPipelineValue.toFixed(2)),
        },
        series,
        narrative: revenueNarrative,
      },
      dataFootprint:
        proposalsResult.rows.length +
        decoratedTrips.length +
        invoicesResult.rows.length +
        followUpsResult.rows.length,
    }),
    calendarPreview: buildCalendarPreview({
      proposals: proposalsResult.rows,
      trips: decoratedTrips,
      invoices: invoicesResult.rows,
      followUps: followUpsResult.rows,
      now,
      health,
    }),
    lastComputedAt: new Date().toISOString(),
  };

  return overview;
}
