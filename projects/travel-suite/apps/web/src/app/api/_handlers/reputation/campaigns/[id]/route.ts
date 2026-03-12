import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { createClient } from "@/lib/supabase/server";
import { REPUTATION_REVIEW_CAMPAIGN_SELECT } from "@/lib/reputation/selects";
import type { Database } from "@/lib/supabase/database.types";
import { safeErrorMessage } from "@/lib/security/safe-error";

type CampaignRow = Database["public"]["Tables"]["reputation_review_campaigns"]["Row"];

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

    const { data: campaignData, error } = await supabase
      .from("reputation_review_campaigns")
      .select(REPUTATION_REVIEW_CAMPAIGN_SELECT)
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .maybeSingle();
    const campaign = campaignData as unknown as CampaignRow | null;

    if (error) {
      throw error;
    }

    if (!campaign) {
      return apiError("Campaign not found", 404);
    }

    return NextResponse.json({ campaign });
  } catch (error: unknown) {
    const message = safeErrorMessage(error, "Request failed");
    console.error("Error fetching reputation campaign:", error);
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
      "name",
      "status",
      "trigger_event",
      "trigger_delay_hours",
      "target_rating_minimum",
      "promoter_threshold",
      "passive_threshold",
      "promoter_action",
      "promoter_review_url",
      "detractor_action",
      "channel_sequence",
      "whatsapp_template_name",
      "email_template_id",
      "nps_question",
      "nps_followup_question",
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

    const { data: campaignData, error } = await supabase
      .from("reputation_review_campaigns")
      .update(updateData as Database['public']['Tables']['reputation_review_campaigns']['Update'])
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .select(REPUTATION_REVIEW_CAMPAIGN_SELECT)
      .single();
    const campaign = campaignData as unknown as CampaignRow | null;

    if (error) {
      throw error;
    }

    if (!campaign) {
      return apiError("Campaign not found", 404);
    }

    return NextResponse.json({ campaign });
  } catch (error: unknown) {
    const message = safeErrorMessage(error, "Request failed");
    console.error("Error updating reputation campaign:", error);
    return apiError(message, 500);
  }
}

export async function DELETE(
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

    const { data: campaignData, error } = await supabase
      .from("reputation_review_campaigns")
      .update({ status: "archived" })
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .select(REPUTATION_REVIEW_CAMPAIGN_SELECT)
      .single();
    const campaign = campaignData as unknown as CampaignRow | null;

    if (error) {
      throw error;
    }

    if (!campaign) {
      return apiError("Campaign not found", 404);
    }

    return NextResponse.json({ campaign });
  } catch (error: unknown) {
    const message = safeErrorMessage(error, "Request failed");
    console.error("Error archiving reputation campaign:", error);
    return apiError(message, 500);
  }
}
