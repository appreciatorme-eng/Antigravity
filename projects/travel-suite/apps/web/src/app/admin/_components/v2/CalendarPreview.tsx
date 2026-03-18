'use client';

import Link from 'next/link';
import { CalendarDays, ChevronRight } from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassSkeleton } from '@/components/glass/GlassSkeleton';
import { cn } from '@/lib/utils';
import type { DashboardV2State } from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface DayEvents {
  date: Date;
  label: string;
  dayLabel: string;
  isToday: boolean;
  departures: number;
  payments: number;
  followUps: number;
  quotes: number;
}

function buildWeekDays(data: DashboardV2State): DayEvents[] {
  const cc = data.critical?.commandCenter;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: DayEvents[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().slice(0, 10);

    let departures = 0;
    let payments = 0;
    let followUps = 0;
    let quotes = 0;

    if (cc) {
      departures = cc.departures.filter((d) => {
        if (!d.start_date) return false;
        return d.start_date.slice(0, 10) === dateStr;
      }).length;

      payments = cc.pending_payments.filter((p) => {
        if (!p.due_date) return false;
        return p.due_date.slice(0, 10) === dateStr;
      }).length;

      followUps = cc.follow_ups.filter((f) => {
        if (!f.scheduled_for) return false;
        return f.scheduled_for.slice(0, 10) === dateStr;
      }).length;

      quotes = cc.expiring_quotes.filter((q) => {
        if (!q.expires_at) return false;
        return q.expires_at.slice(0, 10) === dateStr;
      }).length;
    }

    days.push({
      date,
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      dayLabel: i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' }),
      isToday: i === 0,
      departures,
      payments,
      followUps,
      quotes,
    });
  }

  return days;
}

// ---------------------------------------------------------------------------
// Dot indicator
// ---------------------------------------------------------------------------

function DotRow({ day }: { day: DayEvents }) {
  const dots: Array<{ color: string; label: string }> = [];
  if (day.departures > 0) dots.push({ color: 'bg-blue-500', label: `${day.departures} departure${day.departures > 1 ? 's' : ''}` });
  if (day.payments > 0) dots.push({ color: 'bg-rose-500', label: `${day.payments} payment${day.payments > 1 ? 's' : ''}` });
  if (day.quotes > 0) dots.push({ color: 'bg-amber-500', label: `${day.quotes} quote${day.quotes > 1 ? 's' : ''}` });
  if (day.followUps > 0) dots.push({ color: 'bg-violet-500', label: `${day.followUps} follow-up${day.followUps > 1 ? 's' : ''}` });

  if (dots.length === 0) return null;

  return (
    <div className="mt-1.5 flex items-center justify-center gap-1" title={dots.map((d) => d.label).join(', ')}>
      {dots.map((dot) => (
        <span key={dot.color} className={cn('h-1.5 w-1.5 rounded-full', dot.color)} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface CalendarPreviewProps {
  data: DashboardV2State;
}

export function CalendarPreview({ data }: CalendarPreviewProps) {
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

  const days = buildWeekDays(data);
  const hasAnyEvents = days.some(
    (d) => d.departures + d.payments + d.followUps + d.quotes > 0,
  );

  return (
    <GlassCard padding="xl" className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-black uppercase tracking-widest text-text-muted">
            Next 7 Days
          </h3>
        </div>
        <Link
          href="/calendar"
          className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
        >
          Calendar <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Legend */}
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

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const eventCount =
            day.departures + day.payments + day.followUps + day.quotes;
          return (
            <div
              key={day.label}
              className={cn(
                'flex flex-col items-center rounded-xl px-1 py-2 transition-colors',
                day.isToday
                  ? 'bg-primary/10 ring-1 ring-primary/30'
                  : eventCount > 0
                    ? 'bg-white/50 dark:bg-white/[0.03]'
                    : '',
              )}
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
                  day.isToday
                    ? 'text-primary'
                    : 'text-secondary dark:text-white',
                )}
              >
                {day.date.getDate()}
              </span>
              <DotRow day={day} />
            </div>
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
