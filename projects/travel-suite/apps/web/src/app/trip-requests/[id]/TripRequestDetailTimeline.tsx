"use client";

import { useState } from "react";
import { AlertTriangle, Clock3, Loader2 } from "lucide-react";
import { authedFetch } from "@/lib/api/authed-fetch";
import { useToast } from "@/components/ui/toast";
import type { OperatorTripRequestListItem } from "@/lib/whatsapp/trip-intake.server";
import { cn } from "@/lib/utils";

type ActionType = "regenerate_itinerary" | "resend_operator" | "resend_client" | "retry_request";

type TimelineEntry = {
  label: string;
  value: string;
  tone: string;
  action?: ActionType;
  actionLabel?: string;
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function toTimestamp(value: string | null): number {
  if (!value) return 0;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function getRecoveryForAction(
  entry: OperatorTripRequestListItem["actionHistory"][number],
): { action: ActionType; label: string } | null {
  if (entry.tone !== "error") return null;
  if (entry.action === "retry_request") {
    return { action: "retry_request", label: "Retry now" };
  }
  if (entry.action === "regenerate_itinerary") {
    return { action: "regenerate_itinerary", label: "Regenerate" };
  }
  if (entry.action === "resend_operator") {
    return { action: "resend_operator", label: "Resend operator" };
  }
  if (entry.action === "resend_client") {
    return { action: "resend_client", label: "Resend traveller" };
  }
  return null;
}

function getTimelineEvents(item: OperatorTripRequestListItem): TimelineEntry[] {
  const events: TimelineEntry[] = [];

  if (item.submittedAt) {
    events.push({ label: "Submitted", value: item.submittedAt, tone: "bg-slate-500" });
  }
  if (item.lastItineraryRegeneratedAt) {
    events.push({ label: "Regenerated", value: item.lastItineraryRegeneratedAt, tone: "bg-fuchsia-500" });
  }
  if (item.completionDeliveredAt) {
    events.push({ label: "Trip ready", value: item.completionDeliveredAt, tone: "bg-emerald-500" });
  }
  if (item.lastOperatorResentAt) {
    events.push({ label: "Resent to operator", value: item.lastOperatorResentAt, tone: "bg-sky-500" });
  }
  if (item.lastClientResentAt) {
    events.push({ label: "Resent to traveller", value: item.lastClientResentAt, tone: "bg-amber-500" });
  }

  for (const entry of item.actionHistory) {
    const recovery = getRecoveryForAction(entry);
    events.push({
      label: entry.title,
      value: entry.occurredAt,
      tone: entry.tone === "info" ? "bg-sky-500" : entry.tone === "error" ? "bg-rose-500" : "bg-emerald-500",
      action: recovery?.action,
      actionLabel: recovery?.label,
    });
  }

  return events
    .sort((left, right) => toTimestamp(left.value) - toTimestamp(right.value))
    .filter((event, index, array) =>
      index === array.findIndex((candidate) => candidate.label === event.label && candidate.value === event.value));
}

export function TripRequestDetailTimeline({
  request,
}: {
  request: OperatorTripRequestListItem;
}) {
  const { toast } = useToast();
  const [runningAction, setRunningAction] = useState<ActionType | null>(null);
  const events = getTimelineEvents(request);

  async function runAction(action: ActionType) {
    setRunningAction(action);
    try {
      const response = await authedFetch(`/api/trip-requests/${request.id}/actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const payload = await response.json() as {
        data?: { message?: string } | null;
        error?: string | null;
      };

      if (!response.ok || payload.error) {
        throw new Error(payload.error || "Action failed");
      }

      toast({
        title: "Request updated",
        description: payload.data?.message ?? "Action completed.",
        variant: "success",
      });
      window.location.reload();
    } catch (error) {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setRunningAction(null);
    }
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-muted-foreground">
        <Clock3 className="h-4 w-4" />
        Activity timeline
      </div>
      {events.length > 0 ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {events.map((event) => (
            <div
              key={`${event.label}-${event.value}`}
              className="rounded-2xl border border-border bg-muted/20 px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", event.tone)} />
                <span className="text-sm font-semibold text-foreground">{event.label}</span>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{formatDateTime(event.value)}</div>
              {event.action && event.actionLabel ? (
                <button
                  type="button"
                  onClick={() => void runAction(event.action!)}
                  disabled={runningAction !== null}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-rose-700 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-300"
                >
                  {runningAction === event.action ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  {event.actionLabel}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4" />
          No retry or resend history yet for this request.
        </div>
      )}
    </div>
  );
}
