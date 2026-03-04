"use client";

import { useState } from "react";
import { Tag, MapPin, Clock, FileText } from "lucide-react";
import { GlassButton } from "@/components/glass/GlassButton";
import type { PersonalEventData, CalendarEvent } from "../types";
import type { useCalendarActions } from "../useCalendarActions";

interface PersonalEventDetailProps {
  data: PersonalEventData;
  event: CalendarEvent;
  actions: ReturnType<typeof useCalendarActions>;
  onClose: () => void;
}

function formatTimeRange(startDate: string, endDate: string | null): string {
  const start = new Date(startDate);
  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (!endDate) return formatTime(start);
  const end = new Date(endDate);
  return `${formatTime(start)} \u2014 ${formatTime(end)}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function PersonalEventDetail({
  data,
  event,
  actions,
  onClose,
}: PersonalEventDetailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <DetailRow
          icon={Tag}
          label="Category"
          value={capitalize(data.category)}
        />
        <DetailRow
          icon={Clock}
          label="Time"
          value={data.allDay ? "All Day" : formatTimeRange(event.startDate, event.endDate)}
        />
        <DetailRow
          icon={MapPin}
          label="Location"
          value={data.location ?? "Not set"}
        />
        {data.description && (
          <div className="col-span-2">
            <DetailRow
              icon={FileText}
              label="Description"
              value={data.description}
            />
          </div>
        )}
        {!data.description && (
          <DetailRow
            icon={FileText}
            label="Description"
            value="No description"
          />
        )}
      </div>

      {event.status === "completed" && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-100">
          <p className="text-sm text-green-800 font-medium">
            This event has been completed
          </p>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        {event.status !== "completed" && (
          <GlassButton
            size="sm"
            variant="primary"
            onClick={() =>
              actions.updatePersonalEvent.mutate({
                id: event.id,
                status: "completed",
              })
            }
          >
            Mark Complete
          </GlassButton>
        )}
        {event.status !== "cancelled" && (
          <>
            {!showDeleteConfirm ? (
              <GlassButton
                size="sm"
                variant="danger"
                className="border-2 border-red-500 bg-transparent text-red-500 hover:bg-red-500 hover:text-white"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete
              </GlassButton>
            ) : (
              <GlassButton
                size="sm"
                variant="danger"
                onClick={() =>
                  actions.deletePersonalEvent.mutate(event.id, {
                    onSuccess: () => onClose(),
                  })
                }
              >
                Are you sure?
              </GlassButton>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Tag;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
          {label}
        </p>
        <p className="text-sm text-slate-700 font-medium">{value}</p>
      </div>
    </div>
  );
}
