import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { buildBusinessOsPayload, runBusinessOpsLoop } from "@/lib/platform/business-os";
import { getClientIpFromRequest, logPlatformAction } from "@/lib/platform/audit";
import { logError } from "@/lib/observability/logger";

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    try {
        const payload = await buildBusinessOsPayload(auth.adminClient as never, auth.userId, { limit: 120 });
        return NextResponse.json({
            generated_at: new Date().toISOString(),
            candidate_count: payload.ops_loop_preview.candidate_count,
            by_kind: payload.ops_loop_preview.by_kind,
            suggestions: payload.ops_loop_preview.suggestions,
        });
    } catch (error) {
        logError("[superadmin/business-os/ops-loop GET]", error);
        return apiError("Failed to preview AI ops loop", 500);
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    try {
        const result = await runBusinessOpsLoop(auth.adminClient as never);
        await logPlatformAction(
            auth.userId,
            "Ran Business OS AI ops loop",
            "org_management",
            {
                candidate_count: result.candidate_count,
                created_count: result.created_count,
                by_kind: result.by_kind,
            },
            getClientIpFromRequest(request),
        );
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        logError("[superadmin/business-os/ops-loop POST]", error);
        return apiError("Failed to run AI ops loop", 500);
    }
}
