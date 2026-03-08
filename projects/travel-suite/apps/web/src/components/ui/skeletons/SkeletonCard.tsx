"use client";

import { GlassSkeleton } from "@/components/glass/GlassSkeleton";

export function SkeletonCard({ className = "h-28 w-full" }: { className?: string }) {
  return <GlassSkeleton className={`${className} animate-pulse rounded-2xl bg-white/10`} />;
}
