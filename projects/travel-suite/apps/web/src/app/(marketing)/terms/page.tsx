import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "TripBuilt terms of service — the rules and guidelines for using our travel agency management platform.",
  openGraph: {
    title: "Terms of Service | TripBuilt",
    description: "Terms and conditions for using TripBuilt.",
    images: [
      {
        url: "/api/og?title=Terms+of+Service&subtitle=Rules+and+guidelines",
        width: 1200,
        height: 630,
      },
    ],
  },
};

const EFFECTIVE_DATE = "March 26, 2026";
const COMPANY_NAME = "TripBuilt";
const COMPANY_URL = "https://tripbuilt.com";
const SUPPORT_EMAIL = "support@tripbuilt.com";

export default function TermsOfServicePage() {
  return (
    <div className="text-white">
      <section className="pt-32 md:pt-40 pb-16 md:pb-20 px-6 md:px-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Terms of Service
          </h1>
          <p className="text-gray-400 mb-12">
            Effective date: {EFFECTIVE_DATE}
          </p>

          <div className="space-y-10 text-gray-300 leading-relaxed">
            {/* 1. Acceptance */}
            <Section title="1. Acceptance of Terms">
              <p>
                By accessing or using {COMPANY_NAME} at{" "}
                <a
                  href={COMPANY_URL}
                  className="text-[#00F0FF] hover:underline"
                >
                  {COMPANY_URL}
                </a>{" "}
                (&quot;the Service&quot;), you agree to be bound by these Terms
                of Service (&quot;Terms&quot;). If you do not agree to these
                Terms, you may not use the Service.
              </p>
              <p>
                These Terms apply to all users, including travel agency
                operators, their staff members, and any person who accesses the
                platform.
              </p>
            </Section>

            {/* 2. Service Description */}
            <Section title="2. Service Description">
              <p>
                {COMPANY_NAME} is a software-as-a-service (SaaS) platform that
                provides travel agencies and tour operators with tools to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>
                  Manage client relationships, leads, and communications
                </li>
                <li>Create and send travel proposals and itineraries</li>
                <li>
                  Process payments through integrated payment gateways
                  (Razorpay)
                </li>
                <li>
                  Send and receive messages via WhatsApp and email (Gmail
                  integration)
                </li>
                <li>
                  Manage social media content and reputation
                </li>
                <li>
                  Automate business workflows and marketing
                </li>
              </ul>
            </Section>

            {/* 3. Account */}
            <Section title="3. Account Registration">
              <p>To use the Service, you must:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Be at least 18 years of age</li>
                <li>Provide accurate and complete registration information</li>
                <li>
                  Maintain the security of your account credentials
                </li>
                <li>
                  Promptly notify us of any unauthorized use of your account
                </li>
              </ul>
              <p className="mt-3">
                You are responsible for all activities that occur under your
                account. {COMPANY_NAME} is not liable for any loss or damage
                arising from unauthorized use of your account.
              </p>
            </Section>

            {/* 4. Acceptable Use */}
            <Section title="4. Acceptable Use">
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Use the Service for any unlawful purpose</li>
                <li>
                  Send spam, unsolicited messages, or bulk communications
                  through our messaging features
                </li>
                <li>
                  Attempt to gain unauthorized access to other users&apos; data
                  or accounts
                </li>
                <li>
                  Reverse-engineer, decompile, or disassemble any part of the
                  Service
                </li>
                <li>
                  Use the Service to store or transmit malicious code, viruses,
                  or harmful data
                </li>
                <li>
                  Resell, sublicense, or redistribute the Service without
                  written permission
                </li>
                <li>
                  Circumvent rate limits, security measures, or access controls
                </li>
              </ul>
            </Section>

            {/* 5. Third-Party Integrations */}
            <Section title="5. Third-Party Integrations">
              <p>
                The Service integrates with third-party platforms including
                Google (Gmail), Meta (WhatsApp Business API), Razorpay, and
                others. When you connect these services:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>
                  You authorize {COMPANY_NAME} to access and use data from those
                  services as described in our{" "}
                  <a
                    href="/privacy"
                    className="text-[#00F0FF] hover:underline"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  You are responsible for complying with the terms of those
                  third-party services
                </li>
                <li>
                  {COMPANY_NAME} is not responsible for the availability,
                  accuracy, or policies of third-party services
                </li>
                <li>
                  You may disconnect any integration at any time from your
                  Settings page
                </li>
              </ul>
            </Section>

            {/* 6. Payment Terms */}
            <Section title="6. Payment Terms">
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Subscription fees are billed in Indian Rupees (INR) unless
                  otherwise specified
                </li>
                <li>
                  Payments are processed securely through Razorpay
                </li>
                <li>
                  Subscription plans renew automatically unless cancelled before
                  the renewal date
                </li>
                <li>
                  Refunds are available within 7 days of initial purchase if the
                  Service does not meet your expectations
                </li>
                <li>
                  {COMPANY_NAME} reserves the right to change pricing with 30
                  days&apos; notice to existing subscribers
                </li>
              </ul>
            </Section>

            {/* 7. Data Ownership */}
            <Section title="7. Data Ownership">
              <p>
                <strong className="text-white">Your data is yours.</strong> You
                retain all rights to the content, client data, proposals,
                itineraries, and communications you create or upload to{" "}
                {COMPANY_NAME}.
              </p>
              <p className="mt-3">
                You grant {COMPANY_NAME} a limited, non-exclusive license to
                use, process, and display your data solely for the purpose of
                providing the Service. This license terminates when you delete
                your account.
              </p>
              <p className="mt-3">
                {COMPANY_NAME} retains ownership of the platform, software,
                algorithms, designs, and all intellectual property related to the
                Service.
              </p>
            </Section>

            {/* 8. Service Availability */}
            <Section title="8. Service Availability">
              <p>
                We strive to maintain high availability but do not guarantee
                uninterrupted access. The Service may be temporarily unavailable
                due to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Scheduled maintenance (with advance notice when possible)</li>
                <li>
                  Third-party service outages (Supabase, Vercel, Razorpay, etc.)
                </li>
                <li>Force majeure events beyond our control</li>
              </ul>
            </Section>

            {/* 9. Limitation of Liability */}
            <Section title="9. Limitation of Liability">
              <p>
                To the maximum extent permitted by applicable law,{" "}
                {COMPANY_NAME} shall not be liable for:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>
                  Any indirect, incidental, special, consequential, or punitive
                  damages
                </li>
                <li>Loss of profits, revenue, data, or business opportunities</li>
                <li>
                  Damages arising from your use of third-party integrations
                </li>
                <li>
                  Content or communications sent through the platform by you or
                  your team members
                </li>
              </ul>
              <p className="mt-3">
                Our total liability for any claim arising from the Service shall
                not exceed the amount you paid to {COMPANY_NAME} in the 12
                months preceding the claim.
              </p>
            </Section>

            {/* 10. Termination */}
            <Section title="10. Termination">
              <p>
                You may terminate your account at any time from your Settings
                page.
              </p>
              <p className="mt-3">
                {COMPANY_NAME} may suspend or terminate your account if:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>You violate these Terms</li>
                <li>Your account has been inactive for over 12 months</li>
                <li>
                  We are required to do so by law or regulatory order
                </li>
                <li>
                  We cease to offer the Service (with 60 days&apos; notice and
                  data export period)
                </li>
              </ul>
              <p className="mt-3">
                Upon termination, your data will be retained for 30 days to
                allow export, after which it will be permanently deleted.
              </p>
            </Section>

            {/* 11. Indemnification */}
            <Section title="11. Indemnification">
              <p>
                You agree to indemnify and hold harmless {COMPANY_NAME}, its
                officers, employees, and agents from any claims, damages, or
                expenses arising from your use of the Service, violation of
                these Terms, or infringement of any third-party rights.
              </p>
            </Section>

            {/* 12. Governing Law */}
            <Section title="12. Governing Law">
              <p>
                These Terms are governed by the laws of India. Any disputes
                arising from these Terms shall be subject to the exclusive
                jurisdiction of the courts in Hyderabad, Telangana, India.
              </p>
            </Section>

            {/* 13. Changes */}
            <Section title="13. Changes to These Terms">
              <p>
                We may update these Terms from time to time. Material changes
                will be communicated via email or a prominent notice on the
                platform at least 30 days before they take effect.
              </p>
              <p className="mt-3">
                Continued use of the Service after changes take effect
                constitutes acceptance of the updated Terms.
              </p>
            </Section>

            {/* 14. Contact */}
            <Section title="14. Contact Us">
              <p>
                If you have questions about these Terms, contact us at:
              </p>
              <ul className="list-none mt-3 space-y-1">
                <li>
                  Email:{" "}
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="text-[#00F0FF] hover:underline"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                </li>
                <li>
                  Website:{" "}
                  <a
                    href={COMPANY_URL}
                    className="text-[#00F0FF] hover:underline"
                  >
                    {COMPANY_URL}
                  </a>
                </li>
              </ul>
            </Section>
          </div>
        </div>
      </section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xl md:text-2xl font-bold text-white mb-4">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
