// TimeRangePicker — 7d / 30d / 90d / all button group selector.

"use client";

import { cn } from "@/lib/utils";

export type TimeRange = "7d" | "30d" | "90d" | "all";

const OPTIONS: { value: TimeRange; label: string }[] = [
    { value: "7d", label: "7d" },
    { value: "30d", label: "30d" },
    { value: "90d", label: "90d" },
    { value: "all", label: "All" },
];

interface TimeRangePickerProps {
    value: TimeRange;
    onChange: (range: TimeRange) => void;
    includeAll?: boolean;
}

export default function TimeRangePicker({ value, onChange, includeAll = false }: TimeRangePickerProps) {
    const options = includeAll ? OPTIONS : OPTIONS.slice(0, 3);

    return (
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                        value === opt.value
                            ? "bg-amber-500 text-gray-950 shadow-sm"
                            : "text-gray-400 hover:text-white"
                    )}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}
