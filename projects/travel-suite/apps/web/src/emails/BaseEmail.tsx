import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

interface BaseEmailProps {
  previewText: string;
  title: string;
  children: ReactNode;
  cta?: {
    href: string;
    label: string;
  };
}

const bodyStyle = {
  backgroundColor: "#eef2ff",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
  margin: "0",
  padding: "32px 0",
};

const containerStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "24px",
  margin: "0 auto",
  maxWidth: "640px",
  overflow: "hidden",
};

const headerStyle = {
  background:
    "linear-gradient(135deg, rgba(8,18,32,1) 0%, rgba(15,118,110,1) 100%)",
  padding: "32px 36px",
};

const contentStyle = {
  padding: "32px 36px",
};

const footerStyle = {
  color: "#64748b",
  fontSize: "12px",
  lineHeight: "18px",
  padding: "0 36px 32px",
};

export function BaseEmail({ previewText, title, children, cta }: BaseEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Text
              style={{
                color: "#99f6e4",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.24em",
                margin: "0 0 12px",
                textTransform: "uppercase",
              }}
            >
              Antigravity Travel
            </Text>
            <Heading
              as="h1"
              style={{
                color: "#ffffff",
                fontSize: "28px",
                lineHeight: "34px",
                margin: 0,
              }}
            >
              {title}
            </Heading>
          </Section>

          <Section style={contentStyle}>
            {children}
            {cta ? (
              <Section style={{ marginTop: "28px" }}>
                <Button
                  href={cta.href}
                  style={{
                    backgroundColor: "#0f766e",
                    borderRadius: "14px",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: 700,
                    padding: "14px 20px",
                    textDecoration: "none",
                  }}
                >
                  {cta.label}
                </Button>
              </Section>
            ) : null}
          </Section>

          <Hr style={{ borderColor: "#e2e8f0", margin: "0 36px 24px" }} />

          <Section style={footerStyle}>
            <Text style={{ margin: "0 0 8px" }}>
              © Antigravity Travel
            </Text>
            <Text style={{ margin: 0 }}>
              Unsubscribe
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
