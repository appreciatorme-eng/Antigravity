import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const supabase = await createClient();

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Get user's org
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("organization_id")
            .eq("id", user.id)
            .single();
        if (profileError) throw profileError;

        if (!profile?.organization_id) {
            return NextResponse.json({ error: "No organization found" }, { status: 404 });
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
            return NextResponse.json({
                views: 0,
                inquiries: 0,
                conversion_rate: 0,
                recent_views: [],
                recent_inquiries: []
            });
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

        return NextResponse.json({
            views: totalViews,
            inquiries: totalInquiries,
            conversion_rate: conversionRate,
            recent_views: recentViews || [],
            recent_inquiries: recentInquiries || []
        });

    } catch (error: unknown) {
        console.error("Error fetching marketplace stats:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
