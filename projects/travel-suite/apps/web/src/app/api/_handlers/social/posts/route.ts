import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { SOCIAL_POST_SELECT } from "@/lib/social/selects";
import { safeErrorMessage } from "@/lib/security/safe-error";
import type { Database } from "@/lib/database.types";

type SocialPostRow = Database["public"]["Tables"]["social_posts"]["Row"];

const CreatePostSchema = z.object({
    template_id: z.string().min(1).optional(),
    template_data: z.record(z.string(), z.unknown()).optional(),
    caption_instagram: z.string().max(2200).optional(),
    caption_facebook: z.string().max(63206).optional(),
    hashtags: z.array(z.string().max(100)).max(30).optional(),
    status: z.enum(["draft", "scheduled", "published", "archived"]).optional(),
    source: z.enum(["manual", "ai", "template"]).optional(),
    rendered_image_url: z.string().url().optional(),
});

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

        const { data: postsData, error } = await supabase
            .from("social_posts")
            .select(SOCIAL_POST_SELECT)
            .eq("organization_id", profile.organization_id)
            .order("created_at", { ascending: false });
        const posts = postsData as unknown as SocialPostRow[] | null;

        if (error) throw error;

        return NextResponse.json({ posts });
    } catch (error: unknown) {
        console.error("Error fetching social posts:", error);
        const message = safeErrorMessage(error, "Request failed");
        return apiError(message, 500);
    }
}

export async function POST(req: Request) {
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

        const rawBody = await req.json();
        const parsed = CreatePostSchema.safeParse(rawBody);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 422 }
            );
        }
        const { template_id, template_data, caption_instagram, caption_facebook, hashtags, status, source, rendered_image_url } = parsed.data;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const insertPayload: any = {
            organization_id: profile.organization_id,
            created_by: user.id,
            template_id: template_id ?? '',
            template_data: template_data ?? {},
            caption_instagram,
            caption_facebook,
            hashtags: hashtags ? JSON.stringify(hashtags) : null,
            status: status || 'draft',
            source: source || 'manual',
            rendered_image_url,
        };
        const { data: postData, error } = await supabase
            .from("social_posts")
            .insert(insertPayload)
            .select(SOCIAL_POST_SELECT)
            .single();
        const post = postData as unknown as SocialPostRow | null;

        if (error) throw error;

        return NextResponse.json({ post });
    } catch (error: unknown) {
        console.error("Error creating social post:", error);
        const message = safeErrorMessage(error, "Request failed");
        return apiError(message, 500);
    }
}
