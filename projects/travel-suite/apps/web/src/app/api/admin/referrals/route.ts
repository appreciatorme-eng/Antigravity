import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/security/sanitize";

type ReferralRow = {
  id: string;
  status: string | null;
  reward_granted: boolean | null;
  created_at: string;
  referred_organization_id: string | null;
  referred_org: { name: string | null } | null;
};

const REFERRALS_LIST_RATE_LIMIT_MAX = 80;
const REFERRALS_LIST_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const REFERRALS_MUTATION_RATE_LIMIT_MAX = 20;
const REFERRALS_MUTATION_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, { requireOrganization: false });
    if (!admin.ok) {
      return NextResponse.json(
        { error: admin.response.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: admin.response.status || 401 },
      );
    }

    const rateLimit = await enforceRateLimit({
      identifier: admin.userId,
      limit: REFERRALS_LIST_RATE_LIMIT_MAX,
      windowMs: REFERRALS_LIST_RATE_LIMIT_WINDOW_MS,
      prefix: "api:admin:referrals:list",
    });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many referral list requests. Please retry later." },
        { status: 429 },
      );
    }

    const { data: profile } = await admin.adminClient
      .from("profiles")
      .select("id, referral_code, organization_id")
      .eq("id", admin.userId)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    if (!profile.organization_id) {
      return NextResponse.json(
        { error: "Admin organization not configured" },
        { status: 400 },
      );
    }

    const { data: referrals, error: refError } = await admin.adminClient
      .from("referrals")
      .select(`
        id, status, reward_granted, created_at,
        referred_organization_id,
        referred_org:organizations!referred_organization_id(name)
      `)
      .eq("referrer_profile_id", profile.id)
      .order("created_at", { ascending: false });

    if (refError) {
      return NextResponse.json(
        { error: "Failed to fetch referrals" },
        { status: 500 },
      );
    }

    const typedReferrals = (referrals || []) as ReferralRow[];
    const totalReferrals = typedReferrals.length;
    const convertedReferrals = typedReferrals.filter(
      (referral) => referral.status === "converted",
    ).length;

    const targetReferrals = 3;
    const progress = Math.min((convertedReferrals / targetReferrals) * 100, 100);
    const allRewardsGranted =
      typedReferrals.length > 0 &&
      typedReferrals.every((referral) => Boolean(referral.reward_granted));
    const canClaimReward = convertedReferrals >= targetReferrals && !allRewardsGranted;

    return NextResponse.json({
      referralCode: profile.referral_code,
      referrals: typedReferrals,
      stats: {
        total: totalReferrals,
        converted: convertedReferrals,
        progress,
        target: targetReferrals,
        canClaimReward,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, { requireOrganization: false });
    if (!admin.ok) {
      return NextResponse.json(
        { error: admin.response.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: admin.response.status || 401 },
      );
    }

    const rateLimit = await enforceRateLimit({
      identifier: admin.userId,
      limit: REFERRALS_MUTATION_RATE_LIMIT_MAX,
      windowMs: REFERRALS_MUTATION_RATE_LIMIT_WINDOW_MS,
      prefix: "api:admin:referrals:mutate",
    });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many referral mutation requests. Please retry later." },
        { status: 429 },
      );
    }

    if (!admin.organizationId) {
      return NextResponse.json(
        { error: "You do not have an active organization to link." },
        { status: 400 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as { referralCode?: string };
    const referralCode = sanitizeText(body.referralCode, { maxLength: 80 });
    if (!referralCode) {
      return NextResponse.json({ error: "Referral code required" }, { status: 400 });
    }

    const { data: referrerProfile } = await admin.adminClient
      .from("profiles")
      .select("id, organization_id")
      .eq("referral_code", referralCode)
      .maybeSingle();

    if (!referrerProfile) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
    }

    if (referrerProfile.id === admin.userId) {
      return NextResponse.json(
        { error: "You cannot refer yourself." },
        { status: 400 },
      );
    }

    if (referrerProfile.organization_id === admin.organizationId) {
      return NextResponse.json(
        { error: "You cannot apply a referral code from someone in your own team." },
        { status: 400 },
      );
    }

    const { data: myOrg } = await admin.adminClient
      .from("organizations")
      .select("created_at")
      .eq("id", admin.organizationId)
      .maybeSingle();

    if (myOrg?.created_at) {
      const orgAgeDays =
        (Date.now() - new Date(myOrg.created_at).getTime()) /
        (1000 * 60 * 60 * 24);
      if (orgAgeDays > 7) {
        return NextResponse.json(
          {
            error:
              "Referral codes can only be applied within 7 days of account creation.",
          },
          { status: 403 },
        );
      }
    }

    if (referrerProfile.organization_id) {
      const { data: circularCheck } = await admin.adminClient
        .from("referrals")
        .select("id")
        .eq("referrer_profile_id", admin.userId)
        .eq("referred_organization_id", referrerProfile.organization_id)
        .maybeSingle();

      if (circularCheck) {
        return NextResponse.json(
          { error: "Circular referrals are not permitted." },
          { status: 403 },
        );
      }
    }

    const { error: insertError } = await admin.adminClient
      .from("referrals")
      .insert({
        referrer_profile_id: referrerProfile.id,
        referred_organization_id: admin.organizationId,
        status: "pending",
      });

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "Your organization is already referred by someone." },
          { status: 400 },
        );
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Referral code applied successfully",
    });
  } catch {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
