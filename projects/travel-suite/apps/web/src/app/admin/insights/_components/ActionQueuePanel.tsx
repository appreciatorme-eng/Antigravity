import Link from 'next/link';
import { motion } from 'framer-motion';
import { BadgeCheck, ChevronRight, Clock } from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import { actionEmoji, humanSentence, type ActionQueueData } from '../shared';

interface ActionQueuePanelProps {
  loading: boolean;
  actionQueue: ActionQueueData;
  totalActions: number;
}

export function ActionQueuePanel({ loading, actionQueue, totalActions }: ActionQueuePanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <GlassCard padding="lg">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-secondary dark:text-white">🎯 What to do today</h2>
            <p className="mt-0.5 text-xs text-text-muted">These are the most important things for your business right now.</p>
          </div>
          {!loading && totalActions > 0 ? (
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
              {totalActions} item{totalActions !== 1 ? 's' : ''}
            </span>
          ) : null}
        </div>

        <div className="space-y-3">
          {loading ? (
            [1, 2, 3].map((item) => (
              <div key={item} className="h-16 animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-800" />
            ))
          ) : (actionQueue.queue ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/20">
                <BadgeCheck className="h-7 w-7 text-emerald-500" />
              </div>
              <p className="font-bold text-secondary dark:text-white">You&apos;re all caught up! 🎉</p>
              <p className="mt-1 text-sm text-text-muted">No urgent actions right now. Enjoy the peace!</p>
            </div>
          ) : (
            (actionQueue.queue ?? []).slice(0, 5).map((action) => {
              const isUrgent = action.priority >= 90;
              const isToday = action.priority >= 75 && action.priority < 90;
              const urgencyDot = isUrgent ? '🔴' : isToday ? '🟡' : '🟢';
              const urgencyLabel = isUrgent ? 'URGENT' : isToday ? 'TODAY' : 'THIS WEEK';
              const urgencyBg = isUrgent
                ? 'border-rose-100 hover:border-rose-300 dark:border-rose-800/30'
                : isToday
                  ? 'border-amber-100 hover:border-amber-300 dark:border-amber-800/30'
                  : 'border-gray-100 hover:border-primary/30 dark:border-slate-700';

              return (
                <Link
                  key={action.id}
                  href={action.href}
                  className={`group flex items-center gap-4 rounded-2xl border bg-white/60 p-4 transition-all duration-200 hover:shadow-sm dark:bg-black/10 ${urgencyBg}`}
                >
                  <div className="shrink-0 text-2xl leading-none">{actionEmoji(action)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-snug text-secondary dark:text-white">{humanSentence(action)}</p>
                    {action.due_at ? (
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-text-muted">
                        <Clock className="h-3 w-3" />
                        Due {new Date(action.due_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${isUrgent ? 'text-rose-500' : isToday ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {urgencyDot} {urgencyLabel}
                    </span>
                    <ChevronRight className="h-4 w-4 text-text-muted transition-colors group-hover:text-primary" />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
