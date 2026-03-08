"use client";

import { useMemo, useState } from "react";
import { Calendar, Clock, FileText, Instagram, Send, Share2 } from "lucide-react";
import { toast } from "sonner";

import { GlassBadge } from "@/components/glass/GlassBadge";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassModal } from "@/components/glass/GlassModal";
import type { SocialTemplate, TemplateDataForRender } from "@/lib/social/types";

interface CanvasPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: SocialTemplate;
  templateData: TemplateDataForRender;
  connections: { instagram: boolean; facebook: boolean };
}

type ReviewMode = "now" | "schedule";

function buildDefaultCaption(templateData: TemplateDataForRender): string {
  const destination = templateData.destination || "your next departure";
  const offer = templateData.offer?.trim();
  const price = templateData.price?.trim();
  const company = templateData.companyName?.trim();
  const website = templateData.website?.trim();
  const lines = [
    `${destination} is now open for bookings.`,
    offer ? offer : null,
    price ? `Packages from ${price}.` : null,
    company ? `Planned by ${company}.` : null,
    website ? `More details: ${website}` : null,
  ].filter(Boolean);

  return lines.join("\n\n");
}

export function CanvasPublishModal({
  isOpen,
  onClose,
  template,
  templateData,
  connections,
}: CanvasPublishModalProps) {
  const [reviewMode, setReviewMode] = useState<ReviewMode>("now");
  const [caption, setCaption] = useState(() => buildDefaultCaption(templateData));
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    instagram: connections.instagram,
    facebook: false,
  });
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [submitting, setSubmitting] = useState(false);

  const selectedPlatformList = useMemo(
    () =>
      Object.entries(selectedPlatforms)
        .filter(([, enabled]) => enabled)
        .map(([platform]) => platform),
    [selectedPlatforms]
  );

  const hasConnectedPlatform =
    (selectedPlatforms.instagram && connections.instagram) ||
    (selectedPlatforms.facebook && connections.facebook);

  const handleSubmit = async () => {
    if (!hasConnectedPlatform) {
      toast.error("Connect at least one social platform before submitting for review.");
      return;
    }

    if (reviewMode === "schedule" && !scheduledDate) {
      toast.error("Choose a review date before scheduling.");
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = reviewMode === "schedule" ? "/api/social/schedule" : "/api/social/publish";
      const scheduledFor =
        reviewMode === "schedule"
          ? new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString()
          : undefined;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template.id,
          templateData,
          caption,
          platforms: selectedPlatformList,
          scheduledFor,
          reviewWorkflow: "pending_review",
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof payload?.error === "string" ? payload.error : "Failed to submit content for review."
        );
      }

      toast.success(
        reviewMode === "schedule"
          ? "Scheduled for review. The team will publish it after approval."
          : "Submitted for review. You will be notified when it is approved."
      );
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit content for review."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="Review and queue this post"
      description="Nothing is published instantly here. This flow submits the creative for manual review or schedules that review."
    >
      <div className="space-y-5">
        <GlassCard padding="lg" className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {template.name}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                Review-ready asset for {templateData.destination || "your campaign"}.
              </p>
            </div>
            <GlassBadge variant="info" icon={FileText}>
              Manual review workflow
            </GlassBadge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setReviewMode("now")}
              className={`rounded-2xl border p-4 text-left transition ${
                reviewMode === "now"
                  ? "border-blue-300 bg-blue-50/80 dark:border-blue-700 dark:bg-blue-950/40"
                  : "border-white/40 bg-white/40 dark:border-white/10 dark:bg-slate-900/40"
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Send className="h-4 w-4" />
                Submit now
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-300">
                Queue this creative for immediate internal review. It stays unpublished until someone approves it.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setReviewMode("schedule")}
              className={`rounded-2xl border p-4 text-left transition ${
                reviewMode === "schedule"
                  ? "border-blue-300 bg-blue-50/80 dark:border-blue-700 dark:bg-blue-950/40"
                  : "border-white/40 bg-white/40 dark:border-white/10 dark:bg-slate-900/40"
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Calendar className="h-4 w-4" />
                Schedule review
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-300">
                Put this into the review queue for a future time instead of sending it right away.
              </p>
            </button>
          </div>
        </GlassCard>

        <GlassCard padding="lg" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Platforms</p>
              <p className="text-xs text-slate-500 dark:text-slate-300">
                Only connected channels can be queued for review.
              </p>
            </div>
            {!hasConnectedPlatform && (
              <GlassBadge variant="warning">No connected platform selected</GlassBadge>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { key: "instagram", label: "Instagram", connected: connections.instagram, icon: Instagram },
              { key: "facebook", label: "Facebook", connected: connections.facebook, icon: Share2 },
            ].map(({ key, label, connected, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() =>
                  connected &&
                  setSelectedPlatforms((current) => ({
                    ...current,
                    [key]: !current[key as keyof typeof current],
                  }))
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  selectedPlatforms[key as keyof typeof selectedPlatforms]
                    ? "border-emerald-300 bg-emerald-50/80 dark:border-emerald-700 dark:bg-emerald-950/40"
                    : "border-white/40 bg-white/40 dark:border-white/10 dark:bg-slate-900/40"
                } ${!connected ? "cursor-not-allowed opacity-60" : ""}`}
                disabled={!connected}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <Icon className="h-4 w-4" />
                    {label}
                  </div>
                  <GlassBadge variant={connected ? "success" : "warning"} size="sm">
                    {connected ? "Connected" : "Not connected"}
                  </GlassBadge>
                </div>
              </button>
            ))}
          </div>
        </GlassCard>

        {reviewMode === "schedule" && (
          <GlassCard padding="lg" className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Calendar className="h-4 w-4" />
                Review date
              </span>
              <input
                type="date"
                value={scheduledDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(event) => setScheduledDate(event.target.value)}
                className="w-full rounded-2xl border border-white/40 bg-white/50 px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-blue-300 dark:border-white/10 dark:bg-slate-900/40 dark:text-white"
              />
            </label>
            <label className="space-y-2">
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Clock className="h-4 w-4" />
                Review time
              </span>
              <input
                type="time"
                value={scheduledTime}
                onChange={(event) => setScheduledTime(event.target.value)}
                className="w-full rounded-2xl border border-white/40 bg-white/50 px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-blue-300 dark:border-white/10 dark:bg-slate-900/40 dark:text-white"
              />
            </label>
          </GlassCard>
        )}

        <GlassCard padding="lg" className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Caption for review</p>
            <p className="text-xs text-slate-500 dark:text-slate-300">
              This copy travels with the review request and can be edited later before posting.
            </p>
          </div>
          <textarea
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            rows={7}
            className="w-full rounded-2xl border border-white/40 bg-white/50 px-4 py-3 text-sm leading-relaxed text-slate-900 outline-none transition focus:border-blue-300 dark:border-white/10 dark:bg-slate-900/40 dark:text-white"
          />
        </GlassCard>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <GlassButton variant="ghost" onClick={onClose}>
            Cancel
          </GlassButton>
          <GlassButton
            variant="primary"
            onClick={handleSubmit}
            loading={submitting}
            disabled={!selectedPlatformList.length}
          >
            {!submitting && reviewMode === "schedule" ? <Calendar className="h-4 w-4" /> : null}
            {!submitting && reviewMode === "now" ? <Send className="h-4 w-4" /> : null}
            {submitting ? (
              "Submitting"
            ) : reviewMode === "schedule" ? (
              "Schedule review"
            ) : (
              "Submit for review"
            )}
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
}
