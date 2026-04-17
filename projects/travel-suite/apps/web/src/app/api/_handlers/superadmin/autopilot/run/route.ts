import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { buildAutopilotAuditDetails, buildAutopilotSnapshot, generateDailyOpsBrief, runBusinessDailyAutopilot } from "@/lib/platform/business-os";
import { getClientIpFromRequest, logPlatformAction } from "@/lib/platform/audit";
import { logError } from "@/lib/observability/logger";

export async function POST(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    try {
        const [autopilot, brief] = await Promise.all([
            runBusinessDailyAutopilot(auth.adminClient as never),
            generateDailyOpsBrief(auth.adminClient as never, auth.userId),
        ]);

        await logPlatformAction(
            auth.userId,
            "Autopilot: Manual Business OS run",
            "automation",
            buildAutopilotAuditDetails(autopilot, brief, "manual"),
            getClientIpFromRequest(request),
        );

        const snapshot = await buildAutopilotSnapshot(auth.adminClient as never, auth.userId);
        return NextResponse.json({
            generated_at: new Date().toISOString(),
            result: autopilot,
            brief,
            snapshot,
        }, { status: 201 });
    } catch (error) {
        logError("[superadmin/autopilot/run POST]", error);
        return apiError("Failed to run Autopilot", 500);
    }
}
