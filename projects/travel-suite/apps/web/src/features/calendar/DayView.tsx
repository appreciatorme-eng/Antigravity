"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/glass/GlassCard";
import { TimeGridEvent } from "./TimeGridEvent";
import { AllDayEventsBar } from "./AllDayEventsBar";
import {
  DAY_START_HOUR,
  DAY_END_HOUR,
  HOUR_HEIGHT_PX,
  HOURS,
} from "./constants";
import {
  partitionDayEvents,
  timeToPixelOffset,
  computeTimeGridColumns,
  formatHourLabel,
  isToday,
} from "./utils";
import type { CalendarEvent } from "./types";

interface DayViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (date: Date, hour: number) => void;
}

const GRID_HEIGHT = (DAY_END_HOUR - DAY_START_HOUR + 1) * HOUR_HEIGHT_PX;
const GUTTER_WIDTH = 64;

export function DayView({
  events,
  currentDate,
  onEventClick,
  onTimeSlotClick,
}: DayViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const day = currentDate.getDate();
  const today = isToday(year, month, day);

  // Partition into all-day vs timed events
  const { allDay, timed } = useMemo(
    () => partitionDayEvents(events, year, month, day),
    [events, year, month, day],
  );

  // Compute overlap columns for timed events
  const timedWithColumns = useMemo(
    () => computeTimeGridColumns(timed),
    [timed],
  );

  // Current time indicator
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to 8 AM on mount
  useEffect(() => {
    if (scrollRef.current) {
      const offset = (8 - DAY_START_HOUR) * HOUR_HEIGHT_PX;
      scrollRef.current.scrollTop = offset;
    }
  }, []);

  const currentTimeOffset = today
    ? timeToPixelOffset(now, DAY_START_HOUR, HOUR_HEIGHT_PX)
    : null;

  const dateLabel = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <GlassCard padding="none" className="overflow-hidden">
      {/* Day header */}
      <div
        className={cn(
          "px-6 py-3 border-b border-gray-200 dark:border-gray-700",
          today && "bg-primary/[0.05]",
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold",
              today
                ? "bg-primary text-white"
                : "bg-gray-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300",
            )}
          >
            {day}
          </div>
          <div>
            <p className="text-sm font-serif text-slate-900 dark:text-white">
              {dateLabel}
            </p>
            {today && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Today
              </p>
            )}
          </div>
        </div>
      </div>

      {/* All-day events */}
      <AllDayEventsBar events={allDay} onEventClick={onEventClick} />

      {/* Time grid */}
      <div
        ref={scrollRef}
        className="overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 340px)" }}
      >
        <div className="relative" style={{ height: `${GRID_HEIGHT}px` }}>
          {/* Hour rows */}
          {HOURS.map((hour) => {
            const topPx = (hour - DAY_START_HOUR) * HOUR_HEIGHT_PX;
            return (
              <div
                key={hour}
                className="absolute w-full flex"
                style={{ top: `${topPx}px`, height: `${HOUR_HEIGHT_PX}px` }}
              >
                {/* Hour label gutter */}
                <div
                  className="flex-shrink-0 text-right pr-3 pt-[-6px]"
                  style={{ width: `${GUTTER_WIDTH}px` }}
                >
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 relative -top-2">
                    {formatHourLabel(hour)}
                  </span>
                </div>

                {/* Hour row click target */}
                <button
                  type="button"
                  onClick={() => onTimeSlotClick(currentDate, hour)}
                  className={cn(
                    "flex-1 border-t border-gray-200 dark:border-gray-700",
                    "hover:bg-primary/[0.03] transition-colors cursor-pointer",
                  )}
                  aria-label={`Add event at ${formatHourLabel(hour)}`}
                />
              </div>
            );
          })}

          {/* Half-hour lines */}
          {HOURS.map((hour) => {
            const topPx =
              (hour - DAY_START_HOUR) * HOUR_HEIGHT_PX + HOUR_HEIGHT_PX / 2;
            return (
              <div
                key={`half-${hour}`}
                className="absolute border-t border-dashed border-gray-100 dark:border-gray-800"
                style={{
                  top: `${topPx}px`,
                  left: `${GUTTER_WIDTH}px`,
                  right: 0,
                }}
              />
            );
          })}

          {/* Timed events */}
          <div
            className="absolute top-0 bottom-0"
            style={{
              left: `${GUTTER_WIDTH + 4}px`,
              right: "8px",
            }}
          >
            {timedWithColumns.map(({ event, column, totalColumns }) => {
              const eventStart = new Date(event.startDate);
              const eventEnd = event.endDate
                ? new Date(event.endDate)
                : new Date(eventStart.getTime() + 3600000);

              const topPx = timeToPixelOffset(
                eventStart,
                DAY_START_HOUR,
                HOUR_HEIGHT_PX,
              );
              const bottomPx = timeToPixelOffset(
                eventEnd,
                DAY_START_HOUR,
                HOUR_HEIGHT_PX,
              );
              const heightPx = Math.max(bottomPx - topPx, 24);

              const widthPercent = (1 / totalColumns) * 100 - 1;
              const leftPercent = column * (100 / totalColumns);

              return (
                <TimeGridEvent
                  key={event.id}
                  event={event}
                  topPx={topPx}
                  heightPx={heightPx}
                  leftPercent={leftPercent}
                  widthPercent={widthPercent}
                  onEventClick={onEventClick}
                />
              );
            })}
          </div>

          {/* Current time indicator */}
          {currentTimeOffset !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute pointer-events-none"
              style={{
                top: `${currentTimeOffset}px`,
                left: `${GUTTER_WIDTH - 4}px`,
                right: 0,
                zIndex: 30,
              }}
            >
              <div className="flex items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1" />
                <div className="flex-1 h-[2px] bg-red-500" />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
