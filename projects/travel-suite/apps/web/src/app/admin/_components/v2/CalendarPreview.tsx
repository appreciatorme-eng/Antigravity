'use client';

import Link from 'next/link';
import { CalendarDays, ChevronRight } from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassSkeleton } from '@/components/glass/GlassSkeleton';
import { cn } from '@/lib/utils';
import type { DashboardV2State } from './types';

function DotRow({
  departures,
  payments,
  quotes,
  followUps,
}: {
  departures: number;
  payments: number;
  quotes: number;
  followUps: number;
}) {
  const dots: Array<{ color: string; label: string }> = [];
  if (departures > 0)
    dots.push({
      color: 'bg-blue-500',
      label: `${departures} departure${departures > 1 ? 's' : ''}`,
    });
  if (payments > 0)
    dots.push({
      color: 'bg-rose-500',
      label: `${payments} payment${payments > 1 ? 's' : ''}`,
    });
  if (quotes > 0)
    dots.push({
      color: 'bg-amber-500',
      label: `${quotes} quote${quotes > 1 ? 's' : ''}`,
    });
  if (followUps > 0)
    dots.push({
      color: 'bg-violet-500',
      label: `${followUps} follow-up${followUps > 1 ? 's' : ''}`,
    });

  if (dots.length === 0) return null;

  return (
    <div
      className="mt-1.5 flex items-center justify-center gap-1"
      title={dots.map((dot) => dot.label).join(', ')}
    >
      {dots.map((dot, index) => (
        <span
          key={`${dot.color}-${index}`}
          className={cn('h-1.5 w-1.5 rounded-full', dot.color)}
        />
      ))}
    </div>
  );
}

interface CalendarPreviewProps {
  data: DashboardV2State;
}

export function CalendarPreview({ data }: CalendarPreviewProps) {
  const preview = data.overview?.calendarPreview;
  const isLoading = data.phase === 'loading';

  if (isLoading) {
    return (
      <GlassCard padding="xl" className="h-full">
        <GlassSkeleton className="mb-4 h-5 w-40" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <GlassSkeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </GlassCard>
    );
  }

  const days = preview?.days ?? [];
  const hasAnyEvents = preview?.hasAnyEvents ?? false;
  const sourceErrors = preview?.sourceErrors ?? [];

  return (
    <GlassCard padding="xl" className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-black uppercase tracking-widest text-text-muted">
            Next 7 Days
          </h2>
        </div>
        <Link
          href="/calendar"
          className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
        >
          Calendar <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {sourceErrors.length > 0 && (
        <p className="mb-3 text-[11px] font-medium text-amber-600">
          Some calendar sources are unavailable, so this preview may be partial.
        </p>
      )}

      <div className="mb-3 flex flex-wrap gap-3">
        {[
          { color: 'bg-blue-500', label: 'Departures' },
          { color: 'bg-rose-500', label: 'Payments' },
          { color: 'bg-amber-500', label: 'Quotes' },
          { color: 'bg-violet-500', label: 'Follow-ups' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <span className={cn('h-1.5 w-1.5 rounded-full', item.color)} />
            <span className="text-[9px] font-medium text-text-muted">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const eventCount =
            day.departures + day.payments + day.followUps + day.quotes;
          return (
            <Link
              key={day.date}
              href={`/calendar?date=${day.date}`}
              className={cn(
                'flex flex-col items-center rounded-xl px-1 py-2 transition-colors hover:bg-primary/5',
                day.isToday
                  ? 'bg-primary/10 ring-1 ring-primary/30'
                  : eventCount > 0
                    ? 'bg-white/50 dark:bg-white/[0.03]'
                    : '',
              )}
              title={
                eventCount > 0
                  ? `${eventCount} item${eventCount === 1 ? '' : 's'} on ${day.label}`
                  : `No items on ${day.label}`
              }
            >
              <span
                className={cn(
                  'text-[9px] font-black uppercase tracking-widest',
                  day.isToday ? 'text-primary' : 'text-text-muted',
                )}
              >
                {day.dayLabel}
              </span>
              <span
                className={cn(
                  'text-lg font-black tabular-nums',
                  day.isToday ? 'text-primary' : 'text-secondary dark:text-white',
                )}
              >
                {new Date(`${day.date}T00:00:00.000Z`).getUTCDate()}
              </span>
              <DotRow
                departures={day.departures}
                payments={day.payments}
                quotes={day.quotes}
                followUps={day.followUps}
              />
            </Link>
          );
        })}
      </div>

      {!hasAnyEvents && (
        <p className="mt-3 text-center text-[11px] font-medium text-text-muted">
          No events scheduled for the next 7 days
        </p>
      )}
    </GlassCard>
  );
}
