"use client";

import { cn } from "@/lib/utils";
import { EVENT_TYPE_CONFIG, ALL_EVENT_TYPES } from "./constants";
import type { CalendarEventType, CalendarFiltersState } from "./types";
import { CalendarLegend } from "./CalendarLegend";

interface CalendarFiltersProps {
  filters: CalendarFiltersState;
  eventCounts: Record<CalendarEventType, number>;
  onFiltersChange: (filters: CalendarFiltersState) => void;
}

export function CalendarFilters({
  filters,
  eventCounts,
  onFiltersChange,
}: CalendarFiltersProps) {
  const handleToggle = (type: CalendarEventType) => {
    const newTypes = new Set(filters.enabledTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    onFiltersChange({ ...filters, enabledTypes: newTypes });
  };

  return (
    <div className="space-y-3">
      {/* Filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
        {ALL_EVENT_TYPES.map((type) => {
          const config = EVENT_TYPE_CONFIG[type];
          const Icon = config.icon;
          const count = eventCounts[type] || 0;
          const isEnabled = filters.enabledTypes.has(type);

          return (
            <button
              key={type}
              onClick={() => handleToggle(type)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border",
                isEnabled
                  ? `${config.bgColor} ${config.textColor} ${config.borderColor}`
                  : "bg-gray-50 text-gray-400 border-gray-200",
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {config.label}
              {count > 0 && (
                <span
                  className={cn(
                    "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black",
                    isEnabled ? "bg-white/50" : "bg-gray-200",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend row */}
      <CalendarLegend enabledTypes={filters.enabledTypes} />
    </div>
  );
}
