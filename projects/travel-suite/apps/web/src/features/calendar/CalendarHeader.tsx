"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { cn } from "@/lib/utils";
import { MONTH_NAMES } from "./constants";
import { CalendarFilters } from "./CalendarFilters";
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
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
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
        </div>

        {/* View Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
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
