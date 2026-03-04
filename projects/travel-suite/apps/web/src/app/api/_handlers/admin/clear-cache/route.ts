import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getRequestContext, getRequestId, logError } from "@/lib/observability/logger";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/security/sanitize";
import { passesMutationCsrfGuard } from "@/lib/security/admin-mutation-csrf";

type ClearCacheRequestParams = {
    destination: string | null;
    clearAll: boolean;
};

const CLEAR_CACHE_MUTATION_RATE_LIMIT_MAX = 20;
const CLEAR_CACHE_MUTATION_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

async function parseClearCacheParams(req: NextRequest): Promise<ClearCacheRequestParams> {
    const searchDestination = sanitizeText(req.nextUrl.searchParams.get("destination"), { maxLength: 80 });
    const searchClearAll = req.nextUrl.searchParams.get("all") === "true";

    if (req.headers.get("content-type")?.includes("application/json")) {
        const body = await req.json().catch(() => null);
        const bodyDestination = sanitizeText(body?.destination, { maxLength: 80 });
        const bodyClearAll = body?.all === true;

        return {
            destination: bodyDestination || searchDestination,
            clearAll: bodyClearAll || searchClearAll,
        };
    }

    return {
        destination: searchDestination,
        clearAll: searchClearAll,
    };
}

async function clearCacheForRequest(req: NextRequest): Promise<NextResponse> {
    const requestId = getRequestId(req);
    const requestContext = getRequestContext(req, requestId);

    const admin = await requireAdmin(req, { requireOrganization: false });
    if (!admin.ok) {
        return admin.response;
    }

    const rateLimit = await enforceRateLimit({
        identifier: admin.userId,
        limit: CLEAR_CACHE_MUTATION_RATE_LIMIT_MAX,
        windowMs: CLEAR_CACHE_MUTATION_RATE_LIMIT_WINDOW_MS,
        prefix: "api:admin:clear-cache:mutate",
    });
    if (!rateLimit.success) {
        return NextResponse.json(
            { error: "Too many cache clear requests. Please retry later." },
            { status: 429 }
        );
    }

    if (!passesMutationCsrfGuard(req)) {
        return NextResponse.json({ error: "CSRF validation failed for admin mutation" }, { status: 403 });
    }

    const { destination, clearAll } = await parseClearCacheParams(req);

    if (admin.isSuperAdmin && !destination && !clearAll) {
        return NextResponse.json(
            { error: "Super admin must pass all=true to clear all cache." },
            { status: 400 }
        );
    }

    if (!admin.isSuperAdmin && !admin.organizationId) {
        return NextResponse.json({ error: "Admin organization not configured" }, { status: 400 });
    }

    try {
        let query = admin.adminClient.from("itinerary_cache").delete();

        if (destination) {
            query = query.ilike("destination", destination);
        }

        if (!admin.isSuperAdmin) {
            const { data: orgUsers, error: orgUsersError } = await admin.adminClient
                .from("profiles")
                .select("id")
                .eq("organization_id", admin.organizationId!);

            if (orgUsersError) {
                return NextResponse.json({ success: false, error: orgUsersError.message }, { status: 500 });
            }

            const orgUserIds = (orgUsers || []).map((row) => row.id).filter(Boolean);
            if (orgUserIds.length === 0) {
                return NextResponse.json({
                    success: true,
                    message: "No users found in organization. Nothing to clear.",
                    clearedCount: 0,
                });
            }

            query = query.in("created_by", orgUserIds);
        } else if (!destination && clearAll) {
            query = query.neq("id", "00000000-0000-0000-0000-000000000000");
        }

        const { data, error } = await query.select("id");

        if (error) {
            logError("Cache clear query failed", error, requestContext);
            return NextResponse.json(
                {
                    success: false,
                    error: error.message,
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: destination ? `Cache cleared for destination: ${destination}` : "Cache cleared",
            clearedCount: data?.length || 0,
        });
    } catch (err: unknown) {
        logError("Cache clear mutation crashed", err, requestContext);
        return NextResponse.json(
            {
                success: false,
                error: err instanceof Error ? err.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json(
        {
            error: "Method not allowed. Use POST /api/admin/clear-cache for cache mutation.",
        },
        {
            status: 405,
            headers: {
                Allow: "POST",
            },
        }
    );
}

export async function POST(req: NextRequest) {
    return clearCacheForRequest(req);
}
