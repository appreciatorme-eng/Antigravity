import { describe, expect, it } from "vitest";

import {
  buildFirstContactWelcomeMessage,
  normalizeWhatsAppWelcomeConfig,
} from "@/lib/whatsapp/first-contact-welcome.server";

describe("first-contact-welcome", () => {
  it("normalizes the structured welcome config safely", () => {
    expect(
      normalizeWhatsAppWelcomeConfig({
        intro_headline: " Hey Buddy ",
        service_bullets: [" Flights ", "", "Hotels"],
        office_hours: " Mon-Sat 9-8 ",
      }),
    ).toEqual({
      intro_headline: "Hey Buddy",
      company_description: null,
      region_line: null,
      service_bullets: ["Flights", "Hotels"],
      contact_phone: null,
      office_hours: "Mon-Sat 9-8",
      cta_line: null,
      footer: null,
      customer_reply_mode: "first_contact_link_only",
    });
  });

  it("renders an org-scoped welcome message with configured content and link", () => {
    const message = buildFirstContactWelcomeMessage(
      {
        id: "org_1",
        name: "Go Buddy Adventures",
        owner_id: "owner_1",
        billing_state: "Andhra Pradesh",
        whatsapp_welcome_config: {
          intro_headline: "Hey Buddy 🌍✈️",
          company_description: "Go Buddy Adventures is your one-stop travel solution.",
          region_line: "🏪 DMC for ANDHRA PRADESH",
          service_bullets: ["✈️ Flights", "🏨 Hotels"],
          contact_phone: "+91 9876543210",
          office_hours: "Mon-Sat, 9 AM - 8 PM",
          cta_line: "Fill your details here and we will send your trip back on WhatsApp:",
          footer: "Let's make your adventures a reality!",
        },
      },
      "https://tripbuilt.com/trip-request/token123",
    );

    expect(message).toContain("Go Buddy Adventures is your one-stop travel solution.");
    expect(message).toContain("🏪 DMC for ANDHRA PRADESH");
    expect(message).toContain("✈️ Flights");
    expect(message).toContain("https://tripbuilt.com/trip-request/token123");
    expect(message).toContain("Let's make your adventures a reality!");
  });
});
