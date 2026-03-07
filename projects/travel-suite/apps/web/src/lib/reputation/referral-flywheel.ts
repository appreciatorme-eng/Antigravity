/**
 * Referral flywheel: post-NPS promoter email + referral offer.
 * Called fire-and-forget from the NPS submit handler after a promoter score.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { fetchWithRetry } from "@/lib/network/retry";

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

async function sendPromoterEmail(
  toEmail: string,
  recipientName: string,
  reviewLink: string | null,
  referralUrl: string,
  rewardAmountInr: number
): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const senderEmail =
    process.env.PROPOSAL_FROM_EMAIL ||
    process.env.WELCOME_FROM_EMAIL ||
    process.env.RESEND_FROM_EMAIL;

  if (!resendApiKey || !senderEmail) return;

  const reviewSection = reviewLink
    ? `<p>Your feedback means the world to us. We'd be grateful if you could share it publicly:</p>
       <p>
         <a href="${reviewLink}" style="display:inline-block;padding:10px 20px;background:#0f766e;color:#fff;text-decoration:none;border-radius:8px;">
           Leave a Review
         </a>
       </p>`
    : "";

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;max-width:600px;">
      <h2>Thank you, ${recipientName}! 🙏</h2>
      <p>We're thrilled you had a great experience with us. Your satisfaction is what drives everything we do.</p>
      ${reviewSection}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
      <h3>Earn ₹${rewardAmountInr.toLocaleString("en-IN")} for every friend you refer</h3>
      <p>Know someone who loves travel? Share your personal referral link and earn a reward when they complete their first booking.</p>
      <p>
        <a href="${referralUrl}" style="display:inline-block;padding:10px 20px;background:#0369a1;color:#fff;text-decoration:none;border-radius:8px;">
          Share Your Referral Link
        </a>
      </p>
      <p style="color:#64748b;font-size:13px;">Or copy: <a href="${referralUrl}" style="color:#0369a1;">${referralUrl}</a></p>
      <p style="color:#94a3b8;font-size:12px;margin-top:24px;">
        Reward is subject to your friend completing a paid booking.
        TDS deduction applies per income tax rules if annual rewards exceed ₹10,000.
      </p>
    </div>
  `;

  await fetchWithRetry(
    "https://api.resend.com/emails",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: senderEmail,
        to: [toEmail],
        subject: "Thank you! + Earn ₹" + rewardAmountInr.toLocaleString("en-IN") + " by referring a friend",
        html,
      }),
    },
    { retries: 2, timeoutMs: 8000, baseDelayMs: 300 }
  );
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

    await sendPromoterEmail(
      clientEmail,
      clientName ?? "Valued Traveler",
      reviewLink,
      referralUrl,
      rewardAmountInr
    );
  } catch (err) {
    console.error("[referral-flywheel] firePromoterFollowup failed:", err);
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
