import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { REPUTATION_REVIEW_SELECT } from "@/lib/reputation/selects";
import type { Database } from "@/lib/supabase/database.types";
import { safeErrorMessage } from "@/lib/security/safe-error";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    const { data: reviewData, error } = await supabase
      .from("reputation_reviews")
      .select(REPUTATION_REVIEW_SELECT)
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .single();
    const review = reviewData as unknown as Database["public"]["Tables"]["reputation_reviews"]["Row"] | null;

    if (error) {
      throw error;
    }

    if (!review) {
      return apiError("Review not found", 404);
    }

    return NextResponse.json({ review });
  } catch (error: unknown) {
    const message = safeErrorMessage(error, "Request failed");
    console.error("Error fetching reputation review:", error);
    return apiError(message, 500);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    const body = await req.json();

    const allowedFields = [
      "is_featured",
      "requires_attention",
      "attention_reason",
      "response_status",
      "response_text",
    ] as const;

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return apiError("No valid fields to update", 400);
    }

    // Auto-set response metadata when marking as responded
    if (updateData.response_status === "responded") {
      updateData.response_posted_at = new Date().toISOString();
      updateData.response_posted_by = user.id;
    }

    const { data: reviewData, error } = await supabase
      .from("reputation_reviews")
      .update(updateData as Database['public']['Tables']['reputation_reviews']['Update'])
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .select(REPUTATION_REVIEW_SELECT)
      .single();
    const review = reviewData as unknown as Database["public"]["Tables"]["reputation_reviews"]["Row"] | null;

    if (error) {
      throw error;
    }

    if (!review) {
      return apiError("Review not found", 404);
    }

    revalidateTag("reputation", "max");
    return NextResponse.json({ review });
  } catch (error: unknown) {
    const message = safeErrorMessage(error, "Request failed");
    console.error("Error updating reputation review:", error);
    return apiError(message, 500);
  }
}
