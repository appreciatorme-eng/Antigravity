"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  CheckCircle,
  Circle,
  AlertTriangle,
  CalendarX,
  MessageCircle,
  Phone,
  User,
  Clock,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassSkeleton } from "@/components/glass/GlassSkeleton";
import { cn } from "@/lib/utils";
import {
  useDashboardSchedule,
  type ScheduleEvent,
} from "@/lib/queries/dashboard-tasks";

// ---------------------------------------------------------------------------
// Status configuration (matches TodaysTimeline styling)
// ---------------------------------------------------------------------------

type EventStatus = ScheduleEvent["status"];

const STATUS_CONFIG: Record<
  EventStatus,
  {
    icon: React.ElementType;
    label: string;
    badgeBg: string;
    badgeText: string;
    cardAccent: string;
    dotColor: string;
    lineColor: string;
    pulse: boolean;
    faded: boolean;
  }
> = {
  completed: {
    icon: CheckCircle,
    label: "Done",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-400",
    cardAccent: "border-emerald-500/20",
    dotColor: "bg-emerald-500",
    lineColor: "bg-emerald-500/30",
    pulse: false,
    faded: true,
  },
  active: {
    icon: Circle,
    label: "Active",
    badgeBg: "bg-blue-500/15",
    badgeText: "text-blue-400",
    cardAccent: "border-blue-500/30 ring-1 ring-blue-500/40",
    dotColor: "bg-blue-500",
    lineColor: "bg-blue-500/30",
    pulse: true,
    faded: false,
  },
  upcoming: {
    icon: Circle,
    label: "Upcoming",
    badgeBg: "bg-slate-500/10",
    badgeText: "text-slate-400",
    cardAccent: "border-white/8",
    dotColor: "bg-slate-500",
    lineColor: "bg-slate-500/20",
    pulse: false,
    faded: false,
  },
  alert: {
    icon: AlertTriangle,
    label: "Alert",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-400",
    cardAccent: "border-amber-500/30 ring-1 ring-amber-500/40",
    dotColor: "bg-amber-500",
    lineColor: "bg-amber-500/30",
    pulse: true,
    faded: false,
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(time: string): string {
  if (time.includes("T")) {
    const date = new Date(time);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
  }
  return time;
}

function getISTDate(): string {
  return new Date().toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function buildWhatsAppUrl(phone: string, name: string): string {
  const message = encodeURIComponent(
    `Namaste ${name}! Please provide a trip status update.`
  );
  const cleanPhone = phone.replace(/\s+/g, "").replace("+", "");
  return `https://wa.me/${cleanPhone}?text=${message}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ProgressBar({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <GlassCard padding="lg" className="border-white/8">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
          {completed} of {total} completed
        </span>
        <span className="text-sm font-black text-emerald-500">
          {percentage}%
        </span>
      </div>
      <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="h-full bg-emerald-500 rounded-full"
        />
      </div>
    </GlassCard>
  );
}

function EventCard({
  event,
  index,
  isLast,
}: {
  event: ScheduleEvent;
  index: number;
  isLast: boolean;
}) {
  const cfg = STATUS_CONFIG[event.status];
  const StatusIcon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
      className={cn("relative flex gap-4", cfg.faded && "opacity-60")}
    >
      {/* Timeline column */}
      <div className="flex flex-col items-center shrink-0 w-20">
        {/* Time badge */}
        <div
          className={cn(
            "px-2.5 py-1.5 rounded-lg text-xs font-black whitespace-nowrap",
            cfg.badgeBg,
            cfg.badgeText
          )}
        >
          {formatTime(event.time)}
        </div>

        {/* Dot */}
        <div className="relative mt-2">
          {cfg.pulse && (
            <span
              className={cn(
                "absolute inset-0 rounded-full animate-ping opacity-75",
                cfg.dotColor
              )}
            />
          )}
          <span
            className={cn("relative block w-3 h-3 rounded-full", cfg.dotColor)}
          />
        </div>

        {/* Connecting line */}
        {!isLast && (
          <div className={cn("w-0.5 flex-1 mt-2 min-h-[24px]", cfg.lineColor)} />
        )}
      </div>

      {/* Card */}
      <div className="flex-1 pb-6">
        <div
          className={cn(
            "relative rounded-xl border p-4 bg-white/4 transition-all",
            cfg.cardAccent,
            event.status === "active" && "shadow-lg shadow-blue-500/10",
            event.status === "alert" && "shadow-lg shadow-amber-500/10"
          )}
        >
          {/* Status badge - top right */}
          <div
            className={cn(
              "absolute top-3 right-3 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
              cfg.badgeBg,
              cfg.badgeText
            )}
          >
            {cfg.label}
          </div>

          {/* Pulse dot for active/alert */}
          {cfg.pulse && (
            <span className="absolute top-3 right-[calc(0.75rem+var(--badge-w,60px))] flex h-2.5 w-2.5 sr-only">
              {/* Handled by status badge */}
            </span>
          )}

          {/* Title */}
          <h3 className="text-base font-bold text-slate-900 dark:text-white pr-20 leading-tight">
            {event.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <p className="text-xs text-slate-500 font-medium truncate">
              {event.location}
            </p>
          </div>

          {/* Client + Pax */}
          <div className="flex items-center gap-2 mt-3">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                {event.clientName}
              </p>
              {event.passengerCount !== null && (
                <p className="text-[11px] text-slate-400">
                  {event.passengerCount} passenger
                  {event.passengerCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            {/* Client contact buttons */}
            {event.clientPhone && (
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={`tel:${event.clientPhone}`}
                  title="Call Client"
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 hover:bg-blue-500/25 text-blue-400 transition-all"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
                <a
                  href={buildWhatsAppUrl(event.clientPhone, event.clientName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`WhatsApp ${event.clientName}`}
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/25 text-[#25D366] transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Driver row */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
            <StatusIcon
              className={cn("w-4 h-4 shrink-0", cfg.badgeText)}
            />
            {event.driverName ? (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 truncate">
                    {event.driverName}
                  </p>
                  {event.driverVehicle && (
                    <p className="text-[11px] text-slate-400 truncate">
                      {event.driverVehicle}
                    </p>
                  )}
                </div>
                {event.driverPhone && (
                  <a
                    href={buildWhatsAppUrl(
                      event.driverPhone,
                      event.driverName
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`WhatsApp ${event.driverName}`}
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/25 text-[#25D366] transition-all shrink-0"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                )}
              </>
            ) : (
              <p className="text-sm font-bold text-amber-500 flex-1">
                Driver unassigned
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center shrink-0 w-20">
            <GlassSkeleton className="h-8 w-16 rounded-lg" />
            <GlassSkeleton
              variant="circular"
              className="w-3 h-3 mt-2"
            />
            {i < 3 && <GlassSkeleton className="w-0.5 flex-1 mt-2 min-h-[24px]" />}
          </div>
          <div className="flex-1 pb-6">
            <GlassSkeleton className="h-40 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-500/10 flex items-center justify-center mb-4">
        <CalendarX className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
        Clear schedule today!
      </p>
      <p className="text-sm text-slate-500 mt-2">
        New bookings will appear automatically.
      </p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function SchedulePage() {
  const { data, isLoading } = useDashboardSchedule();

  const events = data?.events ?? [];
  const completedCount = data?.completedCount ?? 0;
  const istDate = getISTDate();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Clock className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Today&apos;s Schedule
          </h1>
        </div>
        <p className="text-sm text-slate-500 ml-8">{istDate} IST</p>
        <p className="text-sm text-slate-400 mt-1 ml-8">
          Full timeline of today&apos;s trips and events
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {/* Skeleton progress bar */}
          <GlassCard padding="lg" className="border-white/8">
            <div className="flex items-center justify-between mb-3">
              <GlassSkeleton className="h-4 w-32" />
              <GlassSkeleton className="h-4 w-10" />
            </div>
            <GlassSkeleton className="h-2.5 w-full rounded-full" />
          </GlassCard>
          <TimelineSkeleton />
        </div>
      ) : events.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {/* Progress bar */}
          <ProgressBar completed={completedCount} total={events.length} />

          {/* Vertical timeline */}
          <div>
            {events.map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                index={index}
                isLast={index === events.length - 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
