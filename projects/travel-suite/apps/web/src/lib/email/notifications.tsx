import { BookingConfirmationEmail } from "@/emails/BookingConfirmation";
import { PaymentReceiptEmail } from "@/emails/PaymentReceipt";
import { ProposalApprovedEmail } from "@/emails/ProposalApproved";
import { ProposalRejectedEmail } from "@/emails/ProposalRejected";
import { ProposalSentEmail } from "@/emails/ProposalSent";
import { TeamInviteEmail } from "@/emails/TeamInvite";
import { sendEmail } from "@/lib/email/send";

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
