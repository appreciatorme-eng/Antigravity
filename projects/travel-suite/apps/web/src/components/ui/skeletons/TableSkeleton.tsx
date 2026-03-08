"use client";

import { GlassSkeleton } from "@/components/glass/GlassSkeleton";

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-6">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5"
        >
          <GlassSkeleton className="h-5 w-5 rounded-md bg-white/10" />
          <div className="space-y-2">
            <GlassSkeleton className="h-4 w-2/3 rounded-full bg-white/10" />
            <GlassSkeleton className="h-3 w-1/2 rounded-full bg-white/10" />
          </div>
          <GlassSkeleton className="h-10 w-24 rounded-xl bg-white/10" />
        </div>
      ))}
    </div>
  );
}
