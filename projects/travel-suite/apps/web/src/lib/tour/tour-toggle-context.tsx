"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { getTourIdForPath, hasPageTour } from "./tour-registry";

// ---------------------------------------------------------------------------
// Custom events for tour communication
// ---------------------------------------------------------------------------

export const TOUR_PAGE_START = "tripbuilt:tour-page-start";
export const TOUR_PAGE_COMPLETE = "tripbuilt:tour-page-complete";
export const TOUR_STOP = "tripbuilt:tour-stop";

// ---------------------------------------------------------------------------
// Visited pages tracking (auto-start on first visit)
// ---------------------------------------------------------------------------

const LS_VISITED_KEY = "tripbuilt:tour_visited_pages";

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
// Context
// ---------------------------------------------------------------------------

interface TourToggleState {
  /** Whether a tour is currently running */
  isTourActive: boolean;
  /** Start the tour for the current page */
  startPageTour: () => void;
  /** Start the full-app sequential tour */
  startFullAppTour: () => void;
  /** Stop any running tour */
  stopTour: () => void;
  /** Whether the current page has a tour available */
  hasCurrentPageTour: boolean;
}

const TourToggleContext = createContext<TourToggleState>({
  isTourActive: false,
  startPageTour: () => {},
  startFullAppTour: () => {},
  stopTour: () => {},
  hasCurrentPageTour: false,
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
  const hasCurrentPageTour = hasPageTour(pathname ?? "");

  const startPageTour = useCallback(() => {
    if (!pathname) return;
    const tourId = getTourIdForPath(pathname);
    if (!tourId) return;

    setIsTourActive(true);
    // Store mode in sessionStorage for the hook to read
    try {
      sessionStorage.setItem("tripbuilt:tour_mode", "page");
    } catch { /* noop */ }

    window.dispatchEvent(
      new CustomEvent(TOUR_PAGE_START, { detail: { tourId, mode: "page" } })
    );
  }, [pathname]);

  const startFullAppTour = useCallback(() => {
    setIsTourActive(true);
    try {
      sessionStorage.setItem("tripbuilt:tour_mode", "full-app");
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
    const handleComplete = () => setIsTourActive(false);
    window.addEventListener(TOUR_PAGE_COMPLETE, handleComplete);
    return () => window.removeEventListener(TOUR_PAGE_COMPLETE, handleComplete);
  }, []);

  // Auto-start on first visit per page
  useEffect(() => {
    if (!pathname || !hasPageTour(pathname)) return;

    const visited = getVisitedPages();
    if (visited.has(pathname)) return;

    // Mark visited immediately so it only fires once
    markPageVisited(pathname);

    // Delay to let page render fully
    const timer = setTimeout(() => {
      const tourId = getTourIdForPath(pathname);
      if (!tourId) return;

      setIsTourActive(true);
      try {
        sessionStorage.setItem("tripbuilt:tour_mode", "page");
      } catch { /* noop */ }

      window.dispatchEvent(
        new CustomEvent(TOUR_PAGE_START, { detail: { tourId, mode: "page" } })
      );
    }, 1200);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <TourToggleContext.Provider
      value={{
        isTourActive,
        startPageTour,
        startFullAppTour,
        stopTour,
        hasCurrentPageTour,
      }}
    >
      {children}
    </TourToggleContext.Provider>
  );
}
