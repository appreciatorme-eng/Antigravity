"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Download, Eye, FileText, Loader2, Save } from "lucide-react";

import { GlassButton } from "@/components/glass/GlassButton";
import { GlassModal } from "@/components/glass/GlassModal";
import type { TripDetailPayload } from "@/features/trip-detail/types";
import { cn } from "@/lib/utils";
import {
  ITINERARY_PRINT_TEMPLATE_META,
  ITINERARY_TEMPLATE_OPTIONS,
  type ItineraryTemplateId,
} from "./itinerary-types";
import { generateTripItineraryPdfBlob } from "./trip-itinerary-pdf";

interface TripPdfTemplatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripPayload: TripDetailPayload;
  selectedTemplateId: ItineraryTemplateId;
  onSaveTemplate: (templateId: ItineraryTemplateId) => Promise<void>;
}

export function TripPdfTemplatePicker({
  isOpen,
  onClose,
  tripId,
  tripPayload,
  selectedTemplateId,
  onSaveTemplate,
}: TripPdfTemplatePickerProps) {
  const [draftTemplateId, setDraftTemplateId] = useState<ItineraryTemplateId>(selectedTemplateId);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewRequestRef = useRef(0);

  const selectedMeta = useMemo(
    () => ITINERARY_PRINT_TEMPLATE_META[draftTemplateId],
    [draftTemplateId],
  );

  const generatePreview = useCallback(async (templateId: ItineraryTemplateId) => {
    const requestId = previewRequestRef.current + 1;
    previewRequestRef.current = requestId;
    setIsPreviewing(true);
    setError(null);
    setPreviewUrl(null);
    setPreviewFileName(null);
    try {
      const result = await generateTripItineraryPdfBlob({
        tripId,
        tripPayload,
        templateId,
      });
      if (requestId !== previewRequestRef.current) return;
      setPreviewUrl(URL.createObjectURL(result.blob));
      setPreviewFileName(result.fileName);
    } catch (previewError) {
      if (requestId !== previewRequestRef.current) return;
      setError(
        previewError instanceof Error
          ? previewError.message
          : "Could not generate this PDF preview.",
      );
    } finally {
      if (requestId === previewRequestRef.current) {
        setIsPreviewing(false);
      }
    }
  }, [tripId, tripPayload]);

  useEffect(() => {
    if (!isOpen) return;
    setDraftTemplateId(selectedTemplateId);
    void generatePreview(selectedTemplateId);
  }, [generatePreview, isOpen, selectedTemplateId]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (isOpen || !previewUrl) return;
    URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewFileName(null);
  }, [isOpen, previewUrl]);

  const handleSelectTemplate = (templateId: ItineraryTemplateId) => {
    setDraftTemplateId(templateId);
    void generatePreview(templateId);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await onSaveTemplate(draftTemplateId);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save the selected template.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);
    try {
      const result = await generateTripItineraryPdfBlob({
        tripId,
        tripPayload,
        templateId: draftTemplateId,
      });
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Could not download the selected PDF.",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Choose PDF Template"
      description="Preview the client-ready PDF before you download or keep it as the trip default."
      size="full"
    >
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <section className="space-y-3">
          {ITINERARY_TEMPLATE_OPTIONS.map((option) => {
            const isSelected = option.id === draftTemplateId;
            const meta = ITINERARY_PRINT_TEMPLATE_META[option.id];
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelectTemplate(option.id)}
                className={cn(
                  "w-full rounded-2xl border p-4 text-left transition-all",
                  "bg-white/80 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg",
                  "dark:bg-slate-900/70 dark:hover:border-emerald-500/70",
                  isSelected
                    ? "border-emerald-500 shadow-lg shadow-emerald-500/10"
                    : "border-slate-200 dark:border-slate-800",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-black text-slate-950 dark:text-white">
                      {meta.label}
                    </p>
                    <p className="text-xs leading-5 text-slate-600 dark:text-slate-400">
                      {option.description}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                      isSelected
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-slate-200 text-slate-400 dark:border-slate-700",
                    )}
                  >
                    {isSelected ? <Check className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  </span>
                </div>
              </button>
            );
          })}
        </section>

        <section className="min-h-[520px] rounded-3xl border border-slate-200 bg-slate-100/80 p-3 dark:border-slate-800 dark:bg-slate-950/60">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-600">
                Selected Template
              </p>
              <h3 className="mt-1 text-xl font-serif text-slate-950 dark:text-white">
                {selectedMeta.label}
              </h3>
            </div>
            <GlassButton
              variant="outline"
              className="h-11 rounded-2xl border-emerald-500/70 px-4 text-emerald-700"
              onClick={() => generatePreview(draftTemplateId)}
              loading={isPreviewing}
            >
              <Eye className="h-4 w-4" />
              Refresh Preview
            </GlassButton>
          </div>

          <div className="relative h-[62vh] min-h-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            {isPreviewing ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                <p className="text-sm font-semibold">Building the selected PDF preview...</p>
              </div>
            ) : previewUrl ? (
              <iframe
                key={previewUrl}
                title={`${selectedMeta.label} PDF preview`}
                src={previewUrl}
                className="h-full w-full"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
                  <FileText className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-base font-black text-slate-950 dark:text-white">
                    Preview builds automatically
                  </p>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
                    Select any template on the left. The PDF preview refreshes with the same renderer used for download.
                  </p>
                </div>
              </div>
            )}
          </div>

          {previewFileName ? (
            <p className="mt-2 truncate text-xs text-slate-500">Preview file: {previewFileName}</p>
          ) : null}
          {error ? (
            <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </section>
      </div>

      <div className="mt-5 flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end dark:border-slate-800">
        <GlassButton variant="ghost" className="h-12 rounded-2xl" onClick={onClose}>
          Close
        </GlassButton>
        <GlassButton
          variant="outline"
          className="h-12 rounded-2xl border-emerald-500/70 text-emerald-700"
          onClick={handleSave}
          loading={isSaving}
        >
          <Save className="h-4 w-4" />
          Save Template
        </GlassButton>
        <GlassButton
          variant="primary"
          className="h-12 rounded-2xl"
          onClick={handleDownload}
          loading={isDownloading}
        >
          <Download className="h-4 w-4" />
          Download This PDF
        </GlassButton>
      </div>
    </GlassModal>
  );
}
