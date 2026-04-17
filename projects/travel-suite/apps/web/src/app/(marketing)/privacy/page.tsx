/**
 * TODO (LEGAL REVIEW REQUIRED): Populate all PLACEHOLDER_* constants below with
 * real contact details before go-live. Have a licensed Indian advocate review
 * this document. The DPDP Act 2023 Rules were pending finalization at time of
 * drafting — verify current requirements before launch.
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "TripBuilt Privacy Policy — DPDP Act 2023 and IT Act 2000 compliant. How we collect, use, and protect your data.",
  openGraph: {
    title: "Privacy Policy | TripBuilt",
    description: "How TripBuilt handles your data under Indian law.",
    images: [
      {
        url: "/api/og?title=Privacy+Policy&subtitle=How+we+handle+your+data",
        width: 1200,
        height: 630,
      },
    ],
  },
};

const EFFECTIVE_DATE = "April 17, 2026";
const VERSION = "1.0.0";
const COMPANY_NAME = "TripBuilt";
const COMPANY_URL = "https://tripbuilt.com";
const SUPPORT_EMAIL = "support@tripbuilt.com";
const GRIEVANCE_OFFICER_NAME = "PLACEHOLDER_OFFICER_NAME";
const GRIEVANCE_OFFICER_EMAIL = "grievance@tripbuilt.com";
const GRIEVANCE_OFFICER_PHONE = "PLACEHOLDER_PHONE";
const REGISTERED_OFFICE_ADDRESS = "Hyderabad, Telangana, India";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-white mb-3">{title}</h2>
      <div className="space-y-3 text-gray-300">{children}</div>
    </section>
  );
}

function TableRow({ cells }: { cells: string[] }) {
  return (
    <tr className="border-b border-white/10">
      {cells.map((c, i) => (
        <td key={i} className="py-2 pr-4 text-sm text-gray-300 align-top">
          {c}
        </td>
      ))}
    </tr>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="text-white">
      <section className="pt-32 md:pt-40 pb-16 md:pb-20 px-6 md:px-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-400 mb-2">
            Effective date: {EFFECTIVE_DATE} &nbsp;·&nbsp; Version: {VERSION}
          </p>
          <p className="text-amber-400/80 text-sm mb-12 border border-amber-400/30 bg-amber-400/10 rounded-lg p-3">
            DRAFT — to be reviewed by a licensed Indian advocate before go-live.
          </p>

          <div className="space-y-10 text-gray-300 leading-relaxed">

            <Section title="1. Introduction and Scope">
              <p>
                {COMPANY_NAME} (&quot;TripBuilt,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;)
                is committed to protecting the privacy and security of personal data.
                This Privacy Policy explains how we collect, use, store, share, and
                protect Personal Data in connection with our platform at{" "}
                <a href={COMPANY_URL} className="text-[#00F0FF] hover:underline">
                  {COMPANY_URL}
                </a>
                .
              </p>
              <p>
                This Policy applies to: (a) Operators — travel agencies and tour
                operators who subscribe to the Platform; (b) authorized sub-users;
                and (c) End-Clients whose data Operators process through the Platform.
              </p>
              <p>
                This Policy is published in compliance with: the Digital Personal Data
                Protection Act, 2023 (&quot;DPDP Act&quot;); the Information Technology Act,
                2000 (&quot;IT Act&quot;); the IT (Reasonable Security Practices and Procedures
                and Sensitive Personal Data or Information) Rules, 2011 (&quot;SPDI Rules&quot;);
                and the IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.
              </p>
              <p>
                If you are an Operator processing End-Client Data through the Platform,
                please also refer to our{" "}
                <a href="/dpa" className="text-[#00F0FF] hover:underline">
                  Data Processing Addendum
                </a>.
              </p>
            </Section>

            <Section title="2. Categories of Personal Data Collected">
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[#00F0FF]">
                <li>
                  <strong className="text-white">Account and Registration Data:</strong>{" "}
                  Business name, GSTIN, registered address, contact name, email address,
                  phone number, designation, and password (hashed, never stored in plaintext).
                </li>
                <li>
                  <strong className="text-white">Billing and Payment Data:</strong>{" "}
                  Name, billing address, last 4 digits of payment instrument, transaction
                  IDs, GST invoice details, and payment history. Full card numbers are
                  processed by Razorpay and not stored by TripBuilt.
                </li>
                <li>
                  <strong className="text-white">Usage Telemetry:</strong>{" "}
                  Pages visited, features used, session duration, click data, and event logs.
                </li>
                <li>
                  <strong className="text-white">Device and Technical Data:</strong>{" "}
                  IP address, browser type and version, operating system, screen resolution,
                  time zone, and referring URLs.
                </li>
                <li>
                  <strong className="text-white">Communication Data:</strong>{" "}
                  Support tickets, emails, and any other communications sent to TripBuilt.
                </li>
                <li>
                  <strong className="text-white">Integration-Scoped Data:</strong>{" "}
                  Gmail API: email metadata and message content for messages you import.
                  WhatsApp Cloud API: message content, delivery status, and opt-in/opt-out signals.
                </li>
                <li>
                  <strong className="text-white">End-Client Data:</strong>{" "}
                  Personal Data of End-Clients entered by Operators, which may include names,
                  email addresses, phone numbers, passport details, travel preferences, and
                  payment information.
                </li>
              </ul>
            </Section>

            <Section title="3. How We Collect Data">
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[#00F0FF]">
                <li>Directly from you when you register, subscribe, or interact with the Platform.</li>
                <li>Automatically through server logs, analytics, and cookies when you use the Platform.</li>
                <li>From third parties via integrations you authorize (Gmail OAuth, Meta WhatsApp Business, Razorpay).</li>
                <li>From Operators when they enter, import, or upload End-Client Data.</li>
              </ul>
            </Section>

            <Section title="4. Purposes and Legal Bases (DPDP Act §7)">
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[#00F0FF]">
                <li><strong className="text-white">Account creation and management</strong> — necessary to perform the Terms of Service contract.</li>
                <li><strong className="text-white">Service delivery</strong> — necessary to provide the subscribed Platform features.</li>
                <li><strong className="text-white">Payment processing and billing</strong> — necessary to perform the contract and comply with GST law and RBI regulations.</li>
                <li><strong className="text-white">Customer support</strong> — legitimate interest in providing assistance.</li>
                <li><strong className="text-white">Platform security and fraud prevention</strong> — legitimate interest in Platform integrity.</li>
                <li><strong className="text-white">Usage analytics and product improvement</strong> — legitimate interest, subject to anonymization.</li>
                <li><strong className="text-white">Marketing communications</strong> — consent or legitimate interest (existing Operators), with opt-out available.</li>
                <li><strong className="text-white">Legal compliance</strong> — IT Act, DPDP Act, GST law, and court/regulatory orders.</li>
                <li><strong className="text-white">End-Client Data</strong> — processed on the Operator&apos;s instructions per the DPA; not used for TripBuilt&apos;s own commercial purposes.</li>
              </ul>
            </Section>

            <Section title="5. Sharing and Disclosure">
              <p>
                TripBuilt does not sell Personal Data. We may share it only in these
                limited circumstances: with Sub-Processors as necessary to provide the
                Platform (see Section 6); as required by Applicable Law or court order;
                in connection with a business transfer (merger, acquisition, or asset
                sale); to protect TripBuilt&apos;s rights or detect fraud; or with your
                prior written consent.
              </p>
            </Section>

            <Section title="6. Sub-Processors">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-2 pr-4 text-white font-semibold">Sub-Processor</th>
                      <th className="text-left py-2 pr-4 text-white font-semibold">Purpose</th>
                      <th className="text-left py-2 text-white font-semibold">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    <TableRow cells={["Supabase Inc.", "Database, auth, storage", "Singapore (AP)"]} />
                    <TableRow cells={["Vercel Inc.", "Hosting, CDN, edge functions", "United States"]} />
                    <TableRow cells={["Razorpay Software Pvt Ltd", "Payment processing", "India"]} />
                    <TableRow cells={["Meta Platforms, Inc.", "WhatsApp Cloud API messaging", "United States"]} />
                    <TableRow cells={["Google LLC", "Gmail API, Google Workspace", "United States"]} />
                    <TableRow cells={["OpenAI LLC", "AI-assisted features", "United States"]} />
                    <TableRow cells={["Upstash Inc.", "Rate limiting, caching (Redis)", "United States / EU"]} />
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="7. Cross-Border Transfers">
              <p>
                Some Personal Data is processed by Sub-Processors outside India (see Section 6).
                TripBuilt complies with Section 16 of the DPDP Act. Where the destination
                country is not designated as adequate, TripBuilt ensures contractual
                safeguards with Sub-Processors require equivalent data protection standards.
                All cross-border transfers comply with FEMA, 1999.
              </p>
            </Section>

            <Section title="8. Data Retention">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-2 pr-4 text-white font-semibold">Category</th>
                      <th className="text-left py-2 text-white font-semibold">Retention Period</th>
                    </tr>
                  </thead>
                  <tbody>
                    <TableRow cells={["Account and registration data", "Account duration + 12 months post-closure"]} />
                    <TableRow cells={["Usage logs and telemetry", "90 days"]} />
                    <TableRow cells={["Payment and billing records", "8 years (GST and RBI audit requirements)"]} />
                    <TableRow cells={["Support communications", "3 years"]} />
                    <TableRow cells={["End-Client Data", "Duration of Operator's account + 30-day export window, then deletion"]} />
                    <TableRow cells={["Audit logs (security)", "12 months"]} />
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="9. Your Rights (DPDP Act §§11–14)">
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[#00F0FF]">
                <li><strong className="text-white">Right of Access:</strong> Obtain a summary of Personal Data processed and processing activities.</li>
                <li><strong className="text-white">Right of Correction and Erasure:</strong> Request correction of inaccurate data or erasure where processing is no longer required.</li>
                <li><strong className="text-white">Right to Grievance Redressal:</strong> Have grievances addressed promptly.</li>
                <li><strong className="text-white">Right to Nomination:</strong> Nominate another individual to exercise rights in the event of death or incapacity.</li>
                <li><strong className="text-white">Right to Withdraw Consent:</strong> Withdraw consent at any time without affecting prior lawful processing.</li>
              </ul>
              <p>
                To exercise any right, submit a written request to{" "}
                <a href={`mailto:${GRIEVANCE_OFFICER_EMAIL}`} className="text-[#00F0FF] hover:underline">
                  {GRIEVANCE_OFFICER_EMAIL}
                </a>
                . We will respond within timelines prescribed under the DPDP Act.
              </p>
              <p>
                <strong className="text-white">End-Clients</strong> seeking to exercise rights
                over data stored in the Platform should contact the Operator first (the Data
                Fiduciary). Operators may relay rights requests to TripBuilt via the DPA mechanism.
              </p>
            </Section>

            <Section title="10. Consent and Withdrawal">
              <p>
                Where we rely on consent as the legal basis for processing (DPDP Act §6),
                you may withdraw consent at any time by: updating communication preferences
                in Account settings; using the unsubscribe link in marketing emails; or
                contacting us at{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#00F0FF] hover:underline">
                  {SUPPORT_EMAIL}
                </a>.
              </p>
              <p>
                <strong className="text-white">Children&apos;s data (DPDP Act §9):</strong>{" "}
                If End-Client Data relates to individuals under 18, Operators are responsible
                for obtaining verifiable parental or guardian consent. TripBuilt does not
                knowingly process Personal Data of children through the general registration process.
              </p>
            </Section>

            <Section title="11. Security Measures">
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[#00F0FF]">
                <li><strong className="text-white">Encryption in Transit:</strong> TLS 1.2 or higher on all data transmissions.</li>
                <li><strong className="text-white">Encryption at Rest:</strong> AES-256 encryption via Supabase&apos;s storage layer.</li>
                <li><strong className="text-white">Access Controls:</strong> Role-based access controls with multi-factor authentication for production systems.</li>
                <li><strong className="text-white">Audit Logs:</strong> All access to sensitive data is logged and retained for 12 months.</li>
                <li><strong className="text-white">Vulnerability Management:</strong> Regular dependency audits (Dependabot, npm audit) and code reviews.</li>
                <li><strong className="text-white">Incident Response:</strong> Written incident response procedure with priority triage.</li>
              </ul>
            </Section>

            <Section title="12. Breach Notification (DPDP Act §8(6))">
              <p>
                In the event of a Personal Data breach, TripBuilt will: (a) contain and
                assess the breach promptly; (b) notify the Data Protection Board of India
                within 72 hours of becoming aware; (c) notify affected Data Principals as
                required by the DPDP Act. Where a breach involves End-Client Data,
                TripBuilt will notify the Operator within 48 hours per the DPA.
              </p>
            </Section>

            <Section title="13. Cookies">
              <p>
                The Platform uses cookies for: session authentication (strictly necessary,
                cannot be disabled); usage analytics (can be disabled via browser settings);
                user preferences such as language; and third-party integrations. You may
                configure your browser to refuse or delete non-essential cookies, but
                doing so may affect Platform functionality.
              </p>
            </Section>

            <Section title="14. Grievance Officer">
              <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 space-y-1 text-sm">
                <p><strong className="text-white">Name:</strong> {GRIEVANCE_OFFICER_NAME}</p>
                <p><strong className="text-white">Email:</strong>{" "}
                  <a href={`mailto:${GRIEVANCE_OFFICER_EMAIL}`} className="text-[#00F0FF] hover:underline">
                    {GRIEVANCE_OFFICER_EMAIL}
                  </a>
                </p>
                <p><strong className="text-white">Phone:</strong> {GRIEVANCE_OFFICER_PHONE}</p>
                <p><strong className="text-white">Address:</strong> {REGISTERED_OFFICE_ADDRESS}</p>
                <p className="text-gray-400 text-xs pt-1">
                  Privacy grievances acknowledged within 24 hours, resolved within 15 days (IT Rules 2021).
                </p>
              </div>
            </Section>

            <Section title="15. Changes to This Policy">
              <p>
                TripBuilt may update this Privacy Policy from time to time. Material changes
                will be notified via email and in-app notification at least 30 days before
                taking effect. Continued use of the Platform after the effective date
                constitutes acceptance of the revised Policy.
              </p>
            </Section>

            <section className="pt-6 border-t border-white/10">
              <p className="text-gray-400 text-sm">
                For all privacy-related queries, contact:{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#00F0FF] hover:underline">
                  {SUPPORT_EMAIL}
                </a>
                {" "}·{" "}
                <strong className="text-white">{COMPANY_NAME}</strong>
                {" · "}{REGISTERED_OFFICE_ADDRESS}
              </p>
            </section>

          </div>
        </div>
      </section>
    </div>
  );
}
