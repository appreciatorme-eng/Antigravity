import { Text } from "@react-email/components";
import { BaseEmail } from "@/emails/BaseEmail";

interface ProposalRejectedProps {
  operatorName: string;
  travelerName: string;
  proposalTitle: string;
}

export function ProposalRejectedEmail({
  operatorName,
  travelerName,
  proposalTitle,
}: ProposalRejectedProps) {
  return (
    <BaseEmail
      previewText={`${travelerName} passed on ${proposalTitle}`}
      title={`${travelerName} passed on your proposal`}
    >
      <Text>Hi {operatorName},</Text>
      <Text>
        <strong>{travelerName}</strong> rejected <strong>{proposalTitle}</strong>.
      </Text>
      <Text>You may want to follow up with a revised itinerary or a simpler payment plan.</Text>
    </BaseEmail>
  );
}
