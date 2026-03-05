import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { resolveScopedOrgWithDemo } from "@/lib/auth/demo-org-resolver";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;
  if (!admin.organizationId) {
    return NextResponse.json({ error: "Organization not configured" }, { status: 400 });
  }

  const orgId = resolveScopedOrgWithDemo(req, admin.organizationId);
  const db = admin.adminClient as any;

  const [driversResult, clientsResult, tripsResult, notificationsResult, revenueResult] =
    await Promise.all([
      db
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .eq("role", "driver"),
      db
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .eq("role", "client"),
      db
        .from("trips")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .in("status", ["pending", "confirmed", "in_progress"]),
      db
        .from("notification_logs")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .eq("status", "pending"),
      db
        .from("trip_service_costs")
        .select("price_amount")
        .eq("organization_id", orgId),
    ]);

  const totalRevenue = (revenueResult.data || []).reduce(
    (sum: number, row: any) => sum + Number(row.price_amount || 0),
    0
  );

  return NextResponse.json({
    totalDrivers: driversResult.count ?? 0,
    totalClients: clientsResult.count ?? 0,
    activeTrips: tripsResult.count ?? 0,
    pendingNotifications: notificationsResult.count ?? 0,
    revenueData: { totalRevenue },
  });
}
