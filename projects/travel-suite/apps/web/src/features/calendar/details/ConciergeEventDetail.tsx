"use client";

import { useState } from "react";
import { Tag, User } from "lucide-react";
import { GlassButton } from "@/components/glass/GlassButton";
import type { ConciergeEventData, CalendarEvent } from "../types";
import type { useCalendarActions } from "../useCalendarActions";

interface ConciergeEventDetailProps {
  data: ConciergeEventData;
  event: CalendarEvent;
  actions: ReturnType<typeof useCalendarActions>;
  onClose: () => void;
}

export function ConciergeEventDetail({
  data,
  event,
  actions,
  onClose,
}: ConciergeEventDetailProps) {
  const [responseText, setResponseText] = useState("");

  const handleRespond = () => {
    if (!responseText.trim()) return;
    actions.respondConcierge.mutate(
      { id: event.id, response: responseText },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <DetailRow icon={Tag} label="Type" value={data.requestType} />
        <DetailRow
          icon={User}
          label="Request"
          value={data.message.slice(0, 80)}
        />
      </div>

      {/* Inline response */}
      {!data.response && (
        <div className="pt-2 space-y-2">
          <textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Type your response..."
            className="w-full p-3 text-sm rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none resize-none"
            rows={3}
          />
          <GlassButton
            size="sm"
            variant="primary"
            onClick={handleRespond}
            disabled={
              !responseText.trim() || actions.respondConcierge.isPending
            }
          >
            {actions.respondConcierge.isPending
              ? "Sending..."
              : "Send Response"}
          </GlassButton>
        </div>
      )}

      {data.response && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-100">
          <p className="text-[10px] uppercase tracking-wider text-green-600 font-bold mb-1">
            Response Sent
          </p>
          <p className="text-sm text-green-800">{data.response}</p>
        </div>
      )}

      {data.tripId && (
        <GlassButton
          size="sm"
          variant="outline"
          onClick={() => {
            window.location.href = `/trips/${data.tripId}`;
          }}
        >
          View Trip
        </GlassButton>
      )}
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
