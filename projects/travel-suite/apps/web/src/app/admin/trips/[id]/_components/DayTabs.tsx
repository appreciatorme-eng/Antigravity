"use client";

import type { DriverAssignment } from "./types";

interface DayTabsProps {
    durationDays: number;
    activeDay: number;
    assignments: Record<number, DriverAssignment>;
    onDayChange: (day: number) => void;
}

export function DayTabs({ durationDays, activeDay, assignments, onDayChange }: DayTabsProps) {
    return (
        <div className="flex gap-2 overflow-x-auto pb-2">
            {Array.from({ length: durationDays }, (_, i) => i + 1).map((day) => (
                <button
                    key={day}
                    onClick={() => onDayChange(day)}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeDay === day
                        ? "bg-primary text-white"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                >
                    Day {day}
                    {assignments[day]?.external_driver_id && (
                        <span className="ml-2 w-2 h-2 bg-green-400 rounded-full inline-block"></span>
                    )}
                </button>
            ))}
        </div>
    );
}
