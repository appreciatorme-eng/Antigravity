import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "TripBuilt privacy policy — how we collect, use, and protect your data. GDPR and IT Act 2000 compliant.",
  openGraph: {
    title: "Privacy Policy | TripBuilt",
    description: "How TripBuilt handles your data.",
    images: [
      {
        url: "/api/og?title=Privacy+Policy&subtitle=How+we+handle+your+data",
        width: 1200,
        height: 630,
      },
    ],
  },
};

const EFFECTIVE_DATE = "March 26, 2026";
const COMPANY_NAME = "TripBuilt";
const COMPANY_URL = "https://tripbuilt.com";
const SUPPORT_EMAIL = "privacy@tripbuilt.com";

export default function PrivacyPolicyPage() {
  return (
    <div className="text-white">
      <section className="pt-32 md:pt-40 pb-16 md:pb-20 px-6 md:px-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-400 mb-12">
            Effective date: {EFFECTIVE_DATE}
          </p>

          <div className="space-y-10 text-gray-300 leading-relaxed">
            {/* 1. Introduction */}
            <Section title="1. Introduction">
              <p>
                {COMPANY_NAME} (&quot;we&quot;, &quot;us&quot;, or
                &quot;our&quot;) operates the {COMPANY_NAME} platform at{" "}
                <a
                  href={COMPANY_URL}
                  className="text-[#00F0FF] hover:underline"
                >
                  {COMPANY_URL}
                </a>
                . This Privacy Policy explains how we collect, use, disclose,
                and safeguard your information when you use our platform.
              </p>
              <p>
                {COMPANY_NAME} is a SaaS platform that helps travel agencies and
                tour operators manage their business — including client
                communications, proposals, itineraries, payments, and marketing.
              </p>
            </Section>

            {/* 2. Information We Collect */}
            <Section title="2. Information We Collect">
              <h4 className="text-white font-semibold mt-4 mb-2">
                2.1 Account Information
              </h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Name, email address, and password when you create an account
                </li>
                <li>Organization name and business details</li>
                <li>Profile information (role, phone number)</li>
              </ul>

              <h4 className="text-white font-semibold mt-4 mb-2">
                2.2 Gmail Integration Data
              </h4>
              <p>
                When you connect your Gmail account, we access the following with
                your explicit consent:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong className="text-white">Email messages</strong> — We
                  display your inbox messages within our unified inbox. Messages
                  are fetched in real-time from Gmail and are{" "}
                  <strong className="text-white">not stored</strong> on our
                  servers.
                </li>
                <li>
                  <strong className="text-white">Email sending</strong> — We
                  send emails on your behalf when you compose messages from our
                  platform.
                </li>
                <li>
                  <strong className="text-white">Read status</strong> — We mark
                  emails as read within Gmail when you view them in our inbox.
                </li>
              </ul>
              <p className="mt-3">
                We store OAuth access and refresh tokens (encrypted with
                AES-256-GCM) to maintain your connection. We do{" "}
                <strong className="text-white">not</strong> store email content,
                attachments, or contact lists from your Gmail account.
              </p>

              <h4 className="text-white font-semibold mt-4 mb-2">
                2.3 Payment Information
              </h4>
              <p>
                Payments are processed through Razorpay. We do not store credit
                card numbers or bank account details. Razorpay handles payment
                data under their own PCI-DSS compliant policies.
              </p>

              <h4 className="text-white font-semibold mt-4 mb-2">
                2.4 Usage Data
              </h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Pages visited, features used, and actions taken</li>
                <li>Device type, browser, IP address, and referral source</li>
                <li>Error logs and performance metrics</li>
              </ul>
            </Section>

            {/* 3. How We Use Your Information */}
            <Section title="3. How We Use Your Information">
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Provide and operate the {COMPANY_NAME} platform and its
                  features
                </li>
                <li>
                  Display your Gmail inbox within our unified communications
                  panel
                </li>
                <li>
                  Send emails, WhatsApp messages, and proposals on your behalf
                </li>
                <li>Process payments and generate invoices via Razorpay</li>
                <li>
                  Improve our platform through aggregated, anonymized usage
                  analytics
                </li>
                <li>
                  Send transactional emails (account verification, password
                  resets)
                </li>
                <li>Provide customer support</li>
              </ul>
            </Section>

            {/* 4. Google API Disclosure */}
            <Section title="4. Google API Services User Data Policy">
              <p>
                {COMPANY_NAME}&apos;s use and transfer of information received
                from Google APIs adheres to the{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00F0FF] hover:underline"
                >
                  Google API Services User Data Policy
                </a>
                , including the Limited Use requirements.
              </p>
              <p className="mt-3">Specifically:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  We only request Gmail scopes necessary for the features you
                  use (read inbox, send emails, mark as read).
                </li>
                <li>
                  We do not use Gmail data for advertising, market research, or
                  email tracking purposes.
                </li>
                <li>
                  We do not allow humans to read your email content except (a)
                  with your explicit consent for support purposes, (b) as
                  required by law, or (c) when the data is aggregated and
                  anonymized for internal operations.
                </li>
                <li>
                  We do not transfer Gmail data to third parties except as
                  necessary to provide the service (e.g., displaying emails in
                  our UI) or as required by law.
                </li>
              </ul>
            </Section>

            {/* 5. Data Storage & Security */}
            <Section title="5. Data Storage & Security">
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Account data is stored in Supabase (PostgreSQL) with row-level
                  security (RLS) enabled on all tables.
                </li>
                <li>
                  OAuth tokens are encrypted using AES-256-GCM before storage.
                </li>
                <li>
                  All data in transit is encrypted via TLS 1.2+.
                </li>
                <li>
                  API endpoints are protected with rate limiting, CSRF guards,
                  and authentication checks.
                </li>
                <li>
                  We use Vercel for hosting (SOC 2 Type II compliant).
                </li>
              </ul>
            </Section>

            {/* 6. Data Retention */}
            <Section title="6. Data Retention">
              <p>
                We retain your account data for as long as your account is
                active. When you delete your account or disconnect a service:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>
                  <strong className="text-white">Gmail disconnection</strong>:
                  OAuth tokens are deleted immediately. No email content was
                  stored.
                </li>
                <li>
                  <strong className="text-white">Account deletion</strong>: All
                  personal data is deleted within 30 days. Anonymized usage
                  analytics may be retained.
                </li>
              </ul>
            </Section>

            {/* 7. Your Rights */}
            <Section title="7. Your Rights">
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>
                  <strong className="text-white">Access</strong> your personal
                  data stored in our platform
                </li>
                <li>
                  <strong className="text-white">Correct</strong> inaccurate
                  personal information
                </li>
                <li>
                  <strong className="text-white">Delete</strong> your account
                  and all associated data
                </li>
                <li>
                  <strong className="text-white">Disconnect</strong> third-party
                  integrations (Gmail, WhatsApp) at any time from Settings
                </li>
                <li>
                  <strong className="text-white">Export</strong> your data in a
                  machine-readable format
                </li>
                <li>
                  <strong className="text-white">Withdraw consent</strong> for
                  optional data processing
                </li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, contact us at{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-[#00F0FF] hover:underline"
                >
                  {SUPPORT_EMAIL}
                </a>
                .
              </p>
            </Section>

            {/* 8. Third-Party Services */}
            <Section title="8. Third-Party Services">
              <p>We use the following third-party services:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>
                  <strong className="text-white">Supabase</strong> — Database
                  and authentication
                </li>
                <li>
                  <strong className="text-white">Vercel</strong> — Hosting and
                  deployment
                </li>
                <li>
                  <strong className="text-white">Razorpay</strong> — Payment
                  processing
                </li>
                <li>
                  <strong className="text-white">Google APIs</strong> — Gmail
                  integration
                </li>
                <li>
                  <strong className="text-white">
                    Meta WhatsApp Business API
                  </strong>{" "}
                  — WhatsApp messaging
                </li>
                <li>
                  <strong className="text-white">Resend</strong> — Transactional
                  email delivery
                </li>
              </ul>
              <p className="mt-3">
                Each service has its own privacy policy. We recommend reviewing
                them for details on their data practices.
              </p>
            </Section>

            {/* 9. Cookies */}
            <Section title="9. Cookies">
              <p>
                We use essential cookies for authentication and session
                management. We do not use advertising or third-party tracking
                cookies. Analytics cookies (if any) are anonymized.
              </p>
            </Section>

            {/* 10. Children */}
            <Section title="10. Children&rsquo;s Privacy">
              <p>
                {COMPANY_NAME} is designed for business use by travel
                professionals. We do not knowingly collect data from anyone under
                the age of 18. If you believe a minor has provided us with
                personal data, please contact us and we will promptly delete it.
              </p>
            </Section>

            {/* 11. International */}
            <Section title="11. International Data Transfers">
              <p>
                Our services are hosted on infrastructure located in the United
                States (Vercel) and may use data centers globally (Supabase).
                Data may be transferred to and processed in countries outside
                your jurisdiction. We ensure appropriate safeguards are in place
                for such transfers.
              </p>
            </Section>

            {/* 12. Changes */}
            <Section title="12. Changes to This Policy">
              <p>
                We may update this Privacy Policy from time to time. We will
                notify you of material changes by posting the updated policy on
                this page and updating the effective date. Continued use of the
                platform after changes constitutes acceptance.
              </p>
            </Section>

            {/* 13. Contact */}
            <Section title="13. Contact Us">
              <p>
                If you have questions about this Privacy Policy, contact us at:
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
