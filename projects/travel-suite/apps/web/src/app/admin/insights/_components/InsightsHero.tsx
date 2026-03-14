import { motion } from 'framer-motion';
import { AlertTriangle, IndianRupee, MessageSquare, RefreshCw, ShieldAlert, Sparkles, type LucideIcon } from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';

interface BusinessHealth {
  Icon: LucideIcon;
  label: string;
  sub: string;
  color: string;
  bg: string;
  border: string;
}

interface InsightsHeroProps {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  onRefresh: () => void;
  health: BusinessHealth;
  revenue30d: number;
  totalActions: number;
  conversionRate: number;
}

export function InsightsHero({
  loading,
  refreshing,
  error,
  onRefresh,
  health,
  revenue30d,
  totalActions,
  conversionRate,
}: InsightsHeroProps) {
  const { Icon: HealthIcon } = health;

  return (
    <>
      <motion.div
        className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Business Pulse</span>
          </div>
          <h1 className="text-3xl font-serif tracking-tight text-secondary dark:text-white">Good day 👋</h1>
          <p className="mt-1 text-sm text-text-muted">
            Here&apos;s everything you need to know about your business today.
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-text-muted transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </motion.div>

      {error ? (
        <GlassCard padding="lg" className="border-rose-200 bg-rose-50/30">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600" />
            <p className="text-sm font-medium text-rose-700">{error}</p>
          </div>
        </GlassCard>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <GlassCard padding="none" className={`overflow-hidden border bg-gradient-to-br ${health.bg} ${health.border}`}>
          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/60 shadow-sm dark:bg-black/20">
                <HealthIcon className={`h-6 w-6 ${health.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold leading-snug text-secondary dark:text-white">
                  {loading ? 'Loading your business data…' : health.label}
                </p>
                <p className="mt-0.5 text-sm text-text-muted">{health.sub}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white/70 px-4 py-3.5 dark:border-emerald-900/30 dark:bg-black/20">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                  <IndianRupee className="h-4.5 w-4.5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xl font-black leading-none text-emerald-700 dark:text-emerald-400">
                    {loading ? '—' : revenue30d.toLocaleString('en-US')}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-text-muted">earned this month</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-white/70 px-4 py-3.5 dark:border-amber-900/30 dark:bg-black/20">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
                  <MessageSquare className="h-4.5 w-4.5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xl font-black leading-none text-amber-700 dark:text-amber-400">
                    {loading ? '—' : totalActions}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-text-muted">
                    {totalActions === 1 ? 'quote needs follow-up' : 'quotes need follow-up'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white/70 px-4 py-3.5 dark:border-blue-900/30 dark:bg-black/20">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40">
                  <AlertTriangle className="h-4.5 w-4.5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-black leading-none text-blue-700 dark:text-blue-400">
                    {loading ? '—' : `${conversionRate.toFixed(0)}%`}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-text-muted">quote-to-booking rate</p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </>
  );
}
