import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { generateDailyOpsBrief } from "@/lib/platform/business-os";
import { logError } from "@/lib/observability/logger";

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    try {
        const brief = await generateDailyOpsBrief(auth.adminClient as never, auth.userId);
        return NextResponse.json({ brief });
    } catch (error) {
        logError("[superadmin/ai/daily-brief GET]", error);
        return apiError("Failed to generate AI daily brief", 500);
    }
}
