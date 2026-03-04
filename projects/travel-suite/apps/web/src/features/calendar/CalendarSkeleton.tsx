"use client";

import { GlassSkeleton } from "@/components/glass/GlassSkeleton";
import { GlassCard } from "@/components/glass/GlassCard";

const DAY_CELLS = 35; // 5 rows x 7 cols
const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarSkeleton() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <GlassSkeleton className="h-12 w-72" />
        <GlassSkeleton className="h-5 w-96" />
      </div>

      {/* Calendar header skeleton */}
      <GlassCard padding="lg" className="space-y-4">
        <div className="flex items-center justify-between">
          {/* Navigation skeleton */}
          <div className="flex items-center gap-3">
            <GlassSkeleton variant="circular" className="w-9 h-9" />
            <GlassSkeleton className="h-8 w-52" />
            <GlassSkeleton variant="circular" className="w-9 h-9" />
            <GlassSkeleton className="h-8 w-16 rounded-lg" />
          </div>

          {/* View toggle skeleton */}
          <GlassSkeleton className="h-9 w-40 rounded-xl" />
        </div>

        {/* Filter pills skeleton */}
        <div className="flex items-center gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <GlassSkeleton key={i} className="h-9 w-24 rounded-xl" />
          ))}
        </div>
      </GlassCard>

      {/* Calendar grid skeleton */}
      <GlassCard padding="none" className="overflow-hidden">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 border-b border-gray-200">
          {WEEKDAY_HEADERS.map((day) => (
            <div
              key={day}
              className="bg-gray-50/80 py-3 text-center text-xs font-bold uppercase tracking-widest text-transparent"
            >
              <GlassSkeleton className="h-3 w-8 mx-auto" />
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {Array.from({ length: DAY_CELLS }).map((_, i) => (
            <div key={i} className="min-h-[120px] bg-white p-2 space-y-2">
              <GlassSkeleton className="h-4 w-6" />
              {i % 3 === 0 && <GlassSkeleton className="h-5 w-full rounded-md" />}
              {i % 5 === 0 && <GlassSkeleton className="h-5 w-3/4 rounded-md" />}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
