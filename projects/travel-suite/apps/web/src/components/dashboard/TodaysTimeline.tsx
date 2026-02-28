"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import {
  Plane,
  MapPin,
  Hotel,
  Camera,
  Car,
  AlertTriangle,
  CheckCircle,
  Circle,
  ChevronRight,
  CalendarX,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { GlassCard } from "@/components/glass/GlassCard";
import { cn } from "@/lib/utils";

type TripStatus = "completed" | "active" | "upcoming" | "alert";
type EventType = "pickup" | "dropoff" | "tour" | "checkin" | "checkout" | "sightseeing";

interface TimelineEvent {
  id: string;
  time: string; // "HH:MM" 24h
  timeLabel: string; // "6:30 AM"
  eventType: EventType;
  title: string;
  clientName: string;
  paxCount: number;
  driverName: string | null;
  driverPhone: string | null;
  location: string;
  status: TripStatus;
  tripId: string;
}

const TODAY_EVENTS: TimelineEvent[] = [
  {
    id: "t1",
    time: "06:30",
    timeLabel: "6:30 AM",
    eventType: "pickup",
    title: "Airport Pickup",
    clientName: "Gupta Family",
    paxCount: 7,
    driverName: "Raju Singh",
    driverPhone: "+919876543210",
    location: "IGI Airport T3, New Delhi",
    status: "completed",
    tripId: "trip-001",
  },
  {
    id: "t2",
    time: "09:00",
    timeLabel: "9:00 AM",
    eventType: "tour",
    title: "City Tour Start",
    clientName: "Chen Group",
    paxCount: 4,
    driverName: null,
    driverPhone: null,
    location: "Connaught Place, Delhi",
    status: "alert",
    tripId: "trip-002",
  },
  {
    id: "t3",
    time: "11:30",
    timeLabel: "11:30 AM",
    eventType: "sightseeing",
    title: "Taj Mahal Visit",
    clientName: "Williams Family",
    paxCount: 5,
    driverName: "Raj Kumar",
    driverPhone: "+919812345678",
    location: "Agra, Uttar Pradesh",
    status: "active",
    tripId: "trip-003",
  },
  {
    id: "t4",
    time: "14:00",
    timeLabel: "2:00 PM",
    eventType: "tour",
    title: "Amber Fort Tour",
    clientName: "Mehta Family",
    paxCount: 6,
    driverName: "Deepak Verma",
    driverPhone: "+919898765432",
    location: "Amber Fort, Jaipur",
    status: "upcoming",
    tripId: "trip-004",
  },
  {
    id: "t5",
    time: "17:30",
    timeLabel: "5:30 PM",
    eventType: "checkin",
    title: "Hotel Check-in",
    clientName: "Kapoor Group",
    paxCount: 10,
    driverName: "Amit Sharma",
    driverPhone: "+919756781234",
    location: "Taj Lake Palace, Udaipur",
    status: "upcoming",
    tripId: "trip-005",
  },
  {
    id: "t6",
    time: "20:00",
    timeLabel: "8:00 PM",
    eventType: "dropoff",
    title: "Airport Drop-off",
    clientName: "Reddy Family",
    paxCount: 3,
    driverName: "Venkat Rao",
    driverPhone: "+919745623189",
    location: "Chhatrapati Shivaji Airport, Mumbai",
    status: "upcoming",
    tripId: "trip-006",
  },
];

const EVENT_TYPE_CONFIG: Record<EventType, { icon: React.ElementType; label: string; color: string }> = {
  pickup: { icon: Plane, label: "Pickup", color: "text-sky-400" },
  dropoff: { icon: Plane, label: "Drop-off", color: "text-orange-400" },
  tour: { icon: Car, label: "Tour", color: "text-violet-400" },
  checkin: { icon: Hotel, label: "Check-in", color: "text-emerald-400" },
  checkout: { icon: Hotel, label: "Check-out", color: "text-rose-400" },
  sightseeing: { icon: Camera, label: "Sightseeing", color: "text-amber-400" },
};

const STATUS_CONFIG: Record<
  TripStatus,
  { icon: React.ElementType; label: string; cardBg: string; timeBg: string; timeText: string; iconColor: string; ring?: string }
> = {
  completed: {
    icon: CheckCircle,
    label: "Done",
    cardBg: "bg-white/3 opacity-70",
    timeBg: "bg-emerald-500/10",
    timeText: "text-emerald-400",
    iconColor: "text-emerald-500",
  },
  active: {
    icon: Circle,
    label: "Active",
    cardBg: "bg-blue-500/8 border-blue-500/30",
    timeBg: "bg-blue-500/15",
    timeText: "text-blue-400",
    iconColor: "text-blue-400",
    ring: "ring-1 ring-blue-500/40",
  },
  upcoming: {
    icon: Circle,
    label: "Upcoming",
    cardBg: "bg-white/4",
    timeBg: "bg-slate-500/10",
    timeText: "text-slate-400",
    iconColor: "text-slate-500",
  },
  alert: {
    icon: AlertTriangle,
    label: "Alert",
    cardBg: "bg-amber-500/8 border-amber-500/30",
    timeBg: "bg-amber-500/15",
    timeText: "text-amber-400",
    iconColor: "text-amber-500",
    ring: "ring-1 ring-amber-500/40",
  },
};

