import { createClient } from "@/lib/supabase/server";
import { type NextRequest } from "next/server";
import { captureOperationalMetric } from "@/lib/observability/metrics";
import {
    getRequestContext,
    getRequestId,
    logError,
    logEvent,
} from "@/lib/observability/logger";
import { jsonWithRequestId as withRequestId } from "@/lib/api/response";

export async function GET(request: NextRequest) {
    const startedAt = Date.now();
    const requestId = getRequestId(request);
    const requestContext = getRequestContext(request, requestId);
    const supabase = await createClient();

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            logEvent("warn", "Marketplace stats unauthorized", requestContext);
            return withRequestId({ error: "Unauthorized" }, requestId, { status: 401 });
        }

        // 1. Get user's org
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("organization_id")
            .eq("id", user.id)
            .single();
        if (profileError) throw profileError;

        if (!profile?.organization_id) {
            return withRequestId({ error: "No organization found" }, requestId, { status: 404 });
        }

        const orgId = profile.organization_id;

        // 2. Get Marketplace Profile
        const { data: marketProfile, error: marketProfileError } = await supabase
            .from("marketplace_profiles")
            .select("id")
            .eq("organization_id", orgId)
            .single();
        if (marketProfileError) throw marketProfileError;

        if (!marketProfile) {
            // No profile -> no stats
            return withRequestId({
                views: 0,
                inquiries: 0,
                conversion_rate: 0,
                recent_views: [],
                recent_inquiries: []
            }, requestId);
        }

        // 3. Get Views Count
        const { count: viewsCount, error: viewsError } = await supabase
            .from("marketplace_profile_views")
            .select("*", { count: "exact", head: true })
            .eq("profile_id", marketProfile.id);
        if (viewsError) throw viewsError;

        // 4. Get Inquiries Count
        const { count: inquiriesCount, error: inquiriesError } = await supabase
            .from("marketplace_inquiries")
            .select("*", { count: "exact", head: true })
            .eq("receiver_org_id", orgId);
        if (inquiriesError) throw inquiriesError;

        const totalViews = viewsCount || 0;
        const totalInquiries = inquiriesCount || 0;
        const conversionRate = totalViews > 0
            ? ((totalInquiries / totalViews) * 100).toFixed(1)
            : "0.0";

        // 5. Get Recent Views (last 5)
        const { data: recentViews, error: recentViewsError } = await supabase
            .from("marketplace_profile_views")
            .select(`
                viewed_at,
                viewer_org_id,
                organizations:viewer_org_id (
                    name,
                    logo_url
                )
            `)
            .eq("profile_id", marketProfile.id)
            .order("viewed_at", { ascending: false })
            .limit(5);
        if (recentViewsError) throw recentViewsError;

        // 6. Get Recent Inquiries (last 5)
        const { data: recentInquiries, error: recentInquiriesError } = await supabase
            .from("marketplace_inquiries")
            .select(`
                created_at,
                message,
                sender_org_id,
                organizations:sender_org_id (
                    name,
                    logo_url
                )
            `)
            .eq("receiver_org_id", orgId)
            .order("created_at", { ascending: false })
            .limit(5);
        if (recentInquiriesError) throw recentInquiriesError;

        const durationMs = Date.now() - startedAt;
        logEvent("info", "Marketplace stats fetched", {
            ...requestContext,
            user_id: user.id,
            organization_id: orgId,
            views: totalViews,
            inquiries: totalInquiries,
            durationMs,
        });
        void captureOperationalMetric("api.marketplace.stats.get", {
            request_id: requestId,
            user_id: user.id,
            organization_id: orgId,
            views: totalViews,
            inquiries: totalInquiries,
            duration_ms: durationMs,
        });
        return withRequestId({
            views: totalViews,
            inquiries: totalInquiries,
            conversion_rate: conversionRate,
            recent_views: recentViews || [],
            recent_inquiries: recentInquiries || []
        }, requestId);

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        logError("Marketplace stats fetch failed", error, requestContext);
        void captureOperationalMetric("api.marketplace.stats.get.error", {
            request_id: requestId,
            error: message,
        });
        return withRequestId({ error: message }, requestId, { status: 500 });
    }
}
