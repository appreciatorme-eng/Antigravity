/**
 * Generate Proposal PDF
 *
 * Endpoint: GET /api/proposals/[id]/pdf
 * Returns: PDF file for download
 */

import React from 'react';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToStream, type DocumentProps } from '@react-pdf/renderer';
import { ProposalDocument } from '@/components/pdf/ProposalDocument';
import type { Database } from '@/lib/database.types';

const normalizeRelation = <T,>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
};

const sanitizeFileName = (value: string) => value.replace(/[^a-zA-Z0-9-_]+/g, '_');

type OrganizationBrand = {
  name: string | null;
  logo_url: string | null;
  primary_color: string | null;
};

type ProfileWithOrganization = {
  organization_id: string | null;
  organizations: OrganizationBrand | OrganizationBrand[] | null;
};

type ClientProfile = {
  full_name: string | null;
  email: string | null;
};

type ProposalActivityRow = {
  id: string;
  title: string;
  description: string | null;
  time: string | null;
  location: string | null;
  price: number | null;
  is_optional: boolean | null;
  is_selected: boolean | null;
};

type ProposalAccommodationRow = {
  id: string;
  hotel_name: string | null;
  room_type: string | null;
  check_in_date: string | null;
  check_out_date: string | null;
  price_per_night: number | null;
  is_selected: boolean | null;
};

type ProposalDayRow = {
  day_number: number;
  title: string | null;
  description: string | null;
  proposal_activities: ProposalActivityRow[] | null;
  proposal_accommodations: ProposalAccommodationRow[] | null;
};

type ProposalQueryRow = Database['public']['Tables']['proposals']['Row'] & {
  clients: { profiles: ClientProfile | ClientProfile[] | null } | null;
  organizations: OrganizationBrand | OrganizationBrand[] | null;
  tour_templates: { destination: string | null } | { destination: string | null }[] | null;
  proposal_days: ProposalDayRow[] | null;
};

type ProposalAddOnRow = Database['public']['Tables']['proposal_add_ons']['Row'];

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
    let userOrganization: OrganizationBrand | null = null;

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, organizations(name, logo_url, primary_color)')
        .eq('id', user.id)
        .single();

      const profileRow = (profile as ProfileWithOrganization | null) || null;
      userOrganizationId = profileRow?.organization_id || null;
      userOrganization = normalizeRelation(profileRow?.organizations || null);
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

    const { data: proposalAddOns } = await supabase
      .from('proposal_add_ons')
      .select('*')
      .eq('proposal_id', id);

    const proposalRow = proposal as ProposalQueryRow;
    const clientProfile = normalizeRelation(proposalRow.clients?.profiles || null);
    const proposalOrganization = normalizeRelation(proposalRow.organizations) || userOrganization;
    const templateDestination = normalizeRelation(proposalRow.tour_templates)?.destination || 'Destination';
    const proposalDays = proposalRow.proposal_days || [];

    const proposalData = {
      id: proposalRow.id,
      title: proposalRow.title,
      total_price: Number(proposalRow.total_price || 0),
      client_selected_price: proposalRow.client_selected_price,
      status: proposalRow.status || 'draft',
      created_at: proposalRow.created_at || new Date().toISOString(),
      destination: templateDestination,
      duration_days: proposalDays.length || undefined,
      currency: 'USD',
      client_name: clientProfile?.full_name || 'Valued Customer',
      client_email: clientProfile?.email || undefined,
      days:
        proposalDays.map((day) => ({
          day_number: day.day_number,
          title: day.title || `Day ${day.day_number}`,
          description: day.description || undefined,
          activities:
            (day.proposal_activities || []).map((activity) => ({
              id: activity.id,
              title: activity.title,
              description: activity.description || undefined,
              time: activity.time || undefined,
              location: activity.location || undefined,
              price: Number(activity.price || 0),
              is_optional: activity.is_optional === true,
              is_selected: activity.is_selected !== false,
            })),
          accommodations:
            (day.proposal_accommodations || []).map((accommodation) => ({
              id: accommodation.id,
              name: accommodation.hotel_name || 'Accommodation',
              type: accommodation.room_type || undefined,
              check_in: accommodation.check_in_date || undefined,
              check_out: accommodation.check_out_date || undefined,
              price: Number(accommodation.price_per_night || 0),
              is_selected: accommodation.is_selected !== false,
            })),
        })),
    };

    const formattedAddOns =
      (proposalAddOns as ProposalAddOnRow[] | null)?.map((addOn) => ({
        id: addOn.id,
        name: addOn.name,
        category: addOn.category,
        description: addOn.description,
        quantity: addOn.quantity,
        unit_price: Number(addOn.unit_price || 0),
        is_selected: addOn.is_selected !== false,
      })) || [];

    const document = React.createElement(ProposalDocument, {
      proposal: proposalData,
      addOns: formattedAddOns,
      organizationName: proposalOrganization?.name || 'Travel Suite',
      organizationLogo: proposalOrganization?.logo_url || null,
      primaryColor: proposalOrganization?.primary_color || '#00d084',
    }) as unknown as React.ReactElement<DocumentProps>;

    const stream = await renderToStream(
      document
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
