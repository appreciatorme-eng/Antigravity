import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { logError } from "@/lib/observability/logger";

const TEMPLATE_DETAILS_RATE_LIMIT_MAX = 120;
const TEMPLATE_DETAILS_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

interface ItineraryTemplateRow {
    id: string;
    title: string;
    destination: string;
    duration_days: number;
    budget_range: string;
    theme: string;
    description?: string | null;
    template_data: unknown;
    usage_count: number;
    rating_avg: number;
    rating_count: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

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

export async function GET(req: Request, { params }: { params: Promise<{ id?: string }> }) {
    try {
        const admin = await requireAdmin(req, { requireOrganization: false });
        if (!admin.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: admin.response.status || 401 });
        }

        const rateLimit = await enforceRateLimit({
            identifier: admin.userId,
            limit: TEMPLATE_DETAILS_RATE_LIMIT_MAX,
            windowMs: TEMPLATE_DETAILS_RATE_LIMIT_WINDOW_MS,
            prefix: "api:admin:templates:details",
        });
        if (!rateLimit.success) {
            const response = NextResponse.json(
                { error: "Too many admin template detail requests. Please retry later." },
                { status: 429 }
            );
            return attachRateLimitHeaders(response, rateLimit);
        }

        const { pathname } = new URL(req.url);
        const pathId = pathname.split("/").pop();
        const { id: paramId } = await params;
        const templateId = (paramId || pathId || "").trim();

        if (!templateId || templateId === "undefined") {
            return NextResponse.json({ error: "Missing template id" }, { status: 400 });
        }

        const uuidRegex = /^[0-9a-fA-F-]{36}$/;
        if (!uuidRegex.test(templateId)) {
            return NextResponse.json({ error: "Invalid template id" }, { status: 400 });
        }

        // itinerary_templates table not yet in generated types - using type assertion
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: templateData, error: templateError } = await (admin.adminClient as any)
            .from("itinerary_templates")
            .select(`
                id,
                title,
                destination,
                duration_days,
                budget_range,
                theme,
                description,
                template_data,
                usage_count,
                rating_avg,
                rating_count,
                is_active,
                created_at,
                updated_at
            `)
            .eq("id", templateId)
            .eq("is_active", true)
            .single() as { data: ItineraryTemplateRow | null; error: unknown };

        if (templateError || !templateData) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        return NextResponse.json({
            template: templateData,
        });
    } catch (error) {
        logError("Error fetching template details", error);
        return NextResponse.json({ error: safeErrorMessage(error, "Request failed") }, { status: 500 });
    }
}
