import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Polyfill missing Blob dependencies if needed by running in edge or letting node standard blob handle it
export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: profile } = await supabase
            .from("profiles")
            .select("organization_id")
            .eq("id", user.id)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.json({ error: "No org" }, { status: 400 });
        }

        const { dataUrl, filename } = await req.json();

        if (!dataUrl) {
            return NextResponse.json({ error: "Missing dataUrl" }, { status: 400 });
        }

        // Convert base64 to buffer
        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        const storagePath = `${profile.organization_id}/posts/${Date.now()}-${filename}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("social-media")
            .upload(storagePath, buffer, {
                contentType: "image/png",
                upsert: false
            });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from("social-media")
            .getPublicUrl(storagePath);

        // Update the post record with the public URL
        const { data: post, error: updateError } = await supabase
            .from("social_posts")
            .update({ rendered_image_url: publicUrl })
            .eq("id", params.id)
            .eq("organization_id", profile.organization_id)
            .select()
            .single();

        if (updateError) throw updateError;

        return NextResponse.json({ post });
    } catch (error: any) {
        console.error("Render upload error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
