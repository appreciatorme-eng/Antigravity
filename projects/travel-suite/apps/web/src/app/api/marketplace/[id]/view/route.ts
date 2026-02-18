import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { id: targetOrgId } = await context.params;

    try {
        // Resolve target profile_id
        const { data: profile, error: profileError } = await supabase
            .from("marketplace_profiles")
            .select("id")
            .eq("organization_id", targetOrgId)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        // Get current user's org if available (optional)
        const { data: { user } } = await supabase.auth.getUser();
        let viewerOrgId = null;

        if (user) {
            const { data: viewerProfile } = await supabase
                .from("profiles")
                .select("organization_id")
                .eq("id", user.id)
                .single();
            viewerOrgId = viewerProfile?.organization_id || null;
        }

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
    } catch (error: any) {
        console.error("Error recording view:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
