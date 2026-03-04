import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";

const DELIVERY_LIST_RATE_LIMIT_MAX = 120;
const DELIVERY_LIST_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

function attachRateLimitHeaders(
    response: NextResponse,
    rateLimit: Awaited<ReturnType<typeof enforceRateLimit>>
): NextResponse {
    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
    response.headers.set("retry-after", String(retryAfterSeconds));
    response.headers.set("x-ratelimit-limit", String(rateLimit.limit));
    response.headers.set("x-ratelimit-remaining", String(rateLimit.remaining));
    response.headers.set("x-ratelimit-reset", String(rateLimit.reset));
    return response;
}

function resolveScopedOrganizationId(
    admin: Extract<Awaited<ReturnType<typeof requireAdmin>>, { ok: true }>,
    req: NextRequest
): { organizationId: string } | { error: NextResponse } {
    const { searchParams } = new URL(req.url);
    const requestedOrganizationId = (searchParams.get("organization_id") || "").trim();

    if (admin.isSuperAdmin) {
        if (!requestedOrganizationId) {
            return {
                error: NextResponse.json(
                    { error: "organization_id query param is required for super admin" },
                    { status: 400 }
                ),
            };
        }
        return { organizationId: requestedOrganizationId };
    }

    if (!admin.organizationId) {
        return {
            error: NextResponse.json({ error: "Admin organization not configured" }, { status: 400 }),
        };
    }

    if (requestedOrganizationId && requestedOrganizationId !== admin.organizationId) {
        return {
            error: NextResponse.json({ error: "Cannot access another organization scope" }, { status: 403 }),
        };
    }

    return { organizationId: admin.organizationId };
}

export async function GET(req: NextRequest) {
    try {
        const admin = await requireAdmin(req, { requireOrganization: false });
        if (!admin.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: admin.response.status || 401 });
        }

        const scopedOrganization = resolveScopedOrganizationId(admin, req);
        if ("error" in scopedOrganization) {
            return scopedOrganization.error;
        }

        const rateLimit = await enforceRateLimit({
            identifier: admin.userId,
            limit: DELIVERY_LIST_RATE_LIMIT_MAX,
            windowMs: DELIVERY_LIST_RATE_LIMIT_WINDOW_MS,
            prefix: "api:admin:notifications:delivery:list",
        });
        if (!rateLimit.success) {
            const response = NextResponse.json(
                { error: "Too many delivery listing requests. Please retry later." },
                { status: 429 }
            );
            return attachRateLimitHeaders(response, rateLimit);
        }

        const { searchParams } = new URL(req.url);
        const status = (searchParams.get("status") || "all").trim();
        const channel = (searchParams.get("channel") || "all").trim();
        const tripId = (searchParams.get("trip_id") || "").trim();
        const failedOnly = (searchParams.get("failed_only") || "false").toLowerCase() === "true";
        const limit = Math.min(Math.max(Number(searchParams.get("limit") || 50), 1), 200);
        const offset = Math.max(Number(searchParams.get("offset") || 0), 0);

        let query = admin.adminClient
            .from("notification_delivery_status")
            .select(
                "id,queue_id,trip_id,user_id,recipient_phone,recipient_type,channel,provider,provider_message_id,notification_type,status,attempt_number,error_message,metadata,sent_at,failed_at,created_at",
                { count: "exact" }
            )
            .eq("organization_id", scopedOrganization.organizationId);

        if (status !== "all") {
            query = query.eq("status", status);
        }

        if (channel !== "all") {
            query = query.eq("channel", channel);
        }

        if (tripId) {
            query = query.eq("trip_id", tripId);
        }

        if (failedOnly) {
            query = query.in("status", ["failed", "retrying"]);
        }

        const { data, count, error } = await query
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        const { data: groupedRows, error: groupedError } = await admin.adminClient
            .from("notification_delivery_status")
            .select("status")
            .eq("organization_id", scopedOrganization.organizationId)
            .order("created_at", { ascending: false })
            .limit(1000);

        if (groupedError) {
            return NextResponse.json({ error: groupedError.message }, { status: 400 });
        }

        const countsByStatus = (groupedRows || []).reduce<Record<string, number>>((acc, row) => {
            const key = row.status || "unknown";
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        return NextResponse.json({
            rows: data || [],
            pagination: {
                total: count || 0,
                limit,
                offset,
            },
            summary: {
                counts_by_status: countsByStatus,
            },
            scoped_organization_id: scopedOrganization.organizationId,
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
