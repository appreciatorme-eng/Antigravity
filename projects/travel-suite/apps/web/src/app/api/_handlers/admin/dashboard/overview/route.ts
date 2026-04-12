import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { resolveScopedOrgWithDemo } from "@/lib/auth/demo-org-resolver";
import { resolveAdminDateRange } from "@/lib/admin/date-range";
import { buildDashboardOverview } from "@/lib/admin/dashboard-overview";
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

    const range = resolveAdminDateRange(req.nextUrl.searchParams, "30d");
    const overview = await buildDashboardOverview({
      adminClient: admin.adminClient,
      organizationId,
      range,
    });

    return apiSuccess(overview);
  } catch (error) {
    logError("[/api/admin/dashboard/overview:GET] Unhandled error", error);
    return apiError("Failed to build dashboard overview", 500);
  }
}
