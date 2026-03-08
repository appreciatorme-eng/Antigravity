import { Text } from "@react-email/components";
import { BaseEmail } from "@/emails/BaseEmail";

interface PaymentReceiptProps {
  recipientName: string;
  amountLabel: string;
  paymentId: string;
  bookingReference: string;
  paidAt: string;
  operatorName: string;
  gstLabel?: string | null;
  invoiceUrl?: string | null;
}

export function PaymentReceiptEmail({
  recipientName,
  amountLabel,
  paymentId,
  bookingReference,
  paidAt,
  operatorName,
  gstLabel,
  invoiceUrl,
}: PaymentReceiptProps) {
  return (
    <BaseEmail
      previewText={`Payment received for ${bookingReference}`}
      title="Payment received"
      cta={invoiceUrl ? { href: invoiceUrl, label: "Download Invoice" } : undefined}
    >
      <Text>Hi {recipientName},</Text>
      <Text>We have received your payment successfully.</Text>
      <Text>
        <strong>Reference:</strong> {bookingReference}
        <br />
        <strong>Amount paid:</strong> {amountLabel}
        <br />
        {gstLabel ? (
          <>
            <strong>GST:</strong> {gstLabel}
            <br />
          </>
        ) : null}
        <strong>Payment ID:</strong> {paymentId}
        <br />
        <strong>Paid at:</strong> {paidAt}
      </Text>
      <Text>{operatorName} will contact you if anything else is needed.</Text>
    </BaseEmail>
  );
}
