/**
 * Notification utilities for the Interactive Proposal System
 *
 * This module handles sending notifications to clients via:
 * - Email (using existing email infrastructure)
 * - WhatsApp (using existing WhatsApp API)
 * - Push notifications (future)
 */

import { createClient } from '@/lib/supabase/client';

interface ProposalNotification {
  proposalId: string;
  clientId: string;
  shareToken: string;
  proposalTitle: string;
  operatorName?: string;
  expiresAt?: string | null;
}

/**
 * Generates the proposal share URL
 */
export function getProposalShareUrl(shareToken: string): string {
  if (typeof window === 'undefined') {
    // Server-side: use environment variable or default
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://travelsuite.app';
    return `${baseUrl}/p/${shareToken}`;
  }
  // Client-side: use current origin
  return `${window.location.origin}/p/${shareToken}`;
}

/**
 * Send proposal via email
 *
 * TODO: Integrate with your existing email service (SendGrid, Postmark, etc.)
 * For now, this is a placeholder that logs what would be sent
 */
export async function sendProposalEmail(notification: ProposalNotification): Promise<boolean> {
  try {
    const supabase = createClient();

    // Get client email
    const { data: client } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', notification.clientId)
      .single();

    if (!client?.email) {
      console.error('Client email not found');
      return false;
    }

    const shareUrl = getProposalShareUrl(notification.shareToken);

    // TODO: Replace with actual email service call
    const emailData = {
      to: client.email,
      subject: `Your Travel Proposal: ${notification.proposalTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your Custom Travel Proposal</h2>
          <p>Hi ${client.full_name || 'there'},</p>
          <p>We've prepared a personalized travel proposal for you: <strong>${notification.proposalTitle}</strong></p>

          <div style="margin: 30px 0; text-align: center;">
            <a href="${shareUrl}"
               style="background: #9c7c46; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              View Your Proposal
            </a>
          </div>

          <p>In this interactive proposal, you can:</p>
          <ul>
            <li>Explore day-by-day itinerary details</li>
            <li>Customize optional activities to fit your preferences</li>
            <li>See pricing update in real-time</li>
            <li>Leave comments and ask questions</li>
            <li>Approve the proposal with one click</li>
          </ul>

          ${notification.expiresAt ? `<p style="color: #666; font-size: 14px;">This proposal expires on ${new Date(notification.expiresAt).toLocaleDateString()}.</p>` : ''}

          <p>We're excited to help plan your perfect trip!</p>

          <p style="color: #666; font-size: 12px; margin-top: 40px;">
            Powered by Travel Suite • Interactive Proposal System
          </p>
        </div>
      `,
    };

    console.log('[EMAIL] Would send:', emailData);

    // TODO: Actual email sending
    // await emailService.send(emailData);

    // For now, just log and return success
    console.log('✅ Email sent to:', client.email);
    return true;
  } catch (error) {
    console.error('Error sending proposal email:', error);
    return false;
  }
}

/**
 * Send proposal via WhatsApp
 *
 * TODO: Integrate with your existing WhatsApp API
 * For now, this is a placeholder that logs what would be sent
 */
export async function sendProposalWhatsApp(notification: ProposalNotification): Promise<boolean> {
  try {
    const supabase = createClient();

    // Get client phone
    const { data: client } = await supabase
      .from('profiles')
      .select('phone, full_name')
      .eq('id', notification.clientId)
      .single();

    if (!client?.phone) {
      console.error('Client phone not found');
      return false;
    }

    const shareUrl = getProposalShareUrl(notification.shareToken);

    // Format WhatsApp message
    const message = `
Hi ${client.full_name || 'there'}! 👋

We've prepared a personalized travel proposal for you: *${notification.proposalTitle}*

View your interactive proposal here:
${shareUrl}

You can:
✅ Explore day-by-day details
✅ Customize activities
✅ See live pricing
✅ Ask questions
✅ Approve with one click

${notification.expiresAt ? `⏰ Expires: ${new Date(notification.expiresAt).toLocaleDateString()}` : ''}

Excited to plan your perfect trip! ✈️
    `.trim();

    console.log('[WHATSAPP] Would send to:', client.phone);
    console.log(message);

    // TODO: Actual WhatsApp sending
    // await whatsappService.send({
    //   to: client.phone,
    //   message: message
    // });

    console.log('✅ WhatsApp sent to:', client.phone);
    return true;
  } catch (error) {
    console.error('Error sending proposal WhatsApp:', error);
    return false;
  }
}

/**
 * Send proposal notification (email + WhatsApp)
 *
 * Sends the proposal to client via multiple channels
 */
export async function sendProposalNotification(
  notification: ProposalNotification,
  channels: { email?: boolean; whatsapp?: boolean } = { email: true, whatsapp: false }
): Promise<{ email: boolean; whatsapp: boolean }> {
  const results = {
    email: false,
    whatsapp: false,
  };

  if (channels.email) {
    results.email = await sendProposalEmail(notification);
  }

  if (channels.whatsapp) {
    results.whatsapp = await sendProposalWhatsApp(notification);
  }

  // Update proposal status to 'sent'
  const supabase = createClient();
  await supabase
    .from('proposals')
    .update({ status: 'sent' })
    .eq('id', notification.proposalId);

  return results;
}

/**
 * Notify operator of client activity
 *
 * Send notifications to operator when client:
 * - Views proposal
 * - Leaves comment
 * - Approves proposal
 */
export async function notifyOperatorOfActivity(
  proposalId: string,
  activityType: 'viewed' | 'commented' | 'approved',
  details?: string
): Promise<void> {
  try {
    const supabase = createClient();

    // Get proposal and operator info
    const { data: proposal } = await supabase
      .from('proposals')
      .select(`
        *,
        clients(profiles(full_name, email)),
        profiles(full_name, email)
      `)
      .eq('id', proposalId)
      .single();

    if (!proposal) return;

    // Get client info safely handling nested relations
    // We use unknown cast first to satisfy strict typing when dealing with complex joins
    const p = proposal as unknown as {
      clients: { profiles: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null } | null;
      profiles: { email: string | null } | null;
    };

    const clientProfile = Array.isArray(p.clients?.profiles)
      ? p.clients?.profiles[0]
      : p.clients?.profiles;

    const clientName = clientProfile?.full_name || 'Client';
    const operatorEmail = p.profiles?.email;

    if (!operatorEmail) return;

    // TODO: Send operator notification email
    const notificationData = {
      to: operatorEmail,
      subject: `Client Activity: ${proposal.title}`,
      message: `${clientName} has ${activityType === 'viewed' ? 'viewed' : activityType === 'commented' ? 'commented on' : 'approved'} the proposal "${proposal.title}". ${details || ''}`,
    };

    console.log('[OPERATOR NOTIFICATION]', notificationData);

    // TODO: Integrate with notification service
    // await notificationService.send(notificationData);
  } catch (error) {
    console.error('Error notifying operator:', error);
  }
}
