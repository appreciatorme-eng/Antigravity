// DemoTour — slide-in panel stepper walking through key pages.
// Renders a fixed right-side panel with step info, pro tips, and progress dots.

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { X, ChevronRight, ChevronLeft, Sparkles, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

/** Custom event name used to trigger the tour from anywhere (e.g. sidebar button) */
export const TOUR_START_EVENT = "tripbuilt:start-tour";

const LS_KEY_COMPLETED = "tripbuilt:demo_tour_completed";
const LS_KEY_ACTIVE = "tripbuilt:demo_tour_active";
const LS_KEY_STEP = "tripbuilt:demo_tour_step";

interface TourStep {
  path: string;
  sidebarHref: string;
  title: string;
  icon: string;
  description: string;
  proTip: string;
}

const STEPS: readonly TourStep[] = [
  {
    path: "/admin",
    sidebarHref: "/",
    title: "Your Command Center",
    icon: "\u{1F4CA}",
    description:
      "Your dashboard shows KPIs, revenue trends, and quick actions at a glance.",
    proTip:
      "Check your Morning Briefing each day for the most important updates.",
  },
  {
    path: "/planner",
    sidebarHref: "/planner",
    title: "Create Itineraries with AI",
    icon: "\u2708\uFE0F",
    description:
      "Type a destination and let AI generate a complete trip plan in seconds.",
    proTip:
      'Try "5 day Rajasthan heritage tour for a family of 4" to see the magic.',
  },
  {
    path: "/clients",
    sidebarHref: "/clients",
    title: "Your Client Pipeline",
    icon: "\u{1F465}",
    description:
      "Track every client from first inquiry to trip completion.",
    proTip:
      "Clients automatically move through stages as you create and share proposals.",
  },
  {
    path: "/admin",
    sidebarHref: "/",
    title: "You're Ready to Go!",
    icon: "\u{1F680}",
    description:
      "Head to Settings to configure WhatsApp, payments, and your marketplace profile.",
    proTip:
      "Check the setup checklist on your dashboard to track your remaining setup tasks.",
  },
] as const;

interface DemoTourProps {
  forceStart?: boolean;
  onForceStartHandled?: () => void;
}

export default function DemoTour({
  forceStart,
  onForceStartHandled,
}: DemoTourProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // SSR guard + resume tour from localStorage
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR-safe mount guard + localStorage resume
    setMounted(true);
    try {
      const wasActive = localStorage.getItem(LS_KEY_ACTIVE) === "true";
      const savedStep = parseInt(localStorage.getItem(LS_KEY_STEP) ?? "0", 10);
      if (wasActive && !isNaN(savedStep) && savedStep >= 0 && savedStep < STEPS.length) {
        setActive(true);
        setCurrentStep(savedStep);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  // Handle external force start (prop-based)
  useEffect(() => {
    if (forceStart) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- prop-driven activation
      setActive(true);
      setCurrentStep(0);
      try {
        localStorage.removeItem(LS_KEY_COMPLETED);
        localStorage.setItem(LS_KEY_ACTIVE, "true");
        localStorage.setItem(LS_KEY_STEP, "0");
      } catch {
        // localStorage unavailable
      }
      onForceStartHandled?.();
    }
  }, [forceStart, onForceStartHandled]);

  // Listen for custom event trigger
  useEffect(() => {
    const handleStartEvent = () => {
      setActive(true);
      setCurrentStep(0);
      try {
        localStorage.removeItem(LS_KEY_COMPLETED);
        localStorage.setItem(LS_KEY_ACTIVE, "true");
        localStorage.setItem(LS_KEY_STEP, "0");
      } catch {
        // localStorage unavailable
      }
    };
    window.addEventListener(TOUR_START_EVENT, handleStartEvent);
    return () => window.removeEventListener(TOUR_START_EVENT, handleStartEvent);
  }, []);

  // Highlight active sidebar link
  useEffect(() => {
    if (!active) return;
    const step = STEPS[currentStep];
    if (!step) return;

    const timer = setTimeout(() => {
      const links = document.querySelectorAll<HTMLAnchorElement>("aside a");
      for (const link of links) {
        if (link.getAttribute("href") === step.sidebarHref) {
          link.setAttribute("data-tour-active", "true");
        }
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      const highlighted = document.querySelectorAll('[data-tour-active="true"]');
      highlighted.forEach((el) => el.removeAttribute("data-tour-active"));
    };
  }, [active, currentStep, pathname]);

  const closeTour = useCallback(() => {
    setActive(false);
    try {
      localStorage.setItem(LS_KEY_COMPLETED, "true");
      localStorage.removeItem(LS_KEY_ACTIVE);
      localStorage.removeItem(LS_KEY_STEP);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const goToStep = useCallback(
    (step: number) => {
      if (step < 0 || step >= STEPS.length) return;
      setCurrentStep(step);
      try {
        localStorage.setItem(LS_KEY_STEP, String(step));
      } catch {
        // localStorage unavailable
      }
      router.push(STEPS[step].path);
    },
    [router],
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

  // Navigate to the current step's page if not already there
  useEffect(() => {
    if (!active) return;
    const step = STEPS[currentStep];
    if (!step) return;
    if (pathname === step.path || pathname?.startsWith(step.path + "/")) return;
    router.push(step.path);
  }, [active, currentStep, pathname, router]);

  if (!active || !mounted) return null;

  const step = STEPS[currentStep];
  const isLastStep = currentStep >= STEPS.length - 1;

  return createPortal(
    <>
      {/* Backdrop overlay */}
      <button
        type="button"
        className="fixed inset-0 bg-black/10 z-40 pointer-events-auto border-0 cursor-default"
        onClick={closeTour}
        aria-label="Close tour"
      />

      {/* Slide-in panel */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-96 max-w-[85vw] z-50",
          "bg-[#0f172a]/95 backdrop-blur-xl border-l border-white/10",
          "flex flex-col",
          "transition-transform duration-300",
          active ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Close button */}
        <div className="flex justify-end p-4">
          <button
            onClick={closeTour}
            className="p-1.5 text-white/40 hover:text-white/80 transition-colors rounded-lg hover:bg-white/10"
            aria-label="Close tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-8">
          {/* Step badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00d084]/10 text-[#00d084] text-[10px] font-bold uppercase tracking-widest mb-6">
            <Sparkles className="w-3 h-3" />
            Step {currentStep + 1} of {STEPS.length}
          </div>

          {/* Large icon */}
          <div className="text-5xl mb-5" aria-hidden="true">
            {step.icon}
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-white text-center mb-3">
            {step.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-white/60 text-center leading-relaxed mb-6 max-w-xs">
            {step.description}
          </p>

          {/* Pro tip */}
          <div className="w-full bg-[#00d084]/10 border border-[#00d084]/20 rounded-xl p-3 mb-8">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-[#00d084] shrink-0 mt-0.5" />
              <p className="text-xs text-[#00d084]/90 leading-relaxed">
                <span className="font-semibold">Pro tip:</span> {step.proTip}
              </p>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => goToStep(i)}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-300",
                  i === currentStep
                    ? "bg-[#00d084] scale-125"
                    : "bg-white/20 hover:bg-white/40",
                )}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="w-full flex items-center justify-between gap-2">
            <button
              onClick={closeTour}
              className="text-xs text-white/40 hover:text-white/70 transition-colors font-medium px-3 py-2"
            >
              Skip Tour
            </button>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-1 px-5 py-2 rounded-lg text-xs font-semibold bg-[#00d084] text-white hover:bg-[#00d084]/90 transition-colors shadow-sm"
              >
                {isLastStep ? "Finish" : "Next"}
                {!isLastStep && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
