"use client";

import { useState } from "react";
import { MapPin, Plus, Trash } from "lucide-react";
import type { Activity, Day, DriverLocationSnapshot, ReminderDayStatus } from "./types";

interface DayActivitiesProps {
    activeDay: number;
    activeDayData: Day | undefined;
    reminderStatus: ReminderDayStatus | undefined;
    latestDriverLocation: DriverLocationSnapshot | null;
    timeOptions: string[];
    onUpdateDayTheme: (dayNumber: number, newTheme: string) => void;
    onUpdateActivity: (
        dayNumber: number,
        activityIndex: number,
        field: keyof Activity,
        value: string | number
    ) => void;
    onAddActivity: (dayNumber: number) => void;
    onRemoveActivity: (dayNumber: number, activityIndex: number) => void;
    onLocationBlur: (dayNumber: number, activityIndex: number, location?: string) => void;
}

export function DayActivities({
    activeDay,
    activeDayData,
    reminderStatus,
    latestDriverLocation,
    timeOptions,
    onUpdateDayTheme,
    onUpdateActivity,
    onAddActivity,
    onRemoveActivity,
    onLocationBlur,
}: DayActivitiesProps) {
    if (!activeDayData) return null;

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex-1 mr-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Day Theme
                    </label>
                    <input
                        type="text"
                        value={activeDayData.theme || ""}
                        onChange={(e) => onUpdateDayTheme(activeDay, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold"
                    />
                </div>
                <button
                    onClick={() => onAddActivity(activeDay)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                    <Plus className="h-4 w-4" />
                    Add Activity
                </button>
            </div>

            <div className="space-y-3">
                <ReminderQueuePanel reminderStatus={reminderStatus} />
                <DriverPingPanel latestDriverLocation={latestDriverLocation} />

                {activeDayData.activities.map((activity, index) => (
                    <ActivityRow
                        key={index}
                        activity={activity}
                        index={index}
                        activeDay={activeDay}
                        isFirst={index === 0}
                        timeOptions={timeOptions}
                        onUpdateActivity={onUpdateActivity}
                        onRemoveActivity={onRemoveActivity}
                        onLocationBlur={onLocationBlur}
                    />
                ))}

                {activeDayData.activities.length === 0 && (
                    <div className="text-center py-6 text-gray-400 text-sm">
                        No activities planned for this day.
                    </div>
                )}
            </div>
        </div>
    );
}

function ReminderQueuePanel({ reminderStatus }: { reminderStatus: ReminderDayStatus | undefined }) {
    return (
        <div className="rounded-lg border border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/5 p-3">
            <p className="text-[10px] uppercase tracking-wide text-primary">Reminder Queue</p>
            {reminderStatus ? (
                <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                    <span className="rounded bg-white border border-white/20 dark:border-white/10 px-2 py-1 text-center">P {reminderStatus.pending}</span>
                    <span className="rounded bg-white border border-white/20 dark:border-white/10 px-2 py-1 text-center">W {reminderStatus.processing}</span>
                    <span className="rounded bg-white border border-white/20 dark:border-white/10 px-2 py-1 text-center">S {reminderStatus.sent}</span>
                    <span className="rounded bg-white border border-white/20 dark:border-white/10 px-2 py-1 text-center">F {reminderStatus.failed}</span>
                </div>
            ) : (
                <p className="mt-2 text-xs text-text-secondary">No reminders queued for this day yet.</p>
            )}
        </div>
    );
}

function DriverPingPanel({ latestDriverLocation }: { latestDriverLocation: DriverLocationSnapshot | null }) {
    const STALE_THRESHOLD_MS = 10 * 60 * 1000;
    const [now] = useState(() => Date.now());

    const isStale = latestDriverLocation?.recorded_at
        ? now - new Date(latestDriverLocation.recorded_at).getTime() > STALE_THRESHOLD_MS
        : false;

    return (
        <div className="rounded-lg border border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/5 p-3">
            <p className="text-[10px] uppercase tracking-wide text-primary">Driver Ping</p>
            {latestDriverLocation?.recorded_at ? (
                <>
                    <p className="mt-2 text-xs text-secondary dark:text-white">
                        Last ping: {new Date(latestDriverLocation.recorded_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-text-secondary">
                        {latestDriverLocation.latitude.toFixed(5)}, {latestDriverLocation.longitude.toFixed(5)}
                    </p>
                    {isStale ? (
                        <p className="mt-1 text-xs font-semibold text-rose-600">Stale: no recent location in last 10 min</p>
                    ) : (
                        <p className="mt-1 text-xs font-semibold text-emerald-600">Live: recent location available</p>
                    )}
                </>
            ) : (
                <p className="mt-2 text-xs text-text-secondary">No driver location ping received yet.</p>
            )}
        </div>
    );
}

interface ActivityRowProps {
    activity: Activity;
    index: number;
    activeDay: number;
    isFirst: boolean;
    timeOptions: string[];
    onUpdateActivity: (
        dayNumber: number,
        activityIndex: number,
        field: keyof Activity,
        value: string | number
    ) => void;
    onRemoveActivity: (dayNumber: number, activityIndex: number) => void;
    onLocationBlur: (dayNumber: number, activityIndex: number, location?: string) => void;
}

function ActivityRow({
    activity,
    index,
    activeDay,
    isFirst,
    timeOptions,
    onUpdateActivity,
    onRemoveActivity,
    onLocationBlur,
}: ActivityRowProps) {
    return (
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg group">
            <div className="mt-3 w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                    <input
                        type="text"
                        value={activity.title}
                        onChange={(e) =>
                            onUpdateActivity(activeDay, index, "title", e.target.value)
                        }
                        className="w-full bg-transparent border-b border-transparent focus:border-primary focus:outline-none px-1 py-0.5"
                        placeholder="Activity title"
                    />
                    <div className="mt-2 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <input
                            type="text"
                            value={activity.location || ""}
                            onChange={(e) =>
                                onUpdateActivity(activeDay, index, "location", e.target.value)
                            }
                            onBlur={(e) =>
                                onLocationBlur(activeDay, index, e.target.value)
                            }
                            className="w-full bg-transparent border-b border-transparent focus:border-primary focus:outline-none px-1 py-0.5 text-sm text-text-secondary"
                            placeholder="Location (auto-mapped)"
                        />
                    </div>
                </div>
                <div className="w-[210px] rounded-lg border border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/5 p-2">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <p className="text-[10px] uppercase tracking-wide text-primary mb-1">Start</p>
                            {isFirst ? (
                                <select
                                    value={activity.start_time || "09:00"}
                                    onChange={(e) =>
                                        onUpdateActivity(activeDay, index, "start_time", e.target.value)
                                    }
                                    className="w-full rounded-md border border-white/20 dark:border-white/10 bg-white px-2 py-1.5 text-sm font-mono tabular-nums text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-[primary]/25"
                                >
                                    {timeOptions.map((time) => (
                                        <option key={time} value={time}>
                                            {time}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="rounded-md border border-white/20 dark:border-white/10 bg-white px-2 py-1.5 text-sm font-mono tabular-nums text-secondary dark:text-white text-center">
                                    {activity.start_time || "--:--"}
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wide text-primary mb-1">End</p>
                            <div className="rounded-md border border-white/20 dark:border-white/10 bg-white px-2 py-1.5 text-sm font-mono tabular-nums text-secondary dark:text-white text-center">
                                {activity.end_time || "--:--"}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="w-[132px] rounded-lg border border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/5 p-2">
                    <p className="text-[10px] uppercase tracking-wide text-primary mb-1">Duration</p>
                    <div className="flex items-center gap-1.5">
                        <select
                            value={activity.duration_minutes}
                            onChange={(e) =>
                                onUpdateActivity(
                                    activeDay,
                                    index,
                                    "duration_minutes",
                                    parseInt(e.target.value, 10) || 60
                                )
                            }
                            className="w-full rounded-md border border-white/20 dark:border-white/10 bg-white px-2 py-1.5 text-sm font-mono tabular-nums text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-[primary]/25"
                        >
                            {[30, 45, 60, 75, 90, 120, 150, 180].map((mins) => (
                                <option key={mins} value={mins}>
                                    {mins}
                                </option>
                            ))}
                        </select>
                        <span className="text-xs text-text-secondary">mins</span>
                    </div>
                </div>
            </div>
            <button
                onClick={() => onRemoveActivity(activeDay, index)}
                className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <Trash className="h-4 w-4" />
            </button>
        </div>
    );
}