function WhatsAppButton({ phone, driverName }: { phone: string; driverName: string }) {
  const message = encodeURIComponent(
    `Namaste ${driverName}! Please provide a trip status update.`
  );
  const cleanPhone = phone.replace(/\s+/g, "").replace("+", "");
  const href = `https://wa.me/${cleanPhone}?text=${message}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={`WhatsApp ${driverName}`}
      className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/25 text-[#25D366] transition-all shrink-0"
    >
      <MessageCircle className="w-3.5 h-3.5" />
    </a>
  );
}

function TimelineCard({ event, index }: { event: TimelineEvent; index: number }) {
  const statusCfg = STATUS_CONFIG[event.status];
  const eventCfg = EVENT_TYPE_CONFIG[event.eventType];
  const StatusIcon = statusCfg.icon;
  const EventIcon = eventCfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: "easeOut" }}
      className="shrink-0 w-64"
    >
      <div
        className={cn(
          "relative rounded-xl border border-white/8 p-4 h-full flex flex-col gap-3 transition-all",
          statusCfg.cardBg,
          statusCfg.ring,
          event.status === "active" && "shadow-lg shadow-blue-500/10",
          event.status === "alert" && "shadow-lg shadow-amber-500/10"
        )}
      >
        {/* Active pulse ring */}
        {event.status === "active" && (
          <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
          </span>
        )}
        {event.status === "alert" && (
          <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>
        )}

        {/* Time + Event Type */}
        <div className="flex items-center gap-2">
          <div className={cn("px-2.5 py-1 rounded-lg text-xs font-black", statusCfg.timeBg, statusCfg.timeText)}>
            {event.timeLabel}
          </div>
          <div className={cn("flex items-center gap-1 text-[10px] font-bold", eventCfg.color)}>
            <EventIcon className="w-3 h-3" />
            {eventCfg.label}
          </div>
        </div>

        {/* Title */}
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
            {event.title}
          </h4>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <p className="text-[10px] text-slate-500 font-medium truncate">{event.location}</p>
          </div>
        </div>

        {/* Client + Pax */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-black text-primary shrink-0">
            {event.clientName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
              {event.clientName}
            </p>
            <p className="text-[10px] text-slate-400">{event.paxCount} pax</p>
          </div>
        </div>

        {/* Driver row */}
        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
          <StatusIcon className={cn("w-3.5 h-3.5 shrink-0", statusCfg.iconColor)} />
          {event.driverName ? (
            <>
              <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex-1 truncate">
                {event.driverName}
              </p>
              {event.driverPhone && (
                <WhatsAppButton phone={event.driverPhone} driverName={event.driverName} />
              )}
            </>
          ) : (
            <p className="text-[11px] font-bold text-amber-500 flex-1">
              Driver unassigned
            </p>
          )}
        </div>

        {/* Status badge */}
        <div className={cn(
          "absolute bottom-3 right-3 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
          statusCfg.timeBg,
          statusCfg.timeText,
          event.status === "active" || event.status === "alert" ? "visible" : "hidden"
        )}>
          {statusCfg.label}
        </div>
      </div>
    </motion.div>
  );
}

interface TodaysTimelineProps {
  loading?: boolean;
}

export function TodaysTimeline({ loading = false }: TodaysTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get IST date string
  const istDate = new Date().toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const completedCount = TODAY_EVENTS.filter((e) => e.status === "completed").length;
  const alertCount = TODAY_EVENTS.filter((e) => e.status === "alert").length;

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-1 shrink-0">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
            Today's Schedule
          </h3>
          <span className="text-[10px] text-slate-500 font-medium">{istDate} IST</span>
          {alertCount > 0 && (
            <span className="text-[9px] font-black bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-full">
              {alertCount} alert{alertCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-500">
            {completedCount}/{TODAY_EVENTS.length} done
          </span>
          <Link
            href="/trips"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            View All <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Timeline Card */}
      <GlassCard padding="none" className="overflow-hidden flex-1">
        {loading ? (
          <div className="flex gap-3 p-4 overflow-x-auto scrollbar-thin">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-64 h-44 rounded-xl bg-slate-100 dark:bg-slate-800/40 animate-pulse"
              />
            ))}
          </div>
        ) : TODAY_EVENTS.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 px-6 text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-500/10 flex items-center justify-center mb-3">
              <CalendarX className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No trips today</p>
            <p className="text-xs text-slate-500 mt-1">
              New bookings will appear here automatically.
            </p>
          </motion.div>
        ) : (
          <>
            {/* Progress bar */}
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(completedCount / TODAY_EVENTS.length) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
                <span className="text-[10px] font-black text-emerald-500">
                  {Math.round((completedCount / TODAY_EVENTS.length) * 100)}%
                </span>
              </div>
            </div>

            {/* Scrollable timeline */}
            <div
              ref={scrollRef}
              className="flex gap-3 px-4 pb-4 overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {TODAY_EVENTS.map((event, index) => (
                <div key={event.id} style={{ scrollSnapAlign: "start" }}>
                  <TimelineCard event={event} index={index} />
                </div>
              ))}
              {/* Scroll CTA sentinel */}
              <div className="shrink-0 w-4" />
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
}
