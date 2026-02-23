export interface ProposalNotification {
  proposalId: string;
  clientId?: string;
  shareToken?: string;
  proposalTitle?: string;
  operatorName?: string;
  expiresAt?: string | null;
}

type SendChannels = { email?: boolean; whatsapp?: boolean };

export interface ProposalNotificationResult {
  email: boolean;
  whatsapp: boolean;
  errors: string[];
}

async function sendProposalChannels(
  proposalId: string,
  channels: SendChannels
): Promise<ProposalNotificationResult> {
  const endpoint =
    typeof window === 'undefined'
      ? `${(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')}/api/proposals/${proposalId}/send`
      : `/api/proposals/${proposalId}/send`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channels }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      email: false,
      whatsapp: false,
      errors: [String(payload?.error || 'Failed to send proposal notifications')],
    };
  }

  return {
    email: Boolean(payload?.email),
    whatsapp: Boolean(payload?.whatsapp),
    errors: Array.isArray(payload?.errors) ? payload.errors.map(String) : [],
  };
}

export function getProposalShareUrl(shareToken: string): string {
  if (!shareToken) return '';
  if (typeof window === 'undefined') {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}/p/${shareToken}`;
  }
  return `${window.location.origin}/p/${shareToken}`;
}

export async function sendProposalEmail(notification: ProposalNotification): Promise<boolean> {
  if (!notification.proposalId) return false;
  const result = await sendProposalChannels(notification.proposalId, { email: true });
  return result.email;
}

export async function sendProposalWhatsApp(notification: ProposalNotification): Promise<boolean> {
  if (!notification.proposalId) return false;
  const result = await sendProposalChannels(notification.proposalId, { whatsapp: true });
  return result.whatsapp;
}

export async function sendProposalNotification(
  notification: ProposalNotification,
  channels: SendChannels = { email: true, whatsapp: false }
): Promise<ProposalNotificationResult> {
  if (!notification.proposalId) {
    return { email: false, whatsapp: false, errors: ['Missing proposal id'] };
  }
  return sendProposalChannels(notification.proposalId, channels);
}

export async function notifyOperatorOfActivity(): Promise<void> {
  // Operator activity notifications are handled by server-side flows tied to proposal events.
}
