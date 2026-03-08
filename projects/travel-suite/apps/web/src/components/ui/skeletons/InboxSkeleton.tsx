"use client";

import { GlassSkeleton } from "@/components/glass/GlassSkeleton";

export function InboxSkeleton() {
  return (
    <div className="grid h-full grid-cols-[280px_1fr_240px] overflow-hidden">
      <div className="border-r border-white/10 bg-[#0a1628]/60 p-3">
        <div className="space-y-3">
          <GlassSkeleton className="h-10 w-full rounded-xl bg-white/10" />
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-xl border border-white/5 p-3">
              <GlassSkeleton className="h-10 w-10 rounded-full bg-white/10" />
              <div className="flex-1 space-y-2">
                <GlassSkeleton className="h-3 w-2/3 rounded-full bg-white/10" />
                <GlassSkeleton className="h-3 w-1/2 rounded-full bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-r border-white/10 bg-[#0a1628]/50 p-4">
        <div className="space-y-4">
          <GlassSkeleton className="h-12 w-full rounded-2xl bg-white/10" />
          {Array.from({ length: 5 }).map((_, index) => (
            <GlassSkeleton key={index} className="h-16 w-full rounded-2xl bg-white/10" />
          ))}
        </div>
      </div>
      <div className="bg-[#0a1628]/60 p-4">
        <div className="space-y-4">
          <GlassSkeleton className="mx-auto h-16 w-16 rounded-full bg-white/10" />
          <GlassSkeleton className="h-4 w-2/3 rounded-full bg-white/10" />
          <GlassSkeleton className="h-4 w-1/2 rounded-full bg-white/10" />
          <GlassSkeleton className="h-40 w-full rounded-2xl bg-white/10" />
        </div>
      </div>
    </div>
  );
}
