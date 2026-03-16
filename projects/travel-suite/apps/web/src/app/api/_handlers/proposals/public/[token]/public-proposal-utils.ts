import { NextResponse } from 'next/server';
import { sanitizeEmail, sanitizeText } from '@/lib/security/sanitize';
import { createAdminClient } from '@/lib/supabase/admin';
import { type RateLimitResult } from "@/lib/security/rate-limit";
import { trackFunnelEvent } from '@/lib/funnel/track';
import {
  type ProposalTierPricing,
  parseTierPricing,
} from '@/lib/proposals/types';
import { logError } from "@/lib/observability/logger";

export const supabaseAdmin = createAdminClient();

type ProposalSummary = {
  id: string;
  title: string;
  total_price: number;
  client_selected_price: number | null;
  status: string;
  expires_at: string | null;
  viewed_at: string | null;
  package_tier: string | null;
  tier_pricing: ProposalTierPricing;
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
  organization_id: string | null;
  client_id: string | null;
  created_by: string | null;
  total_price: number | null;
  client_selected_price: number | null;
  status: string | null;
  expires_at: string | null;
  viewed_at: string | null;
  package_tier: string | null;
  tier_pricing: unknown;
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

type ProposalDayRow = {
  id: string;
  proposal_id: string;
  day_number: number;
  title: string | null;
  description: string | null;
  is_approved: boolean | null;
};

type ProposalActivityRow = {
  id: string;
  proposal_day_id: string;
  time: string | null;
  title: string;
  description: string | null;
  location: string | null;
  image_url: string | null;
  price: number | null;
  is_optional: boolean | null;
  is_premium: boolean | null;
  is_selected: boolean | null;
  display_order: number | null;
};

type ProposalAccommodationRow = {
  id: string;
  proposal_day_id: string;
  hotel_name: string;
  star_rating: number | null;
  room_type: string | null;
  price_per_night: number | null;
  amenities: string[] | null;
  image_url: string | null;
};

type ProposalAddOnRow = {
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

const PROPOSAL_DAY_PUBLIC_SELECT = [
  "id",
  "proposal_id",
  "day_number",
  "title",
  "description",
  "is_approved",
].join(", ");

const PROPOSAL_ACTIVITY_PUBLIC_SELECT = [
  "id",
  "proposal_day_id",
  "time",
  "title",
  "description",
  "location",
  "image_url",
  "price",
  "is_optional",
  "is_premium",
  "is_selected",
  "display_order",
].join(", ");

const PROPOSAL_ACCOMMODATION_PUBLIC_SELECT = [
  "id",
  "proposal_day_id",
  "hotel_name",
  "star_rating",
  "room_type",
  "price_per_night",
  "amenities",
  "image_url",
].join(", ");

const PROPOSAL_ADD_ON_PUBLIC_SELECT = [
  "id",
  "proposal_id",
  "add_on_id",
  "name",
  "description",
  "category",
  "image_url",
  "unit_price",
  "quantity",
  "is_selected",
].join(", ");

const SHARE_TOKEN_REGEX = /^[A-Za-z0-9_-]{8,200}$/;
const IDENTIFIER_REGEX = /^[A-Za-z0-9_-]{6,120}$/;

export const PUBLIC_PROPOSAL_ACTION_RATE_LIMIT_MAX = Number(
  process.env.PUBLIC_PROPOSAL_ACTION_RATE_LIMIT_MAX || "20"
);
export const PUBLIC_PROPOSAL_ACTION_RATE_LIMIT_WINDOW_MS = Number(
  process.env.PUBLIC_PROPOSAL_ACTION_RATE_LIMIT_WINDOW_MS || 15 * 60_000
);
export const PUBLIC_PROPOSAL_READ_RATE_LIMIT_MAX = Number(
  process.env.PUBLIC_PROPOSAL_READ_RATE_LIMIT_MAX || "30"
);
export const PUBLIC_PROPOSAL_READ_RATE_LIMIT_WINDOW_MS = Number(
  process.env.PUBLIC_PROPOSAL_READ_RATE_LIMIT_WINDOW_MS || 60_000
);

export async function loadOperatorContact(organizationId: string | null, createdBy: string | null) {
  try {
    if (createdBy) {
      const { data: operatorProfile } = await supabaseAdmin
        .from("profiles")
        .select("email, full_name")
        .eq("id", createdBy)
        .maybeSingle();

      if (operatorProfile?.email) {
        return {
          email: sanitizeEmail(operatorProfile.email),
          name: sanitizeText(operatorProfile.full_name, { maxLength: 120 }) || "Operator",
        };
      }
    }

    if (!organizationId) {
      return null;
    }

    const { data: organization } = await supabaseAdmin
      .from("organizations")
      .select("name, owner_id")
      .eq("id", organizationId)
      .maybeSingle();

    if (!organization?.owner_id) {
      return null;
    }

    const { data: ownerProfile } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("id", organization.owner_id)
      .maybeSingle();

    return ownerProfile?.email
      ? {
          email: sanitizeEmail(ownerProfile.email),
          name:
            sanitizeText(ownerProfile.full_name, { maxLength: 120 }) ||
            sanitizeText(organization.name, { maxLength: 120 }) ||
            "Operator",
        }
      : null;
  } catch (err) {
    logError("[proposals] loadOperatorContact error", err);
    return null;
  }
}

export function getRequestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp || "unknown";
}

export function withRateLimitHeaders(response: NextResponse, limiter: RateLimitResult) {
  response.headers.set("x-ratelimit-limit", String(limiter.limit));
  response.headers.set("x-ratelimit-reset", String(limiter.reset));
  return response;
}

export function sanitizeShareToken(value: unknown): string | null {
  const token = sanitizeText(value, { maxLength: 200 });
  if (!token) return null;
  if (!SHARE_TOKEN_REGEX.test(token)) return null;
  return token;
}

export function sanitizeIdentifier(value: unknown): string | null {
  const id = sanitizeText(value, { maxLength: 120 });
  if (!id) return null;
  if (!IDENTIFIER_REGEX.test(id)) return null;
  return id;
}

const asNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const asNumber = (value: unknown, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const normalizeText = (value: unknown) => {
  const text = String(value || '').trim();
  return text.length ? text : null;
};

const normalizeTemplate = (value: unknown): ProposalTemplate => {
  if (!value) return null;

  if (Array.isArray(value)) {
    return value.length > 0 ? normalizeTemplate(value[0]) : null;
  }

  if (typeof value !== 'object') return null;
  const template = value as Record<string, unknown>;

  return {
    name: normalizeText(template.name),
    destination: normalizeText(template.destination),
    duration_days: asNullableNumber(template.duration_days),
    description: normalizeText(template.description),
    hero_image_url: normalizeText(template.hero_image_url),
  };
};

export const normalizeProposal = (value: unknown): LoadedProposal => {
  const proposal = (value || {}) as Record<string, unknown>;

  return {
    id: String(proposal.id || ''),
    title: String(proposal.title || ''),
    organization_id: normalizeText(proposal.organization_id),
    client_id: normalizeText(proposal.client_id),
    created_by: normalizeText(proposal.created_by),
    total_price: asNullableNumber(proposal.total_price),
    client_selected_price: asNullableNumber(proposal.client_selected_price),
    status: normalizeText(proposal.status),
    expires_at: normalizeText(proposal.expires_at),
    viewed_at: normalizeText(proposal.viewed_at),
    package_tier: normalizeText(proposal.package_tier),
    tier_pricing: proposal.tier_pricing ?? {},
    tour_templates: normalizeTemplate(proposal.tour_templates),
  };
};

export async function loadProposalByToken(token: string) {
  const { data, error } = await supabaseAdmin
    .from('proposals')
    .select(
      `
      id,
      title,
      organization_id,
      client_id,
      created_by,
      total_price,
      client_selected_price,
      status,
      expires_at,
      viewed_at,
      package_tier,
      tier_pricing,
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

export async function recalculateProposalPrice(proposalId: string) {
  const { data: newPrice, error } = await supabaseAdmin.rpc('calculate_proposal_price', {
    p_proposal_id: proposalId,
  });

  if (error) {
    logError("[proposals] recalculate price rpc error", error);
    return { error: "Request failed" };
  }

  if (newPrice !== null && newPrice !== undefined) {
    const numericPrice = asNumber(newPrice, 0);
    const { error: updateError } = await supabaseAdmin
      .from('proposals')
      .update({ client_selected_price: numericPrice })
      .eq('id', proposalId);

    if (updateError) {
      logError("[proposals] update price error", updateError);
      return { error: "Request failed" };
    }

    return { price: numericPrice };
  }

  return { price: null };
}

export async function buildPublicPayload(shareToken: string) {
  try {
  const loaded = await loadProposalByToken(shareToken);
  if ('error' in loaded) {
    return loaded;
  }

  const proposal = normalizeProposal(loaded.proposal);

  if (!proposal.viewed_at && proposal.status !== 'approved') {
    const { error: viewedUpdateError } = await supabaseAdmin
      .from('proposals')
      .update({
        viewed_at: new Date().toISOString(),
        status: proposal.status === 'draft' ? 'viewed' : proposal.status,
      })
      .eq('id', proposal.id);

    if (viewedUpdateError) {
      logError("[proposals] buildPublicPayload mark-viewed error", viewedUpdateError);
    }

    proposal.viewed_at = new Date().toISOString();
    if (proposal.status === 'draft') {
      proposal.status = 'viewed';
    }

    if (proposal.organization_id) {
      trackFunnelEvent({
        supabase: supabaseAdmin,
        organizationId: proposal.organization_id,
        eventType: 'proposal_viewed',
        profileId: proposal.client_id,
        metadata: { proposal_id: proposal.id },
      });
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
    package_tier: proposal.package_tier || null,
    tier_pricing: parseTierPricing(proposal.tier_pricing),
    template_name: proposal.tour_templates?.name || undefined,
    destination: proposal.tour_templates?.destination || undefined,
    duration_days: proposal.tour_templates?.duration_days || undefined,
    description: proposal.tour_templates?.description || undefined,
    hero_image_url: proposal.tour_templates?.hero_image_url || undefined,
  };

  const { data: daysData } = await supabaseAdmin
    .from('proposal_days')
    .select(PROPOSAL_DAY_PUBLIC_SELECT)
    .eq('proposal_id', proposal.id)
    .order('day_number', { ascending: true });
  const publicDayRows = (daysData ?? null) as ProposalDayRow[] | null;

  const days: PublicDay[] = (publicDayRows || []).map((day) => ({
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
      .select(PROPOSAL_ACTIVITY_PUBLIC_SELECT)
      .in('proposal_day_id', dayIds)
      .order('display_order', { ascending: true });
    const activityRows = (activitiesData ?? null) as ProposalActivityRow[] | null;

    for (const activity of activityRows || []) {
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
      .select(PROPOSAL_ACCOMMODATION_PUBLIC_SELECT)
      .in('proposal_day_id', dayIds);
    const accommodationRows = (accommodationsData ?? null) as ProposalAccommodationRow[] | null;

    for (const accommodation of accommodationRows || []) {
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
    .select(PROPOSAL_ADD_ON_PUBLIC_SELECT)
    .eq('proposal_id', proposal.id)
    .order('category', { ascending: true });
  const addOnRows = (addOnsData ?? null) as ProposalAddOnRow[] | null;

  const addOns: PublicAddOn[] = (addOnRows || []).map((addOn) => ({
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
  } catch (err) {
    logError("[proposals] buildPublicPayload unexpected error", err);
    return { error: "Failed to load proposal", status: 500 as const };
  }
}
