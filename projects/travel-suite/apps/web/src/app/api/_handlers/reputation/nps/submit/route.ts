import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { repFrom } from "@/lib/reputation/db";
import { firePromoterFollowup } from "@/lib/reputation/referral-flywheel";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
import type { RouteTarget } from "@/lib/reputation/types";
import { NPS_BOUNDARIES, REVIEW_LINK_TEMPLATES } from "@/lib/reputation/constants";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rl = await enforceRateLimit({
      identifier: ip,
      limit: 10,
      windowMs: 60_000,
      prefix: "pub:nps:submit",
    });
    if (!rl.success) {
      return apiError("Too many requests", 429);
    }

    const supabase = await createClient();
    const body = await req.json();

    const { token, score, feedback } = body;

    // Validate token format first (cheap, no DB)
    if (!token || typeof token !== "string" || !UUID_REGEX.test(token)) {
      return apiError("token is required", 400);
    }

    // Look up the campaign send by nps_token before validating score
    // so an invalid token always returns 404 regardless of score validity
    const { data: send, error: sendError } = await repFrom(supabase, "reputation_campaign_sends")
      .select("*, reputation_review_campaigns(*)")
      .eq("nps_token", token)
      .maybeSingle();

    if (sendError) {
      throw sendError;
    }

    if (!send) {
      return apiError("Invalid or expired token", 404);
    }

    const scoreValue = Number(score);
    if (isNaN(scoreValue) || scoreValue < 1 || scoreValue > 10) {
      return apiError("score must be a number between 1 and 10", 400);
    }

    // Validate token not expired
    if (!send.nps_token_expires_at || new Date(send.nps_token_expires_at) < new Date()) {
      return apiError("This survey link has expired", 410);
    }

    // Determine routing based on NPS score
    let routedTo: RouteTarget;
    let reviewLink: string | null = null;

    const campaign = send.reputation_review_campaigns;
    const promoterThreshold = campaign?.promoter_threshold ?? NPS_BOUNDARIES.promoter;
    const passiveThreshold = campaign?.passive_threshold ?? NPS_BOUNDARIES.passive;

    if (scoreValue >= promoterThreshold) {
      // Promoter: route to review platform
      routedTo = getPromoterRouteTarget(campaign?.promoter_action);
      reviewLink = generateReviewLink(
        campaign?.promoter_action,
        campaign?.promoter_review_url
      );
    } else if (scoreValue >= passiveThreshold) {
      // Passive: follow up
      routedTo = "followup";
    } else {
      // Detractor: internal feedback
      routedTo = "internal_feedback";
    }

    // Update the campaign send with NPS data
    const updateData = {
      nps_score: scoreValue,
      nps_feedback: feedback || null,
      nps_submitted_at: new Date().toISOString(),
      routed_to: routedTo,
      review_link: reviewLink,
      status: "completed" as const,
      completed_at: new Date().toISOString(),
    };

    const { error: updateError } = await repFrom(supabase, "reputation_campaign_sends")
      .update(updateData)
      .eq("id", send.id);

    if (updateError) {
      throw updateError;
    }

    // For detractors, flag for attention if there's an associated review
    if (routedTo === "internal_feedback" && send.trip_id) {
      await repFrom(supabase, "reputation_reviews")
        .update({
          requires_attention: true,
          attention_reason: `Low NPS score (${scoreValue}/10) from campaign survey`,
        })
        .eq("trip_id", send.trip_id)
        .eq("organization_id", send.organization_id);
    }

    // For promoters: fire review-request + referral-offer email (non-blocking)
    if (["google_review", "tripadvisor_review", "makemytrip_review"].includes(routedTo)) {
      firePromoterFollowup({
        organizationId: send.organization_id,
        clientId: send.client_id ?? null,
        clientName: send.client_name ?? null,
        clientEmail: send.client_email ?? null,
        reviewLink,
        campaignSendId: send.id,
      }).catch((err) => console.error("[nps/submit] promoter followup failed:", err));
    }

    return NextResponse.json({
      success: true,
      routed_to: routedTo,
      review_link: reviewLink,
    });
  } catch (error: unknown) {
    console.error("Error submitting NPS score:", error);
    return apiError("Internal server error", 500);
  }
}

function getPromoterRouteTarget(
  promoterAction: string | null | undefined
): RouteTarget {
  switch (promoterAction) {
    case "tripadvisor_link":
      return "tripadvisor_review";
    case "makemytrip_link":
      return "makemytrip_review";
    case "google_review_link":
    default:
      return "google_review";
  }
}

function generateReviewLink(
  promoterAction: string | null | undefined,
  customUrl: string | null | undefined
): string | null {
  if (customUrl) {
    return customUrl;
  }

  switch (promoterAction) {
    case "google_review_link":
      return REVIEW_LINK_TEMPLATES.google || null;
    case "tripadvisor_link":
      return REVIEW_LINK_TEMPLATES.tripadvisor || null;
    case "makemytrip_link":
      return REVIEW_LINK_TEMPLATES.makemytrip || null;
    default:
      return null;
  }
}
