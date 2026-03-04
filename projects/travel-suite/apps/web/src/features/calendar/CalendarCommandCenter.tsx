"use client";

import { useState, useMemo, useCallback } from "react";
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
import { useCalendarEvents } from "./useCalendarEvents";
import { useCalendarActions } from "./useCalendarActions";
import { ALL_EVENT_TYPES } from "./constants";
import { getEventsForDay } from "./utils";
import type {
  CalendarViewMode,
  CalendarFiltersState,
  CalendarEvent,
  CalendarEventType,
} from "./types";

// ---------------------------------------------------------------------------
// Orchestrator component
// ---------------------------------------------------------------------------

export function CalendarCommandCenter() {
  // ---- State ----
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [filters, setFilters] = useState<CalendarFiltersState>(() => ({
    enabledTypes: new Set<CalendarEventType>(ALL_EVENT_TYPES),
    searchQuery: "",
  }));
  const [selectedDay, setSelectedDay] = useState<{
    year: number;
    month: number;
    day: number;
  } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [addEventDefaults, setAddEventDefaults] = useState<{
    date: Date;
    hour: number | null;
  } | null>(null);

  // ---- Data fetching ----
  const {
    data: events = [],
    isLoading,
    error,
  } = useCalendarEvents(currentDate.getMonth(), currentDate.getFullYear());
  const actions = useCalendarActions();

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
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <h1 className="text-4xl md:text-5xl font-serif text-secondary dark:text-white tracking-tight">
          Command Center
        </h1>
        <p className="mt-2 text-lg text-slate-500">
          Your entire operation at a glance — act on anything, right here.
        </p>
      </motion.div>

      {/* Calendar Header */}
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
      />

      {/* Calendar Grid */}
      <div className="flex gap-6">
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
              currentDate={currentDate}
              onDayClick={setSelectedDay}
              onEventClick={setSelectedEvent}
            />
          ) : viewMode === "day" ? (
            <DayView
              events={filteredEvents}
              currentDate={currentDate}
              onEventClick={setSelectedEvent}
              onTimeSlotClick={handleTimeSlotClick}
            />
          ) : (
            <WeekView
              events={filteredEvents}
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
