import { Section, Text } from "@react-email/components";
import { BaseEmail } from "@/emails/BaseEmail";

interface MarketplaceInquiryEmailProps {
  senderOrgName: string;
  subject: string;
  message: string;
  inquiryUrl: string;
}

const detailBlockStyle = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "16px 0",
};

const labelStyle = {
  color: "#64748b",
  fontSize: "12px" as const,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 4px",
};

export function MarketplaceInquiryEmail({
  senderOrgName,
  subject,
  message,
  inquiryUrl,
}: MarketplaceInquiryEmailProps) {
  return (
    <BaseEmail
      previewText={`New inquiry from ${senderOrgName}`}
      title="New Partnership Inquiry"
      cta={{ href: inquiryUrl, label: "View in Inbox" }}
    >
      <Text>
        <strong>{senderOrgName}</strong> has sent you a new inquiry on the Tour
        Operator Marketplace.
      </Text>
      <Section style={detailBlockStyle}>
        <Text style={labelStyle}>Subject</Text>
        <Text style={{ margin: "0 0 12px", fontWeight: 600 }}>{subject}</Text>
        <Text style={labelStyle}>Message</Text>
        <Text style={{ margin: 0 }}>{message}</Text>
      </Section>
    </BaseEmail>
  );
}
