'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Lightbulb, X, ArrowDown } from 'lucide-react';

const GUIDE_CONTENT: Record<string, { title: string; description: string; hint: string }> = {
  brand: {
    title: 'Add your brand',
    description: 'Upload your company logo and pick a primary brand color. These appear on proposals and invoices sent to clients.',
    hint: 'Scroll down to "Branding & Theme" to update your logo and colors.',
  },
  itinerary: {
    title: 'Create your first itinerary',
    description: 'Type a destination and trip details — AI will generate a complete day-by-day plan in seconds.',
    hint: 'Try something like "5 day Rajasthan heritage tour for a family of 4".',
  },
  whatsapp: {
    title: 'Connect WhatsApp',
    description: 'Link your WhatsApp Business number to chat with clients directly from TripBuilt.',
    hint: 'Find the WhatsApp card in Integrations below and click Connect.',
  },
  share: {
    title: 'Send your first proposal',
    description: 'Share an itinerary with a client to create your first proposal. Open any trip and click Share.',
    hint: 'Select a trip below, then click the Share button to send it to a client.',
  },
};

function SetupGuideInner() {
  const searchParams = useSearchParams();
  const setupKey = searchParams.get('setup');
  const [dismissed, setDismissed] = useState(false);

  if (!setupKey || dismissed) return null;

  const guide = GUIDE_CONTENT[setupKey];
  if (!guide) return null;

  return (
    <div className="bg-[#00d084]/5 border border-[#00d084]/20 rounded-xl p-4 mb-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-[#00d084] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-900">{guide.title}</p>
            <p className="text-sm text-gray-600 mt-1">{guide.description}</p>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-[#00d084] font-medium">
              <ArrowDown className="w-3.5 h-3.5" />
              {guide.hint}
            </div>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100 shrink-0"
          aria-label="Dismiss guide"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function SetupGuide() {
  return (
    <Suspense fallback={null}>
      <SetupGuideInner />
    </Suspense>
  );
}
