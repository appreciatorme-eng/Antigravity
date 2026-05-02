"use client";

import dynamic from "next/dynamic";
import {
  Shield,
  Zap,
  Navigation,
  Bell,
  ArrowUpRight,
  Trash,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { GlassButton } from "@/components/glass/GlassButton";
import { cn } from "@/lib/utils";
import type {
  Trip,
  Day,
  ReminderDayStatus,
  DriverLocationSnapshot,
} from "@/features/trip-detail/types";

// Lazy-load Leaflet map (SSR-incompatible)
const ItineraryMap = dynamic(
  () => import("@/components/map/ItineraryMap"),
  { ssr: false },
);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TripStatusSidebarProps {
  trip: Trip;
  itineraryDays: Day[];
  activeDay: number;
  reminderStatusByDay: Record<number, ReminderDayStatus>;
  latestDriverLocation: DriverLocationSnapshot | null;
  onDeleteTrip: () => void;
  deletingTrip: boolean;
}

// ---------------------------------------------------------------------------
// Status row data
// ---------------------------------------------------------------------------

interface StatusRow {
  label: string;
  status: string;
  color: string;
  icon: typeof Shield;
}

function buildStatusRows(
  latestDriverLocation: DriverLocationSnapshot | null,
  reminderSentCount: number,
): readonly StatusRow[] {
  return [
    {
      label: "Identity Verified",
      status: "Secured",
      color: "text-emerald-500",
      icon: Shield,
    },
    {
      label: "Sync Status",
      status: "Periodic",
      color: "text-blue-500",
      icon: Zap,
    },
    {
      label: "Driver Location",
      status: latestDriverLocation ? "Active" : "Awaiting",
      color: latestDriverLocation ? "text-emerald-500" : "text-amber-500",
      icon: Navigation,
    },
    {
      label: "Reminder Queue",
      status: `${reminderSentCount} Sent`,
      color: "text-primary",
      icon: Bell,
    },
  ] as const;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TripStatusSidebar({
  trip,
  itineraryDays,
  activeDay,
  reminderStatusByDay,
  latestDriverLocation,
  onDeleteTrip,
  deletingTrip,
}: TripStatusSidebarProps) {
  const activeDayReminders = reminderStatusByDay[activeDay];
  const reminderSentCount = activeDayReminders?.sent ?? 0;
  const statusRows = buildStatusRows(latestDriverLocation, reminderSentCount);

  return (
    <div className="space-y-6">
      {/* ── Route Map ─────────────────────────────────────────────── */}
      <GlassCard padding="none" className="overflow-hidden">
        <div className="relative h-[400px]">
          <ItineraryMap
            days={itineraryDays}
            accommodations={trip.itineraries?.raw_data?.accommodations ?? []}
            activeDay={activeDay}
            destination={trip.destination}
            driverLocation={latestDriverLocation ?? undefined}
            className="h-full w-full"
          />

          {/* Map View badge overlay */}
          <div className="absolute top-3 left-3 z-[1000] pointer-events-none">
            <GlassBadge variant="info" size="sm">
              Map View
            </GlassBadge>
          </div>
        </div>
      </GlassCard>

      {/* ── Trip Status ───────────────────────────────────────────── */}
      <GlassCard padding="xl">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
            Trip Status
          </span>
        </div>

        <div className="space-y-4">
          {statusRows.map((row) => {
            const Icon = row.icon;
            return (
              <div
                key={row.label}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn("w-4 h-4", row.color)} />
                  <span className="text-sm font-medium text-secondary dark:text-slate-300">
                    {row.label}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    row.color,
                  )}
                >
                  {row.status}
                </span>
              </div>
            );
          })}
        </div>

        {/* Trip reference */}
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-slate-700">
          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
            Reference
          </p>
          <p className="text-sm font-bold text-secondary dark:text-slate-300 mt-1 font-mono">
            {trip.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </GlassCard>

      {/* ── External Actions ──────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <GlassButton variant="outline" fullWidth>
          <ArrowUpRight className="w-4 h-4" />
          Export Report
        </GlassButton>

        <GlassButton
          onClick={onDeleteTrip}
          disabled={deletingTrip}
          variant="outline"
          fullWidth
          className="border-rose-300 text-rose-600 hover:bg-rose-500 hover:text-white hover:border-rose-500"
        >
          <Trash className="w-4 h-4" />
          {deletingTrip ? "Deleting..." : "Delete Trip"}
        </GlassButton>
      </div>
    </div>
  );
}
