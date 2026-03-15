/**
 * Client Referral Flywheel — admin endpoints.
 * GET  — performance stats (promoters, events, rewards issued, pending TDS).
 * POST — manually issue a referral reward to a client (action: "issue-reward").
 */

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { sanitizeText } from "@/lib/security/sanitize";
import { issueReferralReward } from "@/lib/reputation/referral-flywheel";
import { repFrom } from "@/lib/reputation/db";

const IssueRewardSchema = z.object({
  action: z.literal("issue-reward"),
  client_id: z.string().uuid(),
  referral_code: z.string().min(1).max(80),
  amount_inr: z.number().positive().max(100_000).optional(),
  notes: z.string().max(500).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, { requireOrganization: true });
    if (!admin.ok) return admin.response;
    if (!admin.organizationId) {
      return apiError("Admin organization not configured", 400);
    }

    const organizationId = admin.organizationId;
    const supabase = admin.adminClient;

    const [incentivesRes, eventsRes, promoterCountRes] = await Promise.all([
      supabase
        .from("client_referral_incentives")
        .select("id, status, amount_inr, tds_applicable, issued_at, referrer_client_id, referral_code")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("client_referral_events")
        .select("id, converted, converted_at, referral_code, incentive_id")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(200),
      repFrom(supabase, "reputation_campaign_sends")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .in("routed_to", ["google_review", "tripadvisor_review", "makemytrip_review"]),
    ]);

    const incentives = incentivesRes.data ?? [];
    const events = eventsRes.data ?? [];
    const totalPromoters = promoterCountRes.count ?? 0;

    const totalReferralEvents = events.length;
    const convertedEvents = events.filter((e) => e.converted).length;

    const issuedIncentives = incentives.filter((i) => i.status === "issued");
    const pendingIncentives = incentives.filter((i) => i.status === "pending");

    const totalRewardsIssuedInr = issuedIncentives.reduce(
      (sum, i) => sum + Number(i.amount_inr),
      0
    );
    const tdsApplicableCount = issuedIncentives.filter((i) => i.tds_applicable).length;
    const tdsObligationInr = issuedIncentives
      .filter((i) => i.tds_applicable)
      .reduce((sum, i) => sum + Number(i.amount_inr) * 0.1, 0);

    return NextResponse.json({
      stats: {
        total_promoters: totalPromoters,
        total_referral_events: totalReferralEvents,
        converted_referral_events: convertedEvents,
        conversion_rate_pct:
          totalReferralEvents > 0
            ? Math.round((convertedEvents / totalReferralEvents) * 100)
            : 0,
        rewards_issued: issuedIncentives.length,
        rewards_pending: pendingIncentives.length,
        total_rewards_issued_inr: totalRewardsIssuedInr,
        tds_applicable_count: tdsApplicableCount,
        tds_obligation_inr: Math.round(tdsObligationInr * 100) / 100,
      },
      recent_incentives: incentives.slice(0, 20),
      recent_events: events.slice(0, 20),
    });
  } catch (error) {
    console.error("[/api/admin/reputation/client-referrals:GET] Unhandled error:", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, { requireOrganization: true });
    if (!admin.ok) return admin.response;
    if (!admin.organizationId) {
      return apiError("Admin organization not configured", 400);
    }

    const organizationId = admin.organizationId;
    const body = await req.json().catch(() => ({}));

    const parsed = IssueRewardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { client_id, referral_code, amount_inr, notes } = parsed.data;
    const sanitizedNotes = notes ? sanitizeText(notes, { maxLength: 500 }) : undefined;

    const { data: profile } = await admin.adminClient
      .from("profiles")
      .select("id, full_name, email, organization_id")
      .eq("id", client_id)
      .maybeSingle();

    if (!profile) {
      return apiError("Client not found", 404);
    }

    if (profile.organization_id === organizationId) {
      return apiError("Cannot issue reward to a member of your own organization", 400);
    }

    const result = await issueReferralReward({
      organizationId,
      referrerClientId: client_id,
      referralCode: referral_code,
      amountInr: amount_inr,
      notes: sanitizedNotes ?? undefined,
    });

    if (!result.success) {
      return apiError(result.error ?? "Internal error", 500);
    }

    return NextResponse.json({
      success: true,
      incentive_id: result.incentiveId,
      tds_applicable: result.tdsApplicable,
      amount_inr: amount_inr ?? 500,
      client_name: profile.full_name,
      client_email: profile.email,
    });
  } catch (error) {
    console.error("[/api/admin/reputation/client-referrals:POST] Unhandled error:", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
