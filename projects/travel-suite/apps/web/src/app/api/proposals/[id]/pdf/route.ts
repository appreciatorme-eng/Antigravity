/**
 * API Route: Generate Proposal PDF
 *
 * GET /api/proposals/[id]/pdf?token=xxx
 *
 * Generates PDF for a proposal (accessible via share token)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToStream } from '@react-pdf/renderer';
import { ProposalPDF } from '@/lib/pdf/proposal-pdf';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: proposalId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Missing share token' }, { status: 400 });
    }

    const supabase = await createClient();

    // Load proposal by share token (public access)
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select(
        `
        *,
        tour_templates(name, destination, duration_days, description)
      `
      )
      .eq('id', proposalId)
      .eq('share_token', token)
      .single();

    if (proposalError || !proposal) {
      return NextResponse.json({ error: 'Proposal not found or invalid token' }, { status: 404 });
    }

    // Load days
    const { data: days } = await supabase
      .from('proposal_days')
      .select('*')
      .eq('proposal_id', proposalId)
      .order('day_number', { ascending: true });

    if (!days || days.length === 0) {
      return NextResponse.json({ error: 'No days found for proposal' }, { status: 404 });
    }

    // Load activities for all days
    const dayIds = days.map((d) => d.id);
    const { data: allActivities } = await supabase
      .from('proposal_activities')
      .select('*')
      .in('proposal_day_id', dayIds)
      .order('display_order', { ascending: true });

    // Load accommodations for all days
    const { data: allAccommodations } = await supabase
      .from('proposal_accommodations')
      .select('*')
      .in('proposal_day_id', dayIds);

    // Group activities by day
    const activities: Record<string, any[]> = {};
    (allActivities || []).forEach((activity) => {
      if (!activities[activity.proposal_day_id]) {
        activities[activity.proposal_day_id] = [];
      }
      activities[activity.proposal_day_id].push(activity);
    });

    // Group accommodations by day
    const accommodations: Record<string, any> = {};
    (allAccommodations || []).forEach((acc) => {
      accommodations[acc.proposal_day_id] = acc;
    });

    // Prepare proposal data
    const proposalData = {
      title: proposal.title,
      destination: proposal.tour_templates?.destination,
      duration_days: proposal.tour_templates?.duration_days,
      description: proposal.tour_templates?.description,
      total_price: proposal.total_price,
      status: proposal.status,
    };

    // Generate PDF
    const pdfStream = await renderToStream(
      ProposalPDF({
        proposal: proposalData,
        days,
        activities,
        accommodations,
      })
    );

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${proposal.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
