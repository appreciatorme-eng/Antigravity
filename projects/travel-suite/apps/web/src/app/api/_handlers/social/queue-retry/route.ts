import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { logError } from "@/lib/observability/logger";
import { z } from "zod";

const queueRetrySchema = z.object({
  queueId: z.string().uuid(),
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

    const body = queueRetrySchema.parse(await req.json());

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return apiError("No organization found", 400);
    }

    // Verify queue item exists and belongs to user's organization
    const { data: queueItem, error: fetchError } = await supabase
      .from("social_post_queue")
      .select(
        `
        id,
        status,
        social_posts!inner (
          organization_id
        )
      `
      )
      .eq("id", body.queueId)
      .eq("social_posts.organization_id", profile.organization_id)
      .single();

    if (fetchError || !queueItem) {
      return apiError("Queue item not found", 404);
    }

    // Only allow retry for failed items
    if (queueItem.status !== "failed") {
      return apiError("Can only retry failed items", 400);
    }

    // Reset to pending status
    const { data: updatedItem, error: updateError } = await supabase
      .from("social_post_queue")
      .update({
        status: "pending",
        error_message: null,
        attempts: 0,
        scheduled_for: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.queueId)
      .select("id, status, scheduled_for")
      .single();

    if (updateError || !updatedItem) {
      throw new Error("Failed to retry queue item");
    }

    return NextResponse.json({
      success: true,
      message: "Queue item reset to pending",
      data: updatedItem,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    logError("Error retrying queue item", error);
    const message = safeErrorMessage(error, "Request failed");
    return apiError(message, 500);
  }
}
