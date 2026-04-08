"use client";

import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/glass/GlassCard";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarSkeleton } from "./CalendarSkeleton";
import { MonthView } from "./MonthView";
import { WeekView } from "./WeekView";
import { DayView } from "./DayView";
import { DayDrawer } from "./DayDrawer";
import { EventDetailModal } from "./EventDetailModal";
import { AddEventModal } from "./AddEventModal";
import { BlockDatesModal } from "./BlockDatesModal";
import { useCalendarEvents } from "./useCalendarEvents";
import { useCalendarAvailability } from "./useCalendarAvailability";
import { useCalendarActions } from "./useCalendarActions";
import { ALL_EVENT_TYPES } from "./constants";
import { getEventsForDay } from "./utils";
import type {
  CalendarViewMode,
  CalendarFiltersState,
  CalendarEvent,
  CalendarEventType,
} from "./types";
import { GuidedTour } from '@/components/tour/GuidedTour';

// ---------------------------------------------------------------------------
// Orchestrator component
// ---------------------------------------------------------------------------

export function CalendarCommandCenter() {
  const searchParams = useSearchParams();
  const focusedDayFromQuery = useMemo(() => {
    const rawDate = searchParams.get("date");
    if (!rawDate) {
      return null;
    }

    const parsed = new Date(`${rawDate}T00:00:00`);
    if (!Number.isFinite(parsed.getTime())) {
      return null;
    }

    return parsed;
  }, [searchParams]);
  // ---- State ----
  const [currentDate, setCurrentDate] = useState<Date>(() => focusedDayFromQuery ?? new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>(
    () => typeof window !== "undefined" && window.innerWidth < 768 ? "day" : "month"
  );
  const [filters, setFilters] = useState<CalendarFiltersState>(() => ({
    enabledTypes: new Set<CalendarEventType>(ALL_EVENT_TYPES),
    searchQuery: "",
  }));
  const [selectedDay, setSelectedDay] = useState<{
    year: number;
    month: number;
    day: number;
  } | null>(() =>
    focusedDayFromQuery
      ? {
          year: focusedDayFromQuery.getFullYear(),
          month: focusedDayFromQuery.getMonth(),
          day: focusedDayFromQuery.getDate(),
        }
      : null,
  );
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showBlockDates, setShowBlockDates] = useState(false);
  const [addEventDefaults, setAddEventDefaults] = useState<{
    date: Date;
    hour: number | null;
  } | null>(null);

  // ---- Data fetching ----
  const {
    data: calendarFeed,
    isLoading,
    error,
  } = useCalendarEvents(currentDate.getMonth(), currentDate.getFullYear());
  const events = useMemo(() => calendarFeed?.events ?? [], [calendarFeed]);
  const sourceErrors = calendarFeed?.sourceErrors ?? [];
  const {
    data: blockedSlots = [],
    refetch: refetchBlockedSlots,
  } = useCalendarAvailability(currentDate.getMonth(), currentDate.getFullYear());
  useCalendarActions();

  // ---- Computed values ----
  const filteredEvents = useMemo(
    () => events.filter((e) => filters.enabledTypes.has(e.type)),
    [events, filters.enabledTypes],
  );

  const eventCounts = useMemo(
    () =>
      Object.fromEntries(
        ALL_EVENT_TYPES.map((t) => [
          t,
          events.filter((e) => e.type === t).length,
        ]),
      ) as Record<CalendarEventType, number>,
    [events],
  );

  // ---- Navigation handlers (immutable) ----
  const handlePrevMonth = useCallback(() => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
  }, []);

  const handlePrevWeek = useCallback(() => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - 7);
      return next;
    });
  }, []);

  const handleNextWeek = useCallback(() => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 7);
      return next;
    });
  }, []);

  const handlePrevDay = useCallback(() => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - 1);
      return next;
    });
  }, []);

  const handleNextDay = useCallback(() => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 1);
      return next;
    });
  }, []);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // ---- Time slot click (week/day view) ----
  const handleTimeSlotClick = useCallback((date: Date, hour: number) => {
    setAddEventDefaults({ date, hour });
    setShowAddEvent(true);
  }, []);

  // ---- Day drawer events ----
  const drawerEvents = useMemo(() => {
    if (!selectedDay) return [];
    return getEventsForDay(
      filteredEvents,
      selectedDay.year,
      selectedDay.month,
      selectedDay.day,
    );
  }, [filteredEvents, selectedDay]);

  // ---- View-mode-aware navigation ----
  const handlePrev =
    viewMode === "month"
      ? handlePrevMonth
      : viewMode === "week"
        ? handlePrevWeek
        : handlePrevDay;

  const handleNext =
    viewMode === "month"
      ? handleNextMonth
      : viewMode === "week"
        ? handleNextWeek
        : handleNextDay;

  // ---- Render ----
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      <GuidedTour />
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <h1 className="text-3xl md:text-5xl font-serif text-secondary dark:text-white tracking-tight">
          Command Center
        </h1>
        <p className="mt-1 md:mt-2 text-sm md:text-lg text-slate-500">
          Your entire operation at a glance — act on anything, right here.
        </p>
        {selectedDay && (
        <p className="mt-2 text-xs font-medium text-primary">
            Focused on {new Date(selectedDay.year, selectedDay.month, selectedDay.day).toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </p>
        )}
      </motion.div>

      {!isLoading && !error && sourceErrors.length > 0 && (
        <GlassCard padding="md" className="border-amber-200 bg-amber-50/80">
          <p className="text-sm font-semibold text-amber-900">
            Some event sources failed to load.
          </p>
          <p className="mt-1 text-xs text-amber-700">
            Showing partial calendar data while these sources recover:{" "}
            {sourceErrors.map((entry) => entry.source.replace(/_/g, " ")).join(", ")}.
          </p>
        </GlassCard>
      )}

      {!isLoading && !error && filteredEvents.length === 0 && (
        <GlassCard padding="md" className="border-slate-200 bg-slate-50/80">
          <p className="text-sm font-semibold text-slate-800">
            No calendar events found for this view.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {events.length > 0
              ? "All current events are filtered out. Re-enable event types above to see them."
              : "There are no records scheduled in this month window."}
          </p>
        </GlassCard>
      )}

      {/* Calendar Header */}
      <div data-tour="calendar-filters">
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        filters={filters}
        eventCounts={eventCounts}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        onViewModeChange={setViewMode}
        onFiltersChange={setFilters}
        onAddEvent={() => {
          setAddEventDefaults({ date: currentDate, hour: null });
          setShowAddEvent(true);
        }}
        onBlockDates={() => setShowBlockDates(true)}
      />
      </div>

      {/* Calendar Grid */}
      <div className="flex gap-6" data-tour="calendar-view">
        <div
          className={cn("flex-1 min-w-0", selectedDay && "xl:mr-[400px]")}
        >
          {isLoading ? (
            <CalendarSkeleton />
          ) : error ? (
            <ErrorState
              message={
                error instanceof Error ? error.message : "Failed to load events"
              }
            />
          ) : viewMode === "month" ? (
            <MonthView
              events={filteredEvents}
              blockedSlots={blockedSlots}
              currentDate={currentDate}
              onDayClick={setSelectedDay}
              onEventClick={setSelectedEvent}
            />
          ) : viewMode === "day" ? (
            <DayView
              events={filteredEvents}
              blockedSlots={blockedSlots}
              currentDate={currentDate}
              onEventClick={setSelectedEvent}
              onTimeSlotClick={handleTimeSlotClick}
            />
          ) : (
            <WeekView
              events={filteredEvents}
              blockedSlots={blockedSlots}
              currentDate={currentDate}
              onDayClick={setSelectedDay}
              onEventClick={setSelectedEvent}
              onTimeSlotClick={handleTimeSlotClick}
            />
          )}
        </div>
      </div>

      {/* Day Drawer */}
      <AnimatePresence>
        {selectedDay && (
          <DayDrawer
            day={selectedDay}
            events={drawerEvents}
            sourceErrors={sourceErrors}
            onClose={() => setSelectedDay(null)}
            onEventClick={setSelectedEvent}
          />
        )}
      </AnimatePresence>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <EventDetailModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </AnimatePresence>

      {/* Add Event Modal */}
      <AnimatePresence>
        {showAddEvent && (
          <AddEventModal
            defaults={addEventDefaults}
            onClose={() => {
              setShowAddEvent(false);
              setAddEventDefaults(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBlockDates && (
          <BlockDatesModal
            isOpen={showBlockDates}
            blockedSlots={blockedSlots}
            initialDate={currentDate}
            onClose={() => setShowBlockDates(false)}
            onChanged={async () => {
              await refetchBlockedSlots();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function ErrorState({ message }: { message: string }) {
  return (
    <GlassCard padding="xl" className="flex flex-col items-center justify-center py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-lg font-serif text-slate-800 mb-1">
          Something went wrong
        </h3>
        <p className="text-sm text-slate-500 max-w-xs">{message}</p>
      </motion.div>
    </GlassCard>
  );
}
