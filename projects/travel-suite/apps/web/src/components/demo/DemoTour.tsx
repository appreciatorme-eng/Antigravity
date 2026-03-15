// DemoTour — lightweight tooltip stepper walking through key pages.
// Renders a fixed-position card highlighting sidebar nav items on each step.

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDemoMode } from "@/lib/demo/demo-mode-context";

const LS_KEY_COMPLETED = "antigravity:demo_tour_completed";
const LS_KEY_ACTIVE = "antigravity:demo_tour_active";

interface TourStep {
  /** Page path to navigate to */
  path: string;
  /** Sidebar label text to highlight */
  sidebarLabel: string;
  /** Title shown in tooltip */
  title: string;
  /** Description shown in tooltip */
  description: string;
  /** Emoji prefix */
  emoji: string;
}

const STEPS: TourStep[] = [
  {
    path: "/",
    sidebarLabel: "Home",
    title: "Dashboard",
    description:
      "Your command center — revenue trends, active trips, and KPIs at a glance. Everything updates in real-time.",
    emoji: "📊",
  },
  {
    path: "/trips",
    sidebarLabel: "Trips",
    title: "Trip Management",
    description:
      "Manage tours end-to-end: create itineraries, coordinate logistics, assign drivers, and track every detail.",
    emoji: "✈️",
  },
  {
    path: "/clients",
    sidebarLabel: "Clients",
    title: "Client Pipeline",
    description:
      "Track clients from Lead to Closed. View contact details, trip history, and communication logs.",
    emoji: "👥",
  },
  {
    path: "/admin/pricing",
    sidebarLabel: "Pricing & Profit",
    title: "Pricing & Profit",
    description:
      "Track costs, margins, and commissions per trip. See your real profit with hotel, flight, and vehicle breakdowns.",
    emoji: "💰",
  },
  {
    path: "/admin/invoices",
    sidebarLabel: "Invoices",
    title: "Invoices",
    description:
      "Generate GST-compliant invoices, track payments, and manage outstanding balances for each client.",
    emoji: "🧾",
  },
  {
    path: "/admin/insights",
    sidebarLabel: "AI Insights",
    title: "AI Insights",
    description:
      "AI-powered actions: expiring proposals, stalled deals, upsell ideas. Your smart assistant for growth.",
    emoji: "✨",
  },
];

interface DemoTourProps {
  /** Externally trigger the tour start (e.g. from banner button) */
  forceStart?: boolean;
  onForceStartHandled?: () => void;
}

