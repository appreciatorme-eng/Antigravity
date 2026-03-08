import { Text } from "@react-email/components";
import { BaseEmail } from "@/emails/BaseEmail";

interface ProposalApprovedProps {
  operatorName: string;
  travelerName: string;
  proposalTitle: string;
  paymentUrl?: string | null;
}

export function ProposalApprovedEmail({
  operatorName,
  travelerName,
  proposalTitle,
  paymentUrl,
}: ProposalApprovedProps) {
  return (
    <BaseEmail
      previewText={`${travelerName} approved ${proposalTitle}`}
      title={`${travelerName} approved your proposal`}
      cta={paymentUrl ? { href: paymentUrl, label: "Open Payment Link" } : undefined}
    >
      <Text>Hi {operatorName},</Text>
      <Text>
        <strong>{travelerName}</strong> approved <strong>{proposalTitle}</strong>.
      </Text>
      <Text>
        {paymentUrl
          ? "A payment link has already been created for this traveler."
          : "No payment link was generated automatically for this approval."}
      </Text>
    </BaseEmail>
  );
}
