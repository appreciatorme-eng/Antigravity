import { Hr, Link, Text } from "@react-email/components";
import { BaseEmail } from "@/emails/BaseEmail";

interface ReferralPromoterEmailProps {
  recipientName: string;
  reviewLink: string | null;
  referralUrl: string;
  rewardAmountInr: number;
}

const secondaryButtonStyle = {
  display: "inline-block" as const,
  padding: "10px 20px",
  backgroundColor: "#0f766e",
  color: "#ffffff",
  textDecoration: "none" as const,
  borderRadius: "8px",
  fontWeight: 600 as const,
  fontSize: "14px" as const,
};

export function ReferralPromoterEmail({
  recipientName,
  reviewLink,
  referralUrl,
  rewardAmountInr,
}: ReferralPromoterEmailProps) {
  return (
    <BaseEmail
      previewText={`Earn ₹${rewardAmountInr.toLocaleString("en-IN")} for every friend you refer`}
      title="Thank You for Your Feedback"
      cta={{ href: referralUrl, label: "Share Your Referral Link" }}
    >
      <Text>Hi {recipientName},</Text>
      <Text>
        We&apos;re thrilled you had a great experience with us. Your
        satisfaction is what drives everything we do.
      </Text>
      {reviewLink ? (
        <>
          <Text>
            We&apos;d be grateful if you could share your feedback publicly:
          </Text>
          <Text>
            <Link href={reviewLink} style={secondaryButtonStyle}>
              Leave a Review
            </Link>
          </Text>
        </>
      ) : null}
      <Hr style={{ borderColor: "#e2e8f0", margin: "24px 0" }} />
      <Text style={{ fontSize: "18px", fontWeight: 700 }}>
        Earn ₹{rewardAmountInr.toLocaleString("en-IN")} for every friend you
        refer
      </Text>
      <Text>
        Know someone who loves travel? Share your personal referral link and earn
        a reward when they complete their first booking.
      </Text>
      <Text style={{ color: "#64748b", fontSize: "12px" }}>
        Referral rewards above ₹10,000 per financial year are subject to TDS for
        unregistered individuals.
      </Text>
    </BaseEmail>
  );
}
