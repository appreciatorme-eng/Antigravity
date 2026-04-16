import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { getBusinessOsAccountDetail } from "@/lib/platform/business-os";
import { logError } from "@/lib/observability/logger";

type Body = {
    org_id?: string;
};

export async function POST(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    let body: Body;
    try {
        body = await request.json() as Body;
    } catch {
        return apiError("Invalid JSON", 400);
    }

    const orgId = body.org_id?.trim();
    if (!orgId) return apiError("org_id is required", 400);

    try {
        const detail = await getBusinessOsAccountDetail(auth.adminClient as never, orgId);
        if (!detail) return apiError("Account not found", 404);

        return NextResponse.json({
            org_id: detail.organization.id,
            recommended_next_step: detail.ai.recommended_next_step,
            rationale: detail.ai.rationale,
            safe_actions: detail.ai.safe_actions,
            guarded_actions: detail.ai.guarded_actions,
        });
    } catch (error) {
        logError("[superadmin/ai/propose-account-action POST]", error);
        return apiError("Failed to generate account action proposal", 500);
    }
}
