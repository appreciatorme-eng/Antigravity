import type { TourConfig } from './tour-types';
import { EXTENDED_TOUR_MAP } from './app-tour-steps-extended';

// ---------------------------------------------------------------------------
// Core page tours (existing 6 — nextPage removed, chaining via registry)
// ---------------------------------------------------------------------------

export const DASHBOARD_TOUR: TourConfig = {
  id: 'tour-dashboard',
  steps: [
    {
      element: '[data-tour="kpi-strip"]',
      popover: {
        title: '📊 Your Key Metrics',
        description: 'Revenue, pipeline value, departures, and win rate — all at a glance.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="morning-briefing"]',
      popover: {
        title: '☀️ Morning Briefing',
        description: 'Daily priorities — overdue payments, upcoming departures, and follow-ups appear here.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="calendar-preview"]',
      popover: {
        title: '📅 Weekly Calendar',
        description: 'Your next 7 days — departures, payments due, and follow-ups at a glance.',
        side: 'left',
        align: 'start',
      },
    },
    {
      element: '[data-tour="setup-checklist"]',
      popover: {
        title: '✅ Setup Checklist',
        description: 'Complete these tasks to fully set up your workspace. Click any item for a guided walkthrough.',
        side: 'left',
        align: 'start',
      },
    },
  ],
};

export const PLANNER_TOUR: TourConfig = {
  id: 'tour-planner',
  steps: [
    {
      element: '[data-tour="destination-input"]',
      popover: {
        title: '🌍 Pick a Destination',
        description: 'Type where your client wants to go — AI will build a complete itinerary.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="duration-selector"]',
      popover: {
        title: '📅 Set Duration',
        description: 'Choose how many days. Domestic: 3-7 days, International: 7-14.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="budget-selector"]',
      popover: {
        title: '💰 Budget Style',
        description: 'Pick a tier — this guides AI on hotels, restaurants, and activities.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="generate-button"]',
      popover: {
        title: '✨ Generate Itinerary',
        description: 'Click to create a complete day-by-day plan with costs, tips, and maps.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-tour="past-itineraries"]',
      popover: {
        title: '📂 Your Itinerary Library',
        description: 'Saved itineraries appear here. Click any to view, edit, or share.',
        side: 'top',
        align: 'center',
      },
      waitForElement: true,
    },
  ],
};

export const TRIPS_TOUR: TourConfig = {
  id: 'tour-trips',
  steps: [
    {
      element: '[data-tour="trip-kpi-stats"]',
      popover: {
        title: '📈 Trip Dashboard',
        description: 'Track revenue, active trips, upcoming departures, and pending collections.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="trip-search"]',
      popover: {
        title: '🔍 Search & Filter',
        description: 'Find trips by destination, client name, or reference number.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="create-trip-btn"]',
      popover: {
        title: '➕ Create New Trip',
        description: 'Start a trip manually or from a saved itinerary.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tour="trip-list"]',
      popover: {
        title: '📋 Trip List',
        description: 'Click any trip to view details, share proposals, or manage bookings.',
        side: 'top',
        align: 'center',
      },
    },
  ],
};

export const CLIENTS_TOUR: TourConfig = {
  id: 'tour-clients',
  steps: [
    {
      element: '[data-tour="client-stats"]',
      popover: {
        title: '👥 Client Overview',
        description: 'Total clients, active pipeline, VIP count, and lifetime value.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="client-kanban"]',
      popover: {
        title: '📋 Client Pipeline',
        description: 'Drag clients through stages — Inquiry, Proposal Sent, Confirmed, Completed.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-tour="create-client-btn"]',
      popover: {
        title: '➕ Add New Client',
        description: 'Create a client profile to start tracking their journey.',
        side: 'bottom',
        align: 'end',
      },
    },
  ],
};

export const INBOX_TOUR: TourConfig = {
  id: 'tour-inbox',
  steps: [
    {
      element: '[data-tour="inbox-tabs"]',
      popover: {
        title: '📬 Inbox Navigation',
        description: 'Switch between Inbox, Automations, Templates, and Broadcast.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="inbox-messages"]',
      popover: {
        title: '💬 Unified Messages',
        description: 'All WhatsApp and email conversations in one place. Click to reply.',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: '[data-tour="inbox-automations"]',
      popover: {
        title: '🤖 Automations',
        description: 'Set up auto-replies, follow-up sequences, and notification rules.',
        side: 'bottom',
        align: 'center',
      },
      waitForElement: true,
    },
  ],
};

export const SETTINGS_TOUR: TourConfig = {
  id: 'tour-settings',
  steps: [
    {
      element: '[data-tour="branding-section"]',
      popover: {
        title: '🎨 Branding',
        description: 'Upload your logo and set brand colors. These appear on all client-facing content.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="whatsapp-card"]',
      popover: {
        title: '💬 WhatsApp',
        description: 'Connect your WhatsApp to chat with clients directly from TripBuilt.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="org-details"]',
      popover: {
        title: '🏢 Business Details',
        description: 'Set your company name, address, and contact information.',
        side: 'top',
        align: 'center',
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Merged map: core + extended tours
// ---------------------------------------------------------------------------

/** Map of all app tour IDs to their configs */
export const APP_TOUR_MAP: Record<string, TourConfig> = {
  'tour-dashboard': DASHBOARD_TOUR,
  'tour-planner': PLANNER_TOUR,
  'tour-trips': TRIPS_TOUR,
  'tour-clients': CLIENTS_TOUR,
  'tour-inbox': INBOX_TOUR,
  'tour-settings': SETTINGS_TOUR,
  ...EXTENDED_TOUR_MAP,
};
