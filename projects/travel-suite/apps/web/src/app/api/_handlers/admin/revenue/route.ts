import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import type { Database } from "@/lib/database.types";
import { buildRevenueSeries } from "@/lib/admin/dashboard-metrics";
import { resolveAdminDateRange } from "@/lib/admin/date-range";
import { requireAdmin } from "@/lib/auth/admin";
import { resolveScopedOrgWithDemo } from "@/lib/auth/demo-org-resolver";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/observability/logger";

type PaymentLinkRevenueRow = Pick<
  Database["public"]["Tables"]["payment_links"]["Row"],
  "amount_paise" | "paid_at"
>;

type ProposalRevenueRow = Pick<
  Database["public"]["Tables"]["proposals"]["Row"],
  "created_at" | "updated_at" | "status" | "total_price" | "client_selected_price"
> & {
  trips: { status: string | null } | { status: string | null }[] | null;
};

type TripRevenueRow = Pick<
  Database["public"]["Tables"]["trips"]["Row"],
  "id" | "created_at" | "updated_at" | "status" | "start_date" | "end_date"
>;

type JoinedProfile = { full_name: string | null } | { full_name: string | null }[] | null;
type JoinedItinerary = { trip_title: string | null; destination: string | null } | { trip_title: string | null; destination: string | null }[] | null;
type TripRevenueJoinedRow = TripRevenueRow & {
  client_profile: JoinedProfile;
  itineraries: JoinedItinerary;
};

function pickJoined<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] || null;
  return value ?? null;
}

type InvoicePaymentRevenueRow = {
  amount: number;
  payment_date: string;
};

const CLOSED_PROPOSAL_STATUSES = new Set([
  "approved",
  "accepted",
  "confirmed",
  "converted",
  "rejected",
  "expired",
  "cancelled",
]);
const BOOKING_TRIP_STATUSES = new Set(["planned", "confirmed", "in_progress", "active", "completed", "paid"]);

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

    const [paidLinksResult, proposalsResult, tripsResult, activeOperatorsResult, invoicePaymentsResult] =
      await Promise.all([
        db
          .from("payment_links")
          .select("amount_paise, paid_at")
          .eq("organization_id", organizationId)
          .eq("status", "paid")
          .gte("paid_at", range.fromISO)
          .lt("paid_at", range.toExclusiveISO),
        db
          .from("proposals")
          .select("created_at, updated_at, status, total_price, client_selected_price, trips:trip_id(status)")
          .eq("organization_id", organizationId)
          .is("deleted_at", null)
          .or(
            `and(created_at.gte.${range.fromISO},created_at.lt.${range.toExclusiveISO}),and(updated_at.gte.${range.fromISO},updated_at.lt.${range.toExclusiveISO})`,
          ),
        db
          .from("trips")
          .select("id, created_at, updated_at, status, start_date, end_date, client_profile:profiles!trips_client_id_fkey(full_name), itineraries:itinerary_id(trip_title, destination)")
          .eq("organization_id", organizationId)
          .is("deleted_at", null)
          .or(
            `and(created_at.gte.${range.fromISO},created_at.lt.${range.toExclusiveISO}),and(updated_at.gte.${range.fromISO},updated_at.lt.${range.toExclusiveISO})`,
          ),
        db
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId)
          .neq("role", "client"),
        db
          .from("invoice_payments")
          .select("amount, payment_date")
          .eq("organization_id", organizationId)
          .eq("status", "completed")
          .gte("payment_date", range.fromDate.toISOString().slice(0, 10))
          .lte("payment_date", range.toDate.toISOString().slice(0, 10)),
      ]);

    if (proposalsResult.error) throw proposalsResult.error;
    if (tripsResult.error) throw tripsResult.error;
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

    const paymentLinkRows = (paidLinksResult.data || []) as PaymentLinkRevenueRow[];
    const proposalRows = (proposalsResult.data || []) as ProposalRevenueRow[];
    const tripRows = ((tripsResult.data || []) as TripRevenueJoinedRow[]).map((row) => {
      const profile = pickJoined(row.client_profile);
      const itinerary = pickJoined(row.itineraries);
      return {
        id: row.id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        status: row.status,
        start_date: row.start_date,
        end_date: row.end_date,
        client_name: profile?.full_name || null,
        trip_title: itinerary?.trip_title || null,
        destination: itinerary?.destination || null,
      };
    });
    const invoicePaymentRows = (invoicePaymentsResult.data || []) as InvoicePaymentRevenueRow[];

    // Normalize invoice payments → same shape as payment_links for the chart builder
    const normalizedInvoicePayments: PaymentLinkRevenueRow[] = invoicePaymentRows.map((row) => ({
      amount_paise: Math.round(Number(row.amount || 0) * 100),
      paid_at: row.payment_date,
    }));
    const allPaymentRows: PaymentLinkRevenueRow[] = [...paymentLinkRows, ...normalizedInvoicePayments];

    const series = buildRevenueSeries(resolvedRange, allPaymentRows, proposalRows, tripRows);

    const recoveredRevenue = series.reduce((sum, point) => sum + point.revenue, 0);

    const totalBookings = tripRows.filter((row) =>
      BOOKING_TRIP_STATUSES.has((row.status || "").toLowerCase()),
    ).length;
    const pendingProposals = proposalRows.filter((row) => {
      const status = (row.status || "draft").toLowerCase();
      return !CLOSED_PROPOSAL_STATUSES.has(status);
    }).length;

    return apiSuccess({
      series,
      totals: {
        recoveredRevenue,
        paidLinks: paymentLinkRows.length,
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
