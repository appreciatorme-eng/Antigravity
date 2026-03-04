"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { EVENT_TYPE_CONFIG } from "./constants";
import type { CalendarEvent } from "./types";

interface AllDayEventsBarProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

const MAX_VISIBLE = 3;

export function AllDayEventsBar({ events, onEventClick }: AllDayEventsBarProps) {
  const [expanded, setExpanded] = useState(false);

  if (events.length === 0) return null;

  const visibleEvents = expanded ? events : events.slice(0, MAX_VISIBLE);
  const remaining = events.length - MAX_VISIBLE;

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/50 px-4 py-2">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          All Day
        </span>
        <span className="text-[10px] text-slate-400">
          ({events.length})
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <AnimatePresence>
          {visibleEvents.map((event) => {
            const config = EVENT_TYPE_CONFIG[event.type];
            const Icon = config.icon;
            return (
              <motion.button
                key={event.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => onEventClick(event)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium",
                  "border transition-all hover:shadow-sm cursor-pointer",
                  config.bgColor,
                  config.borderColor,
                  config.textColor,
                )}
              >
                <Icon className="w-3 h-3" />
                <span className="truncate max-w-[180px]">{event.title}</span>
              </motion.button>
            );
          })}
        </AnimatePresence>
        {remaining > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-700 transition-colors"
          >
            {expanded ? (
              <>Show less <ChevronUp className="w-3 h-3" /></>
            ) : (
              <>+{remaining} more <ChevronDown className="w-3 h-3" /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
