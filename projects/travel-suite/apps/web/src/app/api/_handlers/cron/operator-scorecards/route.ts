import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { deliverMonthlyOperatorScorecards } from "@/lib/admin/operator-scorecard-delivery";
import { authorizeCronRequest } from "@/lib/security/cron-auth";

export async function POST(request: NextRequest) {
  try {
    const cronAuth = await authorizeCronRequest(request);
    let authorized = cronAuth.authorized;

    if (!authorized) {
      const admin = await requireAdmin(request, { requireOrganization: false });
      authorized = admin.ok && admin.isSuperAdmin;
    }

    if (!authorized) {
      return apiError("Unauthorized", 401);
    }

    const organizationId = request.nextUrl.searchParams.get("organizationId") || undefined;
    const monthKey = request.nextUrl.searchParams.get("month") || undefined;
    const force = request.nextUrl.searchParams.get("force") === "1";

    const result = await deliverMonthlyOperatorScorecards({
      organizationId,
      monthKey,
      force,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("[/api/cron/operator-scorecards:POST] failed:", error);
    return NextResponse.json(
      { error: "Failed to generate operator scorecards" },
      { status: 500 },
    );
  }
}
