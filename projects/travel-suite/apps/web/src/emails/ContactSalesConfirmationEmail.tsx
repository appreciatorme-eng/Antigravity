import { Text } from "@react-email/components";
import { BaseEmail } from "@/emails/BaseEmail";

interface ContactSalesConfirmationEmailProps {
  name: string;
  targetTier: string;
  organizationName: string;
}

export function ContactSalesConfirmationEmail({
  name,
  targetTier,
  organizationName,
}: ContactSalesConfirmationEmailProps) {
  return (
    <BaseEmail
      previewText={`We received your ${targetTier} plan request`}
      title="Upgrade Request Received"
    >
      <Text>Hi {name},</Text>
      <Text>
        Thank you for your interest in upgrading <strong>{organizationName}</strong>{" "}
        to the <strong>{targetTier}</strong> plan.
      </Text>
      <Text>
        Our sales team will review your request and contact you shortly. For
        immediate assistance, reply to this email.
      </Text>
    </BaseEmail>
  );
}
