import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { resolveScopedOrgWithDemo } from "@/lib/auth/demo-org-resolver";
import { getLastMonthKeys, monthKeyFromDate, monthLabel } from "@/lib/analytics/adapters";

/* eslint-disable @typescript-eslint/no-explicit-any */

const APPROVED_PROPOSAL_STATUSES = new Set(["approved", "accepted", "confirmed"]);
const ACTIVE_TRIP_STATUSES = new Set(["active", "in_progress", "planned", "confirmed"]);
const BOOKING_TRIP_STATUSES = new Set(["planned", "confirmed", "in_progress", "active", "completed"]);

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;
    if (!admin.organizationId) {
      return NextResponse.json({ error: "Organization not configured" }, { status: 400 });
    }

    const orgId = resolveScopedOrgWithDemo(req, admin.organizationId);
    const db = admin.adminClient as any;
    const yearAgoISO = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

    const [
      driversResult,
      clientsResult,
      tripsResult,
      notificationsResult,
      proposalsResult,
      invoicesResult,
      tripSeriesResult,
      recentTripsResult,
      recentNotifiesResult,
      pendingNotificationsResult,
      marketplaceResult,
    ] = await Promise.all([
      db
        .from("external_drivers")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId),
      db
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId),
      db
        .from("trips")
        .select("id, status", { count: "exact" })
        .eq("organization_id", orgId),
      db
        .from("notification_queue")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      db
        .from("proposals")
        .select("created_at, status")
        .eq("organization_id", orgId)
        .gte("created_at", yearAgoISO),
      db
        .from("invoices")
        .select("created_at, total_amount, status")
        .eq("organization_id", orgId)
        .gte("created_at", yearAgoISO),
      db
        .from("trips")
        .select("created_at, status")
        .eq("organization_id", orgId)
        .gte("created_at", yearAgoISO),
      db
        .from("trips")
        .select("id, status, created_at, itineraries(trip_title, destination)")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(5),
      db
        .from("notification_logs")
        .select("id, title, body, sent_at, status")
        .eq("organization_id", orgId)
        .order("sent_at", { ascending: false })
        .limit(5),
      db
        .from("notification_queue")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      db
        .from("marketplace_listing_views")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId),
    ]);

    const tripRows = (tripsResult.data || []) as Array<{ id: string; status: string | null }>;
    const activeTrips = tripRows.filter((t: any) =>
      ACTIVE_TRIP_STATUSES.has((t.status || "").toLowerCase())
    ).length;

    const monthKeys = getLastMonthKeys(12);
    const monthMap = new Map(
      monthKeys.map((mk) => [
        mk,
        { monthKey: mk, label: monthLabel(mk), revenue: 0, bookings: 0, proposals: 0, conversions: 0, conversionRate: 0 },
      ])
    );

    for (const invoice of (invoicesResult.data || []) as any[]) {
      if ((invoice.status || "").toLowerCase() !== "paid") continue;
      const mk = monthKeyFromDate(invoice.created_at);
      if (!mk) continue;
      const pt = monthMap.get(mk);
      if (pt) pt.revenue += Number(invoice.total_amount || 0);
    }

    for (const trip of (tripSeriesResult.data || []) as any[]) {
      if (!BOOKING_TRIP_STATUSES.has((trip.status || "").toLowerCase())) continue;
      const mk = monthKeyFromDate(trip.created_at);
      if (!mk) continue;
      const pt = monthMap.get(mk);
      if (pt) pt.bookings += 1;
    }

    for (const proposal of (proposalsResult.data || []) as any[]) {
      const mk = monthKeyFromDate(proposal.created_at);
      if (!mk) continue;
      const pt = monthMap.get(mk);
      if (!pt) continue;
      pt.proposals += 1;
      if (APPROVED_PROPOSAL_STATUSES.has((proposal.status || "").toLowerCase())) {
        pt.conversions += 1;
      }
    }

    const series = monthKeys
      .map((mk) => monthMap.get(mk))
      .filter(Boolean)
      .map((row: any) => ({
        ...row,
        conversionRate: row.proposals > 0 ? Number(((row.conversions / row.proposals) * 100).toFixed(1)) : 0,
      }));

    const activities: any[] = [];

    for (const trip of (recentTripsResult.data || []) as any[]) {
      const itinerary = Array.isArray(trip.itineraries) ? trip.itineraries[0] : trip.itineraries;
      activities.push({
        id: trip.id,
        type: "trip",
        title: itinerary?.trip_title || "New Trip",
        description: `Trip to ${itinerary?.destination || "Unknown Location"}`,
        timestamp: trip.created_at || new Date().toISOString(),
        status: trip.status || "draft",
      });
    }

    for (const notif of (recentNotifiesResult.data || []) as any[]) {
      activities.push({
        id: notif.id,
        type: "notification",
        title: notif.title || "System Alert",
        description: notif.body || "Notification dispatched to client",
        timestamp: notif.sent_at || new Date().toISOString(),
        status: notif.status || "sent",
      });
    }

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const { data: operatorProfile } = await db
      .from("profiles")
      .select("full_name")
      .eq("id", admin.userId)
      .maybeSingle();
    const operatorName = operatorProfile?.full_name?.split(" ")[0] || "there";

    return NextResponse.json({
      stats: {
        totalDrivers: Number(driversResult.count || 0),
        totalClients: Number(clientsResult.count || 0),
        activeTrips,
        pendingNotifications: Number(pendingNotificationsResult.count || 0),
        marketplaceViews: Number(marketplaceResult.count || 0),
        marketplaceInquiries: 0,
        conversionRate: "0.0",
      },
      activities: activities.slice(0, 8),
      series,
      operatorName,
    });
  } catch (error) {
    console.error("[/api/admin/dashboard/stats:GET] Unhandled error:", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
