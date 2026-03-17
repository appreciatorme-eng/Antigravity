import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { logError } from "@/lib/observability/logger";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return apiError("Unauthorized", 401);
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("organization_id")
            .eq("id", user.id)
            .single();

        if (!profile?.organization_id) {
            return apiError("No organization found", 400);
        }

        const { data: queueData, error } = await supabase
            .from("social_post_queue")
            .select(`
                id,
                platform,
                scheduled_for,
                status,
                post_id,
                social_posts!inner (
                    id,
                    template_id,
                    template_data,
                    caption_instagram,
                    rendered_image_url,
                    organization_id
                )
            `)
            .eq("social_posts.organization_id", profile.organization_id)
            .in("status", ["pending", "processing", "pending_review"])
            .gte("scheduled_for", new Date().toISOString())
            .order("scheduled_for", { ascending: true });

        if (error) throw error;

        return NextResponse.json({ scheduled: queueData || [] });
    } catch (error: unknown) {
        logError("Error fetching scheduled posts", error);
        const message = safeErrorMessage(error, "Request failed");
        return apiError(message, 500);
    }
}
