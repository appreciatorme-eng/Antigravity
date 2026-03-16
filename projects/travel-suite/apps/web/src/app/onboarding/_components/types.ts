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

export interface WizardStep {
  id: number;
  title: string;
  description: string;
  skippable?: boolean;
  helpText?: string;
  videoUrl?: string;
}

export const WIZARD_STEPS: readonly WizardStep[] = [
  {
    id: 1,
    title: 'Business Basics',
    description: 'Set your operator identity and visual branding.',
    skippable: false,
    helpText: 'Your business name and logo appear on all proposals. Choose a primary color that matches your brand.',
    videoUrl: undefined,
  },
  {
    id: 2,
    title: 'Services & Market',
    description: 'Define regions, specialties, and your marketplace pitch.',
    skippable: true,
    helpText: 'Service regions and specialties help clients find you in the marketplace. You can update these later.',
    videoUrl: undefined,
  },
  {
    id: 3,
    title: 'Create Sample Trip',
    description: 'Build your first proposal to see the platform in action.',
    skippable: true,
    helpText: 'Create a sample trip using AI or a saved itinerary plan. This helps you learn the proposal flow.',
    videoUrl: undefined,
  },
  {
    id: 4,
    title: 'Generate Proposal',
    description: 'Create your first professional proposal with AI assistance.',
    skippable: true,
    helpText: 'Generate a polished proposal from your trip data. This shows how proposals work in the platform.',
    videoUrl: undefined,
  },
  {
    id: 5,
    title: 'Proposal Style',
    description: 'Choose the default itinerary template your clients will see.',
    skippable: false,
    helpText: 'This template will be used for all new proposals. You can change it per-proposal later.',
    videoUrl: undefined,
  },
  {
    id: 6,
    title: 'Review & Launch',
    description: 'Confirm details and save your workspace setup.',
    skippable: false,
    helpText: 'Review your setup before launching. You can modify these settings anytime from your dashboard.',
    videoUrl: undefined,
  },
  {
    id: 7,
    title: 'First-Value Sprint',
    description: 'Create and share your first itinerary inside 10 minutes.',
    skippable: true,
    helpText: 'Complete these quick tasks to see how the platform works. Each milestone takes under 3 minutes.',
    videoUrl: undefined,
  },
] as const;

export const TOTAL_WIZARD_STEPS = WIZARD_STEPS.length;
export const TRIP_CREATION_STEP = 3;
export const PROPOSAL_GENERATION_STEP = 4;
export const REVIEW_STEP = 6;
export const FIRST_VALUE_STEP = 7;

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
