import { BookingConfirmationEmail } from "@/emails/BookingConfirmation";
import { OperatorScorecardEmail } from "@/emails/OperatorScorecard";
import { PaymentReceiptEmail } from "@/emails/PaymentReceipt";
import { ProposalApprovedEmail } from "@/emails/ProposalApproved";
import { ProposalRejectedEmail } from "@/emails/ProposalRejected";
import { ProposalSentEmail } from "@/emails/ProposalSent";
import { TeamInviteEmail } from "@/emails/TeamInvite";
import { sendEmail, type EmailAttachment } from "@/lib/email/send";

export function formatInr(amountPaise: number) {
  return `₹${Math.round(amountPaise / 100).toLocaleString("en-IN")}`;
}

export async function sendBookingConfirmation(params: {
  to: string;
  recipientName: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalPaid?: string | null;
  operatorName: string;
  operatorEmail?: string | null;
  tripUrl?: string | null;
}) {
  return sendEmail({
    to: params.to,
    subject: `✈️ Booking Confirmed — ${params.destination} | ${params.startDate}`,
    react: <BookingConfirmationEmail {...params} />,
  });
}

export async function sendProposalSentNotification(params: {
  to: string;
  travelerName: string;
  proposalTitle: string;
  destination?: string | null;
  priceLabel?: string | null;
  proposalUrl: string;
}) {
  return sendEmail({
    to: params.to,
    subject: "Your personalised trip proposal is ready",
    react: <ProposalSentEmail {...params} />,
  });
}

export async function sendProposalApprovedNotification(params: {
  to: string;
  operatorName: string;
  travelerName: string;
  proposalTitle: string;
  paymentUrl?: string | null;
}) {
  return sendEmail({
    to: params.to,
    subject: `${params.travelerName} approved your proposal`,
    react: <ProposalApprovedEmail {...params} />,
  });
}

export async function sendProposalRejectedNotification(params: {
  to: string;
  operatorName: string;
  travelerName: string;
  proposalTitle: string;
}) {
  return sendEmail({
    to: params.to,
    subject: `${params.travelerName} passed on your proposal`,
    react: <ProposalRejectedEmail {...params} />,
  });
}

export async function sendPaymentReceipt(params: {
  to: string;
  recipientName: string;
  amountLabel: string;
  paymentId: string;
  bookingReference: string;
  paidAt: string;
  operatorName: string;
  gstLabel?: string | null;
  invoiceUrl?: string | null;
}) {
  return sendEmail({
    to: params.to,
    subject: `Payment receipt — ${params.bookingReference}`,
    react: <PaymentReceiptEmail {...params} />,
  });
}

export async function sendTeamInviteNotification(params: {
  to: string;
  organizationName: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
}) {
  return sendEmail({
    to: params.to,
    subject: `You're invited to join ${params.organizationName} on Antigravity Travel`,
    react: <TeamInviteEmail {...params} />,
  });
}

export async function sendOperatorScorecardNotification(params: {
  to: string;
  recipientName: string;
  organizationName: string;
  monthLabel: string;
  dashboardUrl: string;
  score: number;
  status: "leading" | "steady" | "at_risk";
  highlights: string[];
  actions: string[];
  revenueLabel: string;
  approvalRateLabel: string;
  attachment: EmailAttachment;
}) {
  return sendEmail({
    to: params.to,
    subject: `${params.organizationName} scorecard — ${params.monthLabel}`,
    react: (
      <OperatorScorecardEmail
        recipientName={params.recipientName}
        organizationName={params.organizationName}
        monthLabel={params.monthLabel}
        dashboardUrl={params.dashboardUrl}
        revenueLabel={params.revenueLabel}
        approvalRateLabel={params.approvalRateLabel}
        scorecard={{
          score: params.score,
          status: params.status,
          highlights: params.highlights,
          actions: params.actions,
        }}
      />
    ),
    attachments: [params.attachment],
  });
}