export default function DemoTour({ forceStart, onForceStartHandled }: DemoTourProps) {
  const { isDemoMode, mounted } = useDemoMode();
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Start tour on first demo enable (if not completed)
  useEffect(() => {
    if (!mounted || !isDemoMode) return;
    try {
      const completed = localStorage.getItem(LS_KEY_COMPLETED) === "true";
      const wasActive = localStorage.getItem(LS_KEY_ACTIVE) === "true";
      if (!completed && !wasActive) {
        // Auto-start on first demo enable — needs useEffect for localStorage access
        // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR-safe init from localStorage
        setActive(true);
        setCurrentStep(0);
        localStorage.setItem(LS_KEY_ACTIVE, "true");
      }
    } catch {
      // localStorage unavailable
    }
  }, [mounted, isDemoMode]);

  // Handle external force start
  useEffect(() => {
    if (forceStart && isDemoMode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- prop-driven activation
      setActive(true);
      setCurrentStep(0);
      try {
        localStorage.removeItem(LS_KEY_COMPLETED);
        localStorage.setItem(LS_KEY_ACTIVE, "true");
      } catch {
        // localStorage unavailable
      }
      onForceStartHandled?.();
    }
  }, [forceStart, isDemoMode, onForceStartHandled]);

  // Position the tooltip next to the sidebar link
  useEffect(() => {
    if (!active) {
      // Reset tooltip position when tour becomes inactive — legitimate effect-driven UI sync
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTooltipPos(null);
      return;
    }

    const step = STEPS[currentStep];
    if (!step) return;

    const positionTooltip = () => {
      // Find the sidebar link by matching href
      const links = document.querySelectorAll<HTMLAnchorElement>("aside a");
      let target: HTMLAnchorElement | null = null;
      for (const link of links) {
        if (link.getAttribute("href") === step.path) {
          target = link;
          break;
        }
      }

      if (target) {
        const rect = target.getBoundingClientRect();
        // Add highlight ring via CSS data attribute (styles defined in globals.css)
        target.setAttribute("data-tour-active", "true");

        setTooltipPos({
          top: rect.top + rect.height / 2,
          left: rect.right + 16,
        });
      }
    };

    // Small delay for page navigation to settle
    const timer = setTimeout(positionTooltip, 200);

    return () => {
      clearTimeout(timer);
      // Clean up highlights — removing the attribute removes the CSS styles
      const highlighted = document.querySelectorAll('[data-tour-active="true"]');
      highlighted.forEach((el) => el.removeAttribute("data-tour-active"));
    };
  }, [active, currentStep, pathname]);

  const closeTour = useCallback(() => {
    setActive(false);
    try {
      localStorage.setItem(LS_KEY_COMPLETED, "true");
      localStorage.removeItem(LS_KEY_ACTIVE);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const goToStep = useCallback(
    (step: number) => {
      if (step < 0 || step >= STEPS.length) return;
      setCurrentStep(step);
      router.push(STEPS[step].path);
    },
    [router]
  );

  const handleNext = useCallback(() => {
    if (currentStep >= STEPS.length - 1) {
      closeTour();
      return;
    }
    goToStep(currentStep + 1);
  }, [currentStep, closeTour, goToStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  // Navigate to the first step's page when tour starts
  useEffect(() => {
    if (active && currentStep === 0 && pathname !== STEPS[0].path) {
      router.push(STEPS[0].path);
    }
  }, [active, currentStep, pathname, router]);

  if (!active || !isDemoMode || !mounted) return null;

  const step = STEPS[currentStep];

  return createPortal(
    <>
      {/* Backdrop overlay — subtle */}
      <button
        type="button"
        className="fixed inset-0 bg-black/10 z-40 pointer-events-auto border-0 cursor-default"
        onClick={closeTour}
        aria-label="Close tour"
      />

      {/* Tooltip Card */}
      {tooltipPos && (
        <div
          ref={tooltipRef}
          className={cn(
            "fixed z-50 w-80",
            "bg-white dark:bg-slate-900 rounded-2xl shadow-2xl",
            "border border-gray-200 dark:border-slate-700",
            "animate-in fade-in slide-in-from-left-3 duration-300"
          )}
          style={{
            top: tooltipPos.top,
            left: tooltipPos.left,
            transform: "translateY(-50%)",
          }}
        >
          {/* Arrow pointing left */}
          <div
            className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 rotate-45 bg-white dark:bg-slate-900 border-l border-b border-gray-200 dark:border-slate-700"
          />

          <div className="relative p-5">
            {/* Close */}
            <button
              onClick={closeTour}
              className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
              aria-label="Close tour"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Step badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00d084]/10 text-[#00d084] text-[10px] font-bold uppercase tracking-widest mb-3">
              <Sparkles className="w-3 h-3" />
              Step {currentStep + 1} of {STEPS.length}
            </div>

            {/* Content */}
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5">
              {step.emoji} {step.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed mb-4">
              {step.description}
            </p>

            {/* Progress dots */}
            <div className="flex items-center gap-1.5 mb-4">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToStep(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === currentStep
                      ? "w-6 bg-[#00d084]"
                      : i < currentStep
                        ? "w-1.5 bg-[#00d084]/40"
                        : "w-1.5 bg-gray-200 dark:bg-slate-700"
                  )}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={closeTour}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors font-medium"
              >
                Skip Tour
              </button>

              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrev}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#00d084] text-white hover:bg-[#00d084]/90 transition-colors shadow-sm"
                >
                  {currentStep >= STEPS.length - 1 ? "Finish" : "Next"}
                  {currentStep < STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
