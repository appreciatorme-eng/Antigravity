import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase configuration missing for public proposal API");
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

type ProposalSummary = {
  id: string;
  title: string;
  total_price: number;
  client_selected_price: number | null;
  status: string;
  expires_at: string | null;
  viewed_at: string | null;
  template_name?: string;
  destination?: string;
  duration_days?: number;
  description?: string;
  hero_image_url?: string;
};

type ProposalTemplate = {
  name: string | null;
  destination: string | null;
  duration_days: number | null;
  description: string | null;
  hero_image_url: string | null;
} | null;

type LoadedProposal = {
  id: string;
  title: string;
  total_price: number | null;
  client_selected_price: number | null;
  status: string | null;
  expires_at: string | null;
  viewed_at: string | null;
  tour_templates?: ProposalTemplate;
};

type PublicDay = {
  id: string;
  proposal_id: string;
  day_number: number;
  title: string | null;
  description: string | null;
  is_approved: boolean;
};

type PublicActivity = {
  id: string;
  proposal_day_id: string;
  time: string | null;
  title: string;
  description: string | null;
  location: string | null;
  image_url: string | null;
  price: number;
  is_optional: boolean;
  is_premium: boolean;
  is_selected: boolean;
  display_order: number;
};

type PublicAccommodation = {
  id: string;
  proposal_day_id: string;
  hotel_name: string;
  star_rating: number;
  room_type: string | null;
  price_per_night: number;
  amenities: string[] | null;
  image_url: string | null;
};

type PublicAddOn = {
  id: string;
  proposal_id: string;
  add_on_id: string | null;
  name: string;
  description: string | null;
  category: string;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  is_selected: boolean;
};

