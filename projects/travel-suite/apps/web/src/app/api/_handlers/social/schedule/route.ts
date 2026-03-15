import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { ZodError } from "zod";

import { createClient } from "@/lib/supabase/server";
import { safeErrorMessage } from "@/lib/security/safe-error";
import {
  ensureSocialPostForReview,
  getConnectionsForPlatforms,
  getCurrentOrganizationId,
  replaceReviewQueueItems,
  resolveScheduledFor,
  scheduleReviewSchema,
} from "@/lib/social/review-queue.server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const body = scheduleReviewSchema.parse(await req.json());
    const organizationId = await getCurrentOrganizationId(supabase, user.id);
    const scheduledFor = resolveScheduledFor(body);
    const post = await ensureSocialPostForReview({
      supabase,
      organizationId,
      userId: user.id,
      status: "scheduled",
      input: body,
    });
    const connections = await getConnectionsForPlatforms({
      supabase,
      organizationId,
      platforms: body.platforms,
    });
    const queuedItems = await replaceReviewQueueItems({
      supabase,
      postId: post.id,
      connections,
      scheduledFor,
    });

    return NextResponse.json({
      success: true,
      workflow: "pending_review",
      message: "Scheduled for manual review",
      data: {
        postId: post.id,
        queuedPlatforms: queuedItems.map((item) => item.platform),
        queueIds: queuedItems.map((item) => item.id),
        scheduledFor,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
    }

    const message = safeErrorMessage(error, "Request failed");
    const status =
      message === "Unauthorized"
        ? 401
        : message === "Post not found"
          ? 404
          : message === "No organization found" ||
              message === "No connected social platforms found" ||
              message === "Invalid review schedule"
            ? 400
            : 500;

    console.error("Error scheduling social post for review:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
