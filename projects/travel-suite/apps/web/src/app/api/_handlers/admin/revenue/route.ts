import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { resolveAdminDateRange } from "@/lib/admin/date-range";
import { requireAdmin } from "@/lib/auth/admin";
import { resolveScopedOrgWithDemo } from "@/lib/auth/demo-org-resolver";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildDashboardClientMap,
  buildDashboardRevenueSeries,
  buildDashboardTripStatusMap,
  decorateDashboardTrips,
  isOpenDashboardProposal,
  resolveDashboardProposalRows,
} from "@/lib/admin/dashboard-business-state";
import { loadDashboardSourceBundle } from "@/lib/admin/dashboard-selectors";
import { logError } from "@/lib/observability/logger";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;
    if (!admin.organizationId) {
      return apiError("Organization not configured", 400);
    }

    const organizationId = resolveScopedOrgWithDemo(req, admin.organizationId);
    if (!organizationId) {
      return apiError("Organization not configured", 400);
    }

    const range = resolveAdminDateRange(req.nextUrl.searchParams, "90d");
    const db = createAdminClient();
    const followUpWindowStart = new Date(range.fromDate);
    followUpWindowStart.setUTCDate(followUpWindowStart.getUTCDate() - 7);
    const followUpWindowEnd = new Date(range.toDate);
    followUpWindowEnd.setUTCDate(followUpWindowEnd.getUTCDate() + 8);

    const [sources, activeOperatorsResult] = await Promise.all([
      loadDashboardSourceBundle({
        client: db,
        organizationId,
        followUpWindowStartIso: followUpWindowStart.toISOString(),
        followUpWindowEndIso: followUpWindowEnd.toISOString(),
      }),
      db
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .neq("role", "client"),
    ]);

    if (activeOperatorsResult.error) throw activeOperatorsResult.error;

    const resolvedRange = {
      preset: "custom",
      from: range.fromDate.toISOString().slice(0, 10),
      to: range.toDate.toISOString().slice(0, 10),
      fromDate: range.fromDate,
      toDate: range.toDate,
      fromISO: range.fromISO,
      toISO: range.toDate.toISOString(),
      toExclusiveISO: range.toExclusiveISO,
      dayCount: Math.max(
        1,
        Math.round(
          (range.toDate.getTime() - range.fromDate.getTime()) / (1000 * 60 * 60 * 24),
        ) + 1,
      ),
      label: range.label,
      granularity: range.granularity,
    } as const;

    const clientMap = buildDashboardClientMap(sources.profiles.rows);
    const tripStatusMap = buildDashboardTripStatusMap(sources.trips.rows);
    const tripRows = decorateDashboardTrips({
      trips: sources.trips.rows,
      itineraries: sources.itineraries.rows,
      clientMap,
    });
    const proposalRows = resolveDashboardProposalRows({
      proposals: sources.proposals.rows,
      tripStatusMap,
      clientMap,
      enforceLinkedTripPresence: sources.trips.health !== "failed",
    });

    const series = buildDashboardRevenueSeries({
      range: resolvedRange,
      proposals: proposalRows,
      trips: tripRows,
      invoices: sources.invoices.rows,
      paymentLinks: sources.paymentLinks.rows,
      invoicePayments: sources.invoicePayments.rows,
    });

    const recoveredRevenue = series.reduce(
      (sum, point) => sum + Number(point.cashCollected ?? point.revenue ?? 0),
      0,
    );

    const totalBookings = tripRows.filter((row) => row.isBooked).length;
    const pendingProposals = proposalRows.filter((row) =>
      isOpenDashboardProposal(row),
    ).length;

    return apiSuccess({
      series,
      totals: {
        recoveredRevenue,
        paidLinks: sources.paymentLinks.rows.filter((row) => row.status === "paid").length,
        activeOperators: activeOperatorsResult.count ?? 0,
        totalBookings,
        pendingProposals,
      },
      range: {
        from: range.fromDate.toISOString().slice(0, 10),
        to: range.toDate.toISOString().slice(0, 10),
        label: range.label,
      },
    });
  } catch (error) {
    logError("[/api/admin/revenue:GET] Unhandled error", error);
    return NextResponse.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
