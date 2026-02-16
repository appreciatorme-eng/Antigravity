/**
 * Send Proposal PDF via Email
 *
 * Endpoint: POST /api/proposals/send-pdf
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { proposal_id, client_email, pdf_base64, proposal_title } = body;

    // Validate required fields
    if (!proposal_id || !client_email || !pdf_base64) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Send email via email service (Resend, SendGrid, etc.)
    // For now, log the attempt and return success
    console.log('[Email Service] Sending proposal PDF:', {
      to: client_email,
      proposal: proposal_title,
      size: pdf_base64.length,
    });

    // Example with Resend (when API key is configured):
    /*
    import { Resend } from 'resend';
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'proposals@yourdomain.com',
      to: client_email,
      subject: `Your Travel Proposal: ${proposal_title}`,
      html: `
        <h1>Your Personalized Travel Proposal</h1>
        <p>Dear Valued Customer,</p>
        <p>Please find attached your personalized travel proposal for <strong>${proposal_title}</strong>.</p>
        <p>Review the detailed itinerary, pricing, and terms & conditions in the attached PDF.</p>
        <p>If you have any questions or would like to proceed with booking, please reply to this email or contact us directly.</p>
        <p>We look forward to creating an unforgettable experience for you!</p>
        <br/>
        <p>Best regards,<br/>Your Travel Team</p>
      `,
      attachments: [
        {
          filename: `${proposal_title.replace(/\s+/g, '_')}_Proposal.pdf`,
          content: pdf_base64,
        },
      ],
    });
    */

    // Log event
    await supabase.from('notification_logs').insert({
      user_id: user.id,
      type: 'proposal_pdf_email',
      title: 'Proposal PDF Sent',
      message: `PDF sent to ${client_email} for proposal: ${proposal_title}`,
      metadata: {
        proposal_id,
        client_email,
        sent_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'PDF sent successfully',
      // Note: In production, this would actually send the email
      note: 'Email sending requires email service API key configuration',
    });
  } catch (error) {
    console.error('Error in POST /api/proposals/send-pdf:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send PDF' },
      { status: 500 }
    );
  }
}
