import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";

import { getSharedCacheStats } from "@/lib/shared-itinerary-cache";
import { requireAdmin } from "@/lib/auth/admin";
import { resolveScopedOrgWithDemo } from "@/lib/auth/demo-org-resolver";
import { logError } from "@/lib/observability/logger";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;
    if (!admin.organizationId) {
      return apiError("Organization not configured", 400);
    }

    const organizationId = resolveScopedOrgWithDemo(req, admin.organizationId);
    const daysParam = Number(req.nextUrl.searchParams.get("days") || "30");
    const days = Number.isFinite(daysParam) && daysParam > 0 ? Math.min(daysParam, 365) : 30;

    const stats = await getSharedCacheStats(days, organizationId);

    return NextResponse.json({
      data: stats ?? {
        totalHits: 0,
        totalMisses: 0,
        hitRate: 0,
        bySource: {},
        topDestinations: {},
      },
      error: null,
    });
  } catch (error) {
    logError("[/api/admin/cache-metrics:GET] Unhandled error", error);
    return NextResponse.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
