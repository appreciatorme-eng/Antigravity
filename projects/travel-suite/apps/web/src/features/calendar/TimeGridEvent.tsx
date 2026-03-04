"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { EVENT_TYPE_CONFIG } from "./constants";
import { getStatusVariant, formatAmount } from "./utils";
import type { CalendarEvent } from "./types";

interface TimeGridEventProps {
  event: CalendarEvent;
  topPx: number;
  heightPx: number;
  leftPercent: number;
  widthPercent: number;
  onEventClick: (event: CalendarEvent) => void;
}

export function TimeGridEvent({
  event,
  topPx,
  heightPx,
  leftPercent,
  widthPercent,
  onEventClick,
}: TimeGridEventProps) {
  const config = EVENT_TYPE_CONFIG[event.type];
  const Icon = config.icon;
  const variant = getStatusVariant(event.status);
  const amount = formatAmount(event.amount, event.currency);
  const isCompact = heightPx < 40;

  const startTime = new Date(event.startDate).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const endTime = event.endDate
    ? new Date(event.endDate).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : null;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.01, zIndex: 20 }}
      onClick={(e) => {
        e.stopPropagation();
        onEventClick(event);
      }}
      className={cn(
        "absolute rounded-lg border-l-[3px] px-2 py-1 text-left transition-shadow",
        "hover:shadow-md overflow-hidden cursor-pointer",
        config.bgColor,
        config.borderColor,
      )}
      style={{
        top: `${topPx}px`,
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        height: `${Math.max(heightPx, 24)}px`,
        zIndex: 10,
      }}
    >
      {isCompact ? (
        <div className="flex items-center gap-1 truncate">
          <Icon className={cn("w-3 h-3 flex-shrink-0", config.textColor)} />
          <span className={cn("text-[10px] font-bold truncate", config.textColor)}>
            {event.title}
          </span>
          <span className="text-[10px] text-slate-500 flex-shrink-0">
            {startTime}
          </span>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-1.5">
            <Icon className={cn("w-3.5 h-3.5 flex-shrink-0 mt-0.5", config.textColor)} />
            <div className="min-w-0 flex-1">
              <p className={cn("text-xs font-bold leading-tight truncate", config.textColor)}>
                {event.title}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {startTime}
                {endTime && ` — ${endTime}`}
              </p>
            </div>
          </div>
          {heightPx > 60 && (
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              <GlassBadge variant={variant} size="sm">
                {event.status}
              </GlassBadge>
              {amount && (
                <span className={cn("text-[10px] font-semibold", config.textColor)}>
                  {amount}
                </span>
              )}
            </div>
          )}
          {heightPx > 80 && event.subtitle && (
            <p className="text-[10px] text-slate-400 mt-1 truncate">
              {event.subtitle}
            </p>
          )}
        </>
      )}
    </motion.button>
  );
}
