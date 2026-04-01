"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassModal } from "@/components/glass/GlassModal";
import { useToast } from "@/components/ui/toast";
import {
  formatBlockedRange,
  toDateInputValue,
  type OperatorUnavailability,
} from "./availability";
import { authedFetch } from "@/lib/api/authed-fetch";

interface BlockDatesModalProps {
  isOpen: boolean;
  blockedSlots: OperatorUnavailability[];
  initialDate: Date;
  onClose: () => void;
  onChanged: () => Promise<void> | void;
}

export function BlockDatesModal({
  isOpen,
  blockedSlots,
  initialDate,
  onClose,
  onChanged,
}: BlockDatesModalProps) {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState(() => toDateInputValue(initialDate));
  const [endDate, setEndDate] = useState(() => toDateInputValue(initialDate));
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sortedSlots = useMemo(
    () =>
      [...blockedSlots].sort((left, right) =>
        right.startDate.localeCompare(left.startDate),
      ),
    [blockedSlots],
  );

  useEffect(() => {
    if (!isOpen) return;
    const nextDate = toDateInputValue(initialDate);
    setStartDate(nextDate);
    setEndDate(nextDate);
    setReason("");
  }, [initialDate, isOpen]);

  async function handleSave() {
    if (!startDate || !endDate) {
      toast({
        title: "Select a date range",
        description: "Start and end dates are required.",
        variant: "warning",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await authedFetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate,
          reason: reason.trim() || undefined,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to block dates");
      }

      toast({
        title: "Dates blocked",
        description: "The selected dates now show as unavailable in your calendar.",
        variant: "success",
      });
      await onChanged();
      onClose();
    } catch (error) {
      toast({
        title: "Could not block dates",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const response = await authedFetch(`/api/availability?id=${id}`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to unblock dates");
      }

      toast({
        title: "Dates unblocked",
        description: "The unavailable range was removed.",
        variant: "success",
      });
      await onChanged();
    } catch (error) {
      toast({
        title: "Could not unblock dates",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Block Dates"
      description="Mark periods when you or your team are unavailable for new trips."
      size="lg"
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="availability-start-date"
              className="text-sm font-medium text-text-secondary"
            >
              Start date
            </label>
            <input
              id="availability-start-date"
              type="date"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value);
                if (endDate < event.target.value) {
                  setEndDate(event.target.value);
                }
              }}
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="availability-end-date"
              className="text-sm font-medium text-text-secondary"
            >
              End date
            </label>
            <input
              id="availability-end-date"
              type="date"
              min={startDate}
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="availability-reason"
            className="text-sm font-medium text-text-secondary"
          >
            Reason (optional)
          </label>
          <textarea
            id="availability-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            placeholder="Leave a note like annual leave, site visit, or blackout period."
            className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <GlassButton variant="ghost" onClick={onClose}>
            Cancel
          </GlassButton>
          <GlassButton onClick={handleSave} loading={saving}>
            Save blocked dates
          </GlassButton>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-secondary dark:text-white">
              Existing unavailable periods
            </h3>
            <span className="text-xs text-text-secondary">
              {sortedSlots.length} total
            </span>
          </div>

          {sortedSlots.length === 0 ? (
            <GlassCard padding="md" className="border border-white/10">
              <p className="text-sm text-text-secondary">
                No blocked dates yet. Use this to avoid quoting trips when your
                team is unavailable.
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {sortedSlots.map((slot) => (
                <GlassCard
                  key={slot.id}
                  padding="md"
                  className="border border-white/10 bg-white/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-secondary dark:text-white">
                        {formatBlockedRange(slot)}
                      </p>
                      <p className="text-xs text-text-secondary">
                        Added{" "}
                        {new Intl.DateTimeFormat("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }).format(new Date(slot.createdAt || slot.startDate))}
                      </p>
                    </div>
                    <GlassButton
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(slot.id)}
                      loading={deletingId === slot.id}
                    >
                      {deletingId === slot.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Remove
                    </GlassButton>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </GlassModal>
  );
}
