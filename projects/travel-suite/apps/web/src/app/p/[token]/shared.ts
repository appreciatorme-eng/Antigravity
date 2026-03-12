import { z } from 'zod';

export interface Proposal {
  id: string;
  title: string;
  total_price: number;
  client_selected_price?: number | null;
  status: string;
  expires_at: string | null;
  template_name?: string;
  destination?: string;
  duration_days?: number;
  description?: string;
  hero_image_url?: string;
}

export interface ProposalAddOn {
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
}

export interface ProposalDay {
  id: string;
  proposal_id: string;
  day_number: number;
  title: string | null;
  description: string | null;
  is_approved: boolean;
}

export interface ProposalActivity {
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
}

export interface ProposalAccommodation {
  id: string;
  proposal_day_id: string;
  hotel_name: string;
  star_rating: number;
  room_type: string | null;
  price_per_night: number;
  amenities: string[] | null;
  image_url: string | null;
}

export interface ProposalComment {
  id: string;
  proposal_day_id: string | null;
  author_name: string;
  comment: string;
  created_at: string;
}

export interface PublicProposalPayload {
  proposal: Proposal;
  days: ProposalDay[];
  activitiesByDay: Record<string, ProposalActivity[]>;
  accommodationsByDay: Record<string, ProposalAccommodation>;
  comments: ProposalComment[];
  addOns: ProposalAddOn[];
}

const ProposalSchema = z.object({
  id: z.string(),
  title: z.string(),
  total_price: z.coerce.number(),
  client_selected_price: z.coerce.number().nullable().optional(),
  status: z.string(),
  expires_at: z.string().nullable(),
  template_name: z.string().optional(),
  destination: z.string().optional(),
  duration_days: z.coerce.number().optional(),
  description: z.string().nullable().optional(),
  hero_image_url: z.string().nullable().optional(),
});

const ProposalAddOnSchema = z.object({
  id: z.string(),
  proposal_id: z.string(),
  add_on_id: z.string().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  image_url: z.string().nullable(),
  unit_price: z.coerce.number(),
  quantity: z.coerce.number(),
  is_selected: z.boolean(),
});

const ProposalDaySchema = z.object({
  id: z.string(),
  proposal_id: z.string(),
  day_number: z.coerce.number(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  is_approved: z.boolean(),
});

const ProposalActivitySchema = z.object({
  id: z.string(),
  proposal_day_id: z.string(),
  time: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  location: z.string().nullable(),
  image_url: z.string().nullable(),
  price: z.coerce.number(),
  is_optional: z.boolean(),
  is_premium: z.boolean(),
  is_selected: z.boolean(),
  display_order: z.coerce.number(),
});

const ProposalAccommodationSchema = z.object({
  id: z.string(),
  proposal_day_id: z.string(),
  hotel_name: z.string(),
  star_rating: z.coerce.number(),
  room_type: z.string().nullable(),
  price_per_night: z.coerce.number(),
  amenities: z.array(z.string()).nullable(),
  image_url: z.string().nullable(),
});

const ProposalCommentSchema = z.object({
  id: z.string(),
  proposal_day_id: z.string().nullable(),
  author_name: z.string(),
  comment: z.string(),
  created_at: z.string(),
});

export const PublicProposalPayloadSchema = z.object({
  proposal: ProposalSchema,
  days: z.array(ProposalDaySchema),
  activitiesByDay: z.record(z.string(), z.array(ProposalActivitySchema)),
  accommodationsByDay: z.record(z.string(), ProposalAccommodationSchema),
  comments: z.array(ProposalCommentSchema),
  addOns: z.array(ProposalAddOnSchema),
});

export const PublicActionResponseSchema = z.object({
  error: z.string().optional(),
  client_selected_price: z.coerce.number().optional(),
  status: z.string().optional(),
});
