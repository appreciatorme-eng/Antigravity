import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logError } from "@/lib/observability/logger";
import { listOrgActivityEventFeed } from "@/lib/platform/org-memory";

function cleanText(value: string | null): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ orgId: string }> },
) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { orgId } = await params;
    const limitRaw = Number(request.nextUrl.searchParams.get("limit"));
    const limit = Number.isFinite(limitRaw) ? limitRaw : 25;
    const cursor = cleanText(request.nextUrl.searchParams.get("cursor"));
    const source = cleanText(request.nextUrl.searchParams.get("source"));
    const eventType = cleanText(request.nextUrl.searchParams.get("event_type"));
    const search = cleanText(request.nextUrl.searchParams.get("search"));

    try {
        const result = await listOrgActivityEventFeed(auth.adminClient as never, {
            orgId,
            limit,
            cursor,
            source,
            eventType,
            search,
        });
        return NextResponse.json(result);
    } catch (error) {
        logError("[superadmin/accounts/:orgId/activity GET]", error);
        return apiError("Failed to load organization activity", 500);
    }
}
