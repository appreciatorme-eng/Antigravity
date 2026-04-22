// DemoModeToggle — pill-shaped toggle in TopBar.
// Matches Glass UI + ThemeToggleButton pattern (hydration-safe).

"use client";

import { useState, useEffect } from "react";
import { FlaskConical, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDemoMode } from "@/lib/demo/demo-mode-context";

// In production, only render when explicitly opted in via NEXT_PUBLIC_DEMO_MODE_ENABLED=true.
const DEMO_DISABLED_IN_PRODUCTION =
  process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED !== 'true';

export default function DemoModeToggle({ className }: { className?: string }) {
  const { isDemoMode, toggleDemoMode, mounted } = useDemoMode();
  const [localMounted, setLocalMounted] = useState(false);

  useEffect(() => {
    // SSR-safe hydration guard — must detect mount via effect
    setLocalMounted(true);
  }, []);

  // Always render the escape hatch when demo mode is currently ON,
  // even in production — user must be able to get out.
  if (DEMO_DISABLED_IN_PRODUCTION && !isDemoMode) {
    return null;
  }

  if (!localMounted || !mounted) {
    return (
      <button
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
          "bg-gray-100 dark:bg-slate-800 text-gray-400",
          "transition-all duration-300",
          className
        )}
        aria-label="Toggle demo mode"
      >
        <FlaskConical className="w-3.5 h-3.5" />
        <span>Demo</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleDemoMode}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
        "transition-all duration-300",
        "hover:scale-105 active:scale-95",
        isDemoMode
          ? "bg-[#00d084]/15 text-[#00d084] ring-2 ring-[#00d084]/30 shadow-[0_0_12px_rgba(0,208,132,0.15)]"
          : "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300",
        className
      )}
      aria-label={isDemoMode ? "Disable demo mode" : "Enable demo mode"}
      title={isDemoMode ? "Demo Mode is ON — viewing sample data" : "Toggle demo data to explore features"}
    >
      {isDemoMode ? (
        <>
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span className="uppercase tracking-widest text-[10px] font-black">Demo</span>
        </>
      ) : (
        <>
          <FlaskConical className="w-3.5 h-3.5" />
          <span>Demo</span>
        </>
      )}
    </button>
  );
}
