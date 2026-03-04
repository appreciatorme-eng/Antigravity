import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CampaignType } from "@/lib/reputation/types";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: campaigns, error } = await (supabase as any)
      .from("reputation_review_campaigns")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ campaigns: campaigns ?? [] });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    console.error("Error fetching reputation campaigns:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 }
      );
    }

    const body = await req.json();

    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: campaign, error } = await (supabase as any)
      .from("reputation_review_campaigns")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ campaign });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    console.error("Error creating reputation campaign:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
