import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { authorizeCronRequest } from "@/lib/security/cron-auth";
import { runSlackApprovalPoller } from "@/lib/platform/slack-approval-poller";
import { logError } from "@/lib/observability/logger";

export async function POST(request: NextRequest) {
    const cronAuth = await authorizeCronRequest(request);
    let authorized = cronAuth.authorized;

    if (!authorized) {
        const admin = await requireSuperAdmin(request);
        authorized = admin.ok;
    }

    if (!authorized) return apiError("Unauthorized", 401);

    try {
        const result = await runSlackApprovalPoller();
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        logError("[autopilot/slack-poll POST]", error);
        return apiError("Slack poll failed", 500);
    }
}
