// WelcomeModal — auto-demo welcome for new users with zero data.
// Shows on first visit, auto-enables demo mode, and invites the user to explore.

"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDemoMode } from "@/lib/demo/demo-mode-context";

const LS_KEY = "tripbuilt:onboarded";

export default function WelcomeModal() {
  const { isDemoMode, toggleDemoMode, mounted } = useDemoMode();
  const [isOpen, setIsOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  // On first mount, check if user is new (not yet onboarded)
  useEffect(() => {
    if (!mounted) return;

    try {
      const onboarded = localStorage.getItem(LS_KEY);
      if (onboarded === "true") {
        setChecking(false);
        return;
      }
    } catch {
      setChecking(false);
      return;
    }

    // If not onboarded and demo mode is not already on, check if user has data
    if (!isDemoMode) {
      const checkData = async () => {
        try {
          const res = await fetch("/api/admin/dashboard/stats");
          if (res.ok) {
            const data = await res.json();
            const hasData = (data.activeTrips ?? 0) > 0 || (data.totalClients ?? 0) > 0;
            if (!hasData) {
              // New user — show welcome + auto-enable demo
              setIsOpen(true);
              toggleDemoMode(); // enable demo mode
            } else {
              // User has data — mark as onboarded
              localStorage.setItem(LS_KEY, "true");
            }
          }
        } catch {
          // Network error — don't block
        } finally {
          setChecking(false);
        }
      };
      void checkData();
    } else {
      setChecking(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    try {
      localStorage.setItem(LS_KEY, "true");
    } catch {
      // localStorage unavailable
    }
  }, []);

  const handleExplore = useCallback(() => {
    handleClose();
    // After closing, trigger the dashboard tour with a delay so the modal animates out
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("tripbuilt:tour-page-start", {
          detail: { tourId: "tour-dashboard", mode: "page" },
        })
      );
    }, 500);
  }, [handleClose]);

  if (!mounted || checking || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 border-0 cursor-default"
        onClick={handleClose}
        aria-label="Close modal"
      />

      {/* Modal Card */}
      <div
        className={cn(
          "relative w-full max-w-md",
          "bg-white dark:bg-slate-900 rounded-2xl shadow-2xl",
          "border border-gray-200 dark:border-slate-700",
          "animate-in fade-in zoom-in-95 duration-300",
          "overflow-hidden"
        )}
      >
        {/* Top accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#00d084] via-[#00d084]/70 to-[#00d084]/40" />

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00d084]/10 mb-5">
            <Sparkles className="w-8 h-8 text-[#00d084]" />
          </div>

          {/* Heading */}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to TripBuilt! 🎉
          </h2>

          <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed mb-6 max-w-xs mx-auto">
            We&apos;ve loaded sample data so you can explore every feature.
            Complete your setup checklist on the dashboard to configure WhatsApp, payments, and more.
          </p>

          {/* Feature highlights */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { emoji: "✈️", label: "10 Trips" },
              { emoji: "👥", label: "12 Clients" },
              { emoji: "💰", label: "Real Pricing" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50"
              >
                <span className="text-xl">{item.emoji}</span>
                <span className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={handleExplore}
            className={cn(
              "w-full inline-flex items-center justify-center gap-2",
              "px-6 py-3 rounded-xl",
              "bg-[#00d084] text-white font-semibold text-sm",
              "hover:bg-[#00d084]/90 transition-all",
              "shadow-lg shadow-[#00d084]/20"
            )}
          >
            Start Exploring
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-3">
            Toggle off Demo Mode anytime to work with your own data.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
