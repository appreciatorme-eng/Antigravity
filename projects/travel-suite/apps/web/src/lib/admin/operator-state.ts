import { isLostProposal, isWonProposal, isWonTripStatus } from "@/lib/admin/proposal-outcomes";
import type { ResolvedAdminDateRange } from "@/lib/admin/date-range";
import { monthKeyFromDate } from "@/lib/analytics/adapters";

type ProposalLike = {
  status?: string | null;
  total_price?: number | null;
  client_selected_price?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  viewed_at?: string | null;
  expires_at?: string | null;
  trips?: { status?: string | null } | { status?: string | null }[] | null;
};

type InvoiceLike = {
  status?: string | null;
  balance_amount?: number | null;
  due_date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  paid_at?: string | null;
  total_amount?: number | null;
};

export const OPEN_PROPOSAL_STATUSES = new Set(["draft", "sent", "viewed"]);
export const BOOKED_TRIP_STATUSES = new Set([
  "planned",
  "confirmed",
  "in_progress",
  "active",
  "paid",
  "completed",
]);
export const ACTIVE_TRIP_STATUSES = new Set([
  "planned",
  "confirmed",
  "in_progress",
  "active",
  "paid",
]);

function normalize(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase();
}

export function formatCompactINR(value: number): string {
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(1)}L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(0)}K`;
  return `₹${value.toLocaleString("en-IN")}`;
}

export function formatDateLabel(value: string | null | undefined): string {
  if (!value) return "Date TBD";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Date TBD";
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatCalendarDay(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function startOfUtcDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

export function addUtcDays(value: Date, days: number) {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return startOfUtcDay(next);
}

export function safeDate(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getProposalValue(proposal: ProposalLike): number {
  return Number(proposal.client_selected_price ?? proposal.total_price ?? 0);
}

export function getProposalLifecycle(proposal: ProposalLike): "open" | "won" | "lost" {
  if (isWonProposal(proposal)) return "won";
  if (isLostProposal(proposal)) return "lost";
  return "open";
}

export function isOpenProposal(proposal: ProposalLike): boolean {
  return getProposalLifecycle(proposal) === "open";
}

export function getBusinessEventIso(
  createdAt: string | null | undefined,
  updatedAt?: string | null,
): string | null {
  return updatedAt || createdAt || null;
}

export function getBucketKey(
  value: string | null | undefined,
  granularity: ResolvedAdminDateRange["granularity"],
): string | null {
  const parsed = safeDate(value);
  if (!parsed) return null;
  if (granularity === "day") {
    return parsed.toISOString().slice(0, 10);
  }
  return monthKeyFromDate(parsed.toISOString());
}

export function getBucketLabel(
  key: string,
  granularity: ResolvedAdminDateRange["granularity"],
): string {
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

export function isInRange(
  value: string | null | undefined,
  range: ResolvedAdminDateRange,
): boolean {
  const parsed = safeDate(value);
  if (!parsed) return false;
  return parsed.getTime() >= range.fromDate.getTime() && parsed.getTime() < new Date(range.toExclusiveISO).getTime();
}

export function isBookedTripStatus(status: string | null | undefined): boolean {
  return BOOKED_TRIP_STATUSES.has(normalize(status));
}

export function isActiveTripStatus(status: string | null | undefined): boolean {
  return ACTIVE_TRIP_STATUSES.has(normalize(status));
}

export function isCollectibleInvoice(invoice: InvoiceLike): boolean {
  return Number(invoice.balance_amount || 0) > 0;
}

export function isPaidInvoice(invoice: InvoiceLike): boolean {
  return normalize(invoice.status) === "paid" || Number(invoice.balance_amount || 0) <= 0;
}

export function isOverdueInvoice(invoice: InvoiceLike, now = new Date()): boolean {
  if (!isCollectibleInvoice(invoice)) return false;
  const dueDate = safeDate(invoice.due_date);
  if (!dueDate) return false;
  return dueDate.getTime() < now.getTime();
}

export function isDueSoonInvoice(invoice: InvoiceLike, now = new Date(), days = 7): boolean {
  if (!isCollectibleInvoice(invoice) || isOverdueInvoice(invoice, now)) return false;
  const dueDate = safeDate(invoice.due_date);
  if (!dueDate) return false;
  const cutoff = addUtcDays(startOfUtcDay(now), days);
  return dueDate.getTime() <= cutoff.getTime();
}

export function getInvoicePaidEventIso(invoice: InvoiceLike): string | null {
  return invoice.paid_at || invoice.updated_at || invoice.created_at || null;
}

export function buildRangeBucketKeys(range: ResolvedAdminDateRange): string[] {
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

export function getResolvedWinRate(
  wins: number,
  losses: number,
): number | null {
  const resolved = wins + losses;
  if (resolved <= 0) return null;
  return Number(((wins / resolved) * 100).toFixed(1));
}

export function getFallbackTripWinRate(
  wins: number,
  total: number,
): number | null {
  if (total <= 0) return null;
  return Number(((wins / total) * 100).toFixed(1));
}

export function hasWonTripStatus(status: string | null | undefined): boolean {
  return isWonTripStatus(status);
}
