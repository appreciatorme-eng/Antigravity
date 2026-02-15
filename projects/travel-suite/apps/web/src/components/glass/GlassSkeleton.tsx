/**
 * Glass Skeleton Component
 *
 * Loading skeletons with glassmorphism effect
 * Used to show content placeholders while data is loading
 */

'use client';

import { cn } from '@/lib/utils';

export interface GlassSkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
}

export function GlassSkeleton({
  className,
  variant = 'rectangular',
  animation = 'pulse',
}: GlassSkeletonProps) {
  const baseStyles = 'bg-white/40 dark:bg-white/10';

  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer bg-gradient-to-r from-white/40 via-white/60 to-white/40 dark:from-white/10 dark:via-white/20 dark:to-white/10',
    none: '',
  };

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        animationStyles[animation],
        className
      )}
    />
  );
}

export function GlassCardSkeleton() {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <GlassSkeleton className="h-4 w-24" />
          <GlassSkeleton className="h-8 w-32" />
        </div>
        <GlassSkeleton variant="circular" className="w-12 h-12" />
      </div>
      <GlassSkeleton className="h-20 w-full" />
    </div>
  );
}

export function GlassTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/20 flex gap-4">
        <GlassSkeleton className="h-4 w-32" />
        <GlassSkeleton className="h-4 w-24" />
        <GlassSkeleton className="h-4 w-40" />
        <GlassSkeleton className="h-4 w-20" />
      </div>

      {/* Rows */}
      <div className="divide-y divide-white/10">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex gap-4 items-center">
            <GlassSkeleton variant="circular" className="w-10 h-10" />
            <div className="flex-1 space-y-2">
              <GlassSkeleton className="h-4 w-48" />
              <GlassSkeleton className="h-3 w-32" />
            </div>
            <GlassSkeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function GlassListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="glass-card p-4 flex items-center gap-4">
          <GlassSkeleton variant="circular" className="w-12 h-12 shrink-0" />
          <div className="flex-1 space-y-2">
            <GlassSkeleton className="h-4 w-3/4" />
            <GlassSkeleton className="h-3 w-1/2" />
          </div>
          <GlassSkeleton className="h-9 w-24" />
        </div>
      ))}
    </div>
  );
}

export function GlassStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-card p-6">
          <div className="flex items-start justify-between mb-4">
            <GlassSkeleton className="h-3 w-20" />
            <GlassSkeleton variant="circular" className="w-12 h-12" />
          </div>
          <GlassSkeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export function GlassFormSkeleton() {
  return (
    <div className="glass-card p-6 space-y-6">
      <div className="space-y-2">
        <GlassSkeleton className="h-4 w-24" />
        <GlassSkeleton className="h-12 w-full" />
      </div>
      <div className="space-y-2">
        <GlassSkeleton className="h-4 w-32" />
        <GlassSkeleton className="h-12 w-full" />
      </div>
      <div className="space-y-2">
        <GlassSkeleton className="h-4 w-28" />
        <GlassSkeleton className="h-24 w-full" />
      </div>
      <div className="flex gap-3 justify-end">
        <GlassSkeleton className="h-10 w-24" />
        <GlassSkeleton className="h-10 w-32" />
      </div>
    </div>
  );
}
