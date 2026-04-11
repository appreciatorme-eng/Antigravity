import type { RevenueChartPoint } from "@/components/analytics/RevenueChart";
import type { ResolvedAdminDateRange } from "@/lib/admin/date-range";
import { monthKeyFromDate } from "@/lib/analytics/adapters";
import { isWonProposal } from "@/lib/admin/proposal-outcomes";

type ProposalLike = {
  created_at: string | null;
  status: string | null;
  trips?: { status?: string | null } | { status?: string | null }[] | null;
};

type TripLike = {
  created_at: string | null;
  status: string | null;
};

type PaidLinkLike = {
  amount_paise: number | null;
  paid_at: string | null;
};

type BucketPoint = RevenueChartPoint & {
  proposalCount: number;
  approvalCount: number;
};

const BOOKING_STATUSES = new Set(["planned", "confirmed", "in_progress", "active", "completed"]);

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
        proposalCount: 0,
        approvalCount: 0,
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
    const key = getBucketKey(trip.created_at, range.granularity);
    if (!key || !buckets.has(key)) continue;
    buckets.get(key)!.bookings += 1;
  }

  for (const proposal of proposals) {
    const key = getBucketKey(proposal.created_at, range.granularity);
    if (!key || !buckets.has(key)) continue;
    const bucket = buckets.get(key)!;
    bucket.proposalCount += 1;
    if (isWonProposal(proposal)) {
      bucket.approvalCount += 1;
    }
  }

  return Array.from(buckets.values()).map((bucket) => ({
    monthKey: bucket.monthKey,
    label: bucket.label,
    revenue: Number(bucket.revenue.toFixed(2)),
    bookings: bucket.bookings,
    conversionRate:
      bucket.proposalCount > 0
        ? Number(((bucket.approvalCount / bucket.proposalCount) * 100).toFixed(1))
        : 0,
  }));
}
