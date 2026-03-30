// WelcomeModal — welcome for new users with zero data.
// Shows on first visit and invites the user to set up their workspace.

"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const LS_KEY = "tripbuilt:onboarded";

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

    // Check if user has data
    const checkData = async () => {
      try {
        const res = await fetch("/api/admin/dashboard/stats");
        if (res.ok) {
          const data = await res.json();
          const hasData = (data.activeTrips ?? 0) > 0 || (data.totalClients ?? 0) > 0;
          if (!hasData) {
            setIsOpen(true);
          } else {
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
            Welcome to TripBuilt!
          </h2>

          <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed mb-6 max-w-xs mx-auto">
            Your workspace is ready. Add your first client, create a trip, or
            connect WhatsApp to start managing your travel business.
          </p>

          {/* Feature highlights */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { emoji: "👥", label: "Add Clients" },
              { emoji: "✈️", label: "Create Trips" },
              { emoji: "💬", label: "WhatsApp" },
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
            Get Started
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
