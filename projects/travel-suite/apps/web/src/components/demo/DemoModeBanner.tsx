// DemoModeBanner — slim info banner below TopBar when demo mode is active.
// Dismissible per session. Shows shimmer animation + tour CTA.

"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDemoMode } from "@/lib/demo/demo-mode-context";
import { TOUR_START_EVENT } from "@/components/demo/DemoTour";

const DISMISS_KEY = "tripbuilt:demo_banner_dismissed";

export default function DemoModeBanner() {
  const { isDemoMode, toggleDemoMode, mounted } = useDemoMode();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "true") {
        // SSR-safe: sessionStorage only available after mount
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDismissed(true);
      }
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  if (!mounted || !isDemoMode || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "true");
    } catch {
      // sessionStorage unavailable
    }
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        "h-9 px-4 flex items-center justify-center gap-3",
        "bg-gradient-to-r from-[#00d084]/5 via-[#00d084]/10 to-[#00d084]/5",
        "border-b border-[#00d084]/10",
        "text-xs text-gray-600 dark:text-slate-400"
      )}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* shimmer-gradient class defined in globals.css to avoid inline styles */}
        <div className="shimmer-gradient" />
      </div>

      <Sparkles className="w-3.5 h-3.5 text-[#00d084] flex-shrink-0" />

      <span className="truncate">
        Viewing sample data from{" "}
        <strong className="text-gray-800 dark:text-slate-200">TripBuilt</strong>.
        Your real data is safe &mdash;{" "}
        <button
          onClick={toggleDemoMode}
          className="underline underline-offset-2 hover:text-[#00d084] transition-colors font-medium"
        >
          toggle off
        </button>{" "}
        anytime.
      </span>

      <button
          onClick={() => window.dispatchEvent(new Event(TOUR_START_EVENT))}
          className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#00d084] bg-[#00d084]/10 hover:bg-[#00d084]/20 transition-colors flex-shrink-0"
        >
          <Navigation className="w-3 h-3" />
          Take a Tour
        </button>

      <button
        onClick={handleDismiss}
        className="ml-auto flex-shrink-0 p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-gray-200/50 dark:hover:bg-slate-700/50 transition-colors"
        aria-label="Dismiss demo banner"
      >
        <X className="w-4 h-4" />
      </button>

    </div>
  );
}
