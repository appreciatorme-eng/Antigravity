import { BookingConfirmationEmail } from "@/emails/BookingConfirmation";
import { ContactSalesConfirmationEmail } from "@/emails/ContactSalesConfirmationEmail";
import { InvoicePdfEmail } from "@/emails/InvoicePdfEmail";
import { MarketplaceInquiryEmail } from "@/emails/MarketplaceInquiryEmail";
import { MarketplaceVerificationEmail } from "@/emails/MarketplaceVerificationEmail";
import { OperatorScorecardEmail } from "@/emails/OperatorScorecard";
import { PaymentReceiptEmail } from "@/emails/PaymentReceipt";
import { ProposalApprovedEmail } from "@/emails/ProposalApproved";
import { ProposalPdfEmail } from "@/emails/ProposalPdfEmail";
import { ProposalRejectedEmail } from "@/emails/ProposalRejected";
import { ProposalSentEmail } from "@/emails/ProposalSent";
import { ReferralPromoterEmail } from "@/emails/ReferralPromoterEmail";
import { TeamInviteEmail } from "@/emails/TeamInvite";
import { WelcomeEmail } from "@/emails/WelcomeEmail";
import { sendEmail, sendEmailForOrg, type EmailAttachment } from "@/lib/email/send";
import type { ReactElement } from "react";

/**
 * Route email through Gmail (if orgId provided and connected) or Resend.
 * Drop-in replacement for sendEmail that supports optional org context.
 */
async function routeEmail(params: {
  orgId?: string;
  to: string;
  subject: string;
  react: ReactElement;
  attachments?: EmailAttachment[];
}): Promise<boolean> {
  if (params.orgId) {
    return sendEmailForOrg({
      orgId: params.orgId,
      to: params.to,
      subject: params.subject,
      react: params.react,
      attachments: params.attachments,
    });
  }
  return routeEmail({
    to: params.to,
    subject: params.subject,
    react: params.react,
    attachments: params.attachments,
  });
}

export function formatInr(amountPaise: number) {
  return `₹${Math.round(amountPaise / 100).toLocaleString("en-IN")}`;
}

export async function sendBookingConfirmation(params: {
  orgId?: string;
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
  return routeEmail({
    orgId: params.orgId,
    to: params.to,
    subject: `✈️ Booking Confirmed — ${params.destination} | ${params.startDate}`,
    react: <BookingConfirmationEmail {...params} />,
  });
}

export async function sendProposalSentNotification(params: {
  orgId?: string;
  to: string;
  travelerName: string;
  proposalTitle: string;
  destination?: string | null;
  priceLabel?: string | null;
  proposalUrl: string;
}) {
  return routeEmail({
    orgId: params.orgId,
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
  return routeEmail({
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
  return routeEmail({
    to: params.to,
    subject: `${params.travelerName} passed on your proposal`,
    react: <ProposalRejectedEmail {...params} />,
  });
}

export async function sendPaymentReceipt(params: {
  orgId?: string;
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
  return routeEmail({
    orgId: params.orgId,
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
  return routeEmail({
    to: params.to,
    subject: `You're invited to join ${params.organizationName} on TripBuilt`,
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
  return routeEmail({
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

export async function sendWelcomeNotification(params: {
  to: string;
  recipientName: string;
  loginUrl: string;
}) {
  return routeEmail({
    to: params.to,
    subject: "Welcome to TripBuilt",
    react: <WelcomeEmail {...params} />,
  });
}

export async function sendInvoicePdfNotification(params: {
  to: string;
  invoiceNumber: string;
  organizationName: string;
  attachment: EmailAttachment;
}) {
  return routeEmail({
    to: params.to,
    subject: `Invoice ${params.invoiceNumber} from ${params.organizationName}`,
    react: (
      <InvoicePdfEmail
        invoiceNumber={params.invoiceNumber}
        organizationName={params.organizationName}
      />
    ),
    attachments: [params.attachment],
  });
}

export async function sendProposalPdfNotification(params: {
  to: string;
  proposalTitle: string;
  recipientName?: string | null;
  attachment: EmailAttachment;
}) {
  return routeEmail({
    to: params.to,
    subject: `Your Travel Proposal: ${params.proposalTitle}`,
    react: (
      <ProposalPdfEmail
        proposalTitle={params.proposalTitle}
        recipientName={params.recipientName}
      />
    ),
    attachments: [params.attachment],
  });
}

export async function sendMarketplaceInquiryNotification(params: {
  to: string;
  senderOrgName: string;
  subject: string;
  message: string;
  inquiryUrl: string;
}) {
  return routeEmail({
    to: params.to,
    subject: `[Marketplace] New Inquiry from ${params.senderOrgName}`,
    react: <MarketplaceInquiryEmail {...params} />,
  });
}

export async function sendMarketplaceVerificationNotification(params: {
  to: string;
  orgName: string;
  status: "verified" | "rejected";
  settingsUrl: string;
}) {
  return routeEmail({
    to: params.to,
    subject: `[Marketplace] Verification Status: ${params.status}`,
    react: <MarketplaceVerificationEmail {...params} />,
  });
}

export async function sendReferralPromoterNotification(params: {
  to: string;
  recipientName: string;
  reviewLink: string | null;
  referralUrl: string;
  rewardAmountInr: number;
}) {
  return routeEmail({
    to: params.to,
    subject: `Thank you! Earn ₹${params.rewardAmountInr.toLocaleString("en-IN")} by referring a friend`,
    react: <ReferralPromoterEmail {...params} />,
  });
}

export async function sendContactSalesConfirmation(params: {
  to: string;
  name: string;
  targetTier: string;
  organizationName: string;
}) {
  return routeEmail({
    to: params.to,
    subject: `TripBuilt ${params.targetTier} upgrade request received`,
    react: <ContactSalesConfirmationEmail {...params} />,
  });
}
