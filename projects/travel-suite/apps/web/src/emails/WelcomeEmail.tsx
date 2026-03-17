import { Text } from "@react-email/components";
import { BaseEmail } from "@/emails/BaseEmail";

interface WelcomeEmailProps {
  recipientName: string;
  loginUrl: string;
}

export function WelcomeEmail({ recipientName, loginUrl }: WelcomeEmailProps) {
  const greeting = recipientName?.trim() || "there";
  return (
    <BaseEmail
      previewText="Your account is ready"
      title="Welcome to TripBuilt"
      cta={{ href: loginUrl, label: "Open TripBuilt" }}
    >
      <Text>Hi {greeting},</Text>
      <Text>
        Your TripBuilt account is ready. Here&apos;s what you can do:
      </Text>
      <Text>
        <strong>Plan trips</strong> — Browse curated itineraries and destinations.
        <br />
        <strong>Receive proposals</strong> — Get personalised trip proposals from expert operators.
        <br />
        <strong>Track bookings</strong> — Manage payments, documents, and updates in one place.
      </Text>
      <Text>If you have any questions, just reply to this email.</Text>
    </BaseEmail>
  );
}
