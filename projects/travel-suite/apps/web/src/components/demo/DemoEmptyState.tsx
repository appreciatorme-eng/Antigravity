// DemoEmptyState — nudge component for empty states when demo mode is OFF.
// Shows "Enable Demo Mode to explore this feature" with an inline toggle.

"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDemoMode } from "@/lib/demo/demo-mode-context";

interface DemoEmptyStateProps {
  feature?: string;
  className?: string;
}

export default function DemoEmptyState({ feature = "this feature", className }: DemoEmptyStateProps) {
  const { isDemoMode, toggleDemoMode, mounted } = useDemoMode();

  // Don't show if demo is already on or not mounted
  if (!mounted || isDemoMode) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl",
        "bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50",
        "animate-in fade-in duration-500",
        className
      )}
    >
      <Sparkles className="w-4 h-4 text-gray-400 flex-shrink-0" />
      <p className="text-xs text-gray-500 dark:text-slate-400">
        No data yet.{" "}
        <button
          onClick={toggleDemoMode}
          className="font-semibold text-[#00d084] hover:text-[#00d084]/80 transition-colors underline underline-offset-2"
        >
          Enable Demo Mode
        </button>{" "}
        to explore {feature} with sample data.
      </p>
    </div>
  );
}
