"use client";

import { useMemo } from "react";
import { GlassCard } from "@/components/glass/GlassCard";
import { DayCell } from "./DayCell";
import { DAY_NAMES } from "./constants";
import { getMonthDays, getEventsForDay, computeEventLanes, getWeeksInMonth } from "./utils";
import { getBlockedSlotsForDay, type OperatorUnavailability } from "./availability";
import type { CalendarEvent } from "./types";

interface MonthViewProps {
  events: CalendarEvent[];
  blockedSlots: OperatorUnavailability[];
  currentDate: Date;
  onDayClick: (day: { year: number; month: number; day: number }) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export function MonthView({
  events,
  blockedSlots,
  currentDate,
  onDayClick,
  onEventClick,
}: MonthViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthDays = useMemo(() => getMonthDays(year, month), [year, month]);

  // Compute multi-day event lanes for each week (reserved for lane overlay rendering)
  const weeks = useMemo(() => getWeeksInMonth(year, month), [year, month]);
  const monthStart = useMemo(() => new Date(year, month, 1), [year, month]);
  const monthEnd = useMemo(() => new Date(year, month + 1, 0, 23, 59, 59, 999), [year, month]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _weekLanes = useMemo(
    () => weeks.map((w) => computeEventLanes(events, w.weekStart, w.weekEnd, monthStart, monthEnd)),
    [events, weeks, monthStart, monthEnd]
  );

  return (
    <GlassCard padding="none" className="overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 border-b border-gray-200 rounded-t-2xl overflow-hidden">
        {DAY_NAMES.map((d) => (
          <div key={d} className="bg-gray-50/80 py-3 text-center text-xs font-bold uppercase tracking-widest text-text-secondary">
            {d}
          </div>
        ))}
      </div>

      {/* Multi-day event lanes overlay (absolute positioned bars) */}
      <div className="relative">
        {/* Day grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-b-xl overflow-hidden">
          {monthDays.map((day, idx) => {
            const dayEvents = day ? getEventsForDay(events, year, month, day) : [];
            const blockedForDay = day
              ? getBlockedSlotsForDay(blockedSlots, year, month, day)
              : [];

            return (
              <DayCell
                key={idx}
                day={day}
                year={year}
                month={month}
                events={dayEvents}
                blockedSlots={blockedForDay}
                totalEventCount={dayEvents.length}
                onDayClick={onDayClick}
                onEventClick={onEventClick}
                index={idx}
              />
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}
