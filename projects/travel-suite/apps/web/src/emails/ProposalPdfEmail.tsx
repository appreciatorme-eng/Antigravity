import { Text } from "@react-email/components";
import { BaseEmail } from "@/emails/BaseEmail";

interface ProposalPdfEmailProps {
  proposalTitle: string;
  recipientName?: string | null;
}

export function ProposalPdfEmail({
  proposalTitle,
  recipientName,
}: ProposalPdfEmailProps) {
  const greeting = recipientName?.trim() ? `Hi ${recipientName}` : "Hi there";
  return (
    <BaseEmail
      previewText={`Your proposal for ${proposalTitle} is attached`}
      title="Your Travel Proposal"
    >
      <Text>{greeting},</Text>
      <Text>
        Please find attached your personalised travel proposal for{" "}
        <strong>{proposalTitle}</strong>.
      </Text>
      <Text>
        Take a look and let us know if you&apos;d like to customise anything
        before approval — just reply to this email.
      </Text>
    </BaseEmail>
  );
}
