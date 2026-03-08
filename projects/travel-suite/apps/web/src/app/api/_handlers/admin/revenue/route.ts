import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/database.types";
import { getLastMonthKeys, monthKeyFromDate, monthLabel } from "@/lib/analytics/adapters";
import { requireAdmin } from "@/lib/auth/admin";
import { resolveScopedOrgWithDemo } from "@/lib/auth/demo-org-resolver";

type RevenueSeriesPoint = {
  monthKey: string;
  label: string;
  revenue: number;
  bookings: number;
  conversionRate: number;
};

type PaymentLinkRevenueRow = Pick<
  Database["public"]["Tables"]["payment_links"]["Row"],
  "amount_paise" | "paid_at"
>;

type ProposalRevenueRow = Pick<
  Database["public"]["Tables"]["proposals"]["Row"],
  "created_at" | "status"
>;

type TripRevenueRow = Pick<
  Database["public"]["Tables"]["trips"]["Row"],
  "created_at" | "status"
>;

const APPROVED_PROPOSAL_STATUSES = new Set(["approved", "accepted", "confirmed", "converted"]);
const CLOSED_PROPOSAL_STATUSES = new Set([
  "approved",
  "accepted",
  "confirmed",
  "converted",
  "rejected",
  "expired",
  "cancelled",
]);
const BOOKING_TRIP_STATUSES = new Set(["planned", "confirmed", "in_progress", "active", "completed"]);

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;
    if (!admin.organizationId) {
      return NextResponse.json({ error: "Organization not configured" }, { status: 400 });
    }

    const organizationId = resolveScopedOrgWithDemo(req, admin.organizationId);
    if (!organizationId) {
      return NextResponse.json({ error: "Organization not configured" }, { status: 400 });
    }

    const db = admin.adminClient;
    const yearAgoIso = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

    const [paidLinksResult, proposalsResult, tripsResult, activeOperatorsResult] = await Promise.all([
      db
        .from("payment_links")
        .select("amount_paise, paid_at")
        .eq("organization_id", organizationId)
        .eq("status", "paid")
        .gte("paid_at", yearAgoIso),
      db
        .from("proposals")
        .select("created_at, status")
        .eq("organization_id", organizationId)
        .gte("created_at", yearAgoIso),
      db
        .from("trips")
        .select("created_at, status")
        .eq("organization_id", organizationId)
        .gte("created_at", yearAgoIso),
      db
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .neq("role", "client"),
    ]);

    if (paidLinksResult.error) throw paidLinksResult.error;
    if (proposalsResult.error) throw proposalsResult.error;
    if (tripsResult.error) throw tripsResult.error;
    if (activeOperatorsResult.error) throw activeOperatorsResult.error;

    const paymentLinkRows = (paidLinksResult.data || []) as PaymentLinkRevenueRow[];
    const proposalRows = (proposalsResult.data || []) as ProposalRevenueRow[];
    const tripRows = (tripsResult.data || []) as TripRevenueRow[];

    const monthKeys = getLastMonthKeys(12);
    const monthMap = new Map<string, RevenueSeriesPoint>(
      monthKeys.map((monthKey) => [
        monthKey,
        {
          monthKey,
          label: monthLabel(monthKey),
          revenue: 0,
          bookings: 0,
          conversionRate: 0,
        },
      ]),
    );
    const proposalCounts = new Map<string, number>();
    const proposalApprovals = new Map<string, number>();

    for (const link of paymentLinkRows) {
      const monthKey = monthKeyFromDate(link.paid_at);
      if (!monthKey) continue;
      const monthPoint = monthMap.get(monthKey);
      if (!monthPoint) continue;
      monthPoint.revenue += Number(link.amount_paise || 0) / 100;
    }

    for (const trip of tripRows) {
      if (!BOOKING_TRIP_STATUSES.has((trip.status || "").toLowerCase())) continue;
      const monthKey = monthKeyFromDate(trip.created_at);
      if (!monthKey) continue;
      const monthPoint = monthMap.get(monthKey);
      if (!monthPoint) continue;
      monthPoint.bookings += 1;
    }

    for (const proposal of proposalRows) {
      const monthKey = monthKeyFromDate(proposal.created_at);
      if (!monthKey) continue;
      proposalCounts.set(monthKey, (proposalCounts.get(monthKey) || 0) + 1);
      if (APPROVED_PROPOSAL_STATUSES.has((proposal.status || "").toLowerCase())) {
        proposalApprovals.set(monthKey, (proposalApprovals.get(monthKey) || 0) + 1);
      }
    }

    const series = monthKeys.map((monthKey) => {
      const monthPoint = monthMap.get(monthKey)!;
      const proposals = proposalCounts.get(monthKey) || 0;
      const approvals = proposalApprovals.get(monthKey) || 0;
      return {
        ...monthPoint,
        conversionRate: proposals > 0 ? Number(((approvals / proposals) * 100).toFixed(1)) : 0,
      };
    });

    const recoveredRevenue = Number(
      paymentLinkRows.reduce((sum, row) => sum + Number(row.amount_paise || 0), 0) / 100,
    );
    const totalBookings = tripRows.filter((row) =>
      BOOKING_TRIP_STATUSES.has((row.status || "").toLowerCase()),
    ).length;
    const pendingProposals = proposalRows.filter((row) => {
      const status = (row.status || "draft").toLowerCase();
      return !CLOSED_PROPOSAL_STATUSES.has(status);
    }).length;

    return NextResponse.json({
      series,
      totals: {
        recoveredRevenue,
        paidLinks: paymentLinkRows.length,
        activeOperators: activeOperatorsResult.count ?? 0,
        totalBookings,
        pendingProposals,
      },
    });
  } catch (error) {
    console.error("[/api/admin/revenue:GET] Unhandled error:", error);
    return NextResponse.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
