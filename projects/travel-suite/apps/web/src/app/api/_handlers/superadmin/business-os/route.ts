import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { buildBusinessOsPayload, type BusinessOsFilters } from "@/lib/platform/business-os";
import { logError } from "@/lib/observability/logger";

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const params = request.nextUrl.searchParams;
    const filters: BusinessOsFilters = {
        owner: params.get("owner")?.trim() === "unowned"
            ? "unowned"
            : params.get("owner")?.trim() || undefined,
        health_band: (params.get("health_band")?.trim() ?? "all") as BusinessOsFilters["health_band"],
        lifecycle_stage: (params.get("lifecycle_stage")?.trim() ?? "all") as BusinessOsFilters["lifecycle_stage"],
        risk: (params.get("risk")?.trim() ?? "all") as BusinessOsFilters["risk"],
        search: params.get("search")?.trim() ?? "",
        page: Math.max(0, Number(params.get("page") || 0)),
        limit: Math.min(120, Math.max(20, Number(params.get("limit") || 80))),
        selected_org_id: params.get("selected_org_id")?.trim() || null,
        only_my_accounts: params.get("only_my_accounts") === "true",
        activation_risk: params.get("activation_risk") === "true",
    };

    try {
        const payload = await buildBusinessOsPayload(auth.adminClient as never, auth.userId, filters);
        return NextResponse.json(payload);
    } catch (error) {
        logError("[superadmin/business-os GET]", error);
        return apiError("Failed to load Business OS", 500);
    }
}
