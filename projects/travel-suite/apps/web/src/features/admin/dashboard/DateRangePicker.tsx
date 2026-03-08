"use client";

import { useMemo, useState } from "react";
import { CalendarRange } from "lucide-react";
import { DayPicker, type DateRange } from "react-day-picker";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassInput } from "@/components/glass/GlassInput";
import {
  createCustomRange,
  createPresetRange,
  type AdminDateRangePreset,
  type AdminDateRangeSelection,
} from "@/lib/admin/date-range";

interface DateRangePickerProps {
  value: AdminDateRangeSelection;
  onChange: (next: AdminDateRangeSelection) => void;
}

const PRESETS: Array<{ value: Exclude<AdminDateRangePreset, "custom">; label: string }> = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [customOpen, setCustomOpen] = useState(value.preset === "custom");
  const [draftFrom, setDraftFrom] = useState(value.from);
  const [draftTo, setDraftTo] = useState(value.to);

  const focusAdjacentPreset = (currentValue: string, direction: -1 | 1) => {
    const values = [...PRESETS.map((preset) => preset.value), "custom"];
    const currentIndex = values.indexOf(currentValue);
    if (currentIndex === -1) return;

    const nextIndex = (currentIndex + direction + values.length) % values.length;
    const nextValue = values[nextIndex];
    const nextButton = document.querySelector<HTMLButtonElement>(
      `[data-date-preset="${nextValue}"]`,
    );
    nextButton?.focus();
  };

  const selectedRange = useMemo<DateRange | undefined>(() => {
    if (!draftFrom || !draftTo) return undefined;
    return {
      from: new Date(`${draftFrom}T00:00:00.000Z`),
      to: new Date(`${draftTo}T00:00:00.000Z`),
    };
  }, [draftFrom, draftTo]);

  const applyCustomRange = () => {
    if (!draftFrom || !draftTo) return;
    const from = new Date(`${draftFrom}T00:00:00.000Z`);
    const to = new Date(`${draftTo}T00:00:00.000Z`);
    onChange(createCustomRange(from, to));
    setCustomOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Select admin date range">
        {PRESETS.map((preset) => (
          <GlassButton
            key={preset.value}
            data-date-preset={preset.value}
            variant={value.preset === preset.value ? "primary" : "ghost"}
            size="sm"
            className="h-9 rounded-xl px-3"
            aria-pressed={value.preset === preset.value}
            onClick={() => {
              onChange(createPresetRange(preset.value));
              setCustomOpen(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") {
                event.preventDefault();
                focusAdjacentPreset(preset.value, 1);
              }

              if (event.key === "ArrowLeft") {
                event.preventDefault();
                focusAdjacentPreset(preset.value, -1);
              }
            }}
          >
            <span className="text-[10px] font-black uppercase tracking-widest">{preset.label}</span>
          </GlassButton>
        ))}

        <GlassButton
          data-date-preset="custom"
          variant={value.preset === "custom" || customOpen ? "primary" : "ghost"}
          size="sm"
          className="h-9 rounded-xl px-3 gap-2"
          aria-pressed={value.preset === "custom" || customOpen}
          onClick={() => setCustomOpen((current) => !current)}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") {
              event.preventDefault();
              focusAdjacentPreset("custom", 1);
            }

            if (event.key === "ArrowLeft") {
              event.preventDefault();
              focusAdjacentPreset("custom", -1);
            }
          }}
        >
          <CalendarRange className="h-4 w-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Custom</span>
        </GlassButton>

        <div className="ml-auto rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold text-white/70">
          {value.label}
        </div>
      </div>

      {customOpen ? (
        <GlassCard padding="lg" className="border-white/10 bg-white/5">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/10 p-3">
              <DayPicker
                mode="range"
                selected={selectedRange}
                onSelect={(range) => {
                  if (!range?.from) return;
                  setDraftFrom(range.from.toISOString().slice(0, 10));
                  if (range.to) {
                    setDraftTo(range.to.toISOString().slice(0, 10));
                  }
                }}
                showOutsideDays
                classNames={{
                  months: "flex flex-col gap-4 md:flex-row",
                  month: "space-y-4",
                  caption: "flex items-center justify-center text-sm font-bold text-white/85",
                  nav: "hidden",
                  table: "w-full border-collapse",
                  head_row: "grid grid-cols-7 text-white/40",
                  row: "grid grid-cols-7",
                  head_cell: "py-1 text-center text-[11px] font-semibold",
                  cell: "p-1",
                  day: "h-10 w-full rounded-xl text-sm text-white/80 transition hover:bg-white/10",
                  day_selected: "bg-primary text-white hover:bg-primary",
                  day_range_middle: "bg-primary/20 text-white",
                  day_today: "border border-primary/40 text-primary",
                }}
              />
            </div>

            <div className="space-y-4">
              <GlassInput
                type="date"
                label="From"
                value={draftFrom}
                onChange={(event) => setDraftFrom(event.target.value)}
              />
              <GlassInput
                type="date"
                label="To"
                value={draftTo}
                onChange={(event) => setDraftTo(event.target.value)}
              />
              <div className="flex gap-3">
                <GlassButton variant="ghost" className="flex-1" onClick={() => setCustomOpen(false)}>
                  Cancel
                </GlassButton>
                <GlassButton variant="primary" className="flex-1" onClick={applyCustomRange}>
                  Apply Range
                </GlassButton>
              </div>
            </div>
          </div>
        </GlassCard>
      ) : null}
    </div>
  );
}
