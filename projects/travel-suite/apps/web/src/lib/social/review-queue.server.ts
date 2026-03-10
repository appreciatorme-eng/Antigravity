import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/lib/database.types";

type AppSupabaseClient = SupabaseClient<Database>;
type SocialPostInsert = Database["public"]["Tables"]["social_posts"]["Insert"];

const socialPlatformSchema = z.enum(["instagram", "facebook"]);

const baseReviewSubmissionSchema = z.object({
  postId: z.string().uuid().optional(),
  templateId: z.string().min(1).optional(),
  templateData: z.record(z.string(), z.unknown()).optional(),
  caption: z.string().trim().max(2200).optional(),
  platforms: z.array(socialPlatformSchema).min(1),
  reviewWorkflow: z.literal("pending_review").optional(),
});

export const publishReviewSchema = baseReviewSubmissionSchema.refine(
  (value) => Boolean(value.postId || value.templateId),
  {
    message: "Provide either postId or templateId",
    path: ["postId"],
  }
);

export const scheduleReviewSchema = baseReviewSubmissionSchema
  .extend({
    scheduledFor: z.string().optional(),
    scheduleDate: z.string().optional(),
    scheduleTime: z.string().optional(),
  })
  .refine((value) => Boolean(value.postId || value.templateId), {
    message: "Provide either postId or templateId",
    path: ["postId"],
  })
  .refine((value) => Boolean(value.scheduledFor || value.scheduleDate), {
    message: "Provide a schedule date or scheduledFor timestamp",
    path: ["scheduledFor"],
  });

export type PublishReviewInput = z.infer<typeof publishReviewSchema>;
export type ScheduleReviewInput = z.infer<typeof scheduleReviewSchema>;

export async function getCurrentOrganizationId(
  supabase: AppSupabaseClient,
  userId: string
) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .single();

  if (error || !profile?.organization_id) {
    throw new Error("No organization found");
  }

  return profile.organization_id;
}

export async function ensureSocialPostForReview(options: {
  supabase: AppSupabaseClient;
  organizationId: string;
  userId: string;
  status: "ready" | "scheduled";
  input: PublishReviewInput | ScheduleReviewInput;
}) {
  const { supabase, organizationId, userId, input, status } = options;

  const caption = input.caption?.trim() || null;
  const postPatch = {
    caption_instagram: caption,
    caption_facebook: caption,
    status,
  };

  if (input.postId) {
    const { data: existingPost, error: fetchError } = await supabase
      .from("social_posts")
      .select("id")
      .eq("id", input.postId)
      .eq("organization_id", organizationId)
      .single();

    if (fetchError || !existingPost) {
      throw new Error("Post not found");
    }

    const { data: updatedPost, error: updateError } = await supabase
      .from("social_posts")
      .update(postPatch)
      .eq("id", existingPost.id)
      .select("id, organization_id, created_by, template_id, template_data, source, status, caption_instagram, caption_facebook, rendered_image_url, rendered_image_urls, hashtags, created_at, updated_at")
      .single();

    if (updateError || !updatedPost) {
      throw new Error("Failed to update social post");
    }

    return updatedPost;
  }

  const { data: createdPost, error: insertError } = await supabase
    .from("social_posts")
    .insert({
      organization_id: organizationId,
      created_by: userId,
      template_id: input.templateId!,
      template_data: (input.templateData ?? {}) as SocialPostInsert["template_data"],
      source: "manual",
      ...postPatch,
    } satisfies SocialPostInsert)
    .select("id, organization_id, created_by, template_id, template_data, source, status, caption_instagram, caption_facebook, rendered_image_url, rendered_image_urls, hashtags, created_at, updated_at")
    .single();

  if (insertError || !createdPost) {
    throw new Error("Failed to create social post");
  }

  return createdPost;
}

export async function getConnectionsForPlatforms(options: {
  supabase: AppSupabaseClient;
  organizationId: string;
  platforms: Array<z.infer<typeof socialPlatformSchema>>;
}) {
  const { supabase, organizationId, platforms } = options;

  const { data: connections, error } = await supabase
    .from("social_connections")
    .select("id, platform")
    .eq("organization_id", organizationId)
    .in("platform", platforms);

  if (error) {
    throw new Error("Failed to load social connections");
  }

  if (!connections?.length) {
    throw new Error("No connected social platforms found");
  }

  return connections;
}

export async function replaceReviewQueueItems(options: {
  supabase: AppSupabaseClient;
  postId: string;
  connections: Array<{ id: string; platform: string }>;
  scheduledFor: string;
}) {
  const { supabase, postId, connections, scheduledFor } = options;
  const platforms = connections.map((connection) => connection.platform);

  if (platforms.length) {
    const { error: deleteError } = await supabase
      .from("social_post_queue")
      .delete()
      .eq("post_id", postId)
      .in("platform", platforms)
      .in("status", ["pending", "pending_review"]);

    if (deleteError) {
      throw new Error("Failed to reset existing review queue items");
    }
  }

  const queueRows = connections.map((connection) => ({
    post_id: postId,
    platform: connection.platform,
    connection_id: connection.id,
    scheduled_for: scheduledFor,
    status: "pending_review",
    error_message: "Awaiting manual review before platform publishing",
  }));

  const { data: queuedItems, error } = await supabase
    .from("social_post_queue")
    .insert(queueRows)
    .select("id, platform, scheduled_for, status");

  if (error || !queuedItems) {
    throw new Error("Failed to queue social post for review");
  }

  return queuedItems;
}

export function resolveScheduledFor(input: ScheduleReviewInput) {
  const resolved = input.scheduledFor
    ? new Date(input.scheduledFor)
    : new Date(`${input.scheduleDate!}T${input.scheduleTime || "09:00"}:00`);

  if (Number.isNaN(resolved.getTime())) {
    throw new Error("Invalid review schedule");
  }

  return resolved.toISOString();
}
