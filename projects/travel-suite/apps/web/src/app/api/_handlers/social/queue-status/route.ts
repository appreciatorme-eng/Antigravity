import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { logError } from "@/lib/observability/logger";
import { z } from "zod";

const queueStatusSchema = z.object({
  queueIds: z.array(z.string().uuid()).min(1),
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const body = queueStatusSchema.parse(await req.json());

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return apiError("No organization found", 400);
    }

    // Fetch queue items with their post data to verify ownership
    const { data: queueItems, error } = await supabase
      .from("social_post_queue")
      .select(
        `
        id,
        platform,
        status,
        error_message,
        platform_post_id,
        platform_post_url,
        scheduled_for,
        attempts,
        social_posts!inner (
          organization_id
        )
      `
      )
      .in("id", body.queueIds)
      .eq("social_posts.organization_id", profile.organization_id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      items: queueItems || [],
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    logError("Error fetching queue status", error);
    const message = safeErrorMessage(error, "Request failed");
    return apiError(message, 500);
  }
}
