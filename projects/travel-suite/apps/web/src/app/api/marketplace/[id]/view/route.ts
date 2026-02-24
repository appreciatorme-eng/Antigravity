import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
    _request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { id: targetOrgId } = await context.params;

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: viewerProfile } = await supabase
            .from("profiles")
            .select("organization_id")
            .eq("id", user.id)
            .single();

        if (!viewerProfile?.organization_id) {
            return NextResponse.json({ error: "Organization not configured" }, { status: 400 });
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
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        const viewerOrgId = viewerProfile.organization_id;

        // Prevent self-views if viewer is same as target
        if (viewerOrgId === targetOrgId) {
            return NextResponse.json({ skipped: true, reason: "self_view" });
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

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error("Error recording view:", error);
        const message = error instanceof Error ? error.message : "Failed to record marketplace profile view";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
