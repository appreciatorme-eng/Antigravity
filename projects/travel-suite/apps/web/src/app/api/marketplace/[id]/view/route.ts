import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeText } from "@/lib/security/sanitize";
import { captureOperationalMetric } from "@/lib/observability/metrics";
import { jsonWithRequestId as withRequestId } from "@/lib/api/response";
import {
    getRequestContext,
    getRequestId,
    logError,
    logEvent,
} from "@/lib/observability/logger";

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const startedAt = Date.now();
    const requestId = getRequestId(request);
    const requestContext = getRequestContext(request, requestId);
    const supabase = await createClient();
    const params = await context.params;
    const targetOrgId = sanitizeText(params.id, { maxLength: 120 });
    if (!targetOrgId) {
        return withRequestId({ error: "Invalid organization id" }, requestId, { status: 400 });
    }

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            logEvent("warn", "Marketplace view tracking unauthorized", requestContext);
            return withRequestId({ error: "Unauthorized" }, requestId, { status: 401 });
        }

        const { data: viewerProfile } = await supabase
            .from("profiles")
            .select("organization_id")
            .eq("id", user.id)
            .single();

        if (!viewerProfile?.organization_id) {
            return withRequestId({ error: "Organization not configured" }, requestId, { status: 400 });
        }

        // Resolve target profile_id
        const { data: profile, error: profileError } = await supabase
            .from("marketplace_profiles")
            .select("id")
            .eq("organization_id", targetOrgId)
            .eq("is_verified", true)
            .eq("verification_status", "verified")
            .single();

        if (profileError || !profile) {
            return withRequestId({ error: "Profile not found" }, requestId, { status: 404 });
        }

        const viewerOrgId = viewerProfile.organization_id;

        // Prevent self-views if viewer is same as target
        if (viewerOrgId === targetOrgId) {
            void captureOperationalMetric("api.marketplace.view.track", {
                request_id: requestId,
                user_id: user.id,
                target_org_id: targetOrgId,
                viewer_org_id: viewerOrgId,
                skipped: true,
                reason: "self_view",
            });
            return withRequestId({ skipped: true, reason: "self_view" }, requestId);
        }

        // Record the view
        const { error } = await supabase
            .from("marketplace_profile_views")
            .insert({
                profile_id: profile.id,
                viewer_org_id: viewerOrgId,
                source: "direct" // Could be dynamic from body if needed
            });

        if (error) throw error;

        const durationMs = Date.now() - startedAt;
        logEvent("info", "Marketplace profile view recorded", {
            ...requestContext,
            user_id: user.id,
            target_org_id: targetOrgId,
            viewer_org_id: viewerOrgId,
            durationMs,
        });
        void captureOperationalMetric("api.marketplace.view.track", {
            request_id: requestId,
            user_id: user.id,
            target_org_id: targetOrgId,
            viewer_org_id: viewerOrgId,
            skipped: false,
            duration_ms: durationMs,
        });
        return withRequestId({ success: true }, requestId);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to record marketplace profile view";
        logError("Marketplace view tracking failed", error, requestContext);
        void captureOperationalMetric("api.marketplace.view.track.error", {
            request_id: requestId,
            error: message,
        });
        return withRequestId({ error: message }, requestId, { status: 500 });
    }
}
