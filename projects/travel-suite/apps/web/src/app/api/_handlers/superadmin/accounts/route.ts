// GET /api/superadmin/accounts — org-first account operating view.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { listAccounts, type AccountHealthBand, type AccountLifecycleStage, type AccountRiskFilter } from "@/lib/platform/god-accounts";
import { logError } from "@/lib/observability/logger";

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(0, Number(searchParams.get("page") || 0));
    const limit = Math.min(100, Math.max(10, Number(searchParams.get("limit") || 50)));
    const search = searchParams.get("search")?.trim() ?? "";
    const owner = searchParams.get("owner")?.trim() ?? undefined;
    const healthBand = (searchParams.get("health_band")?.trim() ?? "all") as AccountHealthBand | "all";
    const lifecycleStage = (searchParams.get("lifecycle_stage")?.trim() ?? "all") as AccountLifecycleStage | "all";
    const risk = (searchParams.get("risk")?.trim() ?? "all") as AccountRiskFilter;

    try {
        const result = await listAccounts(auth.adminClient as never, {
            page,
            limit,
            search,
            owner: owner === "unowned" ? "unowned" : owner,
            health_band: healthBand,
            lifecycle_stage: lifecycleStage,
            risk,
        });
        return NextResponse.json(result);
    } catch (error) {
        logError("[superadmin/accounts GET]", error);
        return apiError("Failed to load accounts", 500);
    }
}
