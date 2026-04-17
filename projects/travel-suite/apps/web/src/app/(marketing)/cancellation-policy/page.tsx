import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cancellation Policy",
  description:
    "TripBuilt Cancellation Policy — how to cancel your subscription, auto-renewal, and what happens to your data.",
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

export default function CancellationPolicyPage() {
  return (
    <div className="text-white">
      <section className="pt-32 md:pt-40 pb-16 md:pb-20 px-6 md:px-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black mb-4">Cancellation Policy</h1>
          <p className="text-gray-400 mb-12">
            Effective date: {EFFECTIVE_DATE} &nbsp;·&nbsp; Version: {VERSION}
          </p>

          <div className="space-y-10 leading-relaxed">

            <Section title="1. Overview">
              <p>
                This Cancellation Policy governs how Operators may cancel their Subscription
                to {COMPANY_NAME} (&quot;TripBuilt&quot;) and the consequences of cancellation.
                This Policy is incorporated into the{" "}
                <a href="/terms" className="text-[#00F0FF] hover:underline">Terms of Service</a>.
                Refunds arising from cancellations are governed by the{" "}
                <a href="/refund-policy" className="text-[#00F0FF] hover:underline">Refund Policy</a>.
              </p>
            </Section>

            <Section title="2. Self-Service Cancellation">
              <p>
                You may cancel your Subscription at any time through Account settings:
                navigate to <strong className="text-white">Settings → Subscription → Cancel Subscription</strong>.
                No phone call or support request is required.
              </p>
              <p>
                Upon confirming cancellation, you will receive a confirmation email at
                your registered address. If you do not receive this within 30 minutes,
                contact{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#00F0FF] hover:underline">
                  {SUPPORT_EMAIL}
                </a>{" "}
                immediately.
              </p>
              <p>
                If you cannot cancel through self-service, email{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#00F0FF] hover:underline">
                  {SUPPORT_EMAIL}
                </a>{" "}
                with subject &quot;Cancellation Request — [Account Name]&quot; and TripBuilt
                will process the cancellation within 2 business days.
              </p>
            </Section>

            <Section title="3. Trial Cancellation">
              <p>
                You may cancel during a Free Trial at any time with no charge. To avoid
                being charged upon trial expiry, cancel before the trial end date shown
                in Account settings. If you do not cancel, your payment method will be
                charged the applicable Subscription Fee at trial end.
              </p>
            </Section>

            <Section title="4. Monthly Plan Cancellation">
              <p>
                Cancellation of a monthly Subscription takes effect at the end of the
                current monthly Billing Cycle. You retain full Platform access until
                that date. No partial refund is issued for unused days in the current
                cycle, except as provided in the{" "}
                <a href="/refund-policy" className="text-[#00F0FF] hover:underline">Refund Policy</a>
                {" "}(e.g., 7-day cooling-off for first subscriptions).
              </p>
            </Section>

            <Section title="5. Annual Plan Cancellation">
              <p>
                Cancellation of an annual Subscription takes effect at the end of the
                current annual Billing Cycle. You retain full Platform access until that
                date. No partial refund is issued for unused months, except as provided
                in the{" "}
                <a href="/refund-policy" className="text-[#00F0FF] hover:underline">Refund Policy</a>.
              </p>
            </Section>

            <Section title="6. Auto-Renewal Turn-Off">
              <p>
                Cancelling your Subscription automatically disables auto-renewal — no
                separate step is required. If you wish to disable auto-renewal without
                cancelling immediately, toggle off auto-renewal at{" "}
                <strong className="text-white">Settings → Subscription → Auto-Renewal</strong>.
                Your Subscription will simply not renew at the end of the current cycle.
              </p>
            </Section>

            <Section title="7. Effect of Cancellation">
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[#00F0FF]">
                <li><strong className="text-white">During current Billing Cycle:</strong> Full Platform access is retained until the last day of the current paid period.</li>
                <li><strong className="text-white">Post-cancellation read-only (30 days):</strong> From expiry of the Billing Cycle, you have 30-day read-only access to review and export data.</li>
                <li><strong className="text-white">Data export:</strong> Use <strong className="text-white">Settings → Data Export</strong> to download User Content and End-Client Data in CSV and PDF formats.</li>
                <li><strong className="text-white">Data deletion:</strong> After the 30-day read-only period, TripBuilt deletes or anonymizes Account data per the{" "}
                  <a href="/privacy" className="text-[#00F0FF] hover:underline">Privacy Policy</a>
                  {" "}retention schedule, except records required by Applicable Law (e.g., GST records retained 8 years).</li>
                <li><strong className="text-white">Outstanding obligations:</strong> Cancellation does not extinguish payment obligations accrued prior to the cancellation date.</li>
              </ul>
            </Section>

            <Section title="8. Re-Activation">
              <p>
                If your Subscription was cancelled but data has not yet been deleted (within
                the 30-day read-only period or first 60 days post-Billing Cycle), you may
                re-activate by subscribing to a new plan. Your data and settings will be
                restored. Re-activation after data deletion creates a new Account with no
                historical data.
              </p>
              <p>
                TripBuilt reserves the right to decline re-activation where the previous
                Account was terminated for violations of the Terms or AUP.
              </p>
            </Section>

            <Section title="9. Account Deletion vs. Cancellation">
              <p>
                <strong className="text-white">Cancellation</strong> stops billing and,
                after the 30-day read-only period, results in data deletion per the
                retention schedule. It is the standard way to stop using the Platform.
              </p>
              <p>
                <strong className="text-white">Account Deletion</strong> is irrevocable
                and permanently removes all Account data, User Content, and End-Client Data
                (subject to records required by law). To request account deletion, email{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#00F0FF] hover:underline">
                  {SUPPORT_EMAIL}
                </a>{" "}
                with subject &quot;Account Deletion Request.&quot; Requests are processed within 30 days.
              </p>
              <p>
                If account deletion is requested while a paid Subscription is active,
                TripBuilt cancels the Subscription immediately with no refund and no
                30-day read-only period. Deleted accounts cannot be recovered.
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
