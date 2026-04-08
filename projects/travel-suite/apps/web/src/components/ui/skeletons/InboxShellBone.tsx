"use client";

import type { ReactNode } from "react";
import { Skeleton } from "boneyard-js/react";
import { InboxSkeleton } from "@/components/ui/skeletons/InboxSkeleton";

function InboxShellFixture() {
  return (
    <div className="grid h-full grid-cols-[280px_1fr_240px] overflow-hidden bg-[#0a1628] text-white">
      <div className="border-r border-white/10 p-3">
        <div className="space-y-3">
          <div className="h-10 rounded-xl border border-white/10 bg-white/5" />
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <div className="h-10 w-10 rounded-full bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded-full bg-white/10" />
                <div className="h-3 w-1/2 rounded-full bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-r border-white/10 p-4">
        <div className="space-y-4">
          <div className="h-12 rounded-2xl border border-white/10 bg-white/[0.04]" />
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-16 rounded-2xl border border-white/10 bg-white/[0.04]" />
          ))}
        </div>
      </div>
      <div className="p-4">
        <div className="space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-white/10" />
          <div className="h-4 w-2/3 rounded-full bg-white/10" />
          <div className="h-4 w-1/2 rounded-full bg-white/5" />
          <div className="h-40 rounded-2xl border border-white/10 bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}

export function InboxShellBone({
  loading = true,
  fallback,
}: {
  loading?: boolean;
  fallback?: ReactNode;
}) {
  return (
    <Skeleton
      name="unified-inbox-shell"
      loading={loading}
      animate="shimmer"
      transition
      fallback={fallback ?? <InboxSkeleton />}
      fixture={<InboxShellFixture />}
      className="h-full"
    >
      <InboxShellFixture />
    </Skeleton>
  );
}
