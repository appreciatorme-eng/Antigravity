import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { createClient } from "@/lib/supabase/server";
import { REPUTATION_REVIEW_CAMPAIGN_SELECT } from "@/lib/reputation/selects";
import { safeErrorMessage } from "@/lib/security/safe-error";
import type { CampaignType } from "@/lib/reputation/types";
import type { Database } from "@/lib/database.types";

type CampaignRow = Database["public"]["Tables"]["reputation_review_campaigns"]["Row"];

const VALID_CAMPAIGN_TYPES: CampaignType[] = [
  "post_trip",
  "mid_trip_checkin",
  "manual_blast",
  "nps_survey",
];

export async function GET() {
  try {
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

    const { data: campaignsData, error } = await supabase
      .from("reputation_review_campaigns")
      .select(REPUTATION_REVIEW_CAMPAIGN_SELECT)
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });
    const campaigns = campaignsData as unknown as CampaignRow[] | null;

    if (error) {
      throw error;
    }

    return NextResponse.json({ campaigns: campaigns ?? [] });
  } catch (error: unknown) {
    const message = safeErrorMessage(error, "Request failed");
    console.error("Error fetching reputation campaigns:", error);
    return apiError(message, 500);
  }
}

export async function POST(req: Request) {
  try {
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

    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return apiError("name is required", 400);
    }

    if (
      !body.campaign_type ||
      !VALID_CAMPAIGN_TYPES.includes(body.campaign_type)
    ) {
      return NextResponse.json(
        {
          error: `campaign_type must be one of: ${VALID_CAMPAIGN_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const insertData = {
      organization_id: profile.organization_id,
      name: body.name.trim(),
      campaign_type: body.campaign_type,
      status: "active" as const,
      trigger_event: body.trigger_event || "trip_completed",
      trigger_delay_hours: body.trigger_delay_hours ?? 24,
      target_rating_minimum: body.target_rating_minimum ?? 0,
      promoter_threshold: body.promoter_threshold ?? 9,
      passive_threshold: body.passive_threshold ?? 7,
      promoter_action: body.promoter_action || "google_review_link",
      promoter_review_url: body.promoter_review_url || null,
      detractor_action: body.detractor_action || "internal_feedback",
      channel_sequence: body.channel_sequence || ["whatsapp"],
      whatsapp_template_name: body.whatsapp_template_name || null,
      email_template_id: body.email_template_id || null,
      nps_question:
        body.nps_question || "How likely are you to recommend us to a friend?",
      nps_followup_question:
        body.nps_followup_question || "What could we do better?",
      stats_sent: 0,
      stats_opened: 0,
      stats_completed: 0,
      stats_reviews_generated: 0,
    };

    const { data: campaignData, error } = await supabase
      .from("reputation_review_campaigns")
      .insert(insertData)
      .select(REPUTATION_REVIEW_CAMPAIGN_SELECT)
      .single();
    const campaign = campaignData as unknown as CampaignRow | null;

    if (error) {
      throw error;
    }

    return NextResponse.json({ campaign });
  } catch (error: unknown) {
    const message = safeErrorMessage(error, "Request failed");
    console.error("Error creating reputation campaign:", error);
    return apiError(message, 500);
  }
}
