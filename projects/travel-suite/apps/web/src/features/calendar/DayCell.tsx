"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EventChip } from "./EventChip";
import { EVENT_TYPE_CONFIG } from "./constants";
import { formatBlockedRange, type OperatorUnavailability } from "./availability";
import { isToday } from "./utils";
import type { CalendarEvent, CalendarEventType } from "./types";

interface DayCellProps {
  day: number | null;
  year: number;
  month: number;
  events: CalendarEvent[];
  blockedSlots: OperatorUnavailability[];
  totalEventCount: number;
  onDayClick: (day: { year: number; month: number; day: number }) => void;
  onEventClick: (event: CalendarEvent) => void;
  index: number;
}

const MAX_VISIBLE = 3;

export function DayCell({
  day,
  year,
  month,
  events,
  blockedSlots,
  totalEventCount,
  onDayClick,
  onEventClick,
  index,
}: DayCellProps) {
  const today = day !== null && isToday(year, month, day);
  const remaining = totalEventCount - MAX_VISIBLE;
  const isBlocked = blockedSlots.length > 0;
  const blockedTooltip = blockedSlots.map((slot) => formatBlockedRange(slot)).join("\n");

  const { uniqueTypes, typeCountMap } = useMemo(() => {
    const countMap = new Map<CalendarEventType, number>();
    for (const e of events) {
      countMap.set(e.type, (countMap.get(e.type) ?? 0) + 1);
    }
    return { uniqueTypes: Array.from(countMap.keys()), typeCountMap: countMap };
  }, [events]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: Math.min(index * 0.008, 0.15), duration: 0.2 }}
      onClick={day ? () => onDayClick({ year, month, day }) : undefined}
      title={isBlocked ? blockedTooltip : undefined}
      className={cn(
        "min-h-[120px] bg-white p-2 transition-colors relative group",
        day ? "hover:bg-gray-50/50 cursor-pointer" : "bg-gray-50/30",
        today && "bg-primary/5",
        isBlocked && "bg-red-50/70",
      )}
    >
      {day !== null && (
        <>
          {isBlocked && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-1 top-9 bottom-1 rounded-xl border border-red-500/40 opacity-90"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(-45deg, rgba(239,68,68,0.12), rgba(239,68,68,0.12) 8px, rgba(239,68,68,0.02) 8px, rgba(239,68,68,0.02) 16px)",
              }}
            />
          )}
          <div className="flex items-center justify-between mb-2">
            <span className={cn(
              "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
              today ? "bg-primary text-white" : "text-text-secondary",
            )}>
              {day}
            </span>
            <div className="flex items-center gap-1">
              {isBlocked && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-red-700 bg-red-100 px-1.5 py-0.5 rounded-md">
                  Unavailable
                </span>
              )}
              {totalEventCount > 0 && (
                <span className="text-xs text-text-muted font-medium bg-gray-100 px-1.5 rounded-md">
                  {totalEventCount}
                </span>
              )}
            </div>
          </div>
          <div className="relative z-[1] space-y-1 max-h-[80px] overflow-y-auto scrollbar-hide">
            {events.slice(0, MAX_VISIBLE).map((event) => (
              <EventChip key={event.id} event={event} onEventClick={onEventClick} />
            ))}
            {remaining > 0 && (
              <span className="text-[10px] text-slate-400 font-medium pl-1">
                +{remaining} more
              </span>
            )}
          </div>
          {/* Colored type dots - shows all event types present on this day */}
          {totalEventCount > 0 && (
            <div className="relative z-[1] flex items-center gap-1 mt-1.5 pt-1.5 border-t border-gray-100">
              {uniqueTypes.map((type) => {
                const config = EVENT_TYPE_CONFIG[type];
                const count = typeCountMap.get(type) ?? 0;
                return (
                  <div
                    key={type}
                    className={cn("w-2 h-2 rounded-full", config.dotColor)}
                    title={`${config.label}: ${count}`}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
