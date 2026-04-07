"use client";

import { useEffect, useState } from "react";
import { MapPin, Plus, Trash, BadgeCheck, Pencil, Check } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { ConflictWarning } from "@/components/trips/ConflictWarning";
import { cn } from "@/lib/utils";
import type { Activity } from "@/features/trip-detail/types";
import type { Conflict } from "@/lib/trips/conflict-detection";

interface TripActivityListProps {
  activities: Activity[];
  dayNumber: number;
  conflicts: Conflict[];
  onAddActivity: () => void;
  onUpdateActivity: (index: number, activity: Activity) => void;
  onDeleteActivity: (index: number) => void;
}

function ActivitiesEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-sm font-medium text-gray-400">
        No activities for this day
      </p>
    </div>
  );
}

function ActivityCard({
  activity,
  index,
  onUpdate,
  onDelete,
}: {
  activity: Activity;
  index: number;
  onUpdate: (index: number, activity: Activity) => void;
  onDelete: (index: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Activity>(activity);

  useEffect(() => {
    setDraft(activity);
  }, [activity]);

  const handleSave = () => {
    onUpdate(index, {
      ...draft,
      title: draft.title.trim() || "New Activity",
      location: draft.location?.trim(),
      description: draft.description?.trim(),
      cost: draft.cost?.trim(),
    });
    setIsEditing(false);
  };

  return (
    <GlassCard
      padding="none"
      className={cn(
        "group overflow-hidden",
        "border-gray-50 dark:border-slate-800",
        "hover:border-primary/20 transition-all duration-300",
      )}
    >
      <div className="flex">
        <div
          className={cn(
            "w-20 flex flex-col items-center justify-center",
            "bg-slate-50 dark:bg-slate-800/50",
            "border-r border-gray-100 dark:border-slate-800",
            "group-hover:bg-primary/5 transition-colors",
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

        <div className="flex-1 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3 min-w-0 flex-1">
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={draft.title}
                    onChange={(e) =>
                      setDraft((current) => ({ ...current, title: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-white/40 bg-white/60 dark:bg-slate-800/50 dark:border-slate-700/40 text-secondary dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Location"
                      value={draft.location ?? ""}
                      onChange={(e) =>
                        setDraft((current) => ({ ...current, location: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-white/40 bg-white/60 dark:bg-slate-800/50 dark:border-slate-700/40 text-secondary dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="text"
                      placeholder="Cost (INR)"
                      value={draft.cost ?? ""}
                      onChange={(e) =>
                        setDraft((current) => ({ ...current, cost: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-white/40 bg-white/60 dark:bg-slate-800/50 dark:border-slate-700/40 text-secondary dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Description"
                    value={draft.description ?? ""}
                    onChange={(e) =>
                      setDraft((current) => ({ ...current, description: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-white/40 bg-white/60 dark:bg-slate-800/50 dark:border-slate-700/40 text-secondary dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </>
              ) : (
                <>
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

                  {activity.description ? (
                    <p className="text-sm leading-6 text-text-muted">
                      {activity.description}
                    </p>
                  ) : null}

                  {activity.cost ? (
                    <GlassBadge variant="secondary" className="bg-primary/5 text-primary">
                      {activity.cost}
                    </GlassBadge>
                  ) : null}
                </>
              )}
            </div>

            <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 shrink-0">
              <button
                type="button"
                onClick={() => onDelete(index)}
                className={cn(
                  "inline-flex items-center justify-center w-8 h-8 rounded-lg",
                  "text-gray-400 transition-colors",
                  "hover:bg-rose-50 hover:text-rose-500",
                  "dark:hover:bg-rose-500/10",
                )}
                aria-label="Delete activity"
              >
                <Trash className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isEditing) {
                    handleSave();
                    return;
                  }
                  setDraft(activity);
                  setIsEditing(true);
                }}
                className={cn(
                  "inline-flex items-center justify-center w-8 h-8 rounded-lg",
                  "text-gray-400 transition-colors",
                  "hover:bg-primary/10 hover:text-primary",
                )}
                aria-label={isEditing ? "Save activity" : "Edit activity"}
              >
                {isEditing ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

export function TripActivityList({
  activities,
  dayNumber,
  conflicts,
  onAddActivity,
  onUpdateActivity,
  onDeleteActivity,
}: TripActivityListProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-serif text-secondary dark:text-white tracking-tight">
            Itinerary
          </h2>
          <GlassBadge variant="secondary" className="bg-primary/5 text-primary">
            Day {dayNumber} Operations
          </GlassBadge>
        </div>
        <GlassButton variant="secondary" size="sm" onClick={onAddActivity}>
          <Plus className="w-4 h-4" />
          Add Activity
        </GlassButton>
      </div>

      {conflicts.length > 0 && <ConflictWarning conflicts={conflicts} />}

      {activities.length === 0 ? (
        <ActivitiesEmpty />
      ) : (
        <div className="space-y-4">
          {activities.map((activity, idx) => (
            <ActivityCard
              key={`${activity.title}-${activity.start_time ?? idx}`}
              activity={activity}
              index={idx}
              onUpdate={onUpdateActivity}
              onDelete={onDeleteActivity}
            />
          ))}
        </div>
      )}
    </div>
  );
}
