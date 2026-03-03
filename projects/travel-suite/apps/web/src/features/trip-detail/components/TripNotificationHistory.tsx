"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { GlassButton } from "@/components/glass/GlassButton";
import { cn } from "@/lib/utils";
import type { TripNotificationEntry } from "@/features/trip-detail/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TripNotificationHistoryProps {
  notifications: TripNotificationEntry[];
  loading: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const INITIAL_DISPLAY_COUNT = 20;

function statusDotColor(status: string | null): string {
  switch (status) {
    case "sent":
      return "bg-emerald-500";
    case "pending":
      return "bg-amber-400";
    case "processing":
      return "bg-blue-400";
    case "failed":
      return "bg-rose-500";
    default:
      return "bg-gray-400";
  }
}

function statusBadgeVariant(
  status: string | null,
): "success" | "warning" | "info" | "danger" | "default" {
  switch (status) {
    case "sent":
      return "success";
    case "pending":
      return "warning";
    case "processing":
      return "info";
    case "failed":
      return "danger";
    default:
      return "default";
  }
}

function formatNotificationType(raw: string): string {
  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTimestamp(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TripNotificationHistory({
  notifications,
  loading,
}: TripNotificationHistoryProps) {
  const [showAll, setShowAll] = useState(false);

  const displayedNotifications = showAll
    ? notifications
    : notifications.slice(0, INITIAL_DISPLAY_COUNT);

  const hasMore = notifications.length > INITIAL_DISPLAY_COUNT;

  return (
    <GlassCard padding="xl">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-5">
        <Bell className="w-4 h-4 text-primary" />
        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
          Notification History
        </span>
      </div>

      {/* Loading state */}
      {loading && (
        <p className="text-sm text-text-muted animate-pulse">
          Loading notifications...
        </p>
      )}

      {/* Empty state */}
      {!loading && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Bell className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-400">
            No notifications sent yet
          </p>
        </div>
      )}

      {/* Timeline */}
      {!loading && notifications.length > 0 && (
        <div className="relative space-y-5 pl-6">
          {/* Vertical line */}
          <div className="absolute left-[7px] top-1 bottom-1 w-px bg-gray-200 dark:bg-slate-700" />

          {displayedNotifications.map((entry) => (
            <div key={`${entry.source}-${entry.id}`} className="relative flex items-start gap-4">
              {/* Status dot */}
              <div
                className={cn(
                  "absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900",
                  statusDotColor(entry.status),
                )}
              />

              {/* Content */}
              <div className="min-w-0 flex-1">
                {/* Top row: type badge + status badge */}
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <GlassBadge variant="info" size="sm">
                    {formatNotificationType(entry.notification_type)}
                  </GlassBadge>
                  {entry.status && (
                    <GlassBadge variant={statusBadgeVariant(entry.status)} size="sm">
                      {entry.status}
                    </GlassBadge>
                  )}
                  {entry.source === "queue" && (
                    <GlassBadge variant="secondary" size="sm">
                      queued
                    </GlassBadge>
                  )}
                </div>

                {/* Title / body */}
                {(entry.title || entry.body) && (
                  <p className="text-sm font-bold text-secondary dark:text-slate-300 truncate">
                    {entry.title || entry.body}
                  </p>
                )}

                {/* Timestamp + channel */}
                <div className="flex items-center gap-2 mt-0.5">
                  {entry.created_at && (
                    <span className="text-[10px] text-text-muted">
                      {formatTimestamp(entry.created_at)}
                    </span>
                  )}
                  {entry.channel && (
                    <span className="text-[10px] text-text-muted">
                      via {entry.channel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show more / less */}
      {!loading && hasMore && (
        <div className="mt-4 text-center">
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => setShowAll((prev) => !prev)}
          >
            {showAll ? "Show less" : `Show all ${notifications.length} notifications`}
          </GlassButton>
        </div>
      )}
    </GlassCard>
  );
}
