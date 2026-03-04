"use client";

import { MapPin, Clock, User } from "lucide-react";
import { GlassButton } from "@/components/glass/GlassButton";
import type { TripEventData, CalendarEvent } from "../types";
import type { useCalendarActions } from "../useCalendarActions";

interface TripEventDetailProps {
  data: TripEventData;
  event: CalendarEvent;
  actions: ReturnType<typeof useCalendarActions>;
  onClose: () => void;
}

export function TripEventDetail({
  data,
  event,
  actions,
}: TripEventDetailProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <DetailRow icon={User} label="Client" value={data.clientName} />
        <DetailRow
          icon={MapPin}
          label="Destination"
          value={data.destination ?? "Not set"}
        />
        <DetailRow
          icon={Clock}
          label="Duration"
          value={data.durationDays ? `${data.durationDays} days` : "TBD"}
        />
      </div>
      <div className="flex gap-2 pt-2">
        {event.status === "draft" && (
          <GlassButton
            size="sm"
            variant="primary"
            onClick={() =>
              actions.updateTripStatus.mutate({
                tripId: event.id,
                status: "confirmed",
              })
            }
          >
            Confirm Trip
          </GlassButton>
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
  icon: typeof MapPin;
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
