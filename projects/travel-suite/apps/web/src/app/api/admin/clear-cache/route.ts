import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { sanitizeText } from "@/lib/security/sanitize";

type ClearCacheRequestParams = {
    destination: string | null;
    clearAll: boolean;
};

function safeHeaderEqual(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left, "utf8");
    const rightBuffer = Buffer.from(right, "utf8");
    if (leftBuffer.length !== rightBuffer.length) return false;
    return timingSafeEqual(leftBuffer, rightBuffer);
}

function isBearerRequest(req: NextRequest): boolean {
    const auth = req.headers.get("authorization") || "";
    return auth.toLowerCase().startsWith("bearer ");
}

function hasTrustedSameOrigin(req: NextRequest): boolean {
    const host = req.headers.get("host");
    if (!host) return false;

    const expectedOrigin = `${req.nextUrl.protocol}//${host}`;
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");

    if (!origin && !referer) return false;

    if (origin && origin !== expectedOrigin) {
        return false;
    }

    if (referer) {
        try {
            const refererOrigin = new URL(referer).origin;
            if (refererOrigin !== expectedOrigin) {
                return false;
            }
        } catch {
            return false;
        }
    }

    return true;
}

function passesMutationCsrfGuard(req: NextRequest): boolean {
    if (isBearerRequest(req)) {
        return true;
    }

    const configuredToken = process.env.ADMIN_MUTATION_CSRF_TOKEN?.trim();
    if (configuredToken) {
        const providedToken = (req.headers.get("x-admin-csrf") || "").trim();
        if (!providedToken) {
            return false;
        }
        return safeHeaderEqual(providedToken, configuredToken);
    }

    return hasTrustedSameOrigin(req);
}

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
    const admin = await requireAdmin(req, { requireOrganization: false });
    if (!admin.ok) {
        return admin.response;
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
            console.error("Cache clear error:", error);
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
        console.error("Cache clear exception:", err);
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
