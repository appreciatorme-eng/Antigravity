/**
 * Referral flywheel: post-NPS promoter email + referral offer.
 * Called fire-and-forget from the NPS submit handler after a promoter score.
 */

import { logError } from "@/lib/observability/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReferralPromoterNotification } from "@/lib/email/notifications";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";
const DEFAULT_REWARD_INR = 500;
const TDS_ANNUAL_THRESHOLD_INR = 10_000;

interface PromoterFollowupInput {
  organizationId: string;
  clientId: string | null;
  clientName: string | null;
  clientEmail: string | null;
  reviewLink: string | null;
  campaignSendId: string;
}

async function computeTdsFlag(
  supabase: ReturnType<typeof createAdminClient>,
  referrerClientId: string,
  newAmountInr: number
): Promise<boolean> {
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();

  const { data } = await supabase
    .from("client_referral_incentives")
    .select("amount_inr")
    .eq("referrer_client_id", referrerClientId)
    .eq("status", "issued")
    .gte("issued_at", yearStart);

  const ytdTotal = (data ?? []).reduce((sum, row) => sum + Number(row.amount_inr), 0);
  return ytdTotal + newAmountInr > TDS_ANNUAL_THRESHOLD_INR;
}

export async function firePromoterFollowup(input: PromoterFollowupInput): Promise<void> {
  const { clientId, clientName, clientEmail, reviewLink } = input;

  if (!clientEmail) return;

  try {
    const supabase = createAdminClient();

    let referralCode: string | null = null;
    if (clientId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", clientId)
        .maybeSingle();
      referralCode = profile?.referral_code ?? null;
    }

    const referralUrl = referralCode
      ? `${APP_URL}/book?ref=${encodeURIComponent(referralCode)}`
      : `${APP_URL}/book`;

    const rewardAmountInr = DEFAULT_REWARD_INR;

    await sendReferralPromoterNotification({
      to: clientEmail,
      recipientName: clientName ?? "Valued Traveler",
      reviewLink,
      referralUrl,
      rewardAmountInr,
    });
  } catch (err) {
    logError("[referral-flywheel] firePromoterFollowup failed", err);
  }
}

export async function issueReferralReward(options: {
  organizationId: string;
  referrerClientId: string;
  referralCode: string;
  amountInr?: number;
  notes?: string;
}): Promise<{
  success: boolean;
  incentiveId?: string;
  tdsApplicable?: boolean;
  error?: string;
}> {
  const { organizationId, referrerClientId, referralCode, notes } = options;
  const amountInr = options.amountInr ?? DEFAULT_REWARD_INR;

  try {
    const supabase = createAdminClient();

    const tdsApplicable = await computeTdsFlag(supabase, referrerClientId, amountInr);

    const { data: incentive, error: insertError } = await supabase
      .from("client_referral_incentives")
      .insert({
        organization_id: organizationId,
        referrer_client_id: referrerClientId,
        referral_code: referralCode,
        amount_inr: amountInr,
        tds_applicable: tdsApplicable,
        status: "issued",
        issued_at: new Date().toISOString(),
        notes: notes ?? null,
      })
      .select("id")
      .single();

    if (insertError || !incentive) {
      return { success: false, error: insertError?.message ?? "Failed to create incentive" };
    }

    return { success: true, incentiveId: incentive.id, tdsApplicable };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to issue reward";
    return { success: false, error: message };
  }
}
