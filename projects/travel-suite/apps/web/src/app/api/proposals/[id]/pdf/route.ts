/**
 * Generate Proposal PDF
 *
 * Endpoint: GET /api/proposals/[id]/pdf
 * Returns: PDF file for download
 */

import React from 'react';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToStream } from '@react-pdf/renderer';
import { ProposalDocument } from '@/components/pdf/ProposalDocument';

const normalizeRelation = <T,>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
};

const sanitizeFileName = (value: string) => value.replace(/[^a-zA-Z0-9-_]+/g, '_');

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shareToken = new URL(request.url).searchParams.get('token');
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let userOrganizationId: string | null = null;
    let userOrganization: any = null;

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, organizations(name, logo_url, primary_color)')
        .eq('id', user.id)
        .single();

      userOrganizationId = profile?.organization_id || null;
      userOrganization = normalizeRelation((profile as any)?.organizations);
    }

    if (!user && !shareToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!shareToken && !userOrganizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    let proposalQuery = supabase
      .from('proposals')
      .select(`
        *,
        clients (
          profiles (
            full_name,
            email
          )
        ),
        organizations (
          name,
          logo_url,
          primary_color
        ),
        tour_templates (
          destination
        ),
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
      .eq('id', id);

    if (shareToken) {
      proposalQuery = proposalQuery.eq('share_token', shareToken);
    } else if (userOrganizationId) {
      proposalQuery = proposalQuery.eq('organization_id', userOrganizationId);
    }

    const { data: proposal, error } = await proposalQuery.single();

    if (error || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    if (shareToken && proposal.expires_at) {
      const expiresAt = new Date(proposal.expires_at);
      if (Number.isFinite(expiresAt.getTime()) && expiresAt.getTime() < Date.now()) {
        return NextResponse.json({ error: 'Share link has expired' }, { status: 410 });
      }
    }

    // proposal_add_ons type may not exist in generated Database types yet.
    const { data: proposalAddOns } = await (supabase as any)
      .from('proposal_add_ons')
      .select('*')
      .eq('proposal_id', id);

    const p = proposal as any;
    const clientProfile = normalizeRelation(p.clients?.profiles);
    const proposalOrganization = normalizeRelation(p.organizations) || userOrganization;

    const proposalData = {
      id: proposal.id,
      title: proposal.title,
      total_price: Number(proposal.total_price || 0),
      client_selected_price: proposal.client_selected_price,
      status: proposal.status || 'draft',
      created_at: proposal.created_at || new Date().toISOString(),
      destination: p.tour_templates?.destination || 'Destination',
      duration_days: p.proposal_days?.length || undefined,
      currency: 'USD',
      client_name: clientProfile?.full_name || 'Valued Customer',
      client_email: clientProfile?.email,
      days:
        p.proposal_days?.map((day: any) => ({
          day_number: day.day_number,
          title: day.title || `Day ${day.day_number}`,
          description: day.description || undefined,
          activities:
            day.proposal_activities?.map((activity: any) => ({
              id: activity.id,
              title: activity.title,
              description: activity.description || undefined,
              time: activity.time || undefined,
              location: activity.location || undefined,
              price: Number(activity.price || 0),
              is_optional: activity.is_optional === true,
              is_selected: activity.is_selected !== false,
            })) || [],
          accommodations:
            day.proposal_accommodations?.map((accommodation: any) => ({
              id: accommodation.id,
              name: accommodation.hotel_name || 'Accommodation',
              type: accommodation.room_type || undefined,
              check_in: accommodation.check_in_date || undefined,
              check_out: accommodation.check_out_date || undefined,
              price: Number(accommodation.price_per_night || 0),
              is_selected: accommodation.is_selected !== false,
            })) || [],
        })) || [],
    };

    const formattedAddOns =
      proposalAddOns?.map((addOn: any) => ({
        id: addOn.id,
        name: addOn.name,
        category: addOn.category,
        description: addOn.description,
        quantity: addOn.quantity,
        unit_price: Number(addOn.unit_price || 0),
        is_selected: addOn.is_selected !== false,
      })) || [];

    const stream = await renderToStream(
      React.createElement(ProposalDocument, {
        proposal: proposalData,
        addOns: formattedAddOns,
        organizationName: proposalOrganization?.name || 'Travel Suite',
        organizationLogo: proposalOrganization?.logo_url || null,
        primaryColor: proposalOrganization?.primary_color || '#00d084',
      }) as any
    );

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${sanitizeFileName(proposal.title)}_Proposal.pdf"`,
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
