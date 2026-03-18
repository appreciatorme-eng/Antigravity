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
    itinerary_template: string;
  } | null;
  marketplace: {
    description: string;
    service_regions: string[];
    specialties: string[];
    verification_status: string;
    is_verified: boolean;
  } | null;
}

export interface WizardStep {
  id: number;
  title: string;
  description: string;
  skippable?: boolean;
}

export const WIZARD_STEPS: readonly WizardStep[] = [
  { id: 1, title: 'Welcome', description: 'Set up your workspace', skippable: false },
  { id: 2, title: 'Ready', description: 'Your workspace is ready', skippable: false },
] as const;

export const TOTAL_WIZARD_STEPS = WIZARD_STEPS.length;
export const SUBMIT_STEP = 2;

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
