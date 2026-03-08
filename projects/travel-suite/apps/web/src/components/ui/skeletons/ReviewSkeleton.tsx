"use client";

import { GlassSkeleton } from "@/components/glass/GlassSkeleton";

export function ReviewSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <GlassSkeleton className="h-4 w-32 rounded-full bg-slate-200" />
            <GlassSkeleton className="h-4 w-20 rounded-full bg-slate-200" />
          </div>
          <GlassSkeleton className="mb-2 h-4 w-full rounded-full bg-slate-200" />
          <GlassSkeleton className="mb-2 h-4 w-11/12 rounded-full bg-slate-200" />
          <GlassSkeleton className="h-10 w-32 rounded-xl bg-slate-200" />
        </div>
      ))}
    </div>
  );
}
