import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "TripBuilt Refund Policy — CPA 2019 and E-Commerce Rules 2020 compliant. 7-day cooling-off period for new subscriptions.",
};

const EFFECTIVE_DATE = "April 17, 2026";
const VERSION = "1.0.0";
const COMPANY_NAME = "TripBuilt";
const COMPANY_URL = "https://tripbuilt.com";
const SUPPORT_EMAIL = "support@tripbuilt.com";
const GRIEVANCE_OFFICER_NAME = "TripBuilt Grievance Team";
const GRIEVANCE_OFFICER_EMAIL = "grievance@tripbuilt.com";
const GRIEVANCE_OFFICER_PHONE = "+91 98765 43210";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-white mb-3">{title}</h2>
      <div className="space-y-3 text-gray-300">{children}</div>
    </section>
  );
}

export default function RefundPolicyPage() {
  return (
    <div className="text-white">
      <section className="pt-32 md:pt-40 pb-16 md:pb-20 px-6 md:px-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black mb-4">Refund Policy</h1>
          <p className="text-gray-400 mb-12">
            Effective date: {EFFECTIVE_DATE} &nbsp;·&nbsp; Version: {VERSION}
          </p>

          <div className="space-y-10 leading-relaxed">

            <Section title="1. Overview">
              <p>
                This Refund Policy governs refunds for Subscription Fees and Add-On
                charges paid to {COMPANY_NAME} (&quot;TripBuilt&quot;) for the Platform. This
                Policy is framed in compliance with the Consumer Protection Act, 2019
                (&quot;CPA 2019&quot;) and the Consumer Protection (E-Commerce) Rules, 2020.
              </p>
              <p>
                This Policy is incorporated into the{" "}
                <a href="/terms" className="text-[#00F0FF] hover:underline">Terms of Service</a>.
                Nothing in this Policy limits any statutory rights you may have under
                the CPA 2019 or any other Applicable Law.
              </p>
            </Section>

            <Section title="2. Eligibility for Refund">
              <p className="font-semibold text-white">2.1 New Subscription — 7-Day Cooling-Off Period</p>
              <p>
                If you are subscribing to a paid Subscription Plan for the first time,
                you may request a full refund within <strong className="text-white">7 calendar days</strong>{" "}
                of the initial payment date if you are dissatisfied for any reason,
                provided that:
              </p>
              <ul className="list-disc pl-5 space-y-1 marker:text-[#00F0FF]">
                <li>You have not created more than 5 proposals, sent more than 20 WhatsApp or email messages, or generated more than 1 GST invoice; and</li>
                <li>Your Account has not violated the Acceptable Use Policy during the evaluation period.</li>
              </ul>
              <p className="font-semibold text-white mt-2">2.2 Annual Plan — 14-Day Evaluation Period</p>
              <p>
                As a B2B best practice, annual Subscription Plans also have a 14-day
                evaluation period during which a refund may be requested if the Platform
                does not meet your documented business requirements, subject to the usage
                limits above and eligibility review by TripBuilt.
              </p>
              <p>
                To request a refund under these provisions, submit a written request to{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#00F0FF] hover:underline">
                  {SUPPORT_EMAIL}
                </a>{" "}
                within the applicable period, stating the reason.
              </p>
            </Section>

            <Section title="3. Non-Refundable Scenarios">
              <p>No refund shall be issued in the following circumstances:</p>
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[#00F0FF]">
                <li>Usage beyond the thresholds in Section 2.1;</li>
                <li>Auto-renewal charges after you have had the opportunity to cancel;</li>
                <li>Add-On credits (messaging, storage, API calls) that have been consumed;</li>
                <li>Voluntary downgrade (a pro-rata credit per Section 4 is applied instead);</li>
                <li>Account suspended or terminated for violation of the Terms or AUP;</li>
                <li>Requests received after the applicable cooling-off period; and</li>
                <li>Third-party charges (e.g., Razorpay transaction fees, WhatsApp messaging fees).</li>
              </ul>
            </Section>

            <Section title="4. Mid-Cycle Downgrade Credits">
              <p>
                If you downgrade your Subscription Plan mid-Billing Cycle, TripBuilt will
                calculate a pro-rata credit for the unused portion of the higher-tier Fee.
                This credit will be applied to future invoices and will not be issued as a
                cash refund. Credits expire 12 months from the date of issuance and have
                no cash value.
              </p>
            </Section>

            <Section title="5. Failed Payment Reversals">
              <p>
                If a payment is initiated and debited but fails to complete (e.g., gateway
                error, bank failure), TripBuilt will coordinate with Razorpay to initiate
                a reversal. Reversals are processed within <strong className="text-white">7 business days</strong>{" "}
                from confirmed transaction failure. Your bank may take an additional 3–10
                business days to reflect the reversal. TripBuilt is not liable for delays
                caused by your bank or payment network.
              </p>
            </Section>

            <Section title="6. Refund Process and Timelines">
              <p>
                <strong className="text-white">Request Window:</strong> Submit within
                the cooling-off period (Section 2) or within 30 days of a disputed charge.
              </p>
              <p>
                <strong className="text-white">How to Submit:</strong> Email{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#00F0FF] hover:underline">
                  {SUPPORT_EMAIL}
                </a>{" "}
                with subject &quot;Refund Request — [Your Account Name]&quot; including your
                registered email, transaction ID or invoice number, reason, and supporting
                documentation.
              </p>
              <p>
                <strong className="text-white">Approval SLA:</strong> TripBuilt will
                review and communicate the outcome within <strong className="text-white">7 business days</strong>{" "}
                of receiving all required information.
              </p>
              <p>
                <strong className="text-white">Disbursal:</strong> Approved refunds are
                processed within <strong className="text-white">10–14 business days</strong>{" "}
                from approval and credited to the original payment method in INR.
              </p>
            </Section>

            <Section title="7. Chargebacks">
              <p>
                If you initiate a chargeback without first attempting to resolve the matter
                with TripBuilt, TripBuilt reserves the right to: suspend your Account
                pending resolution; provide transaction records to Razorpay and the relevant
                financial institution; and terminate your Account if the chargeback is
                determined to be fraudulent or in bad faith.
              </p>
            </Section>

            <Section title="8. Escalation to Grievance Officer">
              <p>
                If your refund request is not resolved to your satisfaction, escalate to:
              </p>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 space-y-1 text-sm">
                <p><strong className="text-white">Name:</strong> {GRIEVANCE_OFFICER_NAME}</p>
                <p><strong className="text-white">Email:</strong>{" "}
                  <a href={`mailto:${GRIEVANCE_OFFICER_EMAIL}`} className="text-[#00F0FF] hover:underline">
                    {GRIEVANCE_OFFICER_EMAIL}
                  </a>
                </p>
                <p><strong className="text-white">Phone:</strong> {GRIEVANCE_OFFICER_PHONE}</p>
                <p className="text-gray-400 text-xs pt-1">
                  Escalations acknowledged within 24 hours, resolved within 15 days.
                </p>
              </div>
            </Section>

            <Section title="9. Consumer Rights Preserved">
              <p>
                Nothing in this Refund Policy derogates from or limits your rights as a
                consumer under the Consumer Protection Act, 2019, or the Consumer Protection
                (E-Commerce) Rules, 2020. If you believe your statutory consumer rights
                have been violated, you may contact the National Consumer Helpline at
                1800-11-4000 or file a complaint at{" "}
                <a
                  href="https://consumerhelpline.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00F0FF] hover:underline"
                >
                  consumerhelpline.gov.in
                </a>.
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
