import Link from 'next/link';
import { motion } from 'framer-motion';
import { CalendarDays, ChevronRight, FileEdit, Gift, Plane, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import { fmt, stageLabel, type AutoRequoteData, type SmartUpsellData } from '../shared';

interface UpsellAndRequotePanelsProps {
  loading: boolean;
  smartUpsell: SmartUpsellData;
  autoRequote: AutoRequoteData;
}

export function UpsellAndRequotePanels({ loading, smartUpsell, autoRequote }: UpsellAndRequotePanelsProps) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        <GlassCard padding="lg">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
              <Gift className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-secondary dark:text-white">🎁 Earn more from existing trips</h2>
              <p className="text-xs text-text-muted">Without finding new clients — just offer the right thing at the right time</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-800" />)}</div>
          ) : (smartUpsell.recommendations ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="mb-2 text-3xl">✈️</p>
              <p className="font-bold text-secondary dark:text-white">No upcoming trips to upsell right now</p>
              <p className="mt-1 text-sm text-text-muted">Check back when you have confirmed trips in the next 30 days.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(smartUpsell.recommendations ?? []).slice(0, 5).map((item) => {
                const topAddon = item.recommendations?.[0];
                const daysLeft = item.days_to_departure;

                return (
                  <Link
                    key={item.trip_id}
                    href={`/trips/${item.trip_id}`}
                    className="group flex items-center gap-4 rounded-2xl border border-violet-100 bg-white/50 p-4 transition-all duration-200 hover:border-violet-300 dark:border-violet-800/20 dark:bg-black/10 dark:hover:border-violet-700"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/30">
                      <Plane className="h-5 w-5 text-violet-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-secondary dark:text-white">
                        {item.trip_title}
                        {item.destination ? ` — ${item.destination}` : ''}
                      </p>
                      <p className="mt-0.5 text-[11px] text-text-muted">{stageLabel(item.stage)}</p>
                      {topAddon ? (
                        <p className="mt-1 text-xs font-semibold text-violet-600 dark:text-violet-400">
                          💡 Offer: {topAddon.name}
                          {topAddon.price_usd > 0 ? ` — earn ${fmt(topAddon.price_usd)} more` : ''}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      {daysLeft !== null && daysLeft !== undefined ? (
                        <>
                          <p className="text-lg font-black leading-none text-violet-600 dark:text-violet-400">{daysLeft}d</p>
                          <p className="text-[10px] text-text-muted">to depart</p>
                        </>
                      ) : (
                        <CalendarDays className="h-5 w-5 text-text-muted" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </GlassCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <GlassCard padding="lg">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <FileEdit className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-secondary dark:text-white">📋 Quotes that may need a price change</h2>
              <p className="text-xs text-text-muted">These quotes might be priced too high — consider a small adjustment</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">{[1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-slate-800" />)}</div>
          ) : (autoRequote.candidates ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="mb-2 text-3xl">👌</p>
              <p className="font-bold text-secondary dark:text-white">Your pricing looks good!</p>
              <p className="mt-1 text-sm text-text-muted">No quotes flagged for a price review right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(autoRequote.candidates ?? []).slice(0, 3).map((item) => {
                const isHighRisk = item.requote_score >= 70;
                const isMedRisk = item.requote_score >= 45;
                const riskEmoji = isHighRisk ? '🔴' : isMedRisk ? '🟡' : '🟢';
                const riskLabel = isHighRisk ? 'High risk' : isMedRisk ? 'Medium risk' : 'Low risk';
                const riskColor = isHighRisk
                  ? 'border-rose-100 bg-rose-50 text-rose-600 dark:border-rose-800/30 dark:bg-rose-900/20'
                  : isMedRisk
                    ? 'border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-800/30 dark:bg-amber-900/20'
                    : 'border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-800/30 dark:bg-emerald-900/20';

                return (
                  <Link
                    key={item.proposal_id}
                    href={`/proposals/${item.proposal_id}`}
                    className={`group flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors ${riskColor}`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-secondary dark:text-white">
                        {riskEmoji} {item.title}
                      </p>
                      <p className="mt-0.5 text-xs opacity-80">{riskLabel} — consider lowering by ~{Math.abs(item.suggested_delta_pct)}%</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 opacity-60 transition-opacity group-hover:opacity-100" />
                  </Link>
                );
              })}
            </div>
          )}
        </GlassCard>
      </motion.div>

      <p className="pb-4 text-center text-[11px] text-text-muted">
        <Sparkles className="mr-1 inline h-3 w-3 text-primary" />
        Insights are based on your real bookings and proposals data. Updated every time you refresh.
      </p>
    </>
  );
}
