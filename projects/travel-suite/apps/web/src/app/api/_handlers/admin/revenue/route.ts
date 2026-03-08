import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/database.types";
import { buildRevenueSeries } from "@/lib/admin/dashboard-metrics";
import { resolveAdminDateRange } from "@/lib/admin/date-range";
import { requireAdmin } from "@/lib/auth/admin";
import { resolveScopedOrgWithDemo } from "@/lib/auth/demo-org-resolver";

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
    const range = resolveAdminDateRange(req.nextUrl.searchParams, "90d");

    const [paidLinksResult, proposalsResult, tripsResult, activeOperatorsResult] = await Promise.all([
      db
        .from("payment_links")
        .select("amount_paise, paid_at")
        .eq("organization_id", organizationId)
        .eq("status", "paid")
        .gte("paid_at", range.fromISO)
        .lt("paid_at", range.toExclusiveISO),
      db
        .from("proposals")
        .select("created_at, status")
        .eq("organization_id", organizationId)
        .gte("created_at", range.fromISO)
        .lt("created_at", range.toExclusiveISO),
      db
        .from("trips")
        .select("created_at, status")
        .eq("organization_id", organizationId)
        .gte("created_at", range.fromISO)
        .lt("created_at", range.toExclusiveISO),
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
    const series = buildRevenueSeries(range, paymentLinkRows, proposalRows, tripRows);

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
      range: {
        from: range.from,
        to: range.to,
        label: range.label,
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
