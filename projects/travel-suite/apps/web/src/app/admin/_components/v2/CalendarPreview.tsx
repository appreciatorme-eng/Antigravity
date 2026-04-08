'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { CalendarDays, ChevronRight } from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassSkeleton } from '@/components/glass/GlassSkeleton';
import { cn } from '@/lib/utils';
import { fetchCalendarFeed, calendarKeys } from '@/features/calendar/useCalendarEvents';
import { getEventsForDay } from '@/features/calendar/utils';
import type { CalendarEvent } from '@/features/calendar/types';
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

function buildWeekDays(events: CalendarEvent[]): DayEvents[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: DayEvents[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dayEvents = getEventsForDay(
      events,
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );

    const departures = dayEvents.filter((event) => event.type === 'trip').length;
    const payments = dayEvents.filter((event) => event.type === 'invoice').length;
    const followUps = dayEvents.filter((event) => event.type === 'follow_up').length;
    const quotes = dayEvents.filter((event) => event.type === 'proposal').length;

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
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  const lastPreviewDay = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() + 6);
    return date;
  }, [today]);
  const monthRequests = useMemo(() => {
    const first = { month: today.getMonth(), year: today.getFullYear() };
    const second = { month: lastPreviewDay.getMonth(), year: lastPreviewDay.getFullYear() };
    if (first.month === second.month && first.year === second.year) {
      return [first];
    }
    return [first, second];
  }, [lastPreviewDay, today]);
  const queries = useQueries({
    queries: monthRequests.map((request) => ({
      queryKey: calendarKeys.events(request.month, request.year),
      queryFn: () => fetchCalendarFeed(request.month, request.year),
      staleTime: 30_000,
    })),
  });
  const isLoading = data.phase === 'loading' || queries.some((query) => query.isLoading);
  const calendarEvents = useMemo(() => {
    const deduped = new Map<string, CalendarEvent>();
    queries.forEach((query) => {
      query.data?.events.forEach((event) => {
        deduped.set(`${event.type}:${event.id}`, event);
      });
    });
    return Array.from(deduped.values());
  }, [queries]);
  const sourceErrors = useMemo(() => {
    return queries.flatMap((query) => query.data?.sourceErrors ?? []);
  }, [queries]);

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

  const days = buildWeekDays(calendarEvents);
  const hasAnyEvents = days.some(
    (d) => d.departures + d.payments + d.followUps + d.quotes > 0,
  );

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
          const href = `/calendar?date=${
            [
              day.date.getFullYear(),
              String(day.date.getMonth() + 1).padStart(2, "0"),
              String(day.date.getDate()).padStart(2, "0"),
            ].join("-")
          }`;
          return (
            <Link
              key={day.label}
              href={href}
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
                  ? `${eventCount} item${eventCount === 1 ? "" : "s"} on ${day.label}`
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
                  day.isToday
                    ? 'text-primary'
                    : 'text-secondary dark:text-white',
                )}
              >
                {day.date.getDate()}
              </span>
              <DotRow day={day} />
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
