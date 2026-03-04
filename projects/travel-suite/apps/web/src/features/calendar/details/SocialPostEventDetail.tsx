"use client";

import { Share2 } from "lucide-react";
import type { SocialPostEventData, CalendarEvent } from "../types";

interface SocialPostEventDetailProps {
  data: SocialPostEventData;
  event: CalendarEvent;
}

export function SocialPostEventDetail({ data }: SocialPostEventDetailProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <DetailRow
          icon={Share2}
          label="Platform"
          value={data.platform ?? "Unknown"}
        />
      </div>
      {data.caption && (
        <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
            Caption Preview
          </p>
          <p className="text-sm text-slate-700 leading-relaxed line-clamp-4">
            {data.caption}
          </p>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Share2;
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
