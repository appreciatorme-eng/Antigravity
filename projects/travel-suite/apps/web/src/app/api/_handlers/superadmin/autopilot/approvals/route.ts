import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { getAutopilotApprovals, type AutopilotApprovalStatus } from "@/lib/platform/business-os";
import { logError } from "@/lib/observability/logger";

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const status = (request.nextUrl.searchParams.get("status")?.trim() ?? "pending") as AutopilotApprovalStatus | "all";
    const limit = Math.min(120, Math.max(10, Number(request.nextUrl.searchParams.get("limit") || 60)));

    try {
        const approvals = await getAutopilotApprovals(auth.adminClient as never, auth.userId, { status, limit });
        return NextResponse.json({
            generated_at: new Date().toISOString(),
            status,
            approvals,
        });
    } catch (error) {
        logError("[superadmin/autopilot/approvals GET]", error);
        return apiError("Failed to load approval queue", 500);
    }
}
