"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TimeGridEvent } from "./TimeGridEvent";
import { getBlockedSlotsForDay, type OperatorUnavailability } from "./availability";
import {
  DAY_START_HOUR,
  DAY_END_HOUR,
  HOUR_HEIGHT_PX,
  HOURS,
} from "./constants";
import {
  timeToPixelOffset,
  partitionDayEvents,
  computeTimeGridColumns,
  formatHourLabel,
  isToday,
} from "./utils";
import type { CalendarEvent } from "./types";

interface WeekTimeGridProps {
  weekDates: Date[];
  events: CalendarEvent[];
  blockedSlots: OperatorUnavailability[];
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (date: Date, hour: number) => void;
}

const GRID_HEIGHT = (DAY_END_HOUR - DAY_START_HOUR + 1) * HOUR_HEIGHT_PX;
const GUTTER_WIDTH = 56;

export function WeekTimeGrid({
  weekDates,
  events,
  blockedSlots,
  onEventClick,
  onTimeSlotClick,
}: WeekTimeGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // Pre-compute timed events per day
  const dayColumns = useMemo(() => {
    return weekDates.map((date) => {
      const { timed } = partitionDayEvents(
        events,
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      );
      return computeTimeGridColumns(timed);
    });
  }, [weekDates, events]);

  // Find which day column is today
  const todayIndex = useMemo(() => {
    return weekDates.findIndex((d) =>
      isToday(d.getFullYear(), d.getMonth(), d.getDate()),
    );
  }, [weekDates]);

  const currentTimeOffset =
    todayIndex >= 0
      ? timeToPixelOffset(now, DAY_START_HOUR, HOUR_HEIGHT_PX)
      : null;

  return (
    <div
      ref={scrollRef}
      className="overflow-y-auto"
      style={{ maxHeight: "calc(100vh - 380px)" }}
    >
      <div className="relative flex" style={{ minHeight: `${GRID_HEIGHT}px` }}>
        {/* Hour labels gutter */}
        <div
          className="flex-shrink-0 relative"
          style={{ width: `${GUTTER_WIDTH}px` }}
        >
          {HOURS.map((hour) => {
            const topPx = (hour - DAY_START_HOUR) * HOUR_HEIGHT_PX;
            return (
              <div
                key={hour}
                className="absolute w-full text-right pr-2"
                style={{ top: `${topPx}px` }}
              >
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 relative -top-2">
                  {formatHourLabel(hour)}
                </span>
              </div>
            );
          })}
        </div>

        {/* 7 day columns */}
        <div className="flex-1 grid grid-cols-7 relative">
          {/* Horizontal hour lines (spanning all columns) */}
          {HOURS.map((hour) => {
            const topPx = (hour - DAY_START_HOUR) * HOUR_HEIGHT_PX;
            return (
              <div
                key={`line-${hour}`}
                className="absolute left-0 right-0 border-t border-gray-200 dark:border-gray-700"
                style={{ top: `${topPx}px` }}
              />
            );
          })}

          {/* Half-hour dashed lines */}
          {HOURS.map((hour) => {
            const topPx =
              (hour - DAY_START_HOUR) * HOUR_HEIGHT_PX + HOUR_HEIGHT_PX / 2;
            return (
              <div
                key={`half-${hour}`}
                className="absolute left-0 right-0 border-t border-dashed border-gray-100 dark:border-gray-800"
                style={{ top: `${topPx}px` }}
              />
            );
          })}

          {/* Day columns with events */}
          {weekDates.map((date, dayIdx) => {
            const isTodayCol = dayIdx === todayIndex;
            const dayColEvents = dayColumns[dayIdx];
            const dayBlocked =
              getBlockedSlotsForDay(
                blockedSlots,
                date.getFullYear(),
                date.getMonth(),
                date.getDate(),
              ).length > 0;

            return (
              <div
                key={date.toISOString()}
                className={cn(
                  "relative border-r border-gray-200 dark:border-gray-700 last:border-r-0",
                  dayBlocked && "bg-red-500/[0.05]",
                  isTodayCol && "bg-primary/[0.02]",
                )}
                style={{ minHeight: `${GRID_HEIGHT}px` }}
              >
                {dayBlocked && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 border-x border-red-500/20"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(-45deg, rgba(239,68,68,0.08), rgba(239,68,68,0.08) 8px, rgba(239,68,68,0.015) 8px, rgba(239,68,68,0.015) 16px)",
                    }}
                  />
                )}
                {/* Click targets for each hour */}
                {HOURS.map((hour) => {
                  const topPx = (hour - DAY_START_HOUR) * HOUR_HEIGHT_PX;
                  return (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => onTimeSlotClick(date, hour)}
                      className="absolute left-0 right-0 hover:bg-primary/[0.04] transition-colors cursor-pointer"
                      style={{
                        top: `${topPx}px`,
                        height: `${HOUR_HEIGHT_PX}px`,
                      }}
                      aria-label={`Add event on ${date.toLocaleDateString()} at ${formatHourLabel(hour)}`}
                    />
                  );
                })}

                {/* Events */}
                <div className="absolute inset-0 px-0.5">
                  {dayColEvents.map(({ event, column, totalColumns }) => {
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
                    const heightPx = Math.max(bottomPx - topPx, 20);

                    const widthPercent = (1 / totalColumns) * 100 - 2;
                    const leftPercent = column * (100 / totalColumns) + 1;

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
              </div>
            );
          })}

          {/* Current time indicator */}
          {currentTimeOffset !== null && todayIndex >= 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute pointer-events-none"
              style={{
                top: `${currentTimeOffset}px`,
                left: `${(todayIndex / 7) * 100}%`,
                width: `${100 / 7}%`,
                zIndex: 30,
              }}
            >
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                <div className="flex-1 h-[2px] bg-red-500" />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
