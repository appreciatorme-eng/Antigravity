'use client';

import { useEffect, useState } from 'react';
import { GlassButton } from '@/components/glass/GlassButton';
import { GlassCard } from '@/components/glass/GlassCard';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function PortalInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  if (!deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 sm:left-auto sm:right-6 sm:max-w-md">
      <GlassCard
        padding="md"
        rounded="xl"
        opacity="medium"
        className="border border-indigo-300/40 bg-slate-900/70 text-white shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20 text-2xl">
            📱
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">Add this trip to your home screen</p>
            <p className="mt-1 text-xs leading-5 text-white/80">
              Save your itinerary for fast access, even when connectivity is unreliable.
            </p>
          </div>
          <GlassButton
            type="button"
            size="sm"
            className="shrink-0 bg-indigo-500 text-white hover:bg-indigo-400"
            onClick={async () => {
              await deferredPrompt.prompt();
              setDeferredPrompt(null);
            }}
          >
            Install
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
}
