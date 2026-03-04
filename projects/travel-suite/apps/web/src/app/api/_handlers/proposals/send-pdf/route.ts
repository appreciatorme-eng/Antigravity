/**
 * Send Proposal PDF via Email
 *
 * Endpoint: POST /api/proposals/send-pdf
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  getIntegrationDisabledMessage,
  isEmailIntegrationEnabled,
} from '@/lib/integrations';

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

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = SendPdfSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { proposal_id, client_email, pdf_base64, proposal_title } = parsed.data;

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle();
    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { data: proposal } = await supabase
      .from('proposals')
      .select('id')
      .eq('id', proposal_id)
      .eq('organization_id', profile.organization_id)
      .maybeSingle();
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const senderEmail = process.env.WELCOME_FROM_EMAIL;
    if (!resendApiKey || !senderEmail) {
      return NextResponse.json(
        { error: 'Email provider is not configured (RESEND_API_KEY / WELCOME_FROM_EMAIL missing)' },
        { status: 503 }
      );
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
      const errorBody = await emailResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: 'Failed to send email', details: errorBody },
        { status: 502 }
      );
    }

    // Log event
    await supabase.from('notification_logs').insert({
      recipient_id: user.id,
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
    console.error('Error in POST /api/proposals/send-pdf:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send PDF' },
      { status: 500 }
    );
  }
}
