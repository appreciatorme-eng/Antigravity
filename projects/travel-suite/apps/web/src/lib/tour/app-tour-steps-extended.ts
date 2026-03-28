import type { TourConfig } from './tour-types';

// ---------------------------------------------------------------------------
// Extended page tours (16 new tours for all nav-config pages)
// ---------------------------------------------------------------------------

// ── Primary ─────────────────────────────────────────────────────────────────

export const PROPOSALS_TOUR: TourConfig = {
  id: 'tour-proposals',
  steps: [
    {
      element: '[data-tour="proposal-stats"]',
      popover: {
        title: '📊 Proposal Pipeline',
        description: 'Track draft, sent, viewed, and approved proposals at a glance.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="proposal-filters"]',
      popover: {
        title: '🔍 Filter & Search',
        description: 'Filter by status or search by client name to find proposals fast.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="create-proposal-btn"]',
      popover: {
        title: '➕ Create Proposal',
        description: 'Build a new proposal from a trip — choose a template, add pricing, and send.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tour="proposal-list"]',
      popover: {
        title: '📋 Your Proposals',
        description: 'Click any proposal to preview, share the link, or track client actions.',
        side: 'top',
        align: 'center',
      },
    },
  ],
};

// ── Daily Workflow ───────────────────────────────────────────────────────────

export const BOOKINGS_TOUR: TourConfig = {
  id: 'tour-bookings',
  steps: [
    {
      element: '[data-tour="booking-tabs"]',
      popover: {
        title: '✈️ Flights & Hotels',
        description: 'Switch between flight search and hotel search tabs.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="booking-search"]',
      popover: {
        title: '🔍 Search Bookings',
        description: 'Search for flights or hotels to add to your trip itinerary.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="booking-itinerary-select"]',
      popover: {
        title: '📋 Link to Itinerary',
        description: 'Select which trip itinerary this booking belongs to.',
        side: 'bottom',
        align: 'start',
      },
    },
  ],
};

export const CALENDAR_TOUR: TourConfig = {
  id: 'tour-calendar',
  steps: [
    {
      element: '[data-tour="calendar-view"]',
      popover: {
        title: '📅 Your Schedule',
        description: 'See all departures, payments due, and follow-ups on a monthly calendar.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="calendar-filters"]',
      popover: {
        title: '🔍 Filter Events',
        description: 'Filter by trip type, status, or date range to focus on what matters.',
        side: 'bottom',
        align: 'start',
      },
    },
  ],
};

export const DRIVERS_TOUR: TourConfig = {
  id: 'tour-drivers',
  steps: [
    {
      element: '[data-tour="driver-search"]',
      popover: {
        title: '🔍 Find Drivers',
        description: 'Search your driver roster by name or vehicle type.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="add-driver-btn"]',
      popover: {
        title: '➕ Add Driver',
        description: 'Register a new driver with their contact info and vehicle details.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tour="driver-list"]',
      popover: {
        title: '🚗 Driver Roster',
        description: 'View all registered drivers. Click any driver to edit, link to an account, or assign to trips.',
        side: 'top',
        align: 'center',
      },
    },
  ],
};

// ── Operations ──────────────────────────────────────────────────────────────

export const INVOICES_TOUR: TourConfig = {
  id: 'tour-invoices',
  steps: [
    {
      element: '[data-tour="invoice-create-form"]',
      popover: {
        title: '📝 Create Invoice',
        description: 'Fill in client, items, and GST details to generate a professional invoice.',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: '[data-tour="invoice-preview"]',
      popover: {
        title: '👁️ Live Preview',
        description: 'See a real-time preview of your invoice as you fill in the form.',
        side: 'left',
        align: 'start',
      },
    },
    {
      element: '[data-tour="invoice-list"]',
      popover: {
        title: '📋 Invoice History',
        description: 'View all invoices — filter by status, download PDF, or send payment links.',
        side: 'top',
        align: 'center',
      },
    },
  ],
};

export const REVENUE_TOUR: TourConfig = {
  id: 'tour-revenue',
  steps: [
    {
      element: '[data-tour="revenue-chart"]',
      popover: {
        title: '📈 Revenue Trends',
        description: 'Track your monthly revenue, collections, and growth over time.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="revenue-stats"]',
      popover: {
        title: '💰 Key Numbers',
        description: 'Total revenue, average deal size, and collection rate at a glance.',
        side: 'bottom',
        align: 'center',
      },
    },
  ],
};

export const PRICING_TOUR: TourConfig = {
  id: 'tour-pricing',
  steps: [
    {
      element: '[data-tour="pricing-kpi"]',
      popover: {
        title: '💰 Profit Overview',
        description: 'Revenue, costs, margins, and overhead — your financial snapshot.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="pricing-tabs"]',
      popover: {
        title: '📊 View Modes',
        description: 'Switch between Monthly View, Overheads, Analytics, and Ledger.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="pricing-month-nav"]',
      popover: {
        title: '📅 Navigate Months',
        description: 'Use arrows to browse different months and compare performance.',
        side: 'bottom',
        align: 'center',
      },
    },
  ],
};

export const OPERATIONS_TOUR: TourConfig = {
  id: 'tour-operations',
  steps: [
    {
      element: '[data-tour="ops-tabs"]',
      popover: {
        title: '🗓️ Command Center',
        description: 'Switch between Command view, Departures, and Revenue tracking.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="ops-alerts"]',
      popover: {
        title: '⚠️ Action Items',
        description: 'Urgent items — overdue payments, upcoming departures, and pending tasks.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="ops-departures"]',
      popover: {
        title: '✈️ Upcoming Departures',
        description: 'All trips departing soon — sorted by date with client details.',
        side: 'top',
        align: 'center',
      },
      waitForElement: true,
    },
  ],
};

// ── Growth ───────────────────────────────────────────────────────────────────

export const MARKETPLACE_TOUR: TourConfig = {
  id: 'tour-marketplace',
  steps: [
    {
      element: '[data-tour="marketplace-search"]',
      popover: {
        title: '🔍 Find Partners',
        description: 'Search for tour operators by name, region, or specialty.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="marketplace-filters"]',
      popover: {
        title: '🎯 Filter Results',
        description: 'Narrow down by region, specialty, rating, or verified status.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="marketplace-listings"]',
      popover: {
        title: '🏪 Operator Profiles',
        description: 'Browse operators, see ratings and specialties, then click to view full profiles.',
        side: 'top',
        align: 'center',
      },
    },
  ],
};

export const REPUTATION_TOUR: TourConfig = {
  id: 'tour-reputation',
  steps: [
    {
      element: '[data-tour="reputation-score"]',
      popover: {
        title: '⭐ Your Reputation Score',
        description: 'Overall rating and NPS score based on client feedback.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="reputation-reviews"]',
      popover: {
        title: '💬 Client Reviews',
        description: 'See what clients say about your service. Respond to build trust.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-tour="reputation-actions"]',
      popover: {
        title: '🚀 Grow Your Reputation',
        description: 'Request reviews, set up NPS surveys, and embed review widgets.',
        side: 'bottom',
        align: 'center',
      },
    },
  ],
};

export const SOCIAL_TOUR: TourConfig = {
  id: 'tour-social',
  steps: [
    {
      element: '[data-tour="social-composer"]',
      popover: {
        title: '✍️ Post Composer',
        description: 'Create stunning social media posts with AI-generated captions.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="social-templates"]',
      popover: {
        title: '🎨 Templates',
        description: 'Choose from festival, destination, and package templates for quick posts.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="social-publish"]',
      popover: {
        title: '📤 Publish & Share',
        description: 'Download images or share directly to WhatsApp and social platforms.',
        side: 'top',
        align: 'center',
      },
    },
  ],
};

export const INSIGHTS_TOUR: TourConfig = {
  id: 'tour-insights',
  steps: [
    {
      element: '[data-tour="insights-hero"]',
      popover: {
        title: '🧠 AI Daily Briefing',
        description: 'AI-powered summary of your business — what needs attention today.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="insights-action-queue"]',
      popover: {
        title: '⚡ Action Queue',
        description: 'AI-prioritized tasks — follow up on expiring proposals, re-engage stalled leads.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="insights-revenue"]',
      popover: {
        title: '📊 Revenue Insights',
        description: 'Margin leaks, upsell opportunities, and pricing intelligence.',
        side: 'top',
        align: 'center',
      },
    },
  ],
};

export const REFERRALS_TOUR: TourConfig = {
  id: 'tour-referrals',
  steps: [
    {
      element: '[data-tour="referral-code"]',
      popover: {
        title: '🔗 Your Referral Link',
        description: 'Share this unique link with other tour operators to earn commissions.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="referral-stats"]',
      popover: {
        title: '💰 Earnings Dashboard',
        description: 'Track total earnings, active referrals, and pending commissions.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="referral-how-it-works"]',
      popover: {
        title: '📖 How It Works',
        description: 'Share your link → they subscribe → you earn 10% every month for 12 months.',
        side: 'top',
        align: 'center',
      },
    },
  ],
};

// ── Account ─────────────────────────────────────────────────────────────────

export const BILLING_TOUR: TourConfig = {
  id: 'tour-billing',
  steps: [
    {
      element: '[data-tour="billing-plan"]',
      popover: {
        title: '📋 Current Plan',
        description: 'Your subscription tier, features included, and renewal date.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="billing-usage"]',
      popover: {
        title: '📊 Usage Stats',
        description: 'Track how much of your plan limits you are using — trips, clients, storage.',
        side: 'bottom',
        align: 'center',
      },
    },
  ],
};

export const ADDONS_TOUR: TourConfig = {
  id: 'tour-addons',
  steps: [
    {
      element: '[data-tour="addons-stats"]',
      popover: {
        title: '📊 Add-on Performance',
        description: 'Revenue, sales count, and top-selling add-ons at a glance.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="addons-categories"]',
      popover: {
        title: '🏷️ Browse by Category',
        description: 'Filter add-ons by type — Activities, Dining, Transport, or Upgrades.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="addons-grid"]',
      popover: {
        title: '🎯 Your Add-ons',
        description: 'Manage add-ons — toggle active/inactive, edit pricing, or create new ones.',
        side: 'top',
        align: 'center',
      },
    },
  ],
};

export const SUPPORT_TOUR: TourConfig = {
  id: 'tour-support',
  steps: [
    {
      element: '[data-tour="support-form"]',
      popover: {
        title: '🎫 Create Ticket',
        description: 'Submit a support request — describe your issue and set priority.',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: '[data-tour="support-tickets"]',
      popover: {
        title: '📋 Your Tickets',
        description: 'Track all your support tickets — see status, updates, and responses.',
        side: 'top',
        align: 'center',
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Extended tour map (imported by app-tour-steps.ts)
// ---------------------------------------------------------------------------

export const EXTENDED_TOUR_MAP: Record<string, TourConfig> = {
  'tour-proposals': PROPOSALS_TOUR,
  'tour-bookings': BOOKINGS_TOUR,
  'tour-calendar': CALENDAR_TOUR,
  'tour-drivers': DRIVERS_TOUR,
  'tour-invoices': INVOICES_TOUR,
  'tour-revenue': REVENUE_TOUR,
  'tour-pricing': PRICING_TOUR,
  'tour-operations': OPERATIONS_TOUR,
  'tour-marketplace': MARKETPLACE_TOUR,
  'tour-reputation': REPUTATION_TOUR,
  'tour-social': SOCIAL_TOUR,
  'tour-insights': INSIGHTS_TOUR,
  'tour-referrals': REFERRALS_TOUR,
  'tour-billing': BILLING_TOUR,
  'tour-addons': ADDONS_TOUR,
  'tour-support': SUPPORT_TOUR,
};
