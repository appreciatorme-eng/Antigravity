/**
 * TODO (LEGAL REVIEW REQUIRED): Populate all PLACEHOLDER_* constants below with
 * real contact details before go-live. Have a licensed Indian advocate review
 * this document. The DPDP Act 2023 subordinate rules were pending finalization
 * at time of drafting — verify current requirements before launch.
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "TripBuilt Terms of Service — legally binding agreement governing your use of our travel agency management platform under Indian law.",
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

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="text-base font-semibold text-white/90 mb-2">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export default function TermsOfServicePage() {
  return (
    <div className="text-white">
      <section className="pt-32 md:pt-40 pb-16 md:pb-20 px-6 md:px-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Terms of Service
          </h1>
          <p className="text-gray-400 mb-2">
            Effective date: {EFFECTIVE_DATE} &nbsp;·&nbsp; Version: {VERSION}
          </p>
          <p className="text-amber-400/80 text-sm mb-12 border border-amber-400/30 bg-amber-400/10 rounded-lg p-3">
            DRAFT — to be reviewed by a licensed Indian advocate before go-live.
          </p>

          <div className="space-y-10 text-gray-300 leading-relaxed">

            <Section title="1. Acceptance of Terms">
              <p>
                These Terms of Service (&quot;Terms&quot;) constitute a legally
                binding agreement between you (&quot;User,&quot;
                &quot;Operator,&quot; or &quot;you&quot;) and {COMPANY_NAME}
                (&quot;TripBuilt,&quot; &quot;we,&quot; &quot;us,&quot; or
                &quot;our&quot;), the owner and operator of the software-as-a-service
                platform at{" "}
                <a href={COMPANY_URL} className="text-[#00F0FF] hover:underline">
                  {COMPANY_URL}
                </a>{" "}
                (the &quot;Platform&quot;). By clicking &quot;I Agree,&quot; &quot;Sign Up,&quot;
                or any similar acceptance mechanism, or by accessing or using
                the Platform, you acknowledge that you have read, understood,
                and agree to be bound by these Terms.
              </p>
              <p>
                Pursuant to Section 10A of the Information Technology Act, 2000
                (&quot;IT Act&quot;), contracts formed through electronic means — including
                click-wrap acceptance — are valid and enforceable. Your electronic
                acceptance constitutes a valid contract under the Indian Contract
                Act, 1872 (&quot;Contract Act&quot;).
              </p>
              <p>
                If you accept on behalf of a company or other legal entity, you
                represent that you have the authority to bind that entity. If you
                do not agree, immediately cease using the Platform.
              </p>
              <p>
                These Terms incorporate by reference:{" "}
                <a href="/privacy" className="text-[#00F0FF] hover:underline">Privacy Policy</a>,{" "}
                <a href="/refund-policy" className="text-[#00F0FF] hover:underline">Refund Policy</a>,{" "}
                <a href="/cancellation-policy" className="text-[#00F0FF] hover:underline">Cancellation Policy</a>,{" "}
                <a href="/acceptable-use" className="text-[#00F0FF] hover:underline">Acceptable Use Policy</a>,{" "}
                <a href="/dpa" className="text-[#00F0FF] hover:underline">Data Processing Addendum</a>, and{" "}
                <a href="/grievance" className="text-[#00F0FF] hover:underline">Grievance Policy</a>.
              </p>
            </Section>

            <Section title="2. Eligibility">
              <p>
                The Platform is intended solely for individuals who are at least
                18 years of age with legal capacity to enter into a binding
                contract under Section 11 of the Contract Act. By accepting these
                Terms, you confirm you meet this requirement.
              </p>
              <p>
                The Platform is designed for B2B use by registered travel agents,
                tour operators, destination management companies, and allied travel
                service providers. You represent that your use will comply with all
                applicable laws in the jurisdictions in which you operate, including
                Ministry of Tourism guidelines and TAIA regulations.
              </p>
              <p>
                Non-Resident Indians (&quot;NRIs&quot;) are permitted to use the Platform
                subject to compliance with FEMA, 1999, and applicable RBI regulations.
                You represent that you are not located in any jurisdiction subject
                to comprehensive embargo or sanctions by the Government of India or
                the United Nations Security Council.
              </p>
            </Section>

            <Section title="3. Definitions">
              <p>Key terms used throughout these Terms:</p>
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[#00F0FF]">
                <li><strong className="text-white">Account</strong> — your unique user account on the Platform.</li>
                <li><strong className="text-white">Add-On</strong> — optional features purchased separately from a Subscription Plan.</li>
                <li><strong className="text-white">DPA</strong> — Data Processing Addendum at {COMPANY_URL}/dpa.</li>
                <li><strong className="text-white">End-Client</strong> — any traveller or customer of the Operator whose data is processed through the Platform.</li>
                <li><strong className="text-white">End-Client Data</strong> — personal data of End-Clients entered into the Platform by or on behalf of an Operator.</li>
                <li><strong className="text-white">Fees</strong> — all charges payable for use of the Platform, including Subscription Fees and Add-On charges.</li>
                <li><strong className="text-white">GST</strong> — Goods and Services Tax under the CGST Act, 2017 and IGST Act, 2017.</li>
                <li><strong className="text-white">Operator</strong> — the travel business entity subscribing to and using the Platform.</li>
                <li><strong className="text-white">Personal Data</strong> — data about an individual identifiable by or in relation to such data, as defined in the DPDP Act, 2023.</li>
                <li><strong className="text-white">Subscription Plan</strong> — a tier of Platform access offered at published pricing.</li>
                <li><strong className="text-white">User Content</strong> — any materials submitted, uploaded, or created by the Operator through the Platform.</li>
              </ul>
            </Section>

            <Section title="4. Account Registration and Security">
              <p>
                To access the Platform, you must create an Account providing accurate,
                current, and complete information including your business name, GSTIN
                (where applicable), registered address, and a valid email address. You
                agree to promptly update your Account information to keep it accurate.
              </p>
              <p>
                You are solely responsible for maintaining the confidentiality of your
                login credentials. You are responsible for all activities under your
                Account, whether or not you authorized them. Notify TripBuilt immediately
                at {SUPPORT_EMAIL} if you become aware of any unauthorized use.
              </p>
              <p>
                Each Account is licensed for use by the Operator and authorized
                sub-users as permitted by the relevant Subscription Plan. Sharing
                Account access beyond authorized users is a material breach of these Terms.
              </p>
            </Section>

            <Section title="5. Subscription Plans, Fees, GST, and Auto-Renewal">
              <SubSection title="5.1 Fees and GST">
                <p>
                  All Subscription Fees and Add-On charges are quoted exclusive of GST
                  unless expressly stated otherwise. GST at the applicable rate under
                  the CGST Act and IGST Act will be levied and appear as a separate line
                  item on the tax invoice. Operators with a valid GSTIN should provide
                  it for invoice matching and input tax credit purposes.
                </p>
              </SubSection>
              <SubSection title="5.2 Auto-Renewal">
                <p>
                  Your Subscription automatically renews at the end of each Billing Cycle
                  for an equivalent period at the then-current fee, unless you cancel
                  before the renewal date in accordance with the{" "}
                  <a href="/cancellation-policy" className="text-[#00F0FF] hover:underline">Cancellation Policy</a>.
                  By subscribing, you authorize TripBuilt and Razorpay to charge your
                  payment method on file for each renewal.
                </p>
              </SubSection>
              <SubSection title="5.3 Price Changes">
                <p>
                  TripBuilt reserves the right to change Subscription Fees at any time.
                  For existing Subscribers, price changes take effect at the start of the
                  next Billing Cycle following a minimum of 30 days&apos; written notice via
                  email and an in-app notification. Continued use after the effective date
                  constitutes acceptance of the new pricing. If you do not accept, you
                  may cancel before the new pricing takes effect.
                </p>
              </SubSection>
              <SubSection title="5.4 Proration">
                <p>
                  Plan upgrades mid-cycle incur a prorated charge for the remainder of
                  the Billing Cycle at the higher rate. Downgrades take effect at the
                  start of the next Billing Cycle with no proration refund for the current cycle.
                </p>
              </SubSection>
            </Section>

            <Section title="6. Free Trials">
              <p>
                TripBuilt may offer Free Trials at its sole discretion. Upon expiry of
                the Free Trial period, access will automatically convert to a paid
                Subscription unless you cancel before the trial ends. If a payment method
                is on file and you do not cancel, you will be charged the applicable
                Subscription Fee for the next Billing Cycle.
              </p>
            </Section>

            <Section title="7. Payment Processing">
              <p>
                All payments are processed by Razorpay Software Private Limited, a
                third-party payment aggregator authorized by the Reserve Bank of India.
                By making a payment, you agree to Razorpay&apos;s terms of service.
                TripBuilt does not store full card numbers or CVV codes. In the event
                of a failed transaction, any debited amount will be reversed to the
                original payment method within 7 business days, subject to bank processing timelines.
              </p>
            </Section>

            <Section title="8. Refunds and Cancellations">
              <p>
                Refunds are governed by the{" "}
                <a href="/refund-policy" className="text-[#00F0FF] hover:underline">Refund Policy</a>
                {" "}and{" "}
                <a href="/cancellation-policy" className="text-[#00F0FF] hover:underline">Cancellation Policy</a>,
                {" "}both incorporated into these Terms. Nothing in these Terms limits
                your rights under the Consumer Protection Act, 2019, to the extent
                such rights apply.
              </p>
            </Section>

            <Section title="9. Acceptable Use">
              <p>
                Your use of the Platform is subject to the{" "}
                <a href="/acceptable-use" className="text-[#00F0FF] hover:underline">Acceptable Use Policy</a>
                {" "}(&quot;AUP&quot;), incorporated into these Terms by reference. TripBuilt
                reserves the right to remove User Content or End-Client Data that
                violates the AUP and to suspend or terminate your Account.
              </p>
            </Section>

            <Section title="10. User Content and End-Client Data">
              <SubSection title="10.1 Ownership">
                <p>
                  You retain all ownership rights in User Content and End-Client Data.
                  TripBuilt does not claim ownership.
                </p>
              </SubSection>
              <SubSection title="10.2 Processing Licence">
                <p>
                  By submitting User Content, you grant TripBuilt a non-exclusive,
                  worldwide, royalty-free licence to host, store, process, and transmit
                  the User Content solely to the extent necessary to provide the Platform.
                </p>
              </SubSection>
              <SubSection title="10.3 End-Client Data">
                <p>
                  The Operator acknowledges it acts as the Data Fiduciary under the DPDP
                  Act for End-Client Data, and TripBuilt acts as a Data Processor. Terms
                  governing this processing are in the{" "}
                  <a href="/dpa" className="text-[#00F0FF] hover:underline">DPA</a>.
                </p>
              </SubSection>
              <SubSection title="10.4 Operator Warranties">
                <p>
                  You represent and warrant that: (a) you have obtained all necessary
                  consents to submit End-Client Data; (b) such submission does not violate
                  any Applicable Law; and (c) User Content does not infringe any third
                  party&apos;s rights.
                </p>
              </SubSection>
            </Section>

            <Section title="11. Third-Party Integrations">
              <p>
                The Platform integrates with third-party services including Razorpay
                (payments), Meta WhatsApp Cloud API (messaging), Google Workspace/Gmail
                (email), Supabase (database and auth), Vercel (hosting), Upstash
                (rate-limiting), and OpenAI (AI features). Your use of third-party
                services is subject to those providers&apos; terms of service. TripBuilt
                accepts no responsibility for the availability, accuracy, or performance
                of third-party services, or for outages or data loss caused by them.
              </p>
            </Section>

            <Section title="12. Intellectual Property">
              <SubSection title="12.1 TripBuilt's IP">
                <p>
                  The Platform, all software, code, designs, trademarks, and related
                  Intellectual Property Rights are and remain the exclusive property
                  of TripBuilt and its licensors.
                </p>
              </SubSection>
              <SubSection title="12.2 Limited Licence">
                <p>
                  Subject to these Terms, TripBuilt grants you a limited, non-exclusive,
                  non-transferable, revocable licence to access and use the Platform
                  solely for your internal business operations during the Subscription term.
                </p>
              </SubSection>
              <SubSection title="12.3 Restrictions">
                <p>
                  You shall not: copy, modify, or create derivative works of the
                  Platform; reverse-engineer or decompile the Platform; remove
                  proprietary notices; use the Platform to build a competing product;
                  or sublicense, sell, or transfer your rights in the Platform.
                </p>
              </SubSection>
            </Section>

            <Section title="13. Confidentiality">
              <p>
                Each party agrees to maintain the confidentiality of the other party&apos;s
                Confidential Information and not to use or disclose it except as necessary
                to exercise rights or perform obligations under these Terms, or as required
                by Applicable Law. This obligation survives termination for 3 years.
              </p>
            </Section>

            <Section title="14. Data Protection and Privacy">
              <p>
                TripBuilt&apos;s collection and processing of Personal Data is governed by the{" "}
                <a href="/privacy" className="text-[#00F0FF] hover:underline">Privacy Policy</a>
                {" "}and, for End-Client Data processed on behalf of Operators, by the{" "}
                <a href="/dpa" className="text-[#00F0FF] hover:underline">DPA</a>.
                TripBuilt is committed to compliance with the DPDP Act, 2023, IT Act, 2000,
                SPDI Rules, 2011, and all other Applicable Laws relating to data protection.
              </p>
            </Section>

            <Section title="15. Disclaimers">
              <p className="uppercase text-sm tracking-wide font-semibold text-amber-400">
                Important — please read carefully
              </p>
              <p>
                THE PLATFORM IS PROVIDED ON AN &quot;AS-IS&quot; AND &quot;AS-AVAILABLE&quot; BASIS
                WITHOUT ANY WARRANTY OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED
                BY APPLICABLE LAW, TRIPBUILT EXPRESSLY DISCLAIMS ALL WARRANTIES,
                INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
                PARTICULAR PURPOSE, WARRANTIES OF UNINTERRUPTED OR ERROR-FREE OPERATION,
                AND WARRANTIES REGARDING ACCURACY OR TIMELINESS OF ANY DATA.
              </p>
              <p>
                TRIPBUILT IS A SOFTWARE TOOL. IT IS NOT A TRAVEL AGENT OR TOUR OPERATOR
                AND MAKES NO WARRANTY REGARDING TRAVEL OUTCOMES, QUALITY OF TRAVEL
                SERVICES, OR ITINERARIES ORGANIZED BY OPERATORS USING THE PLATFORM.
              </p>
            </Section>

            <Section title="16. Limitation of Liability">
              <p className="uppercase text-sm tracking-wide font-semibold text-amber-400">
                Important — please read carefully
              </p>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, TRIPBUILT&apos;S TOTAL
                CUMULATIVE LIABILITY ARISING OUT OF THESE TERMS, THE PLATFORM, OR ANY
                RELATED SERVICES SHALL NOT EXCEED THE LESSER OF: (A) THE TOTAL
                SUBSCRIPTION FEES ACTUALLY PAID BY YOU TO TRIPBUILT IN THE 12 MONTHS
                IMMEDIATELY PRECEDING THE CLAIM; OR (B) ₹25,000 (INDIAN RUPEES
                TWENTY-FIVE THOUSAND).
              </p>
              <p>
                IN NO EVENT SHALL TRIPBUILT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                SPECIAL, PUNITIVE, EXEMPLARY, OR CONSEQUENTIAL DAMAGES, INCLUDING LOSS
                OF PROFITS, REVENUE, GOODWILL, BUSINESS, DATA, OR BUSINESS INTERRUPTION.
              </p>
              <p>
                These limitations do not apply to liability for death or personal injury
                caused by gross negligence, fraud, or any liability that cannot be
                excluded under Applicable Law.
              </p>
            </Section>

            <Section title="17. Indemnification">
              <p>
                You agree to indemnify, defend, and hold harmless TripBuilt and its
                officers, directors, employees, agents, and service providers from and
                against any claims, liabilities, damages, and expenses (including
                reasonable legal fees) arising out of or relating to: your violation of
                these Terms or any Applicable Law; User Content or End-Client Data
                submitted by you; your travel business operations; any claim by an
                End-Client arising from your use of the Platform; or any misrepresentation
                made by you.
              </p>
            </Section>

            <Section title="18. Suspension and Termination">
              <SubSection title="18.1 Termination by Operator">
                <p>
                  You may terminate your Subscription at any time through Account
                  settings. Termination takes effect at the end of the current Billing
                  Cycle per the{" "}
                  <a href="/cancellation-policy" className="text-[#00F0FF] hover:underline">Cancellation Policy</a>.
                </p>
              </SubSection>
              <SubSection title="18.2 Termination by TripBuilt">
                <p>
                  TripBuilt may terminate or suspend your Account: immediately for
                  material breach unremedied within 14 days of notice; immediately
                  for AUP violations posing immediate risk; immediately upon insolvency;
                  on 30 days&apos; notice if TripBuilt discontinues the Platform; or on
                  30 days&apos; notice for any reason at TripBuilt&apos;s discretion with a
                  pro-rata refund of prepaid unused Fees.
                </p>
              </SubSection>
              <SubSection title="18.3 Effect of Termination">
                <p>
                  Upon termination, your Platform access ceases. You will have 30-day
                  read-only access to export data, after which TripBuilt deletes or
                  anonymizes your data per the{" "}
                  <a href="/privacy" className="text-[#00F0FF] hover:underline">Privacy Policy</a>
                  . All outstanding Fees become immediately due.
                </p>
              </SubSection>
            </Section>

            <Section title="19. Force Majeure">
              <p>
                Neither party shall be liable for delay or failure to perform obligations
                due to events beyond reasonable control, including: acts of God, war,
                civil unrest, terrorism, pandemic, cyberattack, internet or telecom
                outage, power failure, governmental action, or failure of third-party
                infrastructure (including cloud hosting or payment gateways). If such
                an event continues for more than 60 consecutive days, either party may
                terminate on 15 days&apos; written notice with a pro-rata refund of prepaid
                unused Fees.
              </p>
            </Section>

            <Section title="20. Dispute Resolution">
              <SubSection title="20.1 Good-Faith Negotiation">
                <p>
                  Before any formal proceeding, the parties shall attempt to resolve
                  disputes through good-faith negotiation for at least 30 days from
                  written notice identifying the dispute.
                </p>
              </SubSection>
              <SubSection title="20.2 Binding Arbitration">
                <p>
                  Disputes not resolved through negotiation shall be finally resolved by
                  binding arbitration under the Arbitration and Conciliation Act, 1996,
                  including its fast-track procedure under Section 29B. Arbitration shall
                  be: conducted by a sole arbitrator; seated in Hyderabad, Telangana,
                  India; in the English language; under Indian law. The award shall be
                  final and binding.
                </p>
              </SubSection>
              <SubSection title="20.3 Class Action Waiver">
                <p>
                  To the maximum extent permitted by Applicable Law, you waive any right
                  to participate in a class action or consolidated arbitration. All
                  disputes shall be arbitrated on an individual basis.
                </p>
              </SubSection>
            </Section>

            <Section title="21. Governing Law and Jurisdiction">
              <p>
                These Terms are governed by the laws of India. For any matter not subject
                to arbitration, the parties submit to the exclusive jurisdiction of the
                courts in Hyderabad, Telangana, India.
              </p>
            </Section>

            <Section title="22. Grievance Officer">
              <p>
                In accordance with Rule 3(2) of the IT (Intermediary Guidelines and
                Digital Media Ethics Code) Rules, 2021, TripBuilt&apos;s Grievance Officer is:
              </p>
              <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 space-y-1 text-sm">
                <p><strong className="text-white">Name:</strong> {GRIEVANCE_OFFICER_NAME}</p>
                <p><strong className="text-white">Designation:</strong> Grievance Officer</p>
                <p><strong className="text-white">Email:</strong>{" "}
                  <a href={`mailto:${GRIEVANCE_OFFICER_EMAIL}`} className="text-[#00F0FF] hover:underline">
                    {GRIEVANCE_OFFICER_EMAIL}
                  </a>
                </p>
                <p><strong className="text-white">Phone:</strong> {GRIEVANCE_OFFICER_PHONE}</p>
                <p><strong className="text-white">Address:</strong> {REGISTERED_OFFICE_ADDRESS}</p>
                <p><strong className="text-white">Hours:</strong> Mon–Fri, 10:00 AM – 6:00 PM IST</p>
                <p className="text-gray-400 text-xs pt-1">
                  Complaints acknowledged within 24 hours, resolved within 15 days per IT Rules 2021.
                </p>
              </div>
              <p className="mt-3">
                For full details, see the{" "}
                <a href="/grievance" className="text-[#00F0FF] hover:underline">Grievance Policy</a>.
              </p>
            </Section>

            <Section title="23. Changes to These Terms">
              <p>
                TripBuilt may modify these Terms at any time. For material changes,
                at least 30 days&apos; advance notice will be provided via email and in-app
                notification. Continued use after the effective date constitutes
                acceptance. If you do not agree, you may cancel before the effective
                date and receive a pro-rata refund for prepaid unused Fees.
              </p>
            </Section>

            <Section title="24. Miscellaneous">
              <p>
                <strong className="text-white">Waiver.</strong>{" "}
                Failure to enforce any provision shall not constitute a waiver of future enforcement.
              </p>
              <p>
                <strong className="text-white">Severability.</strong>{" "}
                If any provision is held unenforceable, it shall be modified to the minimum
                extent necessary, without affecting remaining provisions.
              </p>
              <p>
                <strong className="text-white">Entire Agreement.</strong>{" "}
                These Terms and all incorporated documents constitute the entire agreement
                and supersede all prior negotiations or representations.
              </p>
              <p>
                <strong className="text-white">Assignment.</strong>{" "}
                You may not assign these Terms without TripBuilt&apos;s prior written consent.
                TripBuilt may assign in connection with a merger, acquisition, or asset sale,
                with notice to you.
              </p>
              <p>
                <strong className="text-white">Electronic Communications.</strong>{" "}
                By accepting these Terms, you consent to receive communications from
                TripBuilt electronically, which satisfies any legal writing requirement
                under Section 10A of the IT Act.
              </p>
            </Section>

            <section className="pt-6 border-t border-white/10">
              <p className="text-gray-400 text-sm">
                For all inquiries regarding these Terms, contact:{" "}
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
