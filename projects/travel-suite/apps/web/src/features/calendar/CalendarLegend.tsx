"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EVENT_TYPE_CONFIG, ALL_EVENT_TYPES } from "./constants";
import type { CalendarEventType } from "./types";

interface CalendarLegendProps {
  enabledTypes: Set<CalendarEventType>;
}

export function CalendarLegend({ enabledTypes }: CalendarLegendProps) {
  const visibleTypes = ALL_EVENT_TYPES.filter((type) => enabledTypes.has(type));

  if (visibleTypes.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      className="flex flex-wrap items-center gap-x-4 gap-y-1"
    >
      {visibleTypes.map((type) => {
        const config = EVENT_TYPE_CONFIG[type];
        return (
          <div key={type} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className={cn("w-2.5 h-2.5 rounded-full", config.dotColor)} />
            <span>{config.label}</span>
          </div>
        );
      })}
    </motion.div>
  );
}
