// FeatureCallout — per-page contextual tip when demo mode is active.
// Shows a slim dismissible card with "DEMO TIP" badge at the top of each page.

"use client";

import { useState, useEffect } from "react";
import { X, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDemoMode } from "@/lib/demo/demo-mode-context";

const LS_PREFIX = "tripbuilt:feature_callout_dismissed:";

/** Per-page demo tips keyed by page identifier */
const PAGE_TIPS: Record<string, { tip: string; emoji: string }> = {
  dashboard: {
    tip: "This shows 3 months of sample operations for a Mumbai-based tour operator. Revenue, trip counts, and driver stats are all interconnected.",
    emoji: "📊",
  },
  trips: {
    tip: "10 sample trips across India — from Golden Triangle to Kashmir Houseboats. Click any trip to see full itineraries and cost breakdowns.",
    emoji: "✈️",
  },
  kanban: {
    tip: "12 sample clients at various pipeline stages. Drag cards between stages to see the lifecycle workflow in action.",
    emoji: "📋",
  },
  pricing: {
    tip: "Real-world cost structures: Taj Hotels at ₹12,000/night, IndiGo flights at ₹7,000/pax, vehicles at ₹3,500/day. Margins range 25-40%.",
    emoji: "💰",
  },
  invoices: {
    tip: "Sample invoices with GST-compliant formatting. Includes paid, pending, and overdue statuses to showcase the full payment lifecycle.",
    emoji: "🧾",
  },
  operations: {
    tip: "The Command Center shows today's active trips, driver assignments, and hotel check-ins — a real-time operations dashboard.",
    emoji: "🗓️",
  },
  insights: {
    tip: "AI-powered recommendations: expiring proposals to follow up on, stalled leads to re-engage, and upsell opportunities based on client history.",
    emoji: "✨",
  },
  support: {
    tip: "Sample support tickets across statuses — open, in-progress, and resolved. See how client issues are tracked and managed.",
    emoji: "🎧",
  },
};

interface FeatureCalloutProps {
  /** Page identifier matching keys in PAGE_TIPS */
  page: string;
  className?: string;
}

export default function FeatureCallout({ page, className }: FeatureCalloutProps) {
  const { isDemoMode, mounted } = useDemoMode();
  const [dismissed, setDismissed] = useState(true); // default true to prevent flash

  useEffect(() => {
    try {
      const wasDismissed = localStorage.getItem(LS_PREFIX + page) === "true";
      // SSR-safe: localStorage only available after mount
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(wasDismissed);
    } catch {
      setDismissed(false);
    }
  }, [page]);

  if (!mounted || !isDemoMode || dismissed) return null;

  const tipData = PAGE_TIPS[page];
  if (!tipData) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(LS_PREFIX + page, "true");
    } catch {
      // localStorage unavailable
    }
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 rounded-xl mb-4",
        "bg-[#00d084]/5 border border-[#00d084]/15",
        "animate-in fade-in slide-in-from-top-2 duration-500",
        className
      )}
    >
      <div className="flex items-center gap-2 shrink-0 mt-0.5">
        <Lightbulb className="w-4 h-4 text-[#00d084]" />
        <span className="text-[9px] font-black uppercase tracking-widest text-[#00d084] bg-[#00d084]/10 px-1.5 py-0.5 rounded">
          Demo Tip
        </span>
      </div>

      <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed flex-1">
        {tipData.emoji} {tipData.tip}
      </p>

      <button
        onClick={handleDismiss}
        className="shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
        aria-label="Dismiss tip"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/** Reset all feature callout dismiss states (used when restarting tour) */
export function resetFeatureCallouts() {
  try {
    Object.keys(PAGE_TIPS).forEach((key) => {
      localStorage.removeItem(LS_PREFIX + key);
    });
  } catch {
    // localStorage unavailable
  }
}
