import { Text } from "@react-email/components";
import { BaseEmail } from "@/emails/BaseEmail";

interface BookingConfirmationProps {
  recipientName: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalPaid?: string | null;
  operatorName: string;
  operatorEmail?: string | null;
  tripUrl?: string | null;
}

export function BookingConfirmationEmail({
  recipientName,
  destination,
  startDate,
  endDate,
  totalPaid,
  operatorName,
  operatorEmail,
  tripUrl,
}: BookingConfirmationProps) {
  return (
    <BaseEmail
      previewText={`Booking confirmed for ${destination}`}
      title={`Booking Confirmed — ${destination}`}
      cta={tripUrl ? { href: tripUrl, label: "View Your Trip" } : undefined}
    >
      <Text>Hi {recipientName},</Text>
      <Text>Your trip is confirmed. Here are the key details:</Text>
      <Text>
        <strong>Destination:</strong> {destination}
        <br />
        <strong>Dates:</strong> {startDate} to {endDate}
        {totalPaid ? (
          <>
            <br />
            <strong>Total paid:</strong> {totalPaid}
          </>
        ) : null}
      </Text>
      <Text>
        Your operator is <strong>{operatorName}</strong>
        {operatorEmail ? (
          <>
            {" "}
            and can be reached at <strong>{operatorEmail}</strong>.
          </>
        ) : (
          "."
        )}
      </Text>
    </BaseEmail>
  );
}