const asNumber = (value: unknown, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const normalizeText = (value: unknown) => {
  const text = String(value || '').trim();
  return text.length ? text : null;
};

async function loadProposalByToken(token: string) {
  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('proposals')
    .select(
      `
      id,
      title,
      total_price,
      client_selected_price,
      status,
      expires_at,
      viewed_at,
      tour_templates(name, destination, duration_days, description, hero_image_url)
    `
    )
    .eq('share_token', token)
    .maybeSingle();

  if (error || !data) {
    return { error: 'Proposal not found', status: 404 as const };
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { error: 'This proposal link has expired', status: 410 as const };
  }

  return { proposal: data };
}

async function recalculateProposalPrice(proposalId: string) {
  const supabaseAdmin = getSupabaseAdminClient();
  const { data: newPrice, error } = await supabaseAdmin.rpc('calculate_proposal_price', {
    p_proposal_id: proposalId,
  });

  if (error) {
    return { error: error.message };
  }

  if (newPrice !== null && newPrice !== undefined) {
    const numericPrice = asNumber(newPrice, 0);
    const { error: updateError } = await supabaseAdmin
      .from('proposals')
      .update({ client_selected_price: numericPrice })
      .eq('id', proposalId);

    if (updateError) {
      return { error: updateError.message };
    }

    return { price: numericPrice };
  }

  return { price: null };
}

async function buildPublicPayload(shareToken: string) {
  const supabaseAdmin = getSupabaseAdminClient();
  const loaded = await loadProposalByToken(shareToken);
  if ('error' in loaded) {
    return loaded;
  }

  const proposal = loaded.proposal as LoadedProposal;

  if (!proposal.viewed_at && proposal.status !== 'approved') {
    await supabaseAdmin
      .from('proposals')
      .update({
        viewed_at: new Date().toISOString(),
        status: proposal.status === 'draft' ? 'viewed' : proposal.status,
      })
      .eq('id', proposal.id);

    proposal.viewed_at = new Date().toISOString();
    if (proposal.status === 'draft') {
      proposal.status = 'viewed';
    }
  }

  const summary: ProposalSummary = {
    id: proposal.id,
    title: proposal.title,
    total_price: asNumber(proposal.total_price),
    client_selected_price:
      proposal.client_selected_price === null || proposal.client_selected_price === undefined
        ? null
        : asNumber(proposal.client_selected_price),
    status: proposal.status || 'draft',
    expires_at: proposal.expires_at || null,
    viewed_at: proposal.viewed_at || null,
    template_name: proposal.tour_templates?.name || undefined,
    destination: proposal.tour_templates?.destination || undefined,
    duration_days: proposal.tour_templates?.duration_days || undefined,
    description: proposal.tour_templates?.description || undefined,
    hero_image_url: proposal.tour_templates?.hero_image_url || undefined,
  };

  const { data: daysData } = await supabaseAdmin
    .from('proposal_days')
    .select('*')
    .eq('proposal_id', proposal.id)
    .order('day_number', { ascending: true });

  const days: PublicDay[] = (daysData || []).map((day) => ({
    id: day.id,
    proposal_id: day.proposal_id,
    day_number: day.day_number,
    title: day.title || null,
    description: day.description || null,
    is_approved: day.is_approved === true,
  }));

  const dayIds = days.map((day) => day.id);

  const activitiesByDay: Record<string, PublicActivity[]> = {};
  const accommodationsByDay: Record<string, PublicAccommodation> = {};

  if (dayIds.length > 0) {
    const { data: activitiesData } = await supabaseAdmin
      .from('proposal_activities')
      .select('*')
      .in('proposal_day_id', dayIds)
      .order('display_order', { ascending: true });

    for (const activity of activitiesData || []) {
      const dayId = activity.proposal_day_id;
      if (!activitiesByDay[dayId]) activitiesByDay[dayId] = [];
      activitiesByDay[dayId].push({
        id: activity.id,
        proposal_day_id: activity.proposal_day_id,
        time: activity.time || null,
        title: activity.title,
        description: activity.description || null,
        location: activity.location || null,
        image_url: activity.image_url || null,
        price: asNumber(activity.price),
        is_optional: activity.is_optional === true,
        is_premium: activity.is_premium === true,
        is_selected: activity.is_selected !== false,
        display_order: activity.display_order || 0,
      });
    }

    const { data: accommodationsData } = await supabaseAdmin
      .from('proposal_accommodations')
      .select('*')
      .in('proposal_day_id', dayIds);

    for (const accommodation of accommodationsData || []) {
      accommodationsByDay[accommodation.proposal_day_id] = {
        id: accommodation.id,
        proposal_day_id: accommodation.proposal_day_id,
        hotel_name: accommodation.hotel_name,
        star_rating: accommodation.star_rating || 0,
        room_type: accommodation.room_type || null,
        price_per_night: asNumber(accommodation.price_per_night),
        amenities: Array.isArray(accommodation.amenities) ? accommodation.amenities : null,
        image_url: accommodation.image_url || null,
      };
    }
  }

  const { data: commentsData } = await supabaseAdmin
    .from('proposal_comments')
    .select('id, proposal_day_id, author_name, comment, created_at')
    .eq('proposal_id', proposal.id)
    .order('created_at', { ascending: false });

  const comments = (commentsData || []).map((comment) => ({
    id: comment.id,
    proposal_day_id: comment.proposal_day_id || null,
    author_name: comment.author_name,
    comment: comment.comment,
    created_at: comment.created_at || new Date().toISOString(),
  }));

  const { data: addOnsData } = await supabaseAdmin
    .from('proposal_add_ons')
    .select('*')
    .eq('proposal_id', proposal.id)
    .order('category', { ascending: true });

  const addOns: PublicAddOn[] = (addOnsData || []).map((addOn) => ({
    id: addOn.id,
    proposal_id: addOn.proposal_id,
    add_on_id: addOn.add_on_id || null,
    name: addOn.name,
    description: addOn.description || null,
    category: addOn.category,
    image_url: addOn.image_url || null,
    unit_price: asNumber(addOn.unit_price),
    quantity: asNumber(addOn.quantity, 1),
    is_selected: addOn.is_selected !== false,
  }));

  return {
    proposal: summary,
    days,
    activitiesByDay,
    accommodationsByDay,
    comments,
    addOns,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const payload = await buildPublicPayload(token);

    if ('error' in payload) {
      return NextResponse.json({ error: payload.error }, { status: payload.status });
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    const { token } = await params;
    const loaded = await loadProposalByToken(token);

    if ('error' in loaded) {
      return NextResponse.json({ error: loaded.error }, { status: loaded.status });
    }

    const proposal = loaded.proposal as LoadedProposal;
    const body = await request.json();
    const action = String(body?.action || '').trim();

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    if (action === 'toggleActivity') {
      const activityId = String(body.activityId || '').trim();
      const selected = !!body.selected;
      if (!activityId) {
        return NextResponse.json({ error: 'Activity id is required' }, { status: 400 });
      }

      const { data: activity } = await supabaseAdmin
        .from('proposal_activities')
        .select('id, proposal_day_id')
        .eq('id', activityId)
        .maybeSingle();

      if (!activity) {
        return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
      }

      const { data: day } = await supabaseAdmin
        .from('proposal_days')
        .select('id')
        .eq('id', activity.proposal_day_id)
        .eq('proposal_id', proposal.id)
        .maybeSingle();

      if (!day) {
        return NextResponse.json({ error: 'Activity does not belong to this proposal' }, { status: 403 });
      }

      const { error: activityError } = await supabaseAdmin
        .from('proposal_activities')
        .update({ is_selected: selected })
        .eq('id', activityId);

      if (activityError) {
        return NextResponse.json({ error: activityError.message }, { status: 400 });
      }

      const recalculated = await recalculateProposalPrice(proposal.id);
      if (recalculated.error) {
        return NextResponse.json({ error: recalculated.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, client_selected_price: recalculated.price });
    }

    if (action === 'toggleAddOn') {
      const addOnId = String(body.addOnId || '').trim();
      const selected = !!body.selected;
      if (!addOnId) {
        return NextResponse.json({ error: 'Add-on id is required' }, { status: 400 });
      }

      const { data: addOn } = await supabaseAdmin
        .from('proposal_add_ons')
        .select('id, category')
        .eq('id', addOnId)
        .eq('proposal_id', proposal.id)
        .maybeSingle();

      if (!addOn) {
        return NextResponse.json({ error: 'Add-on not found' }, { status: 404 });
      }

      if (String(addOn.category || '').toLowerCase() === 'transport' && selected) {
        await supabaseAdmin
          .from('proposal_add_ons')
          .update({ is_selected: false })
          .eq('proposal_id', proposal.id)
          .ilike('category', 'transport');
      }

      const { error: addOnError } = await supabaseAdmin
        .from('proposal_add_ons')
        .update({ is_selected: selected })
        .eq('id', addOnId);

      if (addOnError) {
        return NextResponse.json({ error: addOnError.message }, { status: 400 });
      }

      const recalculated = await recalculateProposalPrice(proposal.id);
      if (recalculated.error) {
        return NextResponse.json({ error: recalculated.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, client_selected_price: recalculated.price });
    }

    if (action === 'selectVehicle') {
      const addOnId = String(body.addOnId || '').trim();
      if (!addOnId) {
        return NextResponse.json({ error: 'Vehicle add-on id is required' }, { status: 400 });
      }

      const { data: addOn } = await supabaseAdmin
        .from('proposal_add_ons')
        .select('id, category')
        .eq('id', addOnId)
        .eq('proposal_id', proposal.id)
        .maybeSingle();

      if (!addOn || String(addOn.category || '').toLowerCase() !== 'transport') {
        return NextResponse.json({ error: 'Vehicle option not found' }, { status: 404 });
      }

      await supabaseAdmin
        .from('proposal_add_ons')
        .update({ is_selected: false })
        .eq('proposal_id', proposal.id)
        .ilike('category', 'transport');

      const { error: vehicleError } = await supabaseAdmin
        .from('proposal_add_ons')
        .update({ is_selected: true })
        .eq('id', addOnId);

      if (vehicleError) {
        return NextResponse.json({ error: vehicleError.message }, { status: 400 });
      }

      const recalculated = await recalculateProposalPrice(proposal.id);
      if (recalculated.error) {
        return NextResponse.json({ error: recalculated.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, client_selected_price: recalculated.price });
    }

    if (action === 'comment') {
      const authorName = normalizeText(body.authorName);
      const authorEmail = normalizeText(body.authorEmail);
      const comment = normalizeText(body.comment);
      const proposalDayId = normalizeText(body.proposalDayId);

      if (!authorName || !comment) {
        return NextResponse.json({ error: 'Name and comment are required' }, { status: 400 });
      }

      if (proposalDayId) {
        const { data: day } = await supabaseAdmin
          .from('proposal_days')
          .select('id')
          .eq('id', proposalDayId)
          .eq('proposal_id', proposal.id)
          .maybeSingle();

        if (!day) {
          return NextResponse.json({ error: 'Invalid day reference' }, { status: 400 });
        }
      }

      const { error: commentError } = await supabaseAdmin.from('proposal_comments').insert({
        proposal_id: proposal.id,
        proposal_day_id: proposalDayId,
        author_name: authorName,
        author_email: authorEmail,
        comment,
      });

      if (commentError) {
        return NextResponse.json({ error: commentError.message }, { status: 400 });
      }

      if (proposal.status !== 'approved') {
        await supabaseAdmin
          .from('proposals')
          .update({ status: 'commented' })
          .eq('id', proposal.id);
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'approve') {
      const approvedBy = normalizeText(body.approvedBy);
      if (!approvedBy) {
        return NextResponse.json({ error: 'Approver name is required' }, { status: 400 });
      }

      const { error: approveError } = await supabaseAdmin
        .from('proposals')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: approvedBy,
        })
        .eq('id', proposal.id);

      if (approveError) {
        return NextResponse.json({ error: approveError.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, status: 'approved' });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
