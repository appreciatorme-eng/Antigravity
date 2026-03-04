"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { GlassModal } from "@/components/glass/GlassModal";
import { GlassButton } from "@/components/glass/GlassButton";
import { useCalendarActions } from "./useCalendarActions";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AddEventModalProps {
  defaults: { date: Date; hour: number | null } | null;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_OPTIONS = [
  { value: "meeting", label: "Meeting" },
  { value: "task", label: "Task" },
  { value: "reminder", label: "Reminder" },
  { value: "personal", label: "Personal" },
  { value: "other", label: "Other" },
] as const;

const TIME_MODE_OPTIONS = [
  { key: true as const, label: "All Day" },
  { key: false as const, label: "Set Time" },
];

const INPUT_CLASS =
  "w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-colors";

const LABEL_CLASS =
  "block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5";

// ---------------------------------------------------------------------------
// Form State
// ---------------------------------------------------------------------------

interface FormState {
  title: string;
  category: "meeting" | "task" | "reminder" | "personal" | "other";
  date: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
}

function buildInitialForm(
  defaultDate: Date,
  defaultHour: number | null
): FormState {
  return {
    title: "",
    category: "personal",
    date: defaultDate.toISOString().split("T")[0],
    allDay: defaultHour === null,
    startTime:
      defaultHour !== null
        ? `${String(defaultHour).padStart(2, "0")}:00`
        : "09:00",
    endTime:
      defaultHour !== null
        ? `${String(defaultHour + 1).padStart(2, "0")}:00`
        : "",
    location: "",
    description: "",
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AddEventModal({ defaults, onClose }: AddEventModalProps) {
  const actions = useCalendarActions();

  const defaultDate = defaults?.date ?? new Date();
  const defaultHour = defaults?.hour ?? null;

  const [form, setForm] = useState<FormState>(() =>
    buildInitialForm(defaultDate, defaultHour)
  );

  // Immutable field updater
  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    if (!form.title.trim()) return;

    const startDate = form.allDay
      ? `${form.date}T00:00:00`
      : `${form.date}T${form.startTime}:00`;

    const endDate = form.allDay
      ? `${form.date}T23:59:59`
      : form.endTime.trim()
        ? `${form.date}T${form.endTime}:00`
        : null;

    await actions.createPersonalEvent.mutateAsync({
      title: form.title.trim(),
      description: form.description.trim() || null,
      startDate,
      endDate,
      location: form.location.trim() || null,
      category: form.category,
      allDay: form.allDay,
    });

    onClose();
  }, [form, actions, onClose]);

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const isTitleEmpty = form.title.trim() === "";
  const isPending = actions.createPersonalEvent.isPending;
  const isSaveDisabled = isTitleEmpty || isPending;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <GlassModal isOpen onClose={onClose} title="Add Event" size="md">
      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className={LABEL_CLASS}>
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="Event title"
            className={INPUT_CLASS}
            autoFocus
          />
        </div>

        {/* Category + Date (2-column grid) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLASS}>Category</label>
            <select
              value={form.category}
              onChange={(e) =>
                updateField(
                  "category",
                  e.target.value as FormState["category"]
                )
              }
              className={INPUT_CLASS}
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => updateField("date", e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        {/* Time Mode Toggle — segmented pill control */}
        <div>
          <label className={LABEL_CLASS}>Duration</label>
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl gap-1">
            {TIME_MODE_OPTIONS.map(({ key, label }) => (
              <button
                key={String(key)}
                type="button"
                onClick={() => updateField("allDay", key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-semibold transition-all",
                  form.allDay === key
                    ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Start Time + End Time (visible only when "Set Time" is active) */}
        {!form.allDay && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Start Time</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => updateField("startTime", e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>
                End Time{" "}
                <span className="text-slate-400 font-normal normal-case">
                  (optional)
                </span>
              </label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => updateField("endTime", e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>
        )}

        {/* Location */}
        <div>
          <label className={LABEL_CLASS}>Location</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => updateField("location", e.target.value)}
            placeholder="Add a location (optional)"
            className={INPUT_CLASS}
          />
        </div>

        {/* Description */}
        <div>
          <label className={LABEL_CLASS}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Add a description (optional)"
            rows={3}
            className={INPUT_CLASS}
          />
        </div>

        {/* Footer: Cancel + Save */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
          <GlassButton variant="ghost" size="md" onClick={onClose}>
            Cancel
          </GlassButton>
          <GlassButton
            variant="primary"
            size="md"
            disabled={isSaveDisabled}
            loading={isPending}
            onClick={handleSubmit}
          >
            {isPending ? "Creating..." : "Save Event"}
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
}
