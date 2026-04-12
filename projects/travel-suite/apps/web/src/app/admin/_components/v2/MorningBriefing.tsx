'use client';

import { Calendar, Sparkles } from 'lucide-react';
import { GlassSkeleton } from '@/components/glass/GlassSkeleton';
import type { DashboardV2State } from './types';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

interface MorningBriefingProps {
  data: DashboardV2State;
}

export function MorningBriefing({ data }: MorningBriefingProps) {
  const isLoading = data.phase === 'loading';
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <GlassSkeleton className="h-12 w-72" />
        <GlassSkeleton className="h-5 w-96" />
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div className="space-y-2">
        <h1 className="text-4xl font-serif leading-none tracking-tight text-secondary dark:text-white md:text-5xl">
          {getGreeting()}
        </h1>
        <div className="flex items-center gap-2 text-text-muted">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="max-w-2xl text-sm font-medium">
            {data.overview?.briefing.sentence ||
              'All clear — no urgent operator actions right now.'}
          </p>
        </div>
      </div>

      <div className="flex h-12 shrink-0 items-center gap-3 rounded-2xl border border-gray-100 bg-white px-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Calendar className="h-4 w-4 text-primary" />
        <span className="text-sm font-black uppercase tracking-tighter text-secondary dark:text-white">
          {todayLabel}
        </span>
      </div>
    </div>
  );
}
