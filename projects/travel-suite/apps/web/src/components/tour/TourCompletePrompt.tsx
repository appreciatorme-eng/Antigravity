"use client";

import { useState, useEffect } from "react";
import { Compass, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TOUR_PAGE_COMPLETE } from "@/lib/tour/tour-toggle-context";

interface PromptPayload {
  pageName: string;
}

export function TourCompletePrompt({
  onTourApp,
  onDismiss,
}: {
  onTourApp: () => void;
  onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [pageName, setPageName] = useState("this page");

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<PromptPayload>).detail;
      // Only show prompt for page-mode tours (not full-app)
      try {
        if (sessionStorage.getItem("tripbuilt:tour_mode") === "full-app") return;
      } catch { /* noop */ }

      setPageName(detail?.pageName ?? "this page");
      setVisible(true);
    };

    window.addEventListener(TOUR_PAGE_COMPLETE, handler);
    return () => window.removeEventListener(TOUR_PAGE_COMPLETE, handler);
  }, []);

  if (!visible) return null;

  const handleTourApp = () => {
    setVisible(false);
    onTourApp();
  };

  const handleDismiss = () => {
    setVisible(false);
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-[10001] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Prompt card */}
      <div
        className={cn(
          "relative z-10 w-full md:max-w-sm",
          "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700",
          "rounded-t-2xl md:rounded-2xl shadow-2xl",
          "p-6 animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-2 duration-300"
        )}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
          <Compass className="w-6 h-6 text-primary" />
        </div>

        {/* Text */}
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          You&apos;ve explored {pageName}!
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Want a guided tour of the entire app? We&apos;ll walk you through
          every feature step by step.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleTourApp}
            className={cn(
              "flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl",
              "bg-primary text-white font-semibold text-sm",
              "hover:bg-primary/90 active:scale-[0.98] transition-all"
            )}
          >
            Tour the App
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleDismiss}
            className={cn(
              "flex items-center justify-center w-full py-3 px-4 rounded-xl",
              "text-slate-600 dark:text-slate-400 font-medium text-sm",
              "hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            )}
          >
            I&apos;m Good
          </button>
        </div>
      </div>
    </div>
  );
}
