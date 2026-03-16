/**
 * Send Proposal PDF via Email
 *
 * Endpoint: POST /api/proposals/send-pdf
 */

import { NextResponse } from 'next/server';
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { z } from 'zod';
import {
  getIntegrationDisabledMessage,
  isEmailIntegrationEnabled,
} from '@/lib/integrations';
import { safeErrorMessage } from "@/lib/security/safe-error";
import { logError } from "@/lib/observability/logger";

const SendPdfSchema = z.object({
  proposal_id: z.string().uuid(),
  client_email: z.string().email(),
  pdf_base64: z.string().min(1),
  proposal_title: z.string().min(1),
});

function normalizeBase64(input: string) {
  const trimmed = input.trim();
  const dataUriPrefix = "base64,";
  const markerIndex = trimmed.indexOf(dataUriPrefix);
  if (markerIndex >= 0) {
    return trimmed.slice(markerIndex + dataUriPrefix.length);
  }
  return trimmed;
}

export async function POST(request: Request) {
  try {
    if (!isEmailIntegrationEnabled()) {
      return NextResponse.json(
        {
          success: false,
          disabled: true,
          error: getIntegrationDisabledMessage('email'),
        },
        { status: 202 }
      );
    }

    const auth = await requireAdmin(
      request as unknown as import("next/server").NextRequest,
      { requireOrganization: true },
    );
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = SendPdfSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { proposal_id, client_email, pdf_base64, proposal_title } = parsed.data;

    const { data: proposal } = await auth.adminClient
      .from('proposals')
      .select('id')
      .eq('id', proposal_id)
      .eq('organization_id', auth.organizationId!)
      .maybeSingle();
    if (!proposal) {
      return apiError('Proposal not found', 404);
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const senderEmail = process.env.WELCOME_FROM_EMAIL;
    if (!resendApiKey || !senderEmail) {
      return apiError('Email provider is not configured (RESEND_API_KEY / WELCOME_FROM_EMAIL missing)', 503);
    }

    const attachmentBase64 = normalizeBase64(pdf_base64);
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: senderEmail,
        to: [client_email],
        subject: `Your Travel Proposal: ${proposal_title}`,
        html: `
          <h1>Your Personalized Travel Proposal</h1>
          <p>Please find attached your proposal for <strong>${proposal_title}</strong>.</p>
          <p>Reply to this email if you want us to customize anything before approval.</p>
        `,
        attachments: [
          {
            filename: `${proposal_title.replace(/\s+/g, "_")}_Proposal.pdf`,
            content: attachmentBase64,
          },
        ],
      }),
    });

    if (!emailResponse.ok) {
      const rawBody = await emailResponse.json().catch(() => ({}));
      logError("[proposals/send-pdf] Resend API failure", {
        status: emailResponse.status,
        body: rawBody,
      });
      return apiError("Failed to send email", 502);
    }

    // Log event
    await auth.adminClient.from('notification_logs').insert({
      recipient_id: auth.userId,
      notification_type: 'proposal_pdf_email',
      title: 'Proposal PDF Sent',
      body: `PDF sent to ${client_email} for proposal: ${proposal_title}`,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'PDF sent successfully',
    });
  } catch (error) {
    logError('Error in POST /api/proposals/send-pdf', error);
    return apiError(safeErrorMessage(error, "Request failed"), 500);
  }
}
