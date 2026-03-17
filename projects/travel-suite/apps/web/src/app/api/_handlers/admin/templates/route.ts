import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/security/sanitize";
import { resolveDemoOrg } from "@/lib/auth/demo-org-resolver";

const TEMPLATES_READ_RATE_LIMIT_MAX = 120;
const TEMPLATES_READ_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

function sanitizeSearchTerm(input: string): string {
    const safe = sanitizeText(input, { maxLength: 80 });
    if (!safe) return "";
    // Defang PostgREST filter separators/operators in interpolated search strings.
    return safe.replace(/[%,()]/g, " ").replace(/\s+/g, " ").trim();
}

type AdminContext = Extract<Awaited<ReturnType<typeof requireAdmin>>, { ok: true }>;

function attachRateLimitHeaders(
    response: NextResponse,
    rateLimit: Awaited<ReturnType<typeof enforceRateLimit>>
): NextResponse {
    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
    response.headers.set("retry-after", String(retryAfterSeconds));
    response.headers.set("x-ratelimit-limit", String(rateLimit.limit));
    response.headers.set("x-ratelimit-reset", String(rateLimit.reset));
    return response;
}

function resolveScopedOrgForRead(
    admin: AdminContext,
    req: NextRequest
): { organizationId: string } | { error: NextResponse } {
    const { searchParams } = new URL(req.url);
    const requestedOrganizationId = sanitizeText(searchParams.get("organization_id"), { maxLength: 80 });

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
        return { error: NextResponse.json({ error: "Admin organization not configured" }, { status: 400 }) };
    }

    if (requestedOrganizationId && requestedOrganizationId !== admin.organizationId) {
        return { error: NextResponse.json({ error: "Cannot access another organization scope" }, { status: 403 }) };
    }

    return { organizationId: admin.organizationId };
}

export async function GET(req: NextRequest) {
    try {
        const admin = await requireAdmin(req, { requireOrganization: false });
        if (!admin.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: admin.response.status || 401 });
        }

        const scopedOrg = resolveScopedOrgForRead(admin, req);
        if ("error" in scopedOrg) {
            return scopedOrg.error;
        }

        const demoOverride = resolveDemoOrg(req);
        const effectiveOrgId = demoOverride.isDemoMode && demoOverride.demoOrgId
            ? demoOverride.demoOrgId
            : scopedOrg.organizationId;

        const rateLimit = await enforceRateLimit({
            identifier: admin.userId,
            limit: TEMPLATES_READ_RATE_LIMIT_MAX,
            windowMs: TEMPLATES_READ_RATE_LIMIT_WINDOW_MS,
            prefix: "api:admin:templates:list",
        });
        if (!rateLimit.success) {
            const response = NextResponse.json(
                { error: "Too many admin template list requests. Please retry later." },
                { status: 429 }
            );
            return attachRateLimitHeaders(response, rateLimit);
        }

        const { searchParams } = new URL(req.url);
        const destination = sanitizeSearchTerm(searchParams.get("destination") || "");
        const theme = sanitizeSearchTerm(searchParams.get("theme") || "");
        const budgetRange = sanitizeSearchTerm(searchParams.get("budget_range") || "");
        const durationDays = searchParams.get("duration_days");
        const search = sanitizeSearchTerm(searchParams.get("search") || "");

        let query = admin.adminClient
            .from("itinerary_templates")
            .select(`
                id,
                title,
                destination,
                duration_days,
                budget_range,
                theme,
                description,
                usage_count,
                rating_avg,
                rating_count,
                is_active,
                created_at,
                updated_at,
                published_by_org_id,
                organization_id
            `)
            .eq("is_active", true);

        // Apply filters if provided
        if (destination) {
            query = query.ilike("destination", `%${destination}%`);
        }

        if (theme) {
            query = query.eq("theme", theme);
        }

        if (budgetRange) {
            query = query.eq("budget_range", budgetRange);
        }

        if (durationDays) {
            const duration = parseInt(durationDays, 10);
            if (!isNaN(duration) && duration > 0) {
                query = query.eq("duration_days", duration);
            }
        }

        const { data, error } = await query.order("usage_count", { ascending: false });

        if (error) {
            return NextResponse.json({ error: "Failed to fetch templates" }, { status: 400 });
        }

        // Client-side search filtering if search term provided
        let templates = data || [];
        if (search) {
            const searchLower = search.toLowerCase();
            templates = templates.filter((t) =>
                t.title.toLowerCase().includes(searchLower) ||
                t.destination.toLowerCase().includes(searchLower) ||
                (t.description && t.description.toLowerCase().includes(searchLower))
            );
        }

        return NextResponse.json({ templates }, { status: 200 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: "Internal server error", details: message }, { status: 500 });
    }
}
