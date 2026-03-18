import type { TourConfig } from './tour-types';

export const BRAND_TOUR: TourConfig = {
  id: 'brand',
  steps: [
    {
      element: '[data-tour="logo-upload"]',
      popover: {
        title: 'Upload Your Logo',
        description:
          'Drag & drop or click to upload your company logo. It will appear on proposals and client-facing pages.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="color-picker"]',
      popover: {
        title: 'Set Your Brand Color',
        description:
          "Pick your brand color -- it'll tint buttons, headers, and proposals to match your identity.",
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="branding-section"]',
      popover: {
        title: "You're All Set!",
        description:
          'Your brand is configured. Head back to the dashboard to continue setup.',
        side: 'bottom',
        align: 'center',
      },
    },
  ],
};

export const ITINERARY_TOUR: TourConfig = {
  id: 'itinerary',
  steps: [
    {
      element: '[data-tour="destination-input"]',
      popover: {
        title: 'Pick a Destination',
        description:
          'Type where your client wants to go -- try "Rajasthan", "Maldives", or "Dubai".',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="duration-selector"]',
      popover: {
        title: 'Set the Duration',
        description:
          'Use + and - to choose how many days. Domestic trips: 3-7 days. International: 7-14.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="budget-selector"]',
      popover: {
        title: 'Choose Budget Style',
        description:
          'Pick a budget tier -- this guides AI on hotel ratings, restaurants, and activity types.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="interests-grid"]',
      popover: {
        title: 'Select Interests (Optional)',
        description:
          'Tap interests that match your client -- Art, Food, Adventure, etc. Skip if unsure.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-tour="generate-button"]',
      popover: {
        title: 'Generate the Itinerary!',
        description:
          'Click this button and AI will create a complete day-by-day plan in ~15 seconds.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-tour="save-button"]',
      popover: {
        title: 'Save to Your Library',
        description:
          'Save this itinerary so you can find it later, edit it, or share it with clients.',
        side: 'bottom',
        align: 'end',
      },
      waitForElement: true,
    },
    {
      element: '[data-tour="share-button"]',
      popover: {
        title: 'Share with Client',
        description:
          'Send a beautiful shareable link via WhatsApp or copy it to clipboard. Done!',
        side: 'bottom',
        align: 'end',
      },
      waitForElement: true,
    },
  ],
};

export const WHATSAPP_TOUR: TourConfig = {
  id: 'whatsapp',
  steps: [
    {
      element: '[data-tour="whatsapp-card"]',
      popover: {
        title: 'Connect WhatsApp',
        description:
          'Link your WhatsApp number to chat with clients directly from TripBuilt.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="whatsapp-connect-btn"]',
      popover: {
        title: 'Scan QR Code',
        description:
          'Click this button, then scan the QR code with your WhatsApp app. No API setup needed!',
        side: 'left',
        align: 'center',
      },
    },
  ],
};

export const SHARE_TOUR: TourConfig = {
  id: 'share',
  steps: [
    {
      element: '[data-tour="trip-list"]',
      popover: {
        title: 'Your Trips',
        description:
          'Here are all your saved trips. Pick one to share as a proposal.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-tour="trip-row-first"]',
      popover: {
        title: 'Open a Trip',
        description:
          'Click on any trip to see its details and sharing options.',
        side: 'bottom',
        align: 'start',
      },
    },
  ],
};

/** Continuation tour for trip detail page (after clicking a trip from the share tour) */
export const SHARE_DETAIL_TOUR: TourConfig = {
  id: 'share-detail',
  steps: [
    {
      element: '[data-tour="share-trip-btn"]',
      popover: {
        title: 'Share This Trip',
        description:
          'Click here to generate a shareable proposal link for your client.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="notify-client-btn"]',
      popover: {
        title: 'Notify Your Client',
        description:
          'Send a WhatsApp or email notification to the client about this trip.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="save-changes-btn"]',
      popover: {
        title: 'Save Changes',
        description:
          'Made any edits? Hit Save to keep everything in sync.',
        side: 'bottom',
        align: 'end',
      },
    },
  ],
};

export const TOUR_MAP: Record<string, TourConfig> = {
  brand: BRAND_TOUR,
  itinerary: ITINERARY_TOUR,
  whatsapp: WHATSAPP_TOUR,
  share: SHARE_TOUR,
  'share-detail': SHARE_DETAIL_TOUR,
};
