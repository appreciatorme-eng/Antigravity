"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { getTourIdForPath, hasPageTour, FULL_APP_TOUR_ORDER } from "./tour-registry";

// ---------------------------------------------------------------------------
// Custom events for tour communication
// ---------------------------------------------------------------------------

export const TOUR_PAGE_START = "tripbuilt:tour-page-start";
export const TOUR_PAGE_COMPLETE = "tripbuilt:tour-page-complete";
export const TOUR_STOP = "tripbuilt:tour-stop";
export const TOUR_NO_STEPS = "tripbuilt:tour-no-steps";

// ---------------------------------------------------------------------------
// localStorage keys
// ---------------------------------------------------------------------------

const LS_VISITED_KEY = "tripbuilt:tour_visited_pages";
const LS_SKIPPED_KEY = "tripbuilt:tour_skipped";
const LS_DISMISS_KEY = "tripbuilt:tour_fullapp_dismissed";
const SS_MODE_KEY = "tripbuilt:tour_mode";

// ---------------------------------------------------------------------------
// Visited pages tracking (auto-start on first visit)
// ---------------------------------------------------------------------------

function getVisitedPages(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_VISITED_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function markPageVisited(pathname: string): void {
  try {
    const visited = getVisitedPages();
    visited.add(pathname);
    localStorage.setItem(LS_VISITED_KEY, JSON.stringify([...visited]));
  } catch {
    // localStorage unavailable
  }
}

// ---------------------------------------------------------------------------
// #2: Reset all tour state
// ---------------------------------------------------------------------------

export function resetAllTours(): void {
  try {
    localStorage.removeItem(LS_VISITED_KEY);
    localStorage.removeItem(LS_SKIPPED_KEY);
    localStorage.removeItem(LS_DISMISS_KEY);
    sessionStorage.removeItem(SS_MODE_KEY);
  } catch {
    // storage unavailable
  }
  // Also reset feature callouts (from FeatureCallout.tsx)
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith("tripbuilt:feature_callout_dismissed:")) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // storage unavailable
  }
}

// ---------------------------------------------------------------------------
// #1: Tour progress
// ---------------------------------------------------------------------------

export interface TourProgress {
  visited: number;
  total: number;
}

function computeProgress(): TourProgress {
  const visited = getVisitedPages();
  return {
    visited: visited.size,
    total: FULL_APP_TOUR_ORDER.length,
  };
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface TourToggleState {
  isTourActive: boolean;
  startPageTour: () => void;
  startFullAppTour: () => void;
  stopTour: () => void;
  hasCurrentPageTour: boolean;
  /** #1: Progress tracking — how many pages the user has toured */
  progress: TourProgress;
}

const TourToggleContext = createContext<TourToggleState>({
  isTourActive: false,
  startPageTour: () => {},
  startFullAppTour: () => {},
  stopTour: () => {},
  hasCurrentPageTour: false,
  progress: { visited: 0, total: FULL_APP_TOUR_ORDER.length },
});

export function useTourToggle(): TourToggleState {
  return useContext(TourToggleContext);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function TourToggleProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isTourActive, setIsTourActive] = useState(false);
  const [progressVersion, setProgressVersion] = useState(0);
  const hasCurrentPageTour = hasPageTour(pathname ?? "");

  // #1: Recompute progress when version bumps (after visiting a page)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- progressVersion is a manual trigger
  const progress = useMemo(() => computeProgress(), [progressVersion]);

  const startPageTour = useCallback(() => {
    if (!pathname) return;
    const tourId = getTourIdForPath(pathname);
    if (!tourId) return;

    setIsTourActive(true);
    try {
      sessionStorage.setItem(SS_MODE_KEY, "page");
    } catch { /* noop */ }

    window.dispatchEvent(
      new CustomEvent(TOUR_PAGE_START, { detail: { tourId, mode: "page" } })
    );
  }, [pathname]);

  const startFullAppTour = useCallback(() => {
    setIsTourActive(true);
    try {
      sessionStorage.setItem(SS_MODE_KEY, "full-app");
    } catch { /* noop */ }

    window.dispatchEvent(
      new CustomEvent(TOUR_PAGE_START, {
        detail: { tourId: "tour-dashboard", mode: "full-app" },
      })
    );
  }, []);

  const stopTour = useCallback(() => {
    setIsTourActive(false);
    window.dispatchEvent(new Event(TOUR_STOP));
  }, []);

  // Listen for tour completion to update toggle state
  useEffect(() => {
    const handleComplete = () => {
      setIsTourActive(false);
      setProgressVersion((v) => v + 1);
    };
    window.addEventListener(TOUR_PAGE_COMPLETE, handleComplete);
    return () => window.removeEventListener(TOUR_PAGE_COMPLETE, handleComplete);
  }, []);

  // #7: Listen for no-steps event — show toast and reset toggle
  useEffect(() => {
    const handleNoSteps = () => {
      setIsTourActive(false);
      toast.info("Nothing to tour yet — try again after the page loads.");
    };
    window.addEventListener(TOUR_NO_STEPS, handleNoSteps);
    return () => window.removeEventListener(TOUR_NO_STEPS, handleNoSteps);
  }, []);

  // Auto-start on first visit per page + #8: resume full-app tour
  useEffect(() => {
    if (!pathname || !hasPageTour(pathname)) return;

    // Don't auto-start tours if the Welcome Modal is still showing
    // (user hasn't clicked "Start Exploring" yet)
    try {
      if (localStorage.getItem("tripbuilt:onboarded") !== "true") return;
    } catch { /* noop */ }

    // #8: If full-app mode is active in sessionStorage, resume tour on this page
    try {
      if (sessionStorage.getItem(SS_MODE_KEY) === "full-app") {
        const tourId = getTourIdForPath(pathname);
        if (tourId) {
          markPageVisited(pathname);
          setProgressVersion((v) => v + 1);

          const timer = setTimeout(() => {
            setIsTourActive(true);
            window.dispatchEvent(
              new CustomEvent(TOUR_PAGE_START, { detail: { tourId, mode: "full-app" } })
            );
          }, 800);
          return () => clearTimeout(timer);
        }
      }
    } catch { /* noop */ }

    // Mark page as visited for progress tracking, but do NOT auto-start the tour.
    // Tours are only started explicitly via "Tour this page" or "Take Full Tour" buttons.
    const visited = getVisitedPages();
    if (!visited.has(pathname)) {
      markPageVisited(pathname);
      setProgressVersion((v) => v + 1);
    }
  }, [pathname]);

  return (
    <TourToggleContext.Provider
      value={{
        isTourActive,
        startPageTour,
        startFullAppTour,
        stopTour,
        hasCurrentPageTour,
        progress,
      }}
    >
      {children}
    </TourToggleContext.Provider>
  );
}
