import type { RevenueChartPoint, RevenueChartTripPoint } from "@/components/analytics/RevenueChart";
import type { ResolvedAdminDateRange } from "@/lib/admin/date-range";
import { monthKeyFromDate } from "@/lib/analytics/adapters";
import { isWonProposal } from "@/lib/admin/proposal-outcomes";

type ProposalLike = {
  created_at: string | null;
  updated_at?: string | null;
  status: string | null;
  total_price?: number | null;
  client_selected_price?: number | null;
  trips?: { status?: string | null } | { status?: string | null }[] | null;
};

type TripLike = {
  id?: string;
  created_at: string | null;
  updated_at?: string | null;
  status: string | null;
  start_date?: string | null;
  end_date?: string | null;
  client_name?: string | null;
  trip_title?: string | null;
  destination?: string | null;
};

type PaidLinkLike = {
  amount_paise: number | null;
  paid_at: string | null;
};

type BucketPoint = RevenueChartPoint & {
  proposalCount: number;
  approvalCount: number;
  fallbackRevenue: number;
};

function mapTripToPoint(trip: TripLike): RevenueChartTripPoint {
  return {
    id: trip.id || "",
    title: trip.trip_title || "Untitled trip",
    destination: trip.destination || "Destination pending",
    clientName: trip.client_name || "Client pending",
    status: trip.status || "draft",
    startDate: trip.start_date ?? null,
    endDate: trip.end_date ?? null,
    createdAt: trip.created_at,
  };
}

const BOOKING_STATUSES = new Set(["planned", "confirmed", "in_progress", "active", "completed", "paid"]);

function getBucketKey(value: string | null, granularity: ResolvedAdminDateRange["granularity"]) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  if (granularity === "day") {
    return parsed.toISOString().slice(0, 10);
  }

  return monthKeyFromDate(value);
}

function getBucketLabel(key: string, granularity: ResolvedAdminDateRange["granularity"]) {
  if (granularity === "day") {
    const parsed = new Date(`${key}T00:00:00.000Z`);
    return parsed.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  }

  const parsed = new Date(`${key}-01T00:00:00.000Z`);
  return parsed.toLocaleDateString("en-IN", {
    month: "short",
    timeZone: "UTC",
  });
}

function getActivityDate(createdAt: string | null, updatedAt?: string | null) {
  return updatedAt || createdAt;
}

function getProposalValue(proposal: ProposalLike) {
  return Number(proposal.client_selected_price ?? proposal.total_price ?? 0);
}

function getBucketKeys(range: ResolvedAdminDateRange) {
  const keys: string[] = [];

  if (range.granularity === "day") {
    const cursor = new Date(range.fromDate);
    while (cursor <= range.toDate) {
      keys.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return keys;
  }

  const cursor = new Date(Date.UTC(range.fromDate.getUTCFullYear(), range.fromDate.getUTCMonth(), 1));
  const end = new Date(Date.UTC(range.toDate.getUTCFullYear(), range.toDate.getUTCMonth(), 1));

  while (cursor <= end) {
    keys.push(`${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return keys;
}

export function buildRevenueSeries(
  range: ResolvedAdminDateRange,
  paymentLinks: PaidLinkLike[],
  proposals: ProposalLike[],
  trips: TripLike[],
): RevenueChartPoint[] {
  const buckets = new Map<string, BucketPoint>(
    getBucketKeys(range).map((key) => [
      key,
      {
        monthKey: key,
        label: getBucketLabel(key, range.granularity),
        revenue: 0,
        bookings: 0,
        conversionRate: 0,
        trips: [],
        proposalCount: 0,
        approvalCount: 0,
        fallbackRevenue: 0,
      },
    ]),
  );

  for (const link of paymentLinks) {
    const key = getBucketKey(link.paid_at, range.granularity);
    if (!key || !buckets.has(key)) continue;
    buckets.get(key)!.revenue += Number(link.amount_paise || 0) / 100;
  }

  for (const trip of trips) {
    if (!BOOKING_STATUSES.has((trip.status || "").toLowerCase())) continue;
    const key = getBucketKey(getActivityDate(trip.created_at, trip.updated_at), range.granularity);
    if (!key || !buckets.has(key)) continue;
    const bucket = buckets.get(key)!;
    bucket.bookings += 1;
    if (trip.id) {
      bucket.trips = [...(bucket.trips || []), mapTripToPoint(trip)];
    }
  }

  for (const proposal of proposals) {
    const key = getBucketKey(getActivityDate(proposal.created_at, proposal.updated_at), range.granularity);
    if (!key || !buckets.has(key)) continue;
    const bucket = buckets.get(key)!;
    bucket.proposalCount += 1;
    if (isWonProposal(proposal)) {
      bucket.approvalCount += 1;
      bucket.fallbackRevenue += getProposalValue(proposal);
    }
  }

  return Array.from(buckets.values()).map((bucket) => ({
    monthKey: bucket.monthKey,
    label: bucket.label,
    revenue: Number((bucket.revenue > 0 ? bucket.revenue : bucket.fallbackRevenue).toFixed(2)),
    bookings: bucket.bookings,
    conversionRate:
      bucket.proposalCount > 0
        ? Number(((bucket.approvalCount / bucket.proposalCount) * 100).toFixed(1))
        : 0,
  }));
}
