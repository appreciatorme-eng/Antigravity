import { Text } from "@react-email/components";
import { BaseEmail } from "@/emails/BaseEmail";

interface InvoicePdfEmailProps {
  invoiceNumber: string;
  organizationName: string;
}

export function InvoicePdfEmail({
  invoiceNumber,
  organizationName,
}: InvoicePdfEmailProps) {
  return (
    <BaseEmail
      previewText={`Invoice ${invoiceNumber} from ${organizationName}`}
      title={`Invoice ${invoiceNumber}`}
    >
      <Text>Hi there,</Text>
      <Text>
        Please find your invoice <strong>{invoiceNumber}</strong> from{" "}
        <strong>{organizationName}</strong> attached as a PDF.
      </Text>
      <Text>
        If you have any questions about this invoice, reply to this email and
        our team will assist you.
      </Text>
      <Text>
        Regards,
        <br />
        {organizationName}
      </Text>
    </BaseEmail>
  );
}
