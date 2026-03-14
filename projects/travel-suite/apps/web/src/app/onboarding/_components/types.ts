import type { ItineraryTemplateId } from '@/components/pdf/itinerary-types';

export interface OnboardingPayload {
  onboardingComplete: boolean;
  profile: {
    full_name: string;
    email: string;
    phone: string;
    phone_whatsapp: string;
    bio: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    primary_color: string | null;
    itinerary_template: ItineraryTemplateId;
  } | null;
  marketplace: {
    description: string;
    service_regions: string[];
    specialties: string[];
    verification_status: string;
    is_verified: boolean;
  } | null;
}

export interface FirstValueMilestone {
  id: 'setup' | 'itinerary' | 'share';
  title: string;
  description: string;
  completed: boolean;
  target_minute: number;
}

export interface FirstValuePayload {
  completion_pct: number;
  completed_milestones: number;
  total_milestones: number;
  setup_complete: boolean;
  itinerary_count: number;
  shared_itinerary_count: number;
  first_itinerary_created_at: string | null;
  first_shared_at: string | null;
  latest_share_url: string | null;
  milestones: FirstValueMilestone[];
}

export const WIZARD_STEPS = [
  {
    id: 1,
    title: 'Business Basics',
    description: 'Set your operator identity and visual branding.',
  },
  {
    id: 2,
    title: 'Services & Market',
    description: 'Define regions, specialties, and your marketplace pitch.',
  },
  {
    id: 3,
    title: 'Proposal Style',
    description: 'Choose the default itinerary template your clients will see.',
  },
  {
    id: 4,
    title: 'Review & Launch',
    description: 'Confirm details and save your workspace setup.',
  },
  {
    id: 5,
    title: 'First-Value Sprint',
    description: 'Create and share your first itinerary inside 10 minutes.',
  },
] as const;

export const TOTAL_WIZARD_STEPS = WIZARD_STEPS.length;
export const REVIEW_STEP = 4;
export const FIRST_VALUE_STEP = 5;

export function formatDateTime(input: string | null): string {
  if (!input) return 'Not completed';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return 'Not completed';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
