import { Text } from "@react-email/components";
import { BaseEmail } from "@/emails/BaseEmail";

interface TeamInviteProps {
  organizationName: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
}

export function TeamInviteEmail({
  organizationName,
  inviterName,
  role,
  inviteUrl,
}: TeamInviteProps) {
  return (
    <BaseEmail
      previewText={`You're invited to join ${organizationName}`}
      title={`You're invited to join ${organizationName}`}
      cta={{ href: inviteUrl, label: "Accept Invite" }}
    >
      <Text>Hi there,</Text>
      <Text>
        <strong>{inviterName}</strong> invited you to join <strong>{organizationName}</strong> as a{" "}
        <strong>{role}</strong>.
      </Text>
      <Text>Accept the invite to start collaborating inside Antigravity Travel.</Text>
    </BaseEmail>
  );
}
