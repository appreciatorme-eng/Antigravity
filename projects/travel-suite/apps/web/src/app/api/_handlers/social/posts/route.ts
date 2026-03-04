import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("organization_id")
            .eq("id", user.id)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.json({ error: "No organization found" }, { status: 400 });
        }

        const { data: posts, error } = await supabase
            .from("social_posts")
            .select("*")
            .eq("organization_id", profile.organization_id)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return NextResponse.json({ posts });
    } catch (error: any) {
        console.error("Error fetching social posts:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("organization_id")
            .eq("id", user.id)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.json({ error: "No organization found" }, { status: 400 });
        }

        const body = await req.json();
        const { template_id, template_data, caption_instagram, caption_facebook, hashtags, status, source, rendered_image_url } = body;

        const { data: post, error } = await supabase
            .from("social_posts")
            .insert({
                organization_id: profile.organization_id,
                created_by: user.id,
                template_id,
                template_data,
                caption_instagram,
                caption_facebook,
                hashtags,
                status: status || 'draft',
                source: source || 'manual',
                rendered_image_url
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ post });
    } catch (error: any) {
        console.error("Error creating social post:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
