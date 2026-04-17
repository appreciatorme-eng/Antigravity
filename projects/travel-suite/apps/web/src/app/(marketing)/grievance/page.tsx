import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Grievance Policy",
  description:
    "TripBuilt Grievance Policy — IT Rules 2021 §3(2) and DPDP Act 2023 compliant. File a complaint or escalate to the Grievance Officer.",
};

const EFFECTIVE_DATE = "April 17, 2026";
const VERSION = "1.0.0";
const COMPANY_NAME = "TripBuilt";
const COMPANY_URL = "https://tripbuilt.com";
const SUPPORT_EMAIL = "support@tripbuilt.com";
const GRIEVANCE_OFFICER_NAME = "TripBuilt Grievance Team";
const GRIEVANCE_OFFICER_EMAIL = "grievance@tripbuilt.com";
const GRIEVANCE_OFFICER_PHONE = "+91 98765 43210";
const REGISTERED_OFFICE_ADDRESS = "Hyderabad, Telangana, India";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-white mb-3">{title}</h2>
      <div className="space-y-3 text-gray-300">{children}</div>
    </section>
  );
}

export default function GrievancePage() {
  return (
    <div className="text-white">
      <section className="pt-32 md:pt-40 pb-16 md:pb-20 px-6 md:px-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black mb-4">Grievance Policy</h1>
          <p className="text-gray-400 mb-12">
            Effective date: {EFFECTIVE_DATE} &nbsp;·&nbsp; Version: {VERSION}
          </p>

          {/* Grievance Officer Card — prominent, above the fold */}
          <div className="mb-12 rounded-xl border border-[#00F0FF]/30 bg-[#00F0FF]/5 p-5 sm:p-6">
            <p className="text-xs uppercase tracking-widest text-[#00F0FF] font-semibold mb-3">Grievance Officer</p>
            <p className="text-lg font-bold text-white">{GRIEVANCE_OFFICER_NAME}</p>
            <p className="text-sm text-gray-400 mb-3">Designated per IT Rules 2021, Rule 3(2) and DPDP Act 2023</p>
            <div className="space-y-1 text-sm text-gray-300">
              <p>
                <strong className="text-white">Email:</strong>{" "}
                <a href={`mailto:${GRIEVANCE_OFFICER_EMAIL}`} className="text-[#00F0FF] hover:underline">
                  {GRIEVANCE_OFFICER_EMAIL}
                </a>
              </p>
              <p><strong className="text-white">Phone:</strong> {GRIEVANCE_OFFICER_PHONE}</p>
              <p><strong className="text-white">Address:</strong> {REGISTERED_OFFICE_ADDRESS}</p>
              <p><strong className="text-white">Hours:</strong> Mon–Fri, 10:00 AM – 6:00 PM IST (excluding national public holidays)</p>
            </div>
            <div className="mt-3 text-xs text-gray-400 border-t border-white/10 pt-3">
              Complaints <strong className="text-white">acknowledged within 24 hours</strong> and{" "}
              <strong className="text-white">resolved within 15 days</strong> of receipt.
            </div>
          </div>

          <div className="space-y-10 leading-relaxed">

            <Section title="1. Purpose">
              <p>
                {COMPANY_NAME} (&quot;TripBuilt&quot;) is committed to providing a transparent,
                accessible, and effective grievance redressal mechanism for all Platform users.
                This Policy is published in compliance with:
              </p>
              <ul className="list-disc pl-5 space-y-1 marker:text-[#00F0FF]">
                <li>Rule 3(2) of the IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 (&quot;IT Rules 2021&quot;);</li>
                <li>Section 13 of the Digital Personal Data Protection Act, 2023 (&quot;DPDP Act&quot;); and</li>
                <li>Applicable provisions of the Consumer Protection Act, 2019 and the Consumer Protection (E-Commerce) Rules, 2020.</li>
              </ul>
            </Section>

            <Section title="2. Scope of Grievances">
              <p>This Policy covers:</p>
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[#00F0FF]">
                <li><strong className="text-white">Content grievances:</strong> Complaints about content alleged to be unlawful, infringing, defamatory, or in violation of the AUP or IT Rules 2021.</li>
                <li><strong className="text-white">Privacy and data protection:</strong> Alleged violations of the DPDP Act, IT Act, SPDI Rules, or Privacy Policy.</li>
                <li><strong className="text-white">Service grievances:</strong> Platform availability, billing disputes, refund delays, or failure to deliver services.</li>
                <li><strong className="text-white">Account grievances:</strong> Account suspension, termination, or access restrictions.</li>
                <li><strong className="text-white">Third-party conduct:</strong> Spam, harassment, or misuse of End-Client Data by another Operator.</li>
              </ul>
            </Section>

            <Section title="3. How to File a Grievance">
              <p className="font-semibold text-white">Option A — By Email (Recommended)</p>
              <p>
                Email{" "}
                <a href={`mailto:${GRIEVANCE_OFFICER_EMAIL}`} className="text-[#00F0FF] hover:underline">
                  {GRIEVANCE_OFFICER_EMAIL}
                </a>{" "}
                with subject: &quot;Grievance — [Brief Description].&quot; Include:
              </p>
              <ul className="list-disc pl-5 space-y-1 marker:text-[#00F0FF]">
                <li>Your name and registered email address;</li>
                <li>A description of the issue, when it occurred, and the relief sought;</li>
                <li>Supporting documents, screenshots, or references; and</li>
                <li>Your preferred mode of follow-up contact.</li>
              </ul>
              <p className="font-semibold text-white mt-2">Option B — By Post</p>
              <p>
                Send a written grievance to <strong className="text-white">{REGISTERED_OFFICE_ADDRESS}</strong>,
                marked &quot;Attn: Grievance Officer.&quot;
              </p>
            </Section>

            <Section title="4. Acknowledgement and Resolution">
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[#00F0FF]">
                <li>All grievances are <strong className="text-white">acknowledged within 24 hours</strong> per IT Rules 2021, Rule 3(2), with a grievance reference number and expected timeline.</li>
                <li>Grievances are <strong className="text-white">resolved within 15 days</strong> of receipt. For grievances requiring investigation, TripBuilt provides progress updates at intervals not exceeding 7 days.</li>
                <li>Resolution may include: removal or restriction of content, correction of data, Account reinstatement, issuance of a refund, or a reasoned explanation of why no action is warranted.</li>
              </ul>
            </Section>

            <Section title="5. Escalation to Senior Management">
              <p>
                If the Grievance Officer&apos;s resolution is unsatisfactory or 15 days pass
                without a response, escalate to TripBuilt&apos;s senior management by emailing{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#00F0FF] hover:underline">
                  {SUPPORT_EMAIL}
                </a>{" "}
                with subject &quot;Grievance Escalation — [Grievance Reference Number].&quot; Senior
                management will respond within 10 business days.
              </p>
            </Section>

            <Section title="6. Grievance Appellate Committee (IT Rules 2021)">
              <p>
                If you are not satisfied with TripBuilt&apos;s resolution on a matter covered
                under IT Rules 2021 (including content moderation decisions), you may appeal
                to the Grievance Appellate Committee (&quot;GAC&quot;) established by the Central
                Government under Rule 3A of the IT Rules 2021. Appeals must be filed within
                30 days of TripBuilt&apos;s decision through the GAC portal at{" "}
                <a
                  href="https://gac.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00F0FF] hover:underline"
                >
                  gac.gov.in
                </a>
                {" "}(or as notified by MeitY). TripBuilt will comply with any GAC order.
              </p>
            </Section>

            <Section title="7. Data Protection Grievances (DPDP Act §13)">
              <p>
                For grievances relating to the processing of Personal Data or the exercise
                of rights under the DPDP Act, file a complaint with the Grievance Officer
                using Section 3 above. If unresolved within 15 days, you may escalate to
                the <strong className="text-white">Data Protection Board of India</strong>{" "}
                once constituted under the DPDP Act. Contact details will be published on
                the Platform once the Board begins receiving complaints.
              </p>
            </Section>

            <Section title="8. Consumer Grievances (CPA 2019)">
              <p>
                If TripBuilt&apos;s internal process has not resolved a consumer rights matter,
                you may contact:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[#00F0FF]">
                <li>
                  <strong className="text-white">National Consumer Helpline:</strong>{" "}
                  Call 1800-11-4000 (toll-free) or visit{" "}
                  <a
                    href="https://consumerhelpline.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00F0FF] hover:underline"
                  >
                    consumerhelpline.gov.in
                  </a>
                  .
                </li>
                <li>
                  <strong className="text-white">e-Daakhil Portal:</strong>{" "}
                  File with the appropriate Consumer Disputes Redressal Commission at{" "}
                  <a
                    href="https://edaakhil.nic.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00F0FF] hover:underline"
                  >
                    edaakhil.nic.in
                  </a>
                  .
                </li>
              </ul>
            </Section>

            <Section title="9. Record-Keeping">
              <p>
                In accordance with IT Rules 2021, TripBuilt maintains records of all
                grievances received and actions taken for at least 3 years from receipt
                and makes them available to appropriate governmental authorities upon
                lawful request.
              </p>
            </Section>

            <section className="pt-6 border-t border-white/10">
              <p className="text-gray-400 text-sm">
                {COMPANY_NAME} · Grievance Officer: {GRIEVANCE_OFFICER_NAME} ·{" "}
                <a href={`mailto:${GRIEVANCE_OFFICER_EMAIL}`} className="text-[#00F0FF] hover:underline">
                  {GRIEVANCE_OFFICER_EMAIL}
                </a>{" "}
                · {REGISTERED_OFFICE_ADDRESS} ·{" "}
                <a href={COMPANY_URL} className="text-[#00F0FF] hover:underline">
                  {COMPANY_URL}
                </a>
              </p>
            </section>

          </div>
        </div>
      </section>
    </div>
  );
}
