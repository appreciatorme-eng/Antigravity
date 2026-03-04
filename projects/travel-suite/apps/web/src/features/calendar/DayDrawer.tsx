"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { X, Calendar, DollarSign, TrendingUp, Plane } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { DayEventRow } from "./DayEventRow";
import { EVENT_TYPE_CONFIG, ALL_EVENT_TYPES } from "./constants";
import { isToday } from "./utils";
import type { CalendarEvent, CalendarEventType } from "./types";

interface DayDrawerProps {
  day: { year: number; month: number; day: number };
  events: CalendarEvent[];
  onClose: () => void;
  onEventClick: (event: CalendarEvent) => void;
}

export function DayDrawer({ day, events, onClose, onEventClick }: DayDrawerProps) {
  const dateLabel = new Date(day.year, day.month, day.day).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  const today = isToday(day.year, day.month, day.day);

  // Group events by type
  const grouped = useMemo(() => {
    const groups = new Map<CalendarEventType, CalendarEvent[]>();
    for (const event of events) {
      const existing = groups.get(event.type) ?? [];
      groups.set(event.type, [...existing, event]);
    }
    return groups;
  }, [events]);

  // Today's pulse stats
  const todayPulse = useMemo(() => {
    if (!today) return null;
    const payments = events.filter(e => e.type === "payment");
    const invoicesDue = events.filter(e => e.type === "invoice");
    const departures = events.filter(e => e.type === "trip" && e.entityData.type === "trip");
    const paymentTotal = payments.reduce((sum, e) => sum + (e.amount ?? 0), 0);
    return { paymentTotal, invoicesDue: invoicesDue.length, departures: departures.length };
  }, [events, today]);

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed top-0 right-0 bottom-0 w-[380px] z-40 bg-white/95 backdrop-blur-xl border-l border-gray-200 shadow-2xl flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-serif text-slate-900">{dateLabel}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {events.length} event{events.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-slate-400"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Today's Pulse micro-card */}
      {todayPulse && (
        <div className="mx-6 mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-100">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 mb-3">
            Today&apos;s Pulse
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <DollarSign className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
              <p className="text-sm font-bold text-slate-800">${todayPulse.paymentTotal.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500">Received</p>
            </div>
            <div className="text-center">
              <TrendingUp className="w-4 h-4 mx-auto text-amber-600 mb-1" />
              <p className="text-sm font-bold text-slate-800">{todayPulse.invoicesDue}</p>
              <p className="text-[10px] text-slate-500">Invoices Due</p>
            </div>
            <div className="text-center">
              <Plane className="w-4 h-4 mx-auto text-blue-600 mb-1" />
              <p className="text-sm font-bold text-slate-800">{todayPulse.departures}</p>
              <p className="text-[10px] text-slate-500">Departures</p>
            </div>
          </div>
        </div>
      )}

      {/* Events list */}
      <div className="flex-1 overflow-y-auto p-6 pt-4">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Calendar className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-400">No events on this day</p>
          </div>
        ) : (
          <div className="space-y-5">
            {ALL_EVENT_TYPES.filter(t => grouped.has(t)).map((type) => {
              const typeEvents = grouped.get(type)!;
              const config = EVENT_TYPE_CONFIG[type];
              return (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn("w-2 h-2 rounded-full", config.dotColor)} />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {config.label}
                    </span>
                    <GlassBadge variant={config.badgeVariant} className="text-[10px] px-1.5 py-0">
                      {typeEvents.length}
                    </GlassBadge>
                  </div>
                  <div className="space-y-2">
                    {typeEvents.map((event, i) => (
                      <DayEventRow
                        key={event.id}
                        event={event}
                        onEventClick={onEventClick}
                        index={i}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <GlassButton
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => {
            const params = new URLSearchParams({ type: "revenue", range: "1m" });
            window.location.href = `/analytics/drill-through?${params.toString()}`;
          }}
        >
          Drill Through Analytics
        </GlassButton>
      </div>
    </motion.div>
  );
}
