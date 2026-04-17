import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { applyAutopilotApprovalDecision } from "@/lib/platform/business-os";
import { getClientIpFromRequest, logPlatformActionWithTarget } from "@/lib/platform/audit";
import { logError } from "@/lib/observability/logger";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { id } = await params;

    try {
        const result = await applyAutopilotApprovalDecision(auth.adminClient as never, {
            currentUserId: auth.userId,
            approvalId: id,
            decision: "rejected",
        });

        await logPlatformActionWithTarget(
            auth.userId,
            `Rejected autopilot action for org ${result.approval.org_id}`,
            "automation",
            "organization",
            result.approval.org_id,
            {
                approval_id: result.approval.id,
                action_kind: result.approval.action_kind,
            },
            getClientIpFromRequest(request),
        );

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        logError("[superadmin/autopilot/approvals/:id/reject POST]", error);
        return apiError("Failed to reject autopilot action", 500);
    }
}
