"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/glass/GlassCard";
import { WeekDayColumn } from "./WeekDayColumn";
import { DAY_NAMES } from "./constants";
import { getWeekDates, getEventsForDay, isToday } from "./utils";
import type { CalendarEvent } from "./types";

// ---------------------------------------------------------------------------
// WeekView — 7-column view for the current week with full event cards
// ---------------------------------------------------------------------------

interface WeekViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  onDayClick: (day: { year: number; month: number; day: number }) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export function WeekView({
  events,
  currentDate,
  onDayClick,
  onEventClick,
}: WeekViewProps) {
  // Derive the 7 dates (Sun-Sat) for the week containing currentDate
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  // Pre-compute events for each day to avoid filtering inside each column
  const dayEvents = useMemo(
    () =>
      weekDates.map((date) =>
        getEventsForDay(
          events,
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
        ),
      ),
    [events, weekDates],
  );

  return (
    <GlassCard padding="none" className="overflow-hidden">
      {/* Weekday name headers */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 border-b border-gray-200 rounded-t-2xl overflow-hidden">
        {weekDates.map((date, idx) => {
          const today = isToday(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
          );

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: idx * 0.04,
                duration: 0.2,
                ease: "easeOut",
              }}
              className={headerCellClass(today)}
            >
              <span className="text-xs font-bold uppercase tracking-widest">
                {DAY_NAMES[idx]}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-7 bg-white rounded-b-xl overflow-hidden">
        {weekDates.map((date, idx) => {
          const today = isToday(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
          );

          return (
            <WeekDayColumn
              key={date.toISOString()}
              date={date}
              events={dayEvents[idx]}
              isToday={today}
              onDayClick={() =>
                onDayClick({
                  year: date.getFullYear(),
                  month: date.getMonth(),
                  day: date.getDate(),
                })
              }
              onEventClick={onEventClick}
              index={idx}
            />
          );
        })}
      </div>
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function headerCellClass(today: boolean): string {
  const base =
    "py-3 text-center text-text-secondary transition-colors";

  if (today) {
    return `${base} bg-primary/[0.08]`;
  }

  return `${base} bg-gray-50/80`;
}
