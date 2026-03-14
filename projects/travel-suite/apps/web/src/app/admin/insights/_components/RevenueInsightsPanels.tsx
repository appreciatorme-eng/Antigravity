import Link from 'next/link';
import { motion } from 'framer-motion';
import { BadgeCheck, IndianRupee, TrendingDown, TrendingUp } from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import { fmt, type MarginLeakData } from '../shared';

interface RevenueInsightsPanelsProps {
  loading: boolean;
  revenue30d: number;
  conversionRate: number;
  proposalCount: number;
  conversionPer10: number;
  marginLeak: MarginLeakData;
  totalDiscountGiven: number;
}

export function RevenueInsightsPanels({
  loading,
  revenue30d,
  conversionRate,
  proposalCount,
  conversionPer10,
  marginLeak,
  totalDiscountGiven,
}: RevenueInsightsPanelsProps) {
  return (
    <motion.div
      className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <GlassCard padding="lg" className="border-emerald-100/50 dark:border-emerald-900/30">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <h2 className="text-base font-bold text-secondary dark:text-white">💰 Your money this month</h2>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-8 animate-pulse rounded-xl bg-gray-100 dark:bg-slate-800" />)}</div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-800/30 dark:bg-emerald-900/20">
              <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-emerald-600">Revenue earned</p>
              <p className="text-4xl font-black text-emerald-700 dark:text-emerald-400">{fmt(revenue30d)}</p>
              <p className="mt-1 text-xs text-emerald-600/70">in the last 30 days</p>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <BadgeCheck className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-secondary dark:text-white">
                  {conversionPer10} out of every 10 quotes you send become real bookings
                </p>
                <p className="mt-0.5 text-xs text-text-muted">
                  You sent {proposalCount} quote{proposalCount !== 1 ? 's' : ''} this month
                  {conversionRate >= 30 ? ' — great conversion rate! ✅' : ' — try following up faster to convert more 📈'}
                </p>
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      <GlassCard padding="lg" className="border-amber-100/50 dark:border-amber-900/30">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
            <TrendingDown className="h-4 w-4 text-amber-600" />
          </div>
          <h2 className="text-base font-bold text-secondary dark:text-white">🎟️ Discounts you gave away</h2>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-10 animate-pulse rounded-xl bg-gray-100 dark:bg-slate-800" />)}</div>
        ) : (marginLeak.leaks ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="mb-2 text-3xl">🎉</p>
            <p className="font-bold text-secondary dark:text-white">No big discounts found!</p>
            <p className="mt-1 text-sm text-text-muted">Your pricing is holding strong.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {totalDiscountGiven > 0 ? (
              <div className="mb-4 rounded-2xl border border-amber-100 bg-amber-50 p-3.5 dark:border-amber-800/30 dark:bg-amber-900/20">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  This month you gave away <span className="text-sm font-black">{fmt(totalDiscountGiven)}</span> in discounts — is that intentional?
                </p>
              </div>
            ) : null}

            {(marginLeak.leaks ?? []).slice(0, 4).map((leak) => {
              const discountAmt = (leak.listed_price_usd ?? 0) * ((leak.discount_pct ?? 0) / 100);
              return (
                <Link
                  key={leak.proposal_id}
                  href={`/proposals/${leak.proposal_id}`}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-amber-100 p-3 transition-colors hover:border-amber-300 dark:border-amber-800/20 dark:hover:border-amber-700"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-secondary dark:text-white">{leak.title}</p>
                    <p className="mt-0.5 text-xs text-text-muted">{leak.discount_pct.toFixed(0)}% less than your standard rate</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-black text-amber-600">{fmt(discountAmt)}</p>
                    <p className="text-[10px] text-text-muted">given away</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
