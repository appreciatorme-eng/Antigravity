'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Rocket,
  CheckCircle2,
  Circle,
  ArrowRight,
  X,
  Building2,
  Palette,
  Plane,
  MessageCircle,
  Send,
  PartyPopper,
} from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';

const LS_KEY = 'tripbuilt:setup_checklist_dismissed';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  href: string;
  icon: string;
}

interface SetupProgressData {
  items: ChecklistItem[];
  completionPct: number;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  building: <Building2 className="w-4 h-4" />,
  palette: <Palette className="w-4 h-4" />,
  plane: <Plane className="w-4 h-4" />,
  'message-circle': <MessageCircle className="w-4 h-4" />,
  send: <Send className="w-4 h-4" />,
};

export function SetupChecklist() {
  const [data, setData] = useState<SetupProgressData | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      const wasDismissed = localStorage.getItem(LS_KEY) === 'true';
      if (wasDismissed) return;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR-safe: must read localStorage after mount
      setDismissed(false);
    } catch {
      return;
    }

    const controller = new AbortController();
    fetch('/api/admin/setup-progress', { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) setData(json.data);
      })
      .catch(() => {
        // fail silently
      });

    return () => controller.abort();
  }, []);

  if (dismissed || !data) return null;

  const allDone = data.completionPct === 100;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(LS_KEY, 'true');
    } catch {
      // localStorage unavailable
    }
  };

  return (
    <GlassCard padding="lg" className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Rocket className="w-5 h-5 text-[#00d084]" />
          <h3 className="text-sm font-bold text-gray-900">
            Get Started with TripBuilt
          </h3>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          aria-label="Dismiss checklist"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Items or All Done */}
      {allDone ? (
        <div className="flex items-center gap-2 py-4 justify-center text-sm font-medium text-gray-700">
          <PartyPopper className="w-5 h-5 text-[#00d084]" />
          All done! You&apos;re all set up.
        </div>
      ) : (
        <div className="space-y-1">
          {data.items.map((item) => {
            const isClickable = !item.completed && item.href !== '#';
            const rowContent = (
              <>
                {item.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-[#00d084] shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300 shrink-0" />
                )}
                <span className="text-gray-400 shrink-0">
                  {ICON_MAP[item.icon]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {item.description}
                  </p>
                </div>
                {isClickable && (
                  <span className="shrink-0 p-1 text-gray-400">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </>
            );

            return isClickable ? (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-100 cursor-pointer"
              >
                {rowContent}
              </Link>
            ) : (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
              >
                {rowContent}
              </div>
            );
          })}
        </div>
      )}

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">Setup progress</span>
          <span className="text-xs font-semibold text-gray-700">
            {data.completionPct}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#00d084] to-[#00d084]/70 transition-all duration-500"
            style={{ width: `${data.completionPct}%` }}
          />
        </div>
      </div>
    </GlassCard>
  );
}
