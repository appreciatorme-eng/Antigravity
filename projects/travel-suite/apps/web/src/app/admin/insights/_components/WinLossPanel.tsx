import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import type { WinLossData } from '../shared';

interface WinLossPanelProps {
  loading: boolean;
  winPct: number;
  winLoss: WinLossData;
}

export function WinLossPanel({ loading, winPct, winLoss }: WinLossPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <GlassCard padding="lg">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
            <Target className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-secondary dark:text-white">📊 Why do clients book (or not)?</h2>
            <p className="text-xs text-text-muted">Based on your last 120 days of quotes</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="h-48 animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-800" />
            <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-slate-800" />)}</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2">
            <div className="flex flex-col items-center gap-4">
              <div className="relative h-40 w-40">
                <div
                  className="h-40 w-40 rounded-full"
                  style={{ background: `conic-gradient(#10b981 0% ${winPct}%, #e5e7eb ${winPct}% 100%)` }}
                />
                <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-white shadow-inner dark:bg-slate-900">
                  <p className="text-3xl font-black leading-none text-secondary dark:text-white">{winPct}%</p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">booked</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-secondary dark:text-white">
                  {winLoss.totals?.wins ?? 0} bookings from {winLoss.totals?.proposals ?? 0} quotes
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {winPct >= 30 ? 'Great conversion! Industry average is ~30% ✅' : 'Room to improve — faster follow-ups help 📈'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {(winLoss.patterns ?? []).map((pattern) => {
                const patternConfig: Record<string, { emoji: string; plain: string }> = {
                  no_view: {
                    emoji: '🙈',
                    plain: `${pattern.count} of your quotes were never even opened — try following up within 24 hours of sending`,
                  },
                  stale_viewed: {
                    emoji: '⏳',
                    plain: `${pattern.count} clients saw your quote but went quiet — they need a gentle nudge from you`,
                  },
                  price_pressure: {
                    emoji: '💡',
                    plain: 'Higher-priced quotes lose more often — consider offering payment plans for bigger bookings',
                  },
                };
                const cfg = patternConfig[pattern.key] ?? { emoji: '📌', plain: pattern.insight };

                return (
                  <div key={pattern.key} className="flex items-start gap-3 rounded-xl border border-blue-50 bg-blue-50/50 p-3.5 dark:border-blue-900/20 dark:bg-blue-900/10">
                    <span className="mt-0.5 shrink-0 text-xl leading-none">{cfg.emoji}</span>
                    <p className="text-sm leading-relaxed text-secondary dark:text-white">{cfg.plain}</p>
                  </div>
                );
              })}

              {(winLoss.patterns ?? []).length === 0 ? (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-center dark:border-emerald-900/20 dark:bg-emerald-900/10">
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Not enough data yet 📊</p>
                  <p className="mt-1 text-xs text-text-muted">Send more quotes to start seeing patterns.</p>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
