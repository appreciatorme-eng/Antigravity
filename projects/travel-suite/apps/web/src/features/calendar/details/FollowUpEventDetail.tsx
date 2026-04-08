"use client";

import { BellRing, Clock, User, AlertTriangle } from "lucide-react";
import { GlassButton } from "@/components/glass/GlassButton";
import type { FollowUpEventData, CalendarEvent } from "../types";

interface FollowUpEventDetailProps {
  data: FollowUpEventData;
  event: CalendarEvent;
}

export function FollowUpEventDetail({ data, event }: FollowUpEventDetailProps) {
  const scheduledLabel = new Date(event.startDate).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <DetailRow icon={BellRing} label="Type" value={data.notificationType.replace(/_/g, " ")} />
        <DetailRow icon={Clock} label="Scheduled" value={scheduledLabel} />
        <DetailRow icon={User} label="Recipient" value={data.recipient || "Pending recipient"} />
        <DetailRow icon={AlertTriangle} label="State" value={data.overdue ? "Overdue" : "Upcoming"} />
      </div>

      <div className="flex gap-2 pt-2">
        <GlassButton
          size="sm"
          variant="primary"
          onClick={() => {
            window.location.href = "/admin/notifications";
          }}
        >
          Open Notification Queue
        </GlassButton>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BellRing;
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
        <p className="text-sm text-slate-700 font-medium capitalize">{value}</p>
      </div>
    </div>
  );
}
