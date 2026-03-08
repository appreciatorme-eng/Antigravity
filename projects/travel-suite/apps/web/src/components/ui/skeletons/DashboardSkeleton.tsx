"use client";

import { SkeletonCard } from "@/components/ui/skeletons/SkeletonCard";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonCard key={index} className="h-28 w-full" />
        ))}
      </div>
      <SkeletonCard className="h-80 w-full" />
    </div>
  );
}
