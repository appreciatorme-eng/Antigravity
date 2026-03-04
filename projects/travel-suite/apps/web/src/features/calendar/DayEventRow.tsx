"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { EVENT_TYPE_CONFIG } from "./constants";
import { formatAmount, getStatusVariant } from "./utils";
import type { CalendarEvent } from "./types";

interface DayEventRowProps {
  event: CalendarEvent;
  onEventClick: (event: CalendarEvent) => void;
  index: number;
}

export function DayEventRow({ event, onEventClick, index }: DayEventRowProps) {
  const config = EVENT_TYPE_CONFIG[event.type];
  const Icon = config.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.2), duration: 0.22 }}
      onClick={() => onEventClick(event)}
      className="w-full text-left p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-white group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", config.bgColor)}>
            <Icon className={cn("w-4 h-4", config.textColor)} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate group-hover:text-primary transition-colors">
              {event.title}
            </p>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {event.subtitle}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <GlassBadge variant={getStatusVariant(event.status)} className="text-[10px]">
            {event.status}
          </GlassBadge>
          {event.amount !== null && (
            <span className="text-xs font-bold text-slate-700 tabular-nums">
              {formatAmount(event.amount, event.currency)}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
