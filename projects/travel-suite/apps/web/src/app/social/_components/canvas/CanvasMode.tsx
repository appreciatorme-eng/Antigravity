"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { CanvasEditorPanel } from "./CanvasEditorPanel";
import { CanvasFooter } from "./CanvasFooter";
import { CanvasPublishModal } from "./CanvasPublishModal";
import { CanvasPreviewPane } from "./CanvasPreviewPane";
import { renderBg, renderLayout } from "./layout-preview";
import type { CanvasModeProps } from "./types";

export function CanvasMode({
  template,
  templateData,
  backgrounds,
  selectedBackground,
  connections,
  onTemplateDataChange,
  onBackgroundChange,
  onClose,
  aiPosterUrl,
  onClearAiPoster,
}: CanvasModeProps) {
  const [activeBackgroundIndex, setActiveBackgroundIndex] = useState(() =>
    Math.max(0, backgrounds.indexOf(selectedBackground))
  );
  const [showPhoneMockup, setShowPhoneMockup] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [hdExporting, setHdExporting] = useState(false);

  useEffect(() => {
    const index = backgrounds.indexOf(selectedBackground);
    if (index >= 0) {
      setActiveBackgroundIndex(index);
    }
  }, [backgrounds, selectedBackground]);

  useEffect(() => {
    const handlePublish = () => {
      setShowPublishModal(true);
    };

    window.addEventListener(
      "canvas-mode:publish",
      handlePublish as EventListener
    );

    return () => {
      window.removeEventListener(
        "canvas-mode:publish",
        handlePublish as EventListener
      );
    };
  }, []);

  const goToPrevBackground = useCallback(() => {
    setActiveBackgroundIndex((prev) => {
      const next = prev <= 0 ? backgrounds.length - 1 : prev - 1;
      onBackgroundChange(backgrounds[next]);
      return next;
    });
  }, [backgrounds, onBackgroundChange]);

  const goToNextBackground = useCallback(() => {
    setActiveBackgroundIndex((prev) => {
      const next = prev >= backgrounds.length - 1 ? 0 : prev + 1;
      onBackgroundChange(backgrounds[next]);
      return next;
    });
  }, [backgrounds, onBackgroundChange]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "ArrowLeft") goToPrevBackground();
      if (event.key === "ArrowRight") goToNextBackground();
      if (event.key === "Escape") onClose();
    },
    [goToNextBackground, goToPrevBackground, onClose]
  );

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const node = document.getElementById(`canvas-export-${template.id}`);
      if (!node) return;
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(node, {
        quality: 1,
        pixelRatio: 2,
        width: 1080,
        height: 1080,
      });
      const label = aiPosterUrl ? "AI-" : "";
      const link = document.createElement("a");
      link.download = `${label}${template.name.replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Downloaded!");
    } catch {
      toast.error("Error generating image.");
    } finally {
      setDownloading(false);
    }
  };

  const handleHdExport = async () => {
    setHdExporting(true);
    try {
      const response = await fetch("/api/social/render-poster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateData: {
            ...templateData,
            galleryImages: templateData.galleryImages || [],
          },
          layoutType: template.layout,
          backgroundUrl: templateData.heroImage,
          aspectRatio: "square",
          format: "png",
          quality: 95,
        }),
      });
      if (!response.ok) throw new Error("HD export failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${template.name.replace(/\s+/g, "-")}-HD.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("HD poster downloaded!");
    } catch {
      toast.error("HD export failed.");
    } finally {
      setHdExporting(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: template.id,
          template_data: templateData,
          status: "draft",
          source: "canvas",
        }),
      });
      toast.success("Saved as draft!");
    } catch {
      toast.error("Failed to save draft.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col overflow-hidden"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {template.name}
              {aiPosterUrl && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  AI Poster
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              {aiPosterUrl ? "AI background · " : ""}
              {`${template.layout.replace("Layout", "")} · ${template.category}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPhoneMockup((value) => !value)}
            className={`p-2 rounded-xl transition-colors ${
              showPhoneMockup
                ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600"
                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            }`}
            title="Phone Preview"
          >
            <Smartphone className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-0 overflow-hidden">
        <CanvasPreviewPane
          activeBackgroundIndex={activeBackgroundIndex}
          aiPosterUrl={aiPosterUrl}
          backgrounds={backgrounds}
          onBackgroundChange={onBackgroundChange}
          onClearAiPoster={onClearAiPoster}
          onGoToNextBackground={goToNextBackground}
          onGoToPrevBackground={goToPrevBackground}
          onSetActiveBackgroundIndex={setActiveBackgroundIndex}
          showPhoneMockup={showPhoneMockup}
          template={template}
          templateData={templateData}
        />
        <CanvasEditorPanel
          activeBackgroundIndex={activeBackgroundIndex}
          aiPosterUrl={aiPosterUrl}
          backgrounds={backgrounds}
          connections={connections}
          downloading={downloading}
          hdExporting={hdExporting}
          onBackgroundChange={onBackgroundChange}
          onClearAiPoster={onClearAiPoster}
          onDownload={handleDownload}
          onHdExport={handleHdExport}
          onSetActiveBackgroundIndex={setActiveBackgroundIndex}
          onTemplateDataChange={onTemplateDataChange}
          onTogglePhoneMockup={() => setShowPhoneMockup((value) => !value)}
          showPhoneMockup={showPhoneMockup}
          templateData={templateData}
        />
      </div>

      <CanvasFooter onClose={onClose} onSaveDraft={handleSaveDraft} />

      <CanvasPublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        template={template}
        templateData={templateData}
        connections={connections}
      />

      <div
        id={`canvas-export-${template.id}`}
        className="absolute -z-50 pointer-events-none"
        style={{ width: 1080, height: 1080, left: -9999, top: 0 }}
      >
        <div className={`w-full h-full ${renderBg(template)} flex flex-col`}>
          {renderLayout(template, templateData)}
        </div>
      </div>
    </motion.div>
  );
}
