import type { SupabaseClient } from "@supabase/supabase-js";
import type { ResolvedAdminDateRange } from "@/lib/admin/date-range";
import type {
  DashboardAiInsightCard,
  DashboardCalendarPreview,
  DashboardHealth,
  DashboardHealthSourceKey,
  DashboardKpis,
  DashboardOverview,
  DashboardQueueItem,
  DashboardScorecardMetric,
} from "@/lib/admin/dashboard-overview-types";
import {
  buildDashboardClientMap,
  filterDashboardInvoicesByTrip,
  buildDashboardPipelineSummary,
  resolveDashboardDefaultRevenueMetric,
  buildDashboardRevenueSeries,
  buildDashboardTripStatusMap,
  decorateDashboardTrips,
  isOpenDashboardProposal,
  resolveDashboardProposalRows,
  type ProposalBusinessRow,
  type TripBusinessRow,
} from "@/lib/admin/dashboard-business-state";
import { filterCanonicalPipelineProposals } from "@/lib/proposals/pipeline-integrity";
import {
  loadDashboardSourceBundle,
  type AdminQueryClient,
  type FollowUpSelectorRow,
  type InvoiceSelectorRow,
} from "@/lib/admin/dashboard-selectors";
import { safeTitle } from "@/lib/admin/insights";
import {
  addUtcDays,
  formatCalendarDay,
  formatCompactINR,
  formatDateLabel,
  getFallbackTripWinRate,
  getResolvedWinRate,
  isActiveTripStatus,
  isCollectibleInvoice,
  isDueSoonInvoice,
  isOverdueInvoice,
  safeDate,
  startOfUtcDay,
} from "@/lib/admin/operator-state";

function buildActionQueue(params: {
  proposals: ProposalBusinessRow[];
  trips: TripBusinessRow[];
  invoices: InvoiceSelectorRow[];
  followUps: FollowUpSelectorRow[];
  now: Date;
}): {
  summary: DashboardOverview["actionQueue"]["summary"];
  items: DashboardQueueItem[];
} {
  const items: DashboardQueueItem[] = [];
  const canonicalPipelineProposals = filterCanonicalPipelineProposals(params.proposals);

  const overdueInvoices = params.invoices.filter((invoice) =>
    isOverdueInvoice(invoice, params.now),
  );
  const dueSoonInvoices = params.invoices.filter((invoice) =>
    isDueSoonInvoice(invoice, params.now, 7),
  );
  const expiringQuotes = canonicalPipelineProposals.filter((proposal) => {
    if (!isOpenDashboardProposal(proposal)) return false;
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
        (trip.status || "").trim().toLowerCase(),
      )
    );
  });

  const followUpsDue = params.followUps.filter((followUp) => {
    const scheduled = safeDate(followUp.scheduled_for);
    if (!scheduled) return false;
    return (
      scheduled.getTime() <= addUtcDays(startOfUtcDay(params.now), 1).getTime() ||
      (followUp.status || "").trim().toLowerCase() === "failed"
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
      title: `${safeTitle(trip.tripTitle || trip.destination, "Upcoming trip")} needs confirmation`,
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
        (followUp.status || "").trim().toLowerCase() === "failed" ||
        (scheduledAt ? scheduledAt.getTime() < params.now.getTime() : false)
          ? "critical"
          : "warning",
      href: "/admin/notifications",
      actionLabel: "Review follow-up",
      meta:
        (followUp.status || "").trim().toLowerCase() === "failed"
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
  health: DashboardHealth;
}): string {
  const failedCoreSources = (
    ["proposals", "trips", "invoices", "followUps"] as DashboardHealthSourceKey[]
  ).filter((source) => params.health.sources[source] === "failed");

  if (failedCoreSources.length > 0) {
    return `Dashboard data is partially unavailable. Review ${failedCoreSources.join(", ")} before relying on today’s summary.`;
  }

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
  proposals: ProposalBusinessRow[];
  trips: TripBusinessRow[];
  invoices: InvoiceSelectorRow[];
  followUps: FollowUpSelectorRow[];
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
    const day = dayMap.get(formatCalendarDay(startDate));
    if (!day) continue;
    if ((trip.status || "").trim().toLowerCase() !== "cancelled") {
      day.departures += 1;
    }
  }

  for (const invoice of params.invoices) {
    if (!isCollectibleInvoice(invoice) || !invoice.due_date) continue;
    const dueDate = safeDate(invoice.due_date);
    if (!dueDate) continue;
    const day = dayMap.get(formatCalendarDay(dueDate));
    if (day) day.payments += 1;
  }

  for (const proposal of params.proposals) {
    if (!isOpenDashboardProposal(proposal) || !proposal.expires_at) continue;
    const expiresAt = safeDate(proposal.expires_at);
    if (!expiresAt) continue;
    const day = dayMap.get(formatCalendarDay(expiresAt));
    if (day) day.quotes += 1;
  }

  for (const followUp of params.followUps) {
    const scheduled = safeDate(followUp.scheduled_for);
    if (!scheduled) continue;
    const day = dayMap.get(formatCalendarDay(scheduled));
    if (day) day.followUps += 1;
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
  if (params.dataFootprint <= 0) return [];

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
  kpis: DashboardKpis;
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
      current:
        params.kpis.overdueInvoices !== null
          ? String(params.kpis.overdueInvoices)
          : "—",
      delta: null,
    },
    {
      key: "followups",
      label: "Follow-ups Due",
      current:
        params.kpis.followUpsDue !== null
          ? String(params.kpis.followUpsDue)
          : "—",
      delta: null,
    },
  ];
}

