'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { usePathname } from 'next/navigation';
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
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';

const LS_KEY = 'tripbuilt:setup_checklist_dismissed';
const COMPLETED_KEY = 'tripbuilt:setup_completed_items';

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
  const [newlyCompleted, setNewlyCompleted] = useState<string | null>(null);
  const previousCompletedRef = useRef<Set<string>>(new Set());
  const previousPctRef = useRef<number>(0);
  const pathname = usePathname();
  const mountedRef = useRef(false);

  const fetchProgress = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/admin/setup-progress', { signal });
      if (!res.ok) return;
      const json = await res.json();
      if (!json?.data) return;

      const newData = json.data as SetupProgressData;
      const currentCompleted = new Set(
        newData.items.filter((i: ChecklistItem) => i.completed).map((i: ChecklistItem) => i.id)
      );

      // Detect newly completed items (skip first load)
      if (previousCompletedRef.current.size > 0) {
        for (const id of currentCompleted) {
          if (!previousCompletedRef.current.has(id)) {
            setNewlyCompleted(id);
            confetti({
              particleCount: 60,
              spread: 55,
              origin: { y: 0.7 },
              colors: ['#00d084', '#00b37a', '#fbbf24', '#f59e0b'],
              disableForReducedMotion: true,
            });
            setTimeout(() => setNewlyCompleted(null), 3000);
            break;
          }
        }
      }

      previousCompletedRef.current = currentCompleted;

      // Big celebration when all steps complete
      if (
        newData.completionPct === 100 &&
        previousPctRef.current < 100 &&
        previousPctRef.current > 0
      ) {
        const end = Date.now() + 800;
        const frame = () => {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#00d084', '#fbbf24'],
            disableForReducedMotion: true,
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#00d084', '#fbbf24'],
            disableForReducedMotion: true,
          });
          if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();
      }
      previousPctRef.current = newData.completionPct;

      // Persist known completed items so we detect changes next time
      try {
        localStorage.setItem(COMPLETED_KEY, JSON.stringify([...currentCompleted]));
      } catch { /* ignore */ }

      setData(newData);
    } catch { /* fail silently */ }
  }, []);

  useEffect(() => {
    try {
      const wasDismissed = localStorage.getItem(LS_KEY) === 'true';
      if (wasDismissed) return;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR-safe: must read localStorage after mount
      setDismissed(false);

      // Restore previous completed items for change detection
      const saved = localStorage.getItem(COMPLETED_KEY);
      if (saved) {
        previousCompletedRef.current = new Set(JSON.parse(saved) as string[]);
      }
    } catch {
      return;
    }

    const controller = new AbortController();
    void fetchProgress(controller.signal);
    return () => controller.abort();
  }, [fetchProgress]);

  // Re-fetch when navigating back to /admin (same-tab navigation via router.push)
  useEffect(() => {
    if (dismissed || !mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (pathname === '/admin') {
      // Delay slightly to let DB writes settle
      const timer = setTimeout(() => void fetchProgress(), 500);
      return () => clearTimeout(timer);
    }
  }, [dismissed, pathname, fetchProgress]);

  // Re-fetch when page becomes visible (user returns from completing a task)
  useEffect(() => {
    if (dismissed) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void fetchProgress();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Also re-fetch on focus (covers same-tab navigation via back button)
    const handleFocus = () => void fetchProgress();
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [dismissed, fetchProgress]);

  if (dismissed || !data) return null;

  const allDone = data.completionPct === 100;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(LS_KEY, 'true');
    } catch { /* localStorage unavailable */ }
  };

  return (
    <GlassCard padding="lg" className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Rocket className="w-5 h-5 text-[#00d084]" />
          <h2 className="text-sm font-bold text-gray-900">
            Get Started with TripBuilt
          </h2>
        </div>
        <button
          onClick={handleDismiss}
          className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          aria-label="Dismiss checklist"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Items or All Done */}
      {allDone ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <div className="flex items-center gap-2">
            <PartyPopper className="w-6 h-6 text-[#00d084] animate-bounce" />
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <p className="text-sm font-bold text-gray-900">
            You&apos;re all set up!
          </p>
          <p className="text-xs text-gray-500">
            Your workspace is fully configured. Time to grow your business.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {data.items.map((item) => {
            const isClickable = item.href !== '#';
            const justCompleted = newlyCompleted === item.id;
            const rowContent = (
              <>
                {item.completed ? (
                  <CheckCircle2
                    className={`w-5 h-5 shrink-0 ${
                      justCompleted
                        ? 'text-[#00d084] animate-bounce'
                        : 'text-[#00d084]'
                    }`}
                  />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300 shrink-0" />
                )}
                <span className="text-gray-400 shrink-0">
                  {ICON_MAP[item.icon]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    justCompleted ? 'text-[#00d084]' : 'text-gray-900'
                  }`}>
                    {justCompleted ? `${item.title} — Done!` : item.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {justCompleted ? 'Great job!' : item.description}
                  </p>
                </div>
                {justCompleted && (
                  <Sparkles className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                )}
                {isClickable && !justCompleted && (
                  <span className="shrink-0 p-1 text-gray-400" title={item.completed ? 'Retake tour' : undefined}>
                    {item.completed ? (
                      <RotateCcw className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
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
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                  justCompleted ? 'bg-[#00d084]/5' : ''
                }`}
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
