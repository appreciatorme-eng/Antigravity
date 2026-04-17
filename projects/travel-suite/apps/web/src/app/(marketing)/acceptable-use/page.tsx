import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceptable Use Policy",
  description:
    "TripBuilt Acceptable Use Policy — rules governing platform use, WhatsApp messaging compliance (TCCCPR 2018), and prohibited content under IT Rules 2021.",
};

const EFFECTIVE_DATE = "April 17, 2026";
const VERSION = "1.0.0";
const COMPANY_NAME = "TripBuilt";
const COMPANY_URL = "https://tripbuilt.com";
const SUPPORT_EMAIL = "support@tripbuilt.com";
const GRIEVANCE_OFFICER_EMAIL = "grievance@tripbuilt.com";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-white mb-3">{title}</h2>
      <div className="space-y-3 text-gray-300">{children}</div>
    </section>
  );
}

export default function AcceptableUsePolicyPage() {
  return (
    <div className="text-white">
      <section className="pt-32 md:pt-40 pb-16 md:pb-20 px-6 md:px-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black mb-4">Acceptable Use Policy</h1>
          <p className="text-gray-400 mb-12">
            Effective date: {EFFECTIVE_DATE} &nbsp;·&nbsp; Version: {VERSION}
          </p>

          <div className="space-y-10 leading-relaxed">

            <Section title="1. Purpose and Scope">
              <p>
                This Acceptable Use Policy (&quot;AUP&quot;) sets out the rules governing
                your use of the {COMPANY_NAME} Platform (&quot;TripBuilt&quot;). This AUP is
                incorporated by reference into the{" "}
                <a href="/terms" className="text-[#00F0FF] hover:underline">Terms of Service</a>.
                Capitalized terms not defined here have the meanings given in the Terms.
              </p>
              <p>
                TripBuilt is a professional B2B tool for travel agencies and tour operators.
                All use must be consistent with its intended business purpose, Applicable Law,
                and this AUP.
              </p>
            </Section>

            <Section title="2. General Prohibitions">
              <p>You shall not use the Platform to:</p>
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[#00F0FF]">
                <li>Violate any Applicable Law, regulation, or court order;</li>
                <li>Send or transmit content that is unlawful, fraudulent, threatening, abusive, harassing, defamatory, or obscene;</li>
                <li>Impersonate any person or entity, or misrepresent your affiliation;</li>
                <li>Engage in deceptive, misleading, or false advertising;</li>
                <li>Transmit spam or unsolicited commercial communications;</li>
                <li>Upload or share malware, viruses, or other harmful code;</li>
                <li>Collect Personal Data of other users without consent;</li>
                <li>Engage in activity that disrupts or degrades the Platform or its infrastructure;</li>
                <li>Use the Platform for any purpose other than your internal travel business operations; or</li>
                <li>Use the Platform to compete with TripBuilt or develop a competing product (see Section 6).</li>
              </ul>
            </Section>

            <Section title="3. Prohibited Content">
              <p>You shall not create, upload, store, share, or transmit content that:</p>
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[#00F0FF]">
                <li>Is obscene, pornographic, or sexually explicit;</li>
                <li>Constitutes child sexual abuse material (&quot;CSAM&quot;) — TripBuilt will immediately report such content to law enforcement and the National Cyber Crime Reporting Portal (cybercrime.gov.in);</li>
                <li>Promotes, incites, or facilitates terrorism, extremism, or violence;</li>
                <li>Incites communal disharmony or hatred on any ground protected under Indian law;</li>
                <li>Threatens the sovereignty, integrity, or security of India;</li>
                <li>Constitutes defamation, libel, or slander;</li>
                <li>Infringes any Intellectual Property Right;</li>
                <li>Contains misinformation or disinformation likely to cause public disorder;</li>
                <li>Violates any individual&apos;s privacy rights; or</li>
                <li>Is otherwise prohibited under Rule 3(1)(b) of the IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.</li>
              </ul>
            </Section>

            <Section title="4. Messaging-Specific Rules">
              <p className="font-semibold text-white">4.1 WhatsApp Messaging</p>
              <p>
                The Platform enables WhatsApp Business messaging via the Meta WhatsApp
                Cloud API. You must:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[#00F0FF]">
                <li>Send WhatsApp messages only to End-Clients who have expressly opted in, per Meta&apos;s WhatsApp Business Policy;</li>
                <li>Comply with the Telecom Commercial Communications Customer Preference Regulations, 2018 (&quot;TCCCPR 2018&quot;) and TRAI&apos;s Distributed Ledger Technology (&quot;DLT&quot;) registration requirements, including registering your business and message templates on the applicable DLT platform;</li>
                <li>Respect the Do Not Disturb (&quot;DND&quot;) registry maintained by TRAI;</li>
                <li>Honour opt-out requests within 24 hours; and</li>
                <li>Comply with Meta&apos;s messaging frequency limits and content guidelines.</li>
              </ul>
              <p className="font-semibold text-white mt-2">4.2 Email Messaging</p>
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[#00F0FF]">
                <li>Send emails only to End-Clients who have provided their address in the context of your travel business and have not opted out;</li>
                <li>Include a functioning unsubscribe mechanism in all non-transactional emails; and</li>
                <li>Do not use purchased, rented, or scraped email lists.</li>
              </ul>
              <p className="font-semibold text-white mt-2">4.3 No Spam</p>
              <p>
                Sending unsolicited bulk communications to individuals who have not
                consented is strictly prohibited.
              </p>
            </Section>

            <Section title="5. Security Prohibitions">
              <p>You shall not:</p>
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[#00F0FF]">
                <li>Probe, scan, test, or exploit vulnerabilities in the Platform or its infrastructure;</li>
                <li>Reverse-engineer, decompile, or derive source code from the Platform;</li>
                <li>Circumvent rate limits, access controls, or authentication mechanisms;</li>
                <li>Share Account credentials with unauthorized persons;</li>
                <li>Use bots, crawlers, or scrapers beyond what is explicitly permitted by the Platform&apos;s API documentation; or</li>
                <li>Launch or facilitate any denial-of-service attack on the Platform or third-party infrastructure.</li>
              </ul>
            </Section>

            <Section title="6. Competing-Product Prohibition">
              <p>
                You shall not use the Platform — including its features, workflow designs,
                data structures, pricing, or any other element — to design, build, benchmark,
                test, or evaluate a product or service that competes with TripBuilt. This
                prohibition applies to direct competitors and to entities acting as
                intermediaries, advisors, or contractors for competing products.
              </p>
            </Section>

            <Section title="7. Content Moderation">
              <p>
                TripBuilt reserves the right, but has no obligation, to review, monitor,
                or moderate User Content for compliance with this AUP. TripBuilt will act
                on reports of Prohibited Content per the timelines under IT Rules 2021:
                removal within 24 hours for CSAM or threats to sovereignty; within 72 hours
                for other prohibited categories.
              </p>
            </Section>

            <Section title="8. Consequences of Violation">
              <p>Violations will be addressed at TripBuilt&apos;s discretion based on severity:</p>
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[#00F0FF]">
                <li><strong className="text-white">Warning:</strong> Written warning with requirement to cease the prohibited activity immediately.</li>
                <li><strong className="text-white">Suspension:</strong> Temporary Account suspension pending investigation or remediation.</li>
                <li><strong className="text-white">Termination:</strong> Immediate permanent Account termination for serious, repeated, or wilful violations, or violations creating legal risk.</li>
              </ul>
              <p>
                TripBuilt will cooperate fully with law enforcement and regulatory authorities
                in any investigation arising from an AUP violation. Termination for AUP
                violations does not entitle you to any refund.
              </p>
            </Section>

            <Section title="9. Reporting Abuse">
              <p>
                To report an AUP violation or Prohibited Content, email:{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#00F0FF] hover:underline">
                  {SUPPORT_EMAIL}
                </a>{" "}
                (subject: &quot;AUP Violation Report&quot;) or{" "}
                <a href={`mailto:${GRIEVANCE_OFFICER_EMAIL}`} className="text-[#00F0FF] hover:underline">
                  {GRIEVANCE_OFFICER_EMAIL}
                </a>.
                All abuse reports are acknowledged within 24 hours. See also the{" "}
                <a href="/grievance" className="text-[#00F0FF] hover:underline">Grievance Policy</a>.
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
