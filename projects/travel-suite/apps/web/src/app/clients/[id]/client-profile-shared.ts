import type { ComponentType } from 'react';
import {
  CheckCircle2,
  FileText,
  MessageCircle,
  Timer,
  XCircle,
} from 'lucide-react';

export const CLIENT_PROFILE_SELECT = [
  'budget_max',
  'budget_min',
  'client_tag',
  'created_at',
  'dietary_preferences',
  'dietary_requirements',
  'email',
  'full_name',
  'home_airport',
  'id',
  'interests',
  'language_preference',
  'lead_status',
  'lifecycle_stage',
  'medical_notes',
  'mobility_requirements',
  'notes',
  'organization_id',
  'phone',
  'preferred_destination',
  'referral_source',
  'source_channel',
  'travel_style',
  'travelers_count',
].join(', ');

export const formatINR = (n: number | null | undefined) => {
  if (!n) return '—';
  return '₹' + Math.round(n).toLocaleString('en-IN');
};

export const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const timeAgo = (dateStr: string | null | undefined) => {
  if (!dateStr) return '—';
  const ms = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(ms / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? 's' : ''} ago`;
};

export const getInitials = (name: string | null) => {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
};

export const getDaysSince = (dateStr: string | null | undefined) => {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
};

export type ClientProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string | null;
  organization_id: string | null;
  preferred_destination?: string | null;
  travelers_count?: number | null;
  budget_min?: number | null;
  budget_max?: number | null;
  travel_style?: string | null;
  interests?: string[] | null;
  home_airport?: string | null;
  language_preference?: string | null;
  client_tag?: string | null;
  dietary_preferences?: string | null;
  mobility_requirements?: string | null;
  medical_notes?: string | null;
  lifecycle_stage?: string | null;
  referral_source?: string | null;
  source_channel?: string | null;
  notes?: string | null;
  lead_status?: string | null;
  dietary_requirements?: string[] | null;
  mobility_needs?: string | null;
};

export type TripRow = {
  id: string;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  itinerary_id: string | null;
  created_at: string | null;
};

export type ItineraryMeta = {
  id: string;
  destination: string | null;
  trip_title: string | null;
  duration_days: number | null;
};

export type ProposalRow = {
  id: string;
  title: string | null;
  status: string | null;
  total_price: number | null;
  created_at: string | null;
  viewed_at: string | null;
  approved_at: string | null;
  expires_at: string | null;
};

export const STAGE_COLORS: Record<string, string> = {
  lead: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  prospect:
    'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800',
  proposal:
    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  payment_pending:
    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  payment_confirmed:
    'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  active:
    'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  review:
    'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  past: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
};

export const STAGE_LABELS: Record<string, string> = {
  lead: '🌱 Lead',
  prospect: '👀 Prospect',
  proposal: '📋 Proposal',
  payment_pending: '⏳ Payment Pending',
  payment_confirmed: '✅ Confirmed',
  active: '✈️ Active Trip',
  review: '⭐ Review',
  past: '🏁 Closed',
};

export const PROPOSAL_STATUS_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    icon: ComponentType<{ className?: string }>;
    hint: string;
  }
> = {
  draft: {
    label: 'Draft',
    hint: 'Not sent yet',
    color:
      'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-gray-400 dark:border-slate-700',
    icon: FileText,
  },
  sent: {
    label: 'Quote Sent',
    hint: 'Waiting for client to open',
    color:
      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    icon: FileText,
  },
  viewed: {
    label: 'Viewed 👀',
    hint: 'Client has seen the quote',
    color:
      'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800',
    icon: MessageCircle,
  },
  commented: {
    label: 'Gave Feedback 💬',
    hint: 'Client left comments — follow up!',
    color:
      'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    icon: MessageCircle,
  },
  approved: {
    label: 'Approved ✅',
    hint: 'Client confirmed — collect payment',
    color:
      'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Declined ❌',
    hint: 'Client said no',
    color:
      'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
    icon: XCircle,
  },
  expired: {
    label: 'Expired ⏰',
    hint: 'Quote deadline passed',
    color:
      'bg-gray-100 text-gray-500 border-gray-200 dark:bg-slate-800 dark:text-gray-500 dark:border-slate-700',
    icon: Timer,
  },
};

export const TRIP_STATUS_COLORS: Record<string, { badge: string; label: string }> = {
  completed: {
    badge:
      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    label: 'Completed ✅',
  },
  confirmed: {
    badge:
      'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    label: 'Confirmed',
  },
  in_progress: {
    badge:
      'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    label: 'On Trip ✈️',
  },
  cancelled: {
    badge:
      'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
    label: 'Cancelled',
  },
  draft: {
    badge:
      'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-gray-400 dark:border-slate-700',
    label: 'Planning',
  },
};

export const TAG_CONFIG: Record<string, { label: string; color: string }> = {
  vip: {
    label: '⭐ VIP',
    color:
      'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400',
  },
  repeat: {
    label: '🔄 Repeat',
    color:
      'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400',
  },
  corporate: {
    label: '🏢 Corporate',
    color:
      'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400',
  },
  family: {
    label: '👨‍👩‍👧 Family',
    color:
      'bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-900/20 dark:border-violet-800 dark:text-violet-400',
  },
  honeymoon: {
    label: '💑 Honeymoon',
    color:
      'bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-900/20 dark:border-pink-800 dark:text-pink-400',
  },
  high_priority: {
    label: '🔥 Priority',
    color:
      'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400',
  },
};

export function deriveClientDashboardState(profile: ClientProfile, trips: TripRow[], proposals: ProposalRow[]) {
  const totalTrips = trips.length;
  const completedTrips = trips.filter((trip) => trip.status === 'completed').length;
  const activeTrips = trips.filter((trip) => ['confirmed', 'in_progress'].includes(trip.status ?? '')).length;

  const totalProposals = proposals.length;
  const wonProposals = proposals.filter((proposal) => proposal.status === 'approved').length;
  const rejectedProposals = proposals.filter((proposal) => proposal.status === 'rejected').length;
  const openProposals = proposals.filter((proposal) =>
    ['sent', 'viewed', 'commented'].includes(proposal.status ?? ''),
  ).length;
  const winRate = totalProposals > 0 ? Math.round((wonProposals / totalProposals) * 100) : 0;

  const totalRevenue = proposals
    .filter((proposal) => proposal.status === 'approved')
    .reduce((sum, proposal) => sum + (proposal.total_price ?? 0), 0);

  const memberSinceDays = getDaysSince(profile.created_at);
  const language = profile.language_preference ?? 'English';
  const initials = getInitials(profile.full_name ?? null);
  const hasPreferences =
    profile.preferred_destination ||
    profile.travelers_count ||
    profile.budget_min ||
    profile.budget_max ||
    profile.travel_style ||
    (profile.interests && profile.interests.length > 0) ||
    profile.home_airport;
  const activeProposal = proposals.find((proposal) =>
    ['sent', 'viewed', 'commented'].includes(proposal.status ?? ''),
  );
  const lastContactDate = proposals[0]?.created_at ?? profile.created_at;
  const urgentProposal = proposals.find((proposal) => {
    if (!['sent', 'viewed'].includes(proposal.status ?? '')) return false;
    if (!proposal.created_at) return false;
    return getDaysSince(proposal.created_at) >= 3;
  });
  const tagConf = profile.client_tag ? TAG_CONFIG[profile.client_tag] : null;

  return {
    activeProposal,
    activeTrips,
    completedTrips,
    hasPreferences,
    initials,
    language,
    lastContactDate,
    memberSinceDays,
    openProposals,
    rejectedProposals,
    tagConf,
    totalProposals,
    totalRevenue,
    totalTrips,
    urgentProposal,
    winRate,
    wonProposals,
  };
}
