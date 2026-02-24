import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { sanitizeText } from "@/lib/security/sanitize";
import { captureOperationalMetric } from "@/lib/observability/metrics";
import {
    getRequestContext,
    getRequestId,
    logError,
    logEvent,
} from "@/lib/observability/logger";

const supabaseAdmin = createAdminClient();

async function getAuthContext(req: Request) {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
        const { data: authData } = await supabaseAdmin.auth.getUser(token);
        if (authData?.user) {
            const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("role, organization_id")
                .eq("id", authData.user.id)
                .single();
            return { user: authData.user, profile };
        }
    }

    const serverClient = await createServerClient();
    const { data: { user } } = await serverClient.auth.getUser();
    if (user) {
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("role, organization_id")
            .eq("id", user.id)
            .single();
        return { user, profile };
    }
    return { user: null, profile: null };
}

function withRequestId(body: unknown, requestId: string, init?: ResponseInit) {
    const payload =
        body && typeof body === "object" && !Array.isArray(body)
            ? { ...(body as Record<string, unknown>), request_id: requestId }
            : body;
    const response = NextResponse.json(payload, init);
    response.headers.set("x-request-id", requestId);
    return response;
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const startedAt = Date.now();
    const requestId = getRequestId(req);
    const requestContext = getRequestContext(req, requestId);
    try {
        const { id: targetOrgId } = await context.params;
        const { user, profile } = await getAuthContext(req);
        if (!user || !profile || !profile.organization_id) {
            logEvent("warn", "Marketplace reviews list unauthorized", requestContext);
            return withRequestId({ error: "Unauthorized" }, requestId, { status: 401 });
        }

        const { data: targetProfile } = await supabaseAdmin
            .from("marketplace_profiles")
            .select("organization_id")
            .eq("organization_id", targetOrgId)
            .eq("is_verified", true)
            .eq("verification_status", "verified")
            .maybeSingle();

        if (!targetProfile) {
            return withRequestId([], requestId, { status: 200 });
        }

        const { data, error } = await supabaseAdmin
            .from("marketplace_reviews")
            .select(`
                *,
                reviewer:organizations!reviewer_org_id(name, logo_url)
            `)
            .eq("target_org_id", targetOrgId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        const durationMs = Date.now() - startedAt;
        const reviewsCount = Array.isArray(data) ? data.length : 0;
        logEvent("info", "Marketplace reviews fetched", {
            ...requestContext,
            user_id: user.id,
            target_org_id: targetOrgId,
            reviews_count: reviewsCount,
            durationMs,
        });
        void captureOperationalMetric("api.marketplace.reviews.list", {
            request_id: requestId,
            user_id: user.id,
            target_org_id: targetOrgId,
            reviews_count: reviewsCount,
            duration_ms: durationMs,
        });
        return withRequestId(data || [], requestId);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        logError("Marketplace reviews list failed", error, requestContext);
        void captureOperationalMetric("api.marketplace.reviews.list.error", {
            request_id: requestId,
            error: message,
        });
        return withRequestId({ error: message }, requestId, { status: 500 });
    }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const startedAt = Date.now();
    const requestId = getRequestId(req);
    const requestContext = getRequestContext(req, requestId);
    try {
        const { id } = await context.params;
        const targetOrgId = sanitizeText(id, { maxLength: 120 });
        if (!targetOrgId) {
            return withRequestId({ error: "Invalid organization id" }, requestId, { status: 400 });
        }
        const { user, profile } = await getAuthContext(req);
        if (!user || !profile) {
            logEvent("warn", "Marketplace review create unauthorized", requestContext);
            return withRequestId({ error: "Unauthorized" }, requestId, { status: 401 });
        }

        const reviewerOrgId = profile.organization_id;

        if (!reviewerOrgId) {
            return withRequestId({ error: "Reviewer must belong to an organization" }, requestId, { status: 400 });
        }

        if (reviewerOrgId === targetOrgId) {
            return withRequestId({ error: "You cannot review your own organization" }, requestId, { status: 400 });
        }

        const { data: targetProfile } = await supabaseAdmin
            .from("marketplace_profiles")
            .select("organization_id")
            .eq("organization_id", targetOrgId)
            .eq("is_verified", true)
            .eq("verification_status", "verified")
            .maybeSingle();

        if (!targetProfile) {
            return withRequestId({ error: "Operator not available in marketplace" }, requestId, { status: 404 });
        }

        const body = await req.json().catch(() => ({}));
        const ratingRaw = (body as { rating?: unknown }).rating;
        const rating = Number(ratingRaw);
        const comment = sanitizeText((body as { comment?: unknown }).comment, {
            maxLength: 2000,
            preserveNewlines: true,
        });

        if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
            return withRequestId({ error: "Rating must be between 1 and 5" }, requestId, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from("marketplace_reviews")
            .insert({
                reviewer_org_id: reviewerOrgId,
                target_org_id: targetOrgId,
                rating,
                comment: comment || null,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        const durationMs = Date.now() - startedAt;
        logEvent("info", "Marketplace review created", {
            ...requestContext,
            user_id: user.id,
            reviewer_org_id: reviewerOrgId,
            target_org_id: targetOrgId,
            rating,
            durationMs,
        });
        void captureOperationalMetric("api.marketplace.reviews.create", {
            request_id: requestId,
            user_id: user.id,
            reviewer_org_id: reviewerOrgId,
            target_org_id: targetOrgId,
            rating,
            duration_ms: durationMs,
        });
        return withRequestId(data, requestId);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        logError("Marketplace review create failed", error, requestContext);
        void captureOperationalMetric("api.marketplace.reviews.create.error", {
            request_id: requestId,
            error: message,
        });
        return withRequestId({ error: message }, requestId, { status: 500 });
    }
}
