/**
 * Generate Proposal PDF
 *
 * Endpoint: GET /api/proposals/[id]/pdf
 * Returns: PDF file for download
 */

import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToStream } from '@react-pdf/renderer';
import { ProposalDocument } from '@/components/pdf/ProposalDocument';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id, organizations(name)')
      .eq('user_id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Fetch proposal with all details
    const { data: proposal, error } = await supabase
      .from('proposals')
      .select(`
        *,
        clients(name, email),
        proposal_days(
          *,
          proposal_activities(
            *
          ),
          proposal_accommodations(
            *
          )
        )
      `)
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .single();

    if (error || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Format data for PDF component
    const proposalData = {
      ...proposal,
      client_name: proposal.clients?.name || 'Valued Customer',
      client_email: proposal.clients?.email,
      days: proposal.proposal_days?.map((day: any) => ({
        ...day,
        activities: day.proposal_activities || [],
        accommodations: day.proposal_accommodations || [],
      })) || [],
    };

    // Generate PDF stream
    const stream = await renderToStream(
      React.createElement(ProposalDocument, {
        proposal: proposalData,
        organizationName: (profile as any).organizations?.name || 'Travel Suite',
      })
    );

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Return PDF
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${proposal.title.replace(/\s+/g, '_')}_Proposal.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/proposals/[id]/pdf:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