export async function buildDashboardOverview(params: {
  adminClient: Pick<SupabaseClient, "from">;
  organizationId: string;
  range: ResolvedAdminDateRange;
}): Promise<DashboardOverview> {
  const now = new Date();
  const followUpWindowStart = addUtcDays(startOfUtcDay(now), -7).toISOString();
  const followUpWindowEnd = addUtcDays(startOfUtcDay(now), 8).toISOString();

  const sources = await loadDashboardSourceBundle({
    client: params.adminClient as AdminQueryClient,
    organizationId: params.organizationId,
    followUpWindowStartIso: followUpWindowStart,
    followUpWindowEndIso: followUpWindowEnd,
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
    range: params.range,
    proposals,
    trips,
    invoices,
    paymentLinks: sources.paymentLinks.rows,
    invoicePayments: sources.invoicePayments.rows,
    commercialPayments: sources.commercialPayments.rows,
  });

  const pipeline = buildDashboardPipelineSummary({
    proposals,
    trips,
    invoices,
    paymentLinks: sources.paymentLinks.rows,
    commercialPayments: sources.commercialPayments.rows,
  });
  const actionQueue = buildActionQueue({
    proposals,
    trips,
    invoices,
    followUps: sources.followUps.rows,
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

  const openProposals = filterCanonicalPipelineProposals(proposals).filter((proposal) =>
    isOpenDashboardProposal(proposal),
  );
  const openPipelineValue = openProposals.reduce(
    (sum, proposal) => sum + proposal.value,
    0,
  );

  const overdueInvoices = invoices.filter((invoice) =>
    isOverdueInvoice(invoice, now),
  );
  const overdueAmount = overdueInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.balance_amount || 0),
    0,
  );

  const upcomingDepartures = trips.filter((trip) => {
    if (!isActiveTripStatus(trip.status)) return false;
    const startDate = safeDate(trip.start_date);
    if (!startDate) return false;
    const daysOut =
      (startOfUtcDay(startDate).getTime() - startOfUtcDay(now).getTime()) /
      (1000 * 60 * 60 * 24);
    return daysOut >= 0 && daysOut <= 7;
  }).length;

  const proposalsInWindow = proposals.filter((proposal) =>
    safeDate(proposal.eventIso) &&
    safeDate(proposal.eventIso)!.getTime() >= params.range.fromDate.getTime() &&
    safeDate(proposal.eventIso)!.getTime() < new Date(params.range.toExclusiveISO).getTime(),
  );
  const proposalWins = proposalsInWindow.filter((proposal) => proposal.lifecycle === "won").length;
  const proposalLosses = proposalsInWindow.filter((proposal) => proposal.lifecycle === "lost").length;

  const tripsInWindow = trips.filter((trip) =>
    safeDate(trip.eventIso) &&
    safeDate(trip.eventIso)!.getTime() >= params.range.fromDate.getTime() &&
    safeDate(trip.eventIso)!.getTime() < new Date(params.range.toExclusiveISO).getTime(),
  );
  const wonTripsInWindow = tripsInWindow.filter((trip) => trip.isWon).length;

  const winRate =
    getResolvedWinRate(proposalWins, proposalLosses) ??
    getFallbackTripWinRate(wonTripsInWindow, tripsInWindow.length);

  const kpis: DashboardKpis = {
    bookedValue:
      sources.health.sources.proposals === "failed" && sources.health.sources.trips === "failed"
        ? null
        : Number(totalBookedValue.toFixed(2)),
    cashCollected:
      sources.health.sources.payments === "failed" && sources.health.sources.invoices === "failed"
        ? null
        : Number(totalCashCollected.toFixed(2)),
    openPipelineValue:
      sources.health.sources.proposals === "failed"
        ? null
        : Number(openPipelineValue.toFixed(2)),
    overdueAmount:
      sources.health.sources.invoices === "failed"
        ? null
        : Number(overdueAmount.toFixed(2)),
    overdueInvoices:
      sources.health.sources.invoices === "failed" ? null : overdueInvoices.length,
    departureCount:
      sources.health.sources.trips === "failed" ? null : upcomingDepartures,
    winRate,
    openProposalCount:
      sources.health.sources.proposals === "failed" ? null : openProposals.length,
    wins:
      sources.health.sources.proposals === "failed" && sources.health.sources.trips === "failed"
        ? null
        : proposalWins > 0
          ? proposalWins
          : wonTripsInWindow,
    followUpsDue:
      sources.health.sources.followUps === "failed"
        ? null
        : actionQueue.summary.followUpsDue,
  };

  const revenueNarrative: string[] = [];
  if (totalBookedValue > 0) {
    revenueNarrative.push(
      `Booked value in this window is ${formatCompactINR(totalBookedValue)} across ${totalTripCount} trip${totalTripCount === 1 ? "" : "s"}.`,
    );
  } else if (totalTripCount > 0) {
    revenueNarrative.push(
      "Trip activity exists in this window, but booked value is only counted once a proposal, invoice, or paid payment link owns that business.",
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

  const actionQueueView = {
    total: actionQueue.items.length,
    summary: actionQueue.summary,
    items: actionQueue.items,
  };

  const revenue = {
    defaultMetric: resolveDashboardDefaultRevenueMetric({
      bookedValue: Number(totalBookedValue.toFixed(2)),
      cashCollected: Number(totalCashCollected.toFixed(2)),
      tripCount: totalTripCount,
    }),
    totals: {
      bookedValue: Number(totalBookedValue.toFixed(2)),
      cashCollected: Number(totalCashCollected.toFixed(2)),
      tripCount: totalTripCount,
      openPipelineValue: Number(openPipelineValue.toFixed(2)),
    },
    series,
    narrative: revenueNarrative,
  };

  return {
    generatedAt: new Date().toISOString(),
    health: sources.health,
    briefing: {
      sentence: buildBriefingSentence({
        queue: actionQueueView,
        overdueAmount,
        health: sources.health,
      }),
    },
    kpis,
    actionQueue: actionQueueView,
    revenue,
    customerPulse: {
      proposalCount:
        sources.health.sources.proposals === "failed" ? null : openProposals.length,
      winRate,
      wins:
        sources.health.sources.proposals === "failed" && sources.health.sources.trips === "failed"
          ? null
          : proposalWins > 0
            ? proposalWins
            : wonTripsInWindow,
      followUpsDue:
        sources.health.sources.followUps === "failed"
          ? null
          : actionQueue.summary.followUpsDue,
    },
    pipeline,
    scorecard: buildScorecard({ kpis }),
    aiInsights: buildAiInsights({
      kpis,
      pipeline,
      actionQueue: actionQueueView,
      revenue,
      dataFootprint:
        proposals.length +
        trips.length +
        invoices.length +
        sources.followUps.rows.length,
    }),
    calendarPreview: buildCalendarPreview({
      proposals,
      trips,
      invoices,
      followUps: sources.followUps.rows,
      now,
      health: sources.health,
    }),
    lastComputedAt: new Date().toISOString(),
  };
}
