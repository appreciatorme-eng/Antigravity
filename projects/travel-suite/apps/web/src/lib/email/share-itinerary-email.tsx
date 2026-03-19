import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface ShareItineraryEmailProps {
  clientName: string;
  shareLink: string;
}

export function ShareItineraryEmail({ clientName, shareLink }: ShareItineraryEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your itinerary is ready to view</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={sectionStyle}>
            <Heading style={headingStyle}>Your Itinerary is Ready!</Heading>
            <Text style={textStyle}>
              Hi {clientName},
            </Text>
            <Text style={textStyle}>
              Your travel itinerary has been prepared and is ready for you to review.
              Click the button below to view the full details.
            </Text>
            <Section style={buttonContainerStyle}>
              <Link href={shareLink} style={buttonStyle}>
                View Itinerary
              </Link>
            </Section>
            <Text style={footerTextStyle}>
              Or copy and paste this link into your browser:
            </Text>
            <Text style={linkTextStyle}>{shareLink}</Text>
            <Text style={footerTextStyle}>
              This link expires in 30 days.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const containerStyle = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "580px",
};

const sectionStyle = {
  padding: "0 48px",
};

const headingStyle = {
  fontSize: "24px",
  fontWeight: "600" as const,
  color: "#1a1a1a",
  textAlign: "center" as const,
  margin: "32px 0 16px",
};

const textStyle = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#484848",
};

const buttonContainerStyle = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const buttonStyle = {
  backgroundColor: "#2563eb",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
};

const footerTextStyle = {
  fontSize: "13px",
  color: "#898989",
  lineHeight: "22px",
};

const linkTextStyle = {
  fontSize: "13px",
  color: "#2563eb",
  lineHeight: "22px",
  wordBreak: "break-all" as const,
};
