/**
 * Notification Settings Page
 *
 * Configure browser push notifications for proposal events
 */

'use client';

import NotificationSettings from '@/components/NotificationSettings';
import { GlassCard } from '@/components/glass/GlassCard';
import { Bell } from 'lucide-react';

export default function NotificationSettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <div>
          <span className="text-xs uppercase tracking-widest text-primary font-bold">Notifications</span>
          <h1 className="text-3xl font-serif text-secondary dark:text-white">Notification Settings</h1>
          <p className="text-text-secondary mt-1">
            Configure browser notifications for proposal events and client interactions
          </p>
        </div>
      </div>

      {/* Notification Settings Component */}
      <NotificationSettings />

      {/* Additional Settings Info */}
      <GlassCard padding="lg">
        <h2 className="text-lg font-semibold text-secondary dark:text-white mb-4">About Notifications</h2>

        <div className="space-y-4 text-sm text-text-secondary">
          <div>
            <h3 className="font-semibold text-secondary dark:text-white mb-1">Real-Time Updates</h3>
            <p>
              Notifications are powered by Supabase Realtime and delivered instantly when clients
              interact with proposals. You&apos;ll receive notifications even when TripBuilt is
              closed or in the background.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-secondary dark:text-white mb-1">Privacy & Security</h3>
            <p>
              Notifications are sent directly from our servers to your browser. No third-party
              services are involved. You can revoke permission at any time through your browser
              settings.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-secondary dark:text-white mb-1">Device Support</h3>
            <p>
              Browser notifications work on desktop (Chrome, Firefox, Safari, Edge) and mobile
              devices. For mobile push notifications, add TripBuilt to your home screen.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-secondary dark:text-white mb-1">Managing Noise</h3>
            <p>
              We recommend keeping &quot;Proposal Views&quot; disabled to avoid notification fatigue. Focus
              on high-value events like comments and approvals. You can always check proposal
              analytics for view data.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
