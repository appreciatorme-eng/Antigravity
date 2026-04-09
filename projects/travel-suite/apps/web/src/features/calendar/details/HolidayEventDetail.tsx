"use client";

import type { CalendarEvent, HolidayEventData } from "../types";

interface HolidayEventDetailProps {
  data: HolidayEventData;
  event: CalendarEvent;
}

export function HolidayEventDetail({ data, event }: HolidayEventDetailProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-rose-700">
          Public Holiday
        </p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">{data.localName}</h3>
        <p className="mt-1 text-sm text-slate-600">
          {data.country} ({data.countryCode})
        </p>
      </div>

      {data.destinationLabel ? (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Relevant Destination
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">{data.destinationLabel}</p>
        </div>
      ) : null}

      {data.types.length > 0 ? (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Holiday Types
          </p>
          <p className="mt-1 text-sm text-slate-700">{data.types.join(", ")}</p>
        </div>
      ) : null}

      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Calendar Date
        </p>
        <p className="mt-1 text-sm text-slate-700">{new Date(`${event.startDate}T00:00:00`).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}</p>
      </div>
    </div>
  );
}
