import { Text } from "@react-email/components";
import { BaseEmail } from "@/emails/BaseEmail";
import type { OperatorScorecardPayload } from "@/lib/admin/operator-scorecard";

interface OperatorScorecardEmailProps {
  recipientName: string;
  organizationName: string;
  monthLabel: string;
  dashboardUrl: string;
  scorecard: Pick<OperatorScorecardPayload, "score" | "status" | "highlights" | "actions">;
  revenueLabel: string;
  approvalRateLabel: string;
}

export function OperatorScorecardEmail({
  recipientName,
  organizationName,
  monthLabel,
  dashboardUrl,
  scorecard,
  revenueLabel,
  approvalRateLabel,
}: OperatorScorecardEmailProps) {
  return (
    <BaseEmail
      previewText={`${organizationName} scorecard for ${monthLabel}`}
      title={`${organizationName} scorecard — ${monthLabel}`}
      cta={{ href: dashboardUrl, label: "Open Dashboard" }}
    >
      <Text>Hi {recipientName},</Text>
      <Text>
        Your monthly operator scorecard is ready. You closed the month with a score of{" "}
        <strong>{scorecard.score}</strong> and a <strong>{scorecard.status.replace(/_/g, " ")}</strong> operating
        profile.
      </Text>
      <Text>
        <strong>Revenue:</strong> {revenueLabel}
        <br />
        <strong>Approval rate:</strong> {approvalRateLabel}
      </Text>
      <Text><strong>Highlights</strong></Text>
      {scorecard.highlights.map((item) => (
        <Text key={item}>• {item}</Text>
      ))}
      <Text><strong>Next moves</strong></Text>
      {scorecard.actions.map((item) => (
        <Text key={item}>• {item}</Text>
      ))}
      <Text>The PDF scorecard is attached for your monthly review and team check-ins.</Text>
    </BaseEmail>
  );
}
