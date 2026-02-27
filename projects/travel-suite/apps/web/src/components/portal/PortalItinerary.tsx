'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, Clock, Building2, Phone } from 'lucide-react';

export interface ItineraryActivity {
  time: string;
  name: string;
  location: string;
  notes?: string;
}

export interface ItineraryAccommodation {
  hotelName: string;
  checkIn: string;
  address: string;
  phone: string;
}

export interface ItineraryDay {
  dayNumber: number;
  date: string;       // "15 Mar"
  dateISO: string;    // "2026-03-15" for today comparison
  location: string;
  activities: ItineraryActivity[];
  accommodation?: ItineraryAccommodation;
}

interface PortalItineraryProps {
  days: ItineraryDay[];
}

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function PortalItinerary({ days }: PortalItineraryProps) {
  const todayISO = getTodayISO();
  // Default: expand today's day (or day 1 if no match)
  const defaultOpen = days.find((d) => d.dateISO === todayISO)?.dayNumber ?? days[0]?.dayNumber ?? 1;
  const [openDay, setOpenDay] = useState<number | null>(defaultOpen);

  function toggle(dayNumber: number) {
    setOpenDay((prev) => (prev === dayNumber ? null : dayNumber));
  }

  return (
    <div className="space-y-3">
      {days.map((day) => {
        const isToday = day.dateISO === todayISO;
        const isOpen = openDay === day.dayNumber;

        return (
          <div
            key={day.dayNumber}
            className={[
              'rounded-2xl border bg-white overflow-hidden transition-all duration-200',
              isToday
                ? 'border-emerald-400 shadow-md shadow-emerald-50 ring-1 ring-emerald-200'
                : 'border-gray-200 shadow-sm',
            ].join(' ')}
          >
            {/* Day header — clickable */}
            <button
              type="button"
              onClick={() => toggle(day.dayNumber)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left"
            >
              <div className="flex items-center gap-3">
                <div
                  className={[
                    'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0',
                    isToday
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-600',
                  ].join(' ')}
                >
                  {day.dayNumber}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">
                      {day.date} — {day.location}
                    </span>
                    {isToday && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                        TODAY
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {day.activities.length} activities
                    {day.accommodation ? ' · 1 hotel' : ''}
                  </span>
                </div>
              </div>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
              )}
            </button>

            {/* Expanded content */}
            {isOpen && (
              <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-4">
                {/* Activities */}
                <div className="space-y-2">
                  {day.activities.map((act, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="flex flex-col items-center shrink-0">
                        <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        {idx < day.activities.length - 1 && (
                          <div className="w-px flex-1 bg-gray-100 my-1" />
                        )}
                      </div>
                      <div className="flex-1 pt-1 pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide">
                              {act.time}
                            </span>
                            <p className="text-sm font-semibold text-gray-800 mt-0.5">
                              {act.name}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                              <span className="text-xs text-gray-500">{act.location}</span>
                            </div>
                          </div>
                        </div>
                        {act.notes && (
                          <p className="text-xs text-gray-400 mt-1 italic">{act.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Accommodation */}
                {day.accommodation && (
                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                        Tonight's Stay
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">
                      {day.accommodation.hotelName}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Check-in: {day.accommodation.checkIn}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {day.accommodation.address}
                    </p>
                    <a
                      href={`tel:${day.accommodation.phone.replace(/\s/g, '')}`}
                      className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-amber-700 bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 hover:bg-amber-50 transition-colors"
                    >
                      <Phone className="w-3 h-3" />
                      Call Hotel
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
