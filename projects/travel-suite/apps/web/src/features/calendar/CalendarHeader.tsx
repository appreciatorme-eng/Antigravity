"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { cn } from "@/lib/utils";
import { MONTH_NAMES } from "./constants";
import { CalendarFilters } from "./CalendarFilters";
import { getWeekDates } from "./utils";
import type {
  CalendarViewMode,
  CalendarFiltersState,
  CalendarEventType,
} from "./types";

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: CalendarViewMode;
  filters: CalendarFiltersState;
  eventCounts: Record<CalendarEventType, number>;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onFiltersChange: (filters: CalendarFiltersState) => void;
  onAddEvent: () => void;
}

function getDateDisplay(date: Date, mode: CalendarViewMode): string {
  if (mode === "day") {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
  if (mode === "week") {
    const weekDates = getWeekDates(date);
    const start = weekDates[0];
    const end = weekDates[6];
    const startStr = start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endStr = end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${startStr} \u2014 ${endStr}`;
  }
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function CalendarHeader({
  currentDate,
  viewMode,
  filters,
  eventCounts,
  onPrev,
  onNext,
  onToday,
  onViewModeChange,
  onFiltersChange,
  onAddEvent,
}: CalendarHeaderProps) {
  return (
    <GlassCard padding="lg" className="space-y-4">
      {/* Row 1: Navigation + View Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Month/Week Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPrev}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5 text-text-secondary" />
          </button>

          <h2 className="text-2xl font-serif text-secondary min-w-[220px] text-center">
            {getDateDisplay(currentDate, viewMode)}
          </h2>

          <button
            onClick={onNext}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5 text-text-secondary" />
          </button>

          <GlassButton variant="outline" size="sm" onClick={onToday}>
            Today
          </GlassButton>

          <GlassButton
            variant="primary"
            size="sm"
            onClick={onAddEvent}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </GlassButton>
        </div>

        {/* View Toggle */}
        <div className="flex bg-slate-100 dark:bg-gray-800 p-1 rounded-xl">
          <button
            onClick={() => onViewModeChange("month")}
            className={cn(
              "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
              viewMode === "month"
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-500",
            )}
          >
            Month
          </button>
          <button
            onClick={() => onViewModeChange("week")}
            className={cn(
              "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
              viewMode === "week"
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-500",
            )}
          >
            Week
          </button>
          <button
            onClick={() => onViewModeChange("day")}
            className={cn(
              "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
              viewMode === "day"
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-500",
            )}
          >
            Day
          </button>
        </div>
      </div>

      {/* Row 2: Filters + Legend */}
      <CalendarFilters
        filters={filters}
        eventCounts={eventCounts}
        onFiltersChange={onFiltersChange}
      />
    </GlassCard>
  );
}
