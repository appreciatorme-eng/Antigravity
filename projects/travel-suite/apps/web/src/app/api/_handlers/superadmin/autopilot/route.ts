import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { buildAutopilotSnapshot } from "@/lib/platform/business-os";
import { logError } from "@/lib/observability/logger";

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    try {
        const payload = await buildAutopilotSnapshot(auth.adminClient as never, auth.userId);
        return NextResponse.json(payload);
    } catch (error) {
        logError("[superadmin/autopilot GET]", error);
        return apiError("Failed to load Autopilot", 500);
    }
}
