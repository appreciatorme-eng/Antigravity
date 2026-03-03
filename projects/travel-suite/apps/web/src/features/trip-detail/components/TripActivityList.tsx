"use client";

import { MapPin, Plus, Trash, BadgeCheck } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { ConflictWarning } from "@/components/trips/ConflictWarning";
import { cn } from "@/lib/utils";
import type { Activity } from "@/features/trip-detail/types";
import type { Conflict } from "@/lib/trips/conflict-detection";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TripActivityListProps {
  activities: Activity[];
  dayNumber: number;
  conflicts: Conflict[];
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function ActivitiesEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-sm font-medium text-gray-400">
        No activities for this day
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single activity card
// ---------------------------------------------------------------------------

function ActivityCard({ activity }: { activity: Activity }) {
  return (
    <GlassCard
      padding="none"
      className={cn(
        "group overflow-hidden",
        "border-gray-50 dark:border-slate-800",
        "hover:border-primary/20 transition-all duration-300"
      )}
    >
      <div className="flex">
        {/* Time column */}
        <div
          className={cn(
            "w-20 flex flex-col items-center justify-center",
            "bg-slate-50 dark:bg-slate-800/50",
            "border-r border-gray-100 dark:border-slate-800",
            "group-hover:bg-primary/5 transition-colors"
          )}
        >
          {activity.start_time && (
            <span className="text-xs font-black text-secondary dark:text-white tabular-nums">
              {activity.start_time}
            </span>
          )}
          <div className="w-px h-3 bg-gray-200 dark:bg-slate-700 my-1" />
          <span className="text-[10px] font-bold text-text-muted tabular-nums opacity-60">
            {activity.duration_minutes}m
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 min-w-0">
              <h4 className="text-lg font-bold text-secondary dark:text-white group-hover:text-primary transition-colors">
                {activity.title}
              </h4>

              {activity.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    {activity.location}
                  </span>
                  {activity.coordinates && (
                    <span className="inline-flex items-center gap-1 text-emerald-500">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        Mapped
                      </span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Hover actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
              <button
                type="button"
                className={cn(
                  "inline-flex items-center justify-center w-8 h-8 rounded-lg",
                  "text-gray-400 transition-colors",
                  "hover:bg-rose-50 hover:text-rose-500",
                  "dark:hover:bg-rose-500/10"
                )}
                aria-label="Delete activity"
              >
                <Trash className="w-4 h-4" />
              </button>
              <button
                type="button"
                className={cn(
                  "inline-flex items-center justify-center w-8 h-8 rounded-lg",
                  "text-gray-400 transition-colors",
                  "hover:bg-primary/10 hover:text-primary"
                )}
                aria-label="Edit activity"
              >
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TripActivityList({
  activities,
  dayNumber,
  conflicts,
}: TripActivityListProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-serif text-secondary dark:text-white tracking-tight">
            Itinerary
          </h2>
          <GlassBadge
            variant="secondary"
            className="bg-primary/5 text-primary"
          >
            Day {dayNumber} Operations
          </GlassBadge>
        </div>
        <GlassButton variant="secondary" size="sm">
          <Plus className="w-4 h-4" />
          Add Activity
        </GlassButton>
      </div>

      {/* Conflicts */}
      {conflicts.length > 0 && <ConflictWarning conflicts={conflicts} />}

      {/* Activity list */}
      {activities.length === 0 ? (
        <ActivitiesEmpty />
      ) : (
        <div className="space-y-4">
          {activities.map((activity, idx) => (
            <ActivityCard
              key={`${activity.title}-${activity.start_time ?? idx}`}
              activity={activity}
            />
          ))}
        </div>
      )}
    </div>
  );
}
