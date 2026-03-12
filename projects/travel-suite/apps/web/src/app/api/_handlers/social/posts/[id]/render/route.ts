import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { SOCIAL_POST_SELECT } from "@/lib/social/selects";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type SocialPostRow = Database["public"]["Tables"]["social_posts"]["Row"];

// Polyfill missing Blob dependencies if needed by running in edge or letting node standard blob handle it
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return apiError("Unauthorized", 401);

        const { data: profile } = await supabase
            .from("profiles")
            .select("organization_id")
            .eq("id", user.id)
            .single();

        if (!profile?.organization_id) {
            return apiError("No org", 400);
        }

        const { dataUrl, filename } = await req.json();

        if (!dataUrl) {
            return apiError("Missing dataUrl", 400);
        }

        // Convert base64 to buffer
        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        const storagePath = `${profile.organization_id}/posts/${Date.now()}-${filename}`;

        const { error: uploadError } = await supabase.storage
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
        const { data: postData, error: updateError } = await supabase
            .from("social_posts")
            .update({ rendered_image_url: publicUrl })
            .eq("id", id)
            .eq("organization_id", profile.organization_id)
            .select(SOCIAL_POST_SELECT)
            .single();
        const post = postData as unknown as SocialPostRow | null;

        if (updateError) throw updateError;

        return NextResponse.json({ post });
    } catch (error) {
        console.error("Render upload error:", error);
        return apiError("An internal error occurred", 500);
    }
}
