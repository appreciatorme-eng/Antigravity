/**
 * Notification Settings Page
 *
 * Configure browser push notifications for proposal events
 */

'use client';

import NotificationSettings from '@/components/NotificationSettings';

export default function NotificationSettingsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
        <p className="text-gray-600 mt-2">
          Configure browser notifications for proposal events and client interactions
        </p>
      </div>

      <NotificationSettings />

      {/* Additional Settings Info */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">About Notifications</h2>

        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Real-Time Updates</h3>
            <p>
              Notifications are powered by Supabase Realtime and delivered instantly when clients
              interact with proposals. You'll receive notifications even when Travel Suite is
              closed or in the background.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Privacy & Security</h3>
            <p>
              Notifications are sent directly from our servers to your browser. No third-party
              services are involved. You can revoke permission at any time through your browser
              settings.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Device Support</h3>
            <p>
              Browser notifications work on desktop (Chrome, Firefox, Safari, Edge) and mobile
              devices. For mobile push notifications, add Travel Suite to your home screen.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Managing Noise</h3>
            <p>
              We recommend keeping "Proposal Views" disabled to avoid notification fatigue. Focus
              on high-value events like comments and approvals. You can always check proposal
              analytics for view data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
