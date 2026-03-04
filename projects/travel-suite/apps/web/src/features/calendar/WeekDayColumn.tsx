"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { EVENT_TYPE_CONFIG } from "./constants";
import { getStatusVariant, formatAmount } from "./utils";
import type { CalendarEvent } from "./types";

// ---------------------------------------------------------------------------
// WeekDayColumn — single day column in the week view
// ---------------------------------------------------------------------------

interface WeekDayColumnProps {
  date: Date;
  events: CalendarEvent[];
  isToday: boolean;
  onDayClick: () => void;
  onEventClick: (event: CalendarEvent) => void;
  index: number;
}

export function WeekDayColumn({
  date,
  events,
  isToday: today,
  onDayClick,
  onEventClick,
  index,
}: WeekDayColumnProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25, ease: "easeOut" }}
      className={cn(
        "flex flex-col min-h-[420px] border-r last:border-r-0 border-gray-200/60",
        today && "bg-primary/[0.04]",
      )}
    >
      {/* Column header */}
      <button
        type="button"
        onClick={onDayClick}
        className={cn(
          "w-full py-3 px-2 text-center border-b border-gray-200/60",
          "hover:bg-gray-50/60 transition-colors cursor-pointer",
        )}
      >
        <span
          className={cn(
            "inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold",
            today
              ? "bg-primary text-white"
              : "text-text-secondary",
          )}
        >
          {date.getDate()}
        </span>
      </button>

      {/* Events area */}
      <div className="flex-1 p-1.5 overflow-y-auto scrollbar-hide space-y-2">
        {events.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="border border-dashed border-gray-200 rounded-lg w-full py-6 text-center">
              <span className="text-xs text-slate-400">No events</span>
            </div>
          </div>
        ) : (
          events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEventClick={onEventClick}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// EventCard — full event card rendered inside a day column
// ---------------------------------------------------------------------------

function EventCard({
  event,
  onEventClick,
}: {
  event: CalendarEvent;
  onEventClick: (event: CalendarEvent) => void;
}) {
  const config = EVENT_TYPE_CONFIG[event.type];
  const Icon = config.icon;
  const variant = getStatusVariant(event.status);
  const amount = formatAmount(event.amount, event.currency);

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      onClick={(e) => {
        e.stopPropagation();
        onEventClick(event);
      }}
      className={cn(
        "w-full text-left rounded-lg border p-2.5 transition-all",
        "hover:shadow-sm",
        config.bgColor,
        config.borderColor,
      )}
    >
      {/* Icon + title row */}
      <div className="flex items-start gap-1.5">
        <div
          className={cn(
            "flex-shrink-0 w-5 h-5 rounded flex items-center justify-center mt-0.5",
            config.bgColor,
          )}
        >
          <Icon className={cn("w-3.5 h-3.5", config.textColor)} />
        </div>
        <span
          className={cn(
            "text-xs font-bold leading-tight truncate",
            config.textColor,
          )}
        >
          {event.title}
        </span>
      </div>

      {/* Status badge */}
      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
        <GlassBadge variant={variant} size="sm">
          {event.status}
        </GlassBadge>

        {amount && (
          <span className={cn("text-[11px] font-semibold", config.textColor)}>
            {amount}
          </span>
        )}
      </div>
    </motion.button>
  );
}
