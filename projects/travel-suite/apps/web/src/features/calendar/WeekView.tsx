"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/glass/GlassCard";
import { AllDayEventsBar } from "./AllDayEventsBar";
import { WeekTimeGrid } from "./WeekTimeGrid";
import { DAY_NAMES } from "./constants";
import {
  formatBlockedRange,
  getBlockedSlotsForDay,
  type OperatorUnavailability,
} from "./availability";
import { getWeekDates, isToday, partitionDayEvents } from "./utils";
import type { CalendarEvent } from "./types";

interface WeekViewProps {
  events: CalendarEvent[];
  blockedSlots: OperatorUnavailability[];
  currentDate: Date;
  onDayClick: (day: { year: number; month: number; day: number }) => void;
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (date: Date, hour: number) => void;
}

export function WeekView({
  events,
  blockedSlots,
  currentDate,
  onDayClick,
  onEventClick,
  onTimeSlotClick,
}: WeekViewProps) {
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  // Collect all all-day events for the week
  const allDayEvents = useMemo(() => {
    const seen = new Set<string>();
    const result: CalendarEvent[] = [];

    for (const date of weekDates) {
      const { allDay } = partitionDayEvents(
        events,
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      );
      for (const event of allDay) {
        if (!seen.has(event.id)) {
          seen.add(event.id);
          result.push(event);
        }
      }
    }

    return result;
  }, [events, weekDates]);

  return (
    <GlassCard padding="none" className="overflow-hidden">
      {/* Weekday name + date headers */}
      <div className="grid grid-cols-[56px_repeat(7,1fr)] gap-0 border-b border-gray-200 dark:border-gray-700 rounded-t-2xl overflow-hidden">
        {/* Empty gutter cell */}
        <div className="bg-gray-50/80 dark:bg-gray-800/50" />

        {weekDates.map((date, idx) => {
          const todayCol = isToday(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
          );
          const blockedForDay = getBlockedSlotsForDay(
            blockedSlots,
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
          );
          const isBlocked = blockedForDay.length > 0;

          return (
            <motion.button
              key={date.toISOString()}
              type="button"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.2, ease: "easeOut" }}
              onClick={() =>
                onDayClick({
                  year: date.getFullYear(),
                  month: date.getMonth(),
                  day: date.getDate(),
                })
              }
              className={cn(
                "py-3 text-center transition-colors border-r border-gray-200 dark:border-gray-700 last:border-r-0",
                "hover:bg-gray-50/60 dark:hover:bg-gray-800/60 cursor-pointer",
                isBlocked && "bg-red-50/90 dark:bg-red-500/10",
                todayCol
                  ? "bg-primary/[0.08]"
                  : "bg-gray-50/80 dark:bg-gray-800/50",
              )}
              title={isBlocked ? blockedForDay.map((slot) => formatBlockedRange(slot)).join("\n") : undefined}
            >
              <span className="text-xs font-bold uppercase tracking-widest text-text-secondary block">
                {DAY_NAMES[idx]}
              </span>
              <span
                className={cn(
                  "inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold mt-1",
                  todayCol
                    ? "bg-primary text-white"
                    : "text-text-secondary",
                )}
              >
                {date.getDate()}
              </span>
              {isBlocked && (
                <span className="mt-1 inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700">
                  Unavailable
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* All-day events bar */}
      <AllDayEventsBar events={allDayEvents} onEventClick={onEventClick} />

      {/* Time grid */}
      <WeekTimeGrid
        weekDates={weekDates}
        events={events}
        blockedSlots={blockedSlots}
        onEventClick={onEventClick}
        onTimeSlotClick={onTimeSlotClick}
      />
    </GlassCard>
  );
}
