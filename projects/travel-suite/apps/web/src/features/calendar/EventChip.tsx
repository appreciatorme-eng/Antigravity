"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EVENT_TYPE_CONFIG, QUICK_ACTIONS } from "./constants";
import type { CalendarEvent } from "./types";

interface EventChipProps {
  event: CalendarEvent;
  onEventClick: (event: CalendarEvent) => void;
}

export function EventChip({ event, onEventClick }: EventChipProps) {
  const config = EVENT_TYPE_CONFIG[event.type];
  const Icon = config.icon;
  const actions = QUICK_ACTIONS[event.type];

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      onClick={(e) => {
        e.stopPropagation();
        onEventClick(event);
      }}
      className={cn(
        "w-full text-left px-2 py-1.5 text-xs rounded-lg border transition-all flex items-center gap-1.5 group/chip relative",
        config.bgColor,
        config.textColor,
        config.borderColor,
      )}
      title={event.title}
    >
      <Icon className="w-3 h-3 flex-shrink-0" />
      <span className="font-bold truncate">{event.title}</span>

      {/* Quick action overlay on hover - show first action icon */}
      {actions.length > 0 && (
        <span className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/chip:opacity-100 transition-opacity">
          {(() => {
            const ActionIcon = actions[0].icon;
            return <ActionIcon className="w-3 h-3" />;
          })()}
        </span>
      )}
    </motion.button>
  );
}
