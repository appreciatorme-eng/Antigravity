import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { runAutomationEngine } from "@/lib/automation/engine";
import { authorizeCronRequest } from "@/lib/security/cron-auth";
import { logError } from "@/lib/observability/logger";

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

    const result = await runAutomationEngine("scheduled");

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    logError("[/api/cron/automation-processor:POST] failed", error);
    return NextResponse.json(
      { error: "Failed to process automation rules" },
      { status: 500 },
    );
  }
}
