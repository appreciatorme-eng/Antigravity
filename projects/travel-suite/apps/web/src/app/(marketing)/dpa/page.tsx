import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Processing Addendum",
  description:
    "TripBuilt Data Processing Addendum — governs processing of End-Client data under the DPDP Act 2023.",
};

const EFFECTIVE_DATE = "April 17, 2026";
const VERSION = "1.0.0";
const COMPANY_NAME = "TripBuilt";
const COMPANY_URL = "https://tripbuilt.com";
const SUPPORT_EMAIL = "support@tripbuilt.com";

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

export default function DPAPage() {
  return (
    <div className="text-white">
      <section className="pt-32 md:pt-40 pb-16 md:pb-20 px-6 md:px-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black mb-4">Data Processing Addendum</h1>
          <p className="text-gray-400 mb-12">
            Effective date: {EFFECTIVE_DATE} &nbsp;·&nbsp; Version: {VERSION}
          </p>

          <div className="space-y-10 leading-relaxed">

            <Section title="1. Parties and Role Allocation">
              <p>
                This Data Processing Addendum (&quot;DPA&quot;) governs the processing of
                End-Client Data by {COMPANY_NAME} (&quot;TripBuilt&quot;) on behalf of Operators.
                It forms part of the{" "}
                <a href="/terms" className="text-[#00F0FF] hover:underline">Terms of Service</a>.
              </p>
              <ul className="list-disc pl-5 space-y-1 marker:text-[#00F0FF]">
                <li><strong className="text-white">Operator</strong> is the <strong className="text-white">Data Fiduciary</strong> (as defined under the DPDP Act, 2023) — the entity that determines the purposes and means of processing End-Client Data.</li>
                <li><strong className="text-white">TripBuilt</strong> is the <strong className="text-white">Data Processor</strong> — processing End-Client Data solely on the Operator&apos;s instructions within the Platform.</li>
              </ul>
              <p>
                TripBuilt acts as a separate Data Fiduciary for Personal Data of Operators&apos;
                authorized users processed for its own account management purposes, which is
                governed by the{" "}
                <a href="/privacy" className="text-[#00F0FF] hover:underline">Privacy Policy</a>.
              </p>
            </Section>

            <Section title="2. Subject-Matter and Duration">
              <p>
                TripBuilt shall process End-Client Data to provide the Platform services
                described in the Terms and Documentation. Processing continues for the
                duration of the Operator&apos;s active Subscription plus the 30-day data export
                window following termination, after which TripBuilt deletes or anonymizes
                the data per the Privacy Policy retention schedule, unless Applicable Law
                requires longer retention.
              </p>
            </Section>

            <Section title="3. Nature and Purpose of Processing">
              <p>TripBuilt processes End-Client Data to:</p>
              <ul className="list-disc pl-5 space-y-1 marker:text-[#00F0FF]">
                <li>Store and display End-Client profiles, booking details, and travel documents;</li>
                <li>Enable the Operator to generate proposals, itineraries, and GST invoices;</li>
                <li>Facilitate WhatsApp and email communications between Operator and End-Clients;</li>
                <li>Enable payment tracking and reconciliation;</li>
                <li>Provide AI-assisted features where the Operator has activated them;</li>
                <li>Maintain audit logs and ensure Platform security; and</li>
                <li>Comply with Applicable Law and lawful regulatory requests.</li>
              </ul>
              <p>
                TripBuilt shall not process End-Client Data for its own marketing, product
                development, or commercial purposes.
              </p>
            </Section>

            <Section title="4. Types of Personal Data and Categories">
              <p>
                End-Client Data processed through the Platform may include: names, email
                addresses, phone numbers, passport and travel document numbers, travel
                itineraries, payment references, preferences and special requirements,
                and any other data the Operator chooses to enter.
              </p>
              <p>
                <strong className="text-white">Sensitive Personal Data:</strong> Passport
                numbers and government-issued identifiers are Sensitive Personal Data under
                the SPDI Rules. Operators are responsible for ensuring they have a required
                lawful basis before entering such data.
              </p>
            </Section>

            <Section title="5. Operator Obligations">
              <p>The Operator represents, warrants, and covenants that:</p>
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[#00F0FF]">
                <li>It has a lawful basis under the DPDP Act for processing each category of End-Client Data;</li>
                <li>It has provided End-Clients with all required privacy notices and obtained all required consents;</li>
                <li>It is solely responsible for the accuracy and completeness of End-Client Data;</li>
                <li>It will respond to rights requests from End-Clients and relay to TripBuilt any rights requests requiring TripBuilt&apos;s assistance;</li>
                <li>It will not instruct TripBuilt to process End-Client Data in violation of Applicable Law; and</li>
                <li>It will promptly notify TripBuilt of any breach or unauthorized access to End-Client Data.</li>
              </ul>
            </Section>

            <Section title="6. TripBuilt's Obligations as Data Processor">
              <ul className="list-disc pl-5 space-y-2 marker:text-[#00F0FF]">
                <li><strong className="text-white">Processing per Instructions:</strong> Process End-Client Data only on documented Operator instructions.</li>
                <li><strong className="text-white">Confidentiality:</strong> Ensure all personnel authorized to process End-Client Data are bound by confidentiality obligations.</li>
                <li><strong className="text-white">Security:</strong> Maintain the security measures described in Section 9 and the Privacy Policy.</li>
                <li><strong className="text-white">Breach Notification:</strong> Notify the Operator within 48 hours of becoming aware of a Personal Data breach affecting End-Client Data.</li>
                <li><strong className="text-white">Rights Request Assistance:</strong> Provide reasonable assistance for Operator compliance with End-Client rights requests.</li>
                <li><strong className="text-white">Sub-Processors:</strong> Provide at least 30 days&apos; written notice before engaging a new Sub-Processor or making material changes.</li>
                <li><strong className="text-white">Return and Deletion:</strong> On Subscription expiry, make End-Client Data available for download or delete it and certify deletion in writing.</li>
              </ul>
            </Section>

            <Section title="7. Sub-Processors">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-2 pr-4 text-white font-semibold">Sub-Processor</th>
                      <th className="text-left py-2 pr-4 text-white font-semibold">Purpose</th>
                      <th className="text-left py-2 text-white font-semibold">Country</th>
                    </tr>
                  </thead>
                  <tbody>
                    <TableRow cells={["Supabase Inc.", "Database hosting, authentication, storage", "Singapore"]} />
                    <TableRow cells={["Vercel Inc.", "Platform hosting, CDN, serverless functions", "United States"]} />
                    <TableRow cells={["Razorpay Software Pvt Ltd", "Payment processing, GST invoicing", "India"]} />
                    <TableRow cells={["Meta Platforms, Inc.", "WhatsApp Cloud API — message delivery", "United States"]} />
                    <TableRow cells={["Google LLC", "Gmail API integration", "United States"]} />
                    <TableRow cells={["OpenAI LLC", "AI-assisted content generation", "United States"]} />
                    <TableRow cells={["Upstash Inc.", "Rate limiting, caching (Redis)", "United States / EU"]} />
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="8. International Data Transfers">
              <p>
                End-Client Data is processed by some Sub-Processors outside India. Where
                the destination country is notified as adequate under Section 16 of the
                DPDP Act, the transfer proceeds on that basis. Otherwise, TripBuilt ensures
                contractual safeguards requiring equivalent data protection standards. All
                transfers comply with FEMA, 1999 to the extent applicable.
              </p>
            </Section>

            <Section title="9. Security Measures">
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[#00F0FF]">
                <li><strong className="text-white">Encryption in Transit:</strong> TLS 1.2 or higher on all data transmissions.</li>
                <li><strong className="text-white">Encryption at Rest:</strong> AES-256 via Supabase&apos;s storage layer.</li>
                <li><strong className="text-white">Access Controls:</strong> Role-based access controls (RBAC) with multi-factor authentication for production systems.</li>
                <li><strong className="text-white">Audit Logging:</strong> All access to End-Client Data logged and retained for 12 months.</li>
                <li><strong className="text-white">Vulnerability Management:</strong> Regular dependency audits (Dependabot, npm audit) and code reviews.</li>
                <li><strong className="text-white">Incident Response:</strong> Written incident response procedure with priority triage.</li>
                <li><strong className="text-white">Sub-Processor Due Diligence:</strong> Sub-Processors required to maintain industry-standard security certifications.</li>
                <li><strong className="text-white">Network Security:</strong> Firewall controls, rate limiting (Upstash), and DDoS mitigation (Vercel edge network).</li>
              </ul>
            </Section>

            <Section title="10. Audit Rights">
              <p>
                No more than once per 12-month period (unless TripBuilt has suffered a
                material security incident), the Operator may request an audit of TripBuilt&apos;s
                data processing activities. At least 30 days&apos; written notice is required.
                Audits occur during business hours at the Operator&apos;s expense without
                unreasonably disrupting TripBuilt&apos;s operations. TripBuilt may satisfy the
                audit right by providing a current third-party audit report (e.g., SOC 2
                Type II) covering the relevant controls.
              </p>
            </Section>

            <Section title="11. Governing Law">
              <p>
                This DPA is governed by the laws of India. Disputes arising under this
                DPA are resolved per the dispute resolution provisions in the{" "}
                <a href="/terms" className="text-[#00F0FF] hover:underline">Terms of Service</a>,
                with courts of Hyderabad, Telangana having jurisdiction for non-arbitrated matters.
              </p>
            </Section>

            <section className="pt-6 border-t border-white/10">
              <p className="text-gray-400 text-sm">
                Questions? Contact:{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#00F0FF] hover:underline">
                  {SUPPORT_EMAIL}
                </a>{" "}
                · {COMPANY_NAME} · {COMPANY_URL}
              </p>
            </section>

          </div>
        </div>
      </section>
    </div>
  );
}
