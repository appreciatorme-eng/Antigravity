"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
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
import {
  useDashboardSchedule,
  type ScheduleEvent,
} from "@/lib/queries/dashboard-tasks";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type TripStatus = "completed" | "active" | "upcoming" | "alert";

function formatTimeLabel(time: string): string {
  const date = new Date(time);

  // If the string is already a short time like "06:30" (not a valid ISO),
  // Date will return Invalid Date. Fall back to manual parsing.
  if (Number.isNaN(date.getTime())) {
    const [hours, minutes] = time.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;
    const period = hours >= 12 ? "PM" : "AM";
    const h = hours % 12 || 12;
    const m = String(minutes).padStart(2, "0");
    return `${h}:${m} ${period}`;
  }

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  TripStatus,
  {
    icon: React.ElementType;
    label: string;
    cardBg: string;
    timeBg: string;
    timeText: string;
    iconColor: string;
    ring?: string;
  }
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

// ---------------------------------------------------------------------------
// WhatsAppButton
// ---------------------------------------------------------------------------

function WhatsAppButton({
  phone,
  driverName,
}: {
  phone: string;
  driverName: string;
}) {
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

// ---------------------------------------------------------------------------
// TimelineCard
// ---------------------------------------------------------------------------

function TimelineCard({
  event,
  index,
}: {
  event: ScheduleEvent;
  index: number;
}) {
  const statusCfg = STATUS_CONFIG[event.status];
  const StatusIcon = statusCfg.icon;
  const timeLabel = formatTimeLabel(event.time);
  const paxCount = event.passengerCount ?? 0;

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

        {/* Time + Status */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-black",
              statusCfg.timeBg,
              statusCfg.timeText
            )}
          >
            {timeLabel}
          </div>
        </div>

        {/* Title */}
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
            {event.title}
          </h4>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <p className="text-[10px] text-slate-500 font-medium truncate">
              {event.location}
            </p>
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
            <p className="text-[10px] text-slate-400">{paxCount} pax</p>
          </div>
        </div>

        {/* Driver row */}
        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
          <StatusIcon
            className={cn("w-3.5 h-3.5 shrink-0", statusCfg.iconColor)}
          />
          {event.driverName ? (
            <>
              <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex-1 truncate">
                {event.driverName}
              </p>
              {event.driverPhone && (
                <WhatsAppButton
                  phone={event.driverPhone}
                  driverName={event.driverName}
                />
              )}
            </>
          ) : (
            <p className="text-[11px] font-bold text-amber-500 flex-1">
              Driver unassigned
            </p>
          )}
        </div>

        {/* Status badge */}
        <div
          className={cn(
            "absolute bottom-3 right-3 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
            statusCfg.timeBg,
            statusCfg.timeText,
            event.status === "active" || event.status === "alert"
              ? "visible"
              : "hidden"
          )}
        >
          {statusCfg.label}
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function SkeletonRow() {
  return (
    <div className="flex gap-3 p-4 overflow-x-auto scrollbar-thin">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="shrink-0 w-64 h-44 rounded-xl bg-slate-100 dark:bg-slate-800/40 animate-pulse"
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TodaysTimeline
// ---------------------------------------------------------------------------

interface TodaysTimelineProps {
  loading?: boolean;
}

export function TodaysTimeline({ loading = false }: TodaysTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useDashboardSchedule();

  const showLoading = loading || isLoading;

  const events = data?.events ?? [];
  const completedCount = data?.completedCount ?? 0;
  const totalCount = events.length;
  const alertCount = events.filter((e) => e.status === "alert").length;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Get IST date string
  const istDate = new Date().toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-1 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">
            Today&apos;s Schedule
          </h2>
          <span className="text-[10px] text-slate-500 font-medium">
            {istDate} IST
          </span>
          {alertCount > 0 && (
            <span className="text-[9px] font-black bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-full">
              {alertCount} alert{alertCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!showLoading && totalCount > 0 && (
            <span className="text-[10px] text-slate-500">
              {completedCount}/{totalCount} done
            </span>
          )}
          <Link
            href="/dashboard/schedule"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            View All <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Timeline Card */}
      <GlassCard padding="none" className="overflow-hidden flex-1">
        {showLoading ? (
          <SkeletonRow />
        ) : events.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 px-5 py-4"
          >
            <CalendarX className="w-5 h-5 text-slate-400 shrink-0" />
            <p className="text-sm font-medium text-slate-500">
              No trips scheduled for today — new bookings will appear here.
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
                    animate={{ width: `${progressPercent}%` }}
                    transition={{
                      duration: 0.8,
                      ease: "easeOut",
                      delay: 0.3,
                    }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
                <span className="text-[10px] font-black text-emerald-500">
                  {progressPercent}%
                </span>
              </div>
            </div>

            {/* Scrollable timeline */}
            <div
              ref={scrollRef}
              className="flex gap-3 px-4 pb-4 overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {events.map((event, index) => (
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
