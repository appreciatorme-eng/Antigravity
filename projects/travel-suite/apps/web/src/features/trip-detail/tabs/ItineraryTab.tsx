"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { validateDaySchedule } from "@/lib/trips/conflict-detection";
import type { Conflict } from "@/lib/trips/conflict-detection";
import type { ActivitySlot } from "@/lib/trips/conflict-detection";
import { TripDriverCard } from "@/features/trip-detail/components/TripDriverCard";
import { TripAccommodationCard } from "@/features/trip-detail/components/TripAccommodationCard";
import { TripActivityList } from "@/features/trip-detail/components/TripActivityList";
import { TripStatusSidebar } from "@/features/trip-detail/components/TripStatusSidebar";
import type {
  Trip,
  Day,
  Activity,
  Driver,
  DriverAssignment,
  Accommodation,
  ReminderDayStatus,
  DriverLocationSnapshot,
} from "@/features/trip-detail/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ItineraryTabProps {
  trip: Trip;
  itineraryDays: readonly Day[];
  activeDay: number;
  onActiveDayChange: (day: number) => void;
  drivers: Driver[];
  assignments: Record<number, DriverAssignment>;
  accommodations: Record<number, Accommodation>;
  reminderStatusByDay: Record<number, ReminderDayStatus>;
  latestDriverLocation: DriverLocationSnapshot | null;
  busyDriversByDay: Record<number, string[]>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function activityToSlot(activity: Activity, index: number): ActivitySlot {
  return {
    id: `activity-${index}`,
    name: activity.title,
    startTime: activity.start_time ?? "",
    endTime: activity.end_time ?? "",
    locationName: activity.location ?? "",
    lat: activity.coordinates?.lat,
    lng: activity.coordinates?.lng,
    durationMinutes: activity.duration_minutes,
  };
}

function getActiveDayData(
  itineraryDays: readonly Day[],
  activeDay: number,
): Day | undefined {
  return itineraryDays.find((d) => d.day_number === activeDay);
}

// ---------------------------------------------------------------------------
// Day Selector
// ---------------------------------------------------------------------------

function DaySelector({
  days,
  activeDay,
  onActiveDayChange,
}: {
  days: readonly Day[];
  activeDay: number;
  onActiveDayChange: (day: number) => void;
}) {
  return (
    <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-900 rounded-2xl overflow-x-auto w-full max-w-fit border border-gray-200 dark:border-slate-800">
      {days.map((day) => {
        const isActive = day.day_number === activeDay;
        return (
          <button
            key={day.day_number}
            type="button"
            onClick={() => onActiveDayChange(day.day_number)}
            className={cn(
              "px-10 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap",
              isActive
                ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                : "text-text-muted hover:text-secondary dark:hover:text-white",
            )}
          >
            Cycle {day.day_number}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// No-op handlers (to be wired to mutations in a future pass)
// ---------------------------------------------------------------------------

const handleAssignmentChange = () => {};
const handleAccommodationChange = () => {};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ItineraryTab({
  trip,
  itineraryDays,
  activeDay,
  onActiveDayChange,
  drivers,
  assignments,
  accommodations,
  reminderStatusByDay,
  latestDriverLocation,
  busyDriversByDay,
}: ItineraryTabProps) {
  const activeDayData = getActiveDayData(itineraryDays, activeDay);

  const activities: readonly Activity[] = useMemo(
    () => activeDayData?.activities ?? [],
    [activeDayData],
  );

  const conflicts: Conflict[] = useMemo(() => {
    const slots = activities.map((a, i) => activityToSlot(a, i));
    return validateDaySchedule(slots);
  }, [activities]);

  const currentAssignment = assignments[activeDay];
  const currentAccommodation = accommodations[activeDay];
  const currentBusyDriverIds = busyDriversByDay[activeDay] ?? [];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
      {/* Left column */}
      <div className="xl:col-span-8 space-y-6">
        <DaySelector
          days={itineraryDays}
          activeDay={activeDay}
          onActiveDayChange={onActiveDayChange}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TripDriverCard
            drivers={drivers}
            assignment={currentAssignment}
            busyDriverIds={currentBusyDriverIds}
            onAssignmentChange={handleAssignmentChange}
          />
          <TripAccommodationCard
            accommodation={currentAccommodation}
            onAccommodationChange={handleAccommodationChange}
          />
        </div>

        <TripActivityList
          activities={[...activities]}
          dayNumber={activeDay}
          conflicts={conflicts}
        />
      </div>

      {/* Right column */}
      <div className="xl:col-span-4">
        <div className="sticky top-10">
          <TripStatusSidebar
            trip={trip}
            itineraryDays={[...itineraryDays]}
            activeDay={activeDay}
            reminderStatusByDay={reminderStatusByDay}
            latestDriverLocation={latestDriverLocation}
          />
        </div>
      </div>
    </div>
  );
}
