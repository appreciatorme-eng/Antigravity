export interface Client {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

export interface TourTemplate {
  id: string;
  name: string;
  destination: string | null;
  duration_days: number | null;
  base_price: number | null;
  hero_image_url: string | null;
}

export interface AddOn {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: 'Activities' | 'Dining' | 'Transport' | 'Upgrades' | string;
  image_url: string | null;
  duration: string | null;
  is_active: boolean;
}

export interface FeatureLimitSnapshot {
  allowed: boolean;
  used: number;
  limit: number | null;
  remaining: number | null;
  resetAt: string | null;
  tier: string;
  upgradePlan: string | null;
}

export interface PricingSuggestion {
  min: number;
  median: number;
  max: number;
  confidence: 'data' | 'ai_estimate';
  sampleSize: number;
}

export interface WhatsAppProposalDraft {
  id: string;
  clientId: string | null;
  templateId: string | null;
  travelerName: string | null;
  travelerPhone: string;
  travelerEmail: string | null;
  destination: string | null;
  travelDates: string | null;
  tripStartDate: string | null;
  tripEndDate: string | null;
  groupSize: number | null;
  budgetInr: number | null;
  title: string;
  status: string;
}
