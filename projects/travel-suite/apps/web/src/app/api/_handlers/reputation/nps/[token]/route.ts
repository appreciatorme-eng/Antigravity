import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { repFrom } from "@/lib/reputation/db";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || !UUID_REGEX.test(token)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rl = await enforceRateLimit({
      identifier: ip,
      limit: 30,
      windowMs: 60_000,
      prefix: "pub:nps:get",
    });
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const supabase = await createClient();

    // Lookup campaign send by nps_token (no auth required - public endpoint)
    const { data: send, error: sendError } = await repFrom(supabase, "reputation_campaign_sends")
      .select("*, reputation_review_campaigns(*)")
      .eq("nps_token", token)
      .maybeSingle();

    if (sendError) {
      throw sendError;
    }

    if (!send) {
      return NextResponse.json(
        { error: "Survey not found" },
        { status: 404 }
      );
    }

    // Validate token not expired
    const expiresAt = new Date(send.nps_token_expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This survey link has expired" },
        { status: 410 }
      );
    }

    // Check if already submitted
    if (send.nps_submitted_at) {
      return NextResponse.json(
        { error: "This survey has already been completed" },
        { status: 409 }
      );
    }

    const campaign = send.reputation_review_campaigns;

    // Fetch trip info if available
    let tripInfo: { name: string; destination: string } | null = null;
    if (send.trip_id) {
      const { data: trip } = await supabase
        .from("trips")
        .select("name, destination")
        .eq("id", send.trip_id)
        .single();

      if (trip) {
        tripInfo = {
          name: trip.name ?? "",
          destination: trip.destination ?? "",
        };
      }
    }

    // Fetch organization name for branding
    let organizationName: string | null = null;
    if (send.organization_id) {
      const { data: org } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", send.organization_id)
        .single();

      if (org) {
        organizationName = org.name ?? null;
      }
    }

    return NextResponse.json({
      nps_question:
        campaign?.nps_question ||
        "How likely are you to recommend us to a friend?",
      nps_followup_question:
        campaign?.nps_followup_question || "What could we do better?",
      client_name: send.client_name,
      trip: tripInfo,
      organization_name: organizationName,
      promoter_threshold: campaign?.promoter_threshold ?? 9,
      passive_threshold: campaign?.passive_threshold ?? 7,
    });
  } catch (error: unknown) {
    console.error("Error loading NPS form data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
