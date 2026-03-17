import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/security/sanitize";
import { resolveDemoOrg, blockDemoMutation } from "@/lib/auth/demo-org-resolver";
import { passesMutationCsrfGuard } from "@/lib/security/admin-mutation-csrf";

const TEMPLATES_READ_RATE_LIMIT_MAX = 120;
const TEMPLATES_READ_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const TEMPLATES_WRITE_RATE_LIMIT_MAX = 60;
const TEMPLATES_WRITE_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

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

        // itinerary_templates table not yet in generated types - using type assertion
        let query = (admin.adminClient as any)
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
        let templates = (data || []) as any[];
        if (search) {
            const searchLower = search.toLowerCase();
            templates = templates.filter((t: any) =>
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

export async function POST(req: NextRequest) {
    try {
        const admin = await requireAdmin(req, { requireOrganization: true });
        if (!admin.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: admin.response.status || 401 });
        }

        if (!admin.organizationId) {
            return NextResponse.json({ error: "Admin organization not configured" }, { status: 400 });
        }

        if (!passesMutationCsrfGuard(req)) {
            return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
        }

        const demoBlock = blockDemoMutation(req);
        if (demoBlock) {
            return demoBlock;
        }

        const rateLimit = await enforceRateLimit({
            identifier: admin.userId,
            limit: TEMPLATES_WRITE_RATE_LIMIT_MAX,
            windowMs: TEMPLATES_WRITE_RATE_LIMIT_WINDOW_MS,
            prefix: "api:admin:templates:create",
        });
        if (!rateLimit.success) {
            const response = NextResponse.json(
                { error: "Too many template publish requests. Please retry later." },
                { status: 429 }
            );
            return attachRateLimitHeaders(response, rateLimit);
        }

        const body = await req.json();
        const itineraryId = sanitizeText(body.itinerary_id, { maxLength: 80 });

        if (!itineraryId) {
            return NextResponse.json({ error: "itinerary_id is required" }, { status: 400 });
        }

        // Fetch the itinerary to verify ownership and get data
        const { data: itinerary, error: itineraryError } = await admin.adminClient
            .from("itineraries")
            .select(`
                id,
                trip_title,
                destination,
                duration_days,
                estimated_budget,
                theme,
                description,
                organization_id,
                daily_plans
            `)
            .eq("id", itineraryId)
            .eq("organization_id", admin.organizationId)
            .single();

        if (itineraryError || !itinerary) {
            return NextResponse.json(
                { error: "Itinerary not found or does not belong to your organization" },
                { status: 404 }
            );
        }

        // Quality gate: verify at least 1 successful trip completion
        const { count, error: tripCountError } = await admin.adminClient
            .from("trips")
            .select("id", { count: "exact", head: true })
            .eq("itinerary_id", itineraryId)
            .eq("status", "completed");

        if (tripCountError) {
            return NextResponse.json(
                { error: "Failed to verify trip completion status" },
                { status: 400 }
            );
        }

        if (!count || count < 1) {
            return NextResponse.json(
                {
                    error: "This itinerary must have at least 1 completed trip before publishing as a template",
                    code: "QUALITY_GATE_NOT_MET",
                },
                { status: 400 }
            );
        }

        // Determine budget range from estimated_budget
        const itineraryData = itinerary as any;
        let budgetRange = "medium";
        if (itineraryData.estimated_budget) {
            if (itineraryData.estimated_budget < 20000) {
                budgetRange = "budget";
            } else if (itineraryData.estimated_budget >= 50000) {
                budgetRange = "luxury";
            }
        }

        // Create the template (anonymized - organization_id is null, published_by_org_id tracks publisher)
        // itinerary_templates table not yet in generated types - using type assertion
        const { data: template, error: createError } = await (admin.adminClient as any)
            .from("itinerary_templates")
            .insert({
                title: itineraryData.trip_title || "Untitled Template",
                destination: itineraryData.destination || "",
                duration_days: itineraryData.duration_days || 1,
                budget_range: budgetRange,
                theme: itineraryData.theme || "general",
                description: itineraryData.description,
                template_data: itineraryData.raw_data,
                published_by_org_id: admin.organizationId,
                is_active: true,
                usage_count: 0,
                rating_count: 0,
                rating_avg: 0,
            })
            .select()
            .single();

        if (createError || !template) {
            return NextResponse.json(
                { error: "Failed to create template", details: createError?.message },
                { status: 400 }
            );
        }

        return NextResponse.json({ template }, { status: 201 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: "Internal server error", details: message }, { status: 500 });
    }
}
