"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, TrendingUp, ArrowRight, BarChart3, Target, Users } from "lucide-react";

export function UpgradeBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 via-[#0a1628] to-[#0a1628] p-6 shadow-lg"
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-violet-500/5 pointer-events-none" />

      <div className="relative">
        {/* Header */}
        <div className="mb-4 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">
              Unlock Full Business Insights
            </h3>
            <p className="mt-1 text-sm text-white/60">
              Upgrade to see complete performance trends, conversion metrics, and actionable recommendations
            </p>
          </div>
        </div>

        {/* Locked features grid */}
        <div className="mb-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">6-Month Trends</p>
              <p className="mt-0.5 text-[11px] text-white/50">Revenue & conversion charts</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
              <Target className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Performance Score</p>
              <p className="mt-0.5 text-[11px] text-white/50">Leading, steady, or at-risk</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <Users className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Client Insights</p>
              <p className="mt-0.5 text-[11px] text-white/50">NPS trends & satisfaction</p>
            </div>
          </div>
        </div>

        {/* Stats banner */}
        <div className="mb-5 rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-transparent p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-snug">
                Operators with full analytics grow 40% faster year-on-year
              </p>
              <p className="mt-1 text-xs font-bold text-emerald-400">
                Make data-driven decisions, not gut-feeling guesses
              </p>
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Link
            href="/billing"
            className="flex-1 group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:brightness-110 hover:shadow-emerald-500/40"
          >
            Upgrade to Pro
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/billing"
            className="flex items-center justify-center gap-1 text-xs text-white/40 transition-colors hover:text-white/60 sm:px-3"
          >
            Compare all plans
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
