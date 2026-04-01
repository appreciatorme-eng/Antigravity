"use client";

import { useState, useCallback } from "react";
import { GlassModal } from "@/components/glass/GlassModal";
import { GlassButton } from "@/components/glass/GlassButton";
import { useToast } from "@/components/ui/toast";
import { authedFetch } from "@/lib/api/authed-fetch";
import { Info, Sparkles } from "lucide-react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PublishTemplateModalProps {
  itineraryId: string;
  tripTitle?: string;
  onClose: () => void;
  onPublishSuccess?: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const THEME_OPTIONS = [
  { value: "general", label: "General" },
  { value: "adventure", label: "Adventure" },
  { value: "cultural", label: "Cultural" },
  { value: "honeymoon", label: "Honeymoon" },
  { value: "family", label: "Family" },
] as const;

const INPUT_CLASS =
  "w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-colors";

const LABEL_CLASS =
  "block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5";

// ---------------------------------------------------------------------------
// Form State
// ---------------------------------------------------------------------------

interface FormState {
  title: string;
  description: string;
  theme: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PublishTemplateModal({
  itineraryId,
  tripTitle,
  onClose,
  onPublishSuccess,
}: PublishTemplateModalProps) {
  const { toast } = useToast();
  const [publishing, setPublishing] = useState(false);
  const [form, setForm] = useState<FormState>({
    title: tripTitle || "",
    description: "",
    theme: "general",
  });

  // Immutable field updater
  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handlePublish = useCallback(async () => {
    if (!form.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your template.",
        variant: "error",
      });
      return;
    }

    setPublishing(true);
    try {
      const response = await authedFetch("/api/admin/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itinerary_id: itineraryId,
          title: form.title.trim(),
          description: form.description.trim() || null,
          theme: form.theme,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle quality gate error specifically
        if (result.code === "QUALITY_GATE_NOT_MET") {
          toast({
            title: "Quality gate not met",
            description: result.error || "This itinerary must have at least 1 completed trip before publishing as a template.",
            variant: "error",
          });
        } else {
          toast({
            title: "Publish failed",
            description: result.error || "Failed to publish template. Please try again.",
            variant: "error",
          });
        }
        return;
      }

      toast({
        title: "Template published!",
        description: "Your itinerary has been published to the template library.",
        variant: "success",
      });

      onPublishSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error publishing template:", error);
      toast({
        title: "Publish failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "error",
      });
    } finally {
      setPublishing(false);
    }
  }, [form, itineraryId, toast, onClose, onPublishSuccess]);

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const isTitleEmpty = form.title.trim() === "";
  const isPublishDisabled = isTitleEmpty || publishing;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <GlassModal
      isOpen
      onClose={onClose}
      title="Publish as Template"
      size="md"
    >
      <div className="space-y-5">
        {/* Info Banner */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">Share your itinerary with the community</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Your template will be anonymized and shared with other operators.
              Earn contributor badges by publishing quality templates!
            </p>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className={LABEL_CLASS}>
            Template Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="e.g., Goa Beach Paradise 5-Day"
            className={INPUT_CLASS}
            autoFocus
            maxLength={100}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Choose a descriptive title that helps others discover your template
          </p>
        </div>

        {/* Theme */}
        <div>
          <label className={LABEL_CLASS}>Theme</label>
          <select
            value={form.theme}
            onChange={(e) => updateField("theme", e.target.value)}
            className={INPUT_CLASS}
          >
            {THEME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Categorize your itinerary by its primary theme
          </p>
        </div>

        {/* Description */}
        <div>
          <label className={LABEL_CLASS}>
            Description{" "}
            <span className="text-slate-400 font-normal normal-case">
              (optional)
            </span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Describe what makes this itinerary special, key highlights, and who it's perfect for..."
            rows={4}
            className={INPUT_CLASS}
            maxLength={500}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {form.description.length}/500 characters
          </p>
        </div>

        {/* Quality Gate Info */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
          <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-purple-700 dark:text-purple-300">
            <p className="font-medium mb-1">Quality Gate</p>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              Only itineraries with at least 1 completed trip can be published as templates.
              This ensures the community gets field-tested, proven itineraries.
            </p>
          </div>
        </div>

        {/* Footer: Cancel + Publish */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
          <GlassButton
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={publishing}
          >
            Cancel
          </GlassButton>
          <GlassButton
            variant="primary"
            size="md"
            disabled={isPublishDisabled}
            loading={publishing}
            onClick={handlePublish}
          >
            {publishing ? "Publishing..." : "Publish Template"}
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
}
