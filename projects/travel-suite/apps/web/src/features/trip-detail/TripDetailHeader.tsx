"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  CopyPlus,
  Share2,
  Zap,
  Bell,
  Save,
} from "lucide-react";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassBadge } from "@/components/glass/GlassBadge";
import type { Trip } from "@/features/trip-detail/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TripDetailHeaderProps {
  trip: Trip;
  onSave: () => void;
  saving: boolean;
  onDuplicate: () => void;
  duplicating: boolean;
  onNotify: () => void;
  onShare: () => void;
  onOptimizeRoute: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatHeaderDate(value: string | null): string {
  if (!value) return "TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function computeDurationLabel(trip: Trip): string {
  const durationDays = trip.itineraries?.duration_days;
  if (durationDays && durationDays > 0) {
    return `${durationDays} Day${durationDays > 1 ? "s" : ""}`;
  }

  if (trip.start_date && trip.end_date) {
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      const diffMs = end.getTime() - start.getTime();
      const days = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
      return `${days} Day${days > 1 ? "s" : ""}`;
    }
  }

  return "Duration TBD";
}

function renderStatusBadge(status: string) {
  switch (status) {
    case "confirmed":
      return <GlassBadge variant="success">Confirmed</GlassBadge>;
    case "pending":
      return <GlassBadge variant="warning">Awaiting Activation</GlassBadge>;
    default:
      return (
        <GlassBadge variant="secondary">
          {status.toUpperCase() || "DRAFT"}
        </GlassBadge>
      );
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TripDetailHeader({
  trip,
  onSave,
  saving,
  onDuplicate,
  duplicating,
  onNotify,
  onShare,
  onOptimizeRoute,
}: TripDetailHeaderProps) {
  const title =
    trip.itineraries?.trip_title || trip.destination || "Untitled Trip";
  const clientName = trip.profiles?.full_name ?? "Unassigned";
  const startDateLabel = formatHeaderDate(trip.start_date);
  const durationLabel = computeDurationLabel(trip);

  return (
    <header className="space-y-4 md:space-y-6">
      {/* Back link */}
      <Link
        href="/trips"
        className="text-xs font-black uppercase tracking-widest text-text-muted hover:text-primary inline-flex items-center gap-2 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        All Trips
      </Link>

      {/* Title row */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <h1 className="text-2xl md:text-5xl font-serif text-secondary dark:text-white tracking-tight">
              {title}
            </h1>
            {renderStatusBadge(trip.status)}
          </div>

          {/* Metadata chips */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 md:px-4 py-1.5 md:py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg md:rounded-xl border border-gray-100 dark:border-slate-800 text-xs md:text-sm text-secondary dark:text-slate-300">
              <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-text-muted" />
              {clientName}
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 md:px-4 py-1.5 md:py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg md:rounded-xl border border-gray-100 dark:border-slate-800 text-xs md:text-sm text-secondary dark:text-slate-300">
              <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-text-muted" />
              {startDateLabel}
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 md:px-4 py-1.5 md:py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg md:rounded-xl border border-gray-100 dark:border-slate-800 text-xs md:text-sm text-secondary dark:text-slate-300">
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-text-muted" />
              {durationLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons — icon-only on mobile, full labels on desktop */}
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        <GlassButton
          variant="outline"
          className="h-10 md:h-14 px-3 md:px-6 rounded-xl md:rounded-2xl hover:shadow-md"
          onClick={onDuplicate}
          loading={duplicating}
        >
          <CopyPlus className="w-4 h-4" />
          <span className="hidden md:inline">Duplicate Trip</span>
        </GlassButton>

        <GlassButton
          variant="outline"
          className="h-10 md:h-14 px-3 md:px-6 rounded-xl md:rounded-2xl hover:shadow-md"
          onClick={onShare}
          data-tour="share-trip-btn"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden md:inline">Share Trip</span>
        </GlassButton>

        <GlassButton
          variant="outline"
          className="h-10 md:h-14 px-3 md:px-6 rounded-xl md:rounded-2xl hover:shadow-md"
          onClick={onOptimizeRoute}
        >
          <Zap className="w-4 h-4" />
          <span className="hidden md:inline">AI Optimize Route</span>
        </GlassButton>

        <GlassButton
          variant="outline"
          className="h-10 md:h-14 px-3 md:px-6 rounded-xl md:rounded-2xl hover:shadow-md border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white dark:border-amber-400 dark:text-amber-400"
          onClick={onNotify}
          data-tour="notify-client-btn"
        >
          <Bell className="w-4 h-4" />
          <span className="hidden md:inline">Notify Client</span>
        </GlassButton>

        <GlassButton
          variant="primary"
          className="h-10 md:h-14 px-3 md:px-6 rounded-xl md:rounded-2xl hover:shadow-lg"
          onClick={onSave}
          loading={saving}
          data-tour="save-changes-btn"
        >
          <Save className="w-4 h-4" />
          <span className="hidden md:inline">Save Changes</span>
        </GlassButton>
      </div>
    </header>
  );
}
