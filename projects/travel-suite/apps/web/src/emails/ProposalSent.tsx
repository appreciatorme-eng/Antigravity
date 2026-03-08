import { Text } from "@react-email/components";
import { BaseEmail } from "@/emails/BaseEmail";

interface ProposalSentProps {
  travelerName: string;
  proposalTitle: string;
  destination?: string | null;
  priceLabel?: string | null;
  proposalUrl: string;
}

export function ProposalSentEmail({
  travelerName,
  proposalTitle,
  destination,
  priceLabel,
  proposalUrl,
}: ProposalSentProps) {
  return (
    <BaseEmail
      previewText={`Your personalised trip proposal is ready`}
      title="Your personalised trip proposal is ready"
      cta={{ href: proposalUrl, label: "Review Proposal" }}
    >
      <Text>Hi {travelerName},</Text>
      <Text>
        We have prepared your proposal <strong>{proposalTitle}</strong>
        {destination ? ` for ${destination}` : ""}.
      </Text>
      {priceLabel ? (
        <Text>
          <strong>Estimated price:</strong> {priceLabel}
        </Text>
      ) : null}
      <Text>Open the link below to review the itinerary, pricing, and next steps.</Text>
    </BaseEmail>
  );
}
