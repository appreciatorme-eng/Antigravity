"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { TOUR_MAP } from './tour-steps';
import { APP_TOUR_MAP } from './app-tour-steps';
import type { TourStepConfig, TourConfig } from './tour-types';
import { getNextTourPage, getPageName, getTourIdForPath } from './tour-registry';
import { TOUR_PAGE_START, TOUR_PAGE_COMPLETE, TOUR_STOP } from './tour-toggle-context';

const LS_KEY_SKIPPED = 'tripbuilt:tour_skipped';
const SS_KEY_CONTINUE = 'tripbuilt:tour_continue';
const SS_KEY_MODE = 'tripbuilt:tour_mode';

/** Poll for an element to appear in the DOM, resolving true if found */
function waitForElement(
  selector: string,
  timeoutMs = 10_000,
): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      resolve(true);
      return;
    }
    const start = Date.now();
    const check = () => {
      if (document.querySelector(selector)) {
        resolve(true);
        return;
      }
      if (Date.now() - start > timeoutMs) {
        resolve(false);
        return;
      }
      requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  });
}

/** Look up a tour config from both setup tours and app tours */
function findTourConfig(tourId: string): TourConfig | undefined {
  return TOUR_MAP[tourId] ?? APP_TOUR_MAP[tourId];
}

/** Get current tour mode from sessionStorage */
function getTourMode(): 'page' | 'full-app' {
  try {
    return (sessionStorage.getItem(SS_KEY_MODE) as 'page' | 'full-app') || 'page';
  } catch {
    return 'page';
  }
}

export function useGuidedTour() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const driverRef = useRef<ReturnType<
    typeof import('driver.js').driver
  > | null>(null);
  const startedRef = useRef(false);

  const tourParam = searchParams.get('tour');
  const setupParam = searchParams.get('setup');

  // Check for cross-page tour continuation (e.g. share tour → trip detail)
  const continueTourId = typeof window !== 'undefined'
    ? sessionStorage.getItem(SS_KEY_CONTINUE)
    : null;

  // Resolve which tour to run: ?tour= first, then ?setup=, then sessionStorage
  const activeTourId = tourParam ?? setupParam ?? continueTourId;

  // Whether this is an app tour (triggered via ?tour= param)
  const isAppTour = tourParam !== null;

  const cleanup = useCallback(() => {
    if (driverRef.current) {
      driverRef.current.destroy();
      driverRef.current = null;
    }
  }, []);

  // Core tour runner — shared by URL-param and event-driven paths
  const runTour = useCallback(async (tourId: string, mode: 'page' | 'full-app' | 'setup') => {
    const tourConfig = findTourConfig(tourId);
    if (!tourConfig) return;

    const { driver } = await import('driver.js');
    // @ts-expect-error -- CSS import handled by Next.js bundler at runtime
    await import('driver.js/dist/driver.css');

    // Build steps, filtering out those whose elements don't exist
    const validSteps: Array<{
      element: string;
      popover: TourStepConfig['popover'];
    }> = [];

    for (const step of tourConfig.steps) {
      if (step.waitForElement) {
        const found = await waitForElement(step.element, 8_000);
        if (!found) continue;
      } else {
        await waitForElement(step.element, 2_000);
        if (!document.querySelector(step.element)) continue;
      }
      validSteps.push({
        element: step.element,
        popover: step.popover,
      });
    }

    if (validSteps.length === 0) return;

    // For multi-page setup tours: pre-set the continuation flag
    if (tourId === 'share') {
      sessionStorage.setItem(SS_KEY_CONTINUE, 'share-detail');
    }

    const isFullApp = mode === 'full-app';
    const currentPath = pathname ?? '/';

    const d = driver({
      showProgress: true,
      animate: true,
      overlayColor: 'rgba(0, 0, 0, 0.6)',
      stagePadding: 8,
      stageRadius: 12,
      popoverClass: 'tripbuilt-tour-popover',
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: isFullApp ? 'Continue →' : 'Done ✓',
      showButtons: ['next', 'previous', 'close'],
      steps: validSteps,
      onDestroyStarted: () => {
        const activeIndex = d.getActiveIndex();
        const isLastStep = activeIndex === validSteps.length - 1;

        if (!isLastStep) {
          // Skipped — mark as skipped
          const existing = JSON.parse(
            localStorage.getItem(LS_KEY_SKIPPED) || '{}',
          ) as Record<string, boolean>;
          localStorage.setItem(
            LS_KEY_SKIPPED,
            JSON.stringify({ ...existing, [tourId]: true }),
          );
          sessionStorage.removeItem(SS_KEY_CONTINUE);
        }

        d.destroy();

        if (isLastStep) {
          if (isFullApp) {
            // Full-app mode: navigate to next page
            const nextPage = getNextTourPage(currentPath);
            if (nextPage) {
              const nextTourId = getTourIdForPath(nextPage);
              router.push(nextTourId ? `${nextPage}?tour=${nextTourId}` : nextPage);
            } else {
              // Last page in sequence — done
              sessionStorage.removeItem(SS_KEY_MODE);
              router.push('/');
            }
          } else if (mode === 'page') {
            // Page-mode: dispatch complete event (triggers prompt)
            const pageName = getPageName(currentPath);
            window.dispatchEvent(
              new CustomEvent(TOUR_PAGE_COMPLETE, { detail: { pageName } })
            );
          } else if (mode === 'setup') {
            // Setup tours: navigate to nextPage if defined, else dashboard
            if (tourConfig.nextPage) {
              router.push(tourConfig.nextPage);
            } else if (tourId !== 'share') {
              router.push('/admin');
            }
          }
        }
      },
    });

    driverRef.current = d;

    // Auto-dismiss tour when user clicks any highlighted element
    const handleHighlightClick = () => {
      setTimeout(() => {
        if (driverRef.current) {
          driverRef.current.destroy();
        }
      }, 150);
    };

    const observer = new MutationObserver(() => {
      const activeEl = document.querySelector('.driver-active-element');
      if (activeEl && !activeEl.hasAttribute('data-tour-click-attached')) {
        activeEl.setAttribute('data-tour-click-attached', 'true');
        activeEl.addEventListener('click', handleHighlightClick, { once: true });
      }
    });
    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });

    requestAnimationFrame(() => {
      d.drive();
    });

    return () => observer.disconnect();
  }, [pathname, router]);

  // ---------------------------------------------------------------------------
  // Path 1: URL-param driven tours (?tour=, ?setup=, sessionStorage continue)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!activeTourId || startedRef.current) return;

    const tourConfig = findTourConfig(activeTourId);
    if (!tourConfig) return;

    if (!isAppTour) {
      const skipped = JSON.parse(
        localStorage.getItem(LS_KEY_SKIPPED) || '{}',
      ) as Record<string, boolean>;

      if (setupParam) {
        delete skipped[setupParam];
        delete skipped['share-detail'];
        localStorage.setItem(LS_KEY_SKIPPED, JSON.stringify(skipped));
      } else if (skipped[activeTourId]) {
        return;
      }
    }

    if (continueTourId) {
      sessionStorage.removeItem(SS_KEY_CONTINUE);
    }

    startedRef.current = true;

    const mode = isAppTour ? getTourMode() : 'setup';

    let observerCleanup: (() => void) | undefined;
    const timer = setTimeout(() => {
      const maybeCleanup = runTour(activeTourId, mode);
      void maybeCleanup.then((fn) => { observerCleanup = fn; });
    }, 600);

    return () => {
      clearTimeout(timer);
      observerCleanup?.();
      cleanup();
    };
  }, [activeTourId, setupParam, isAppTour, continueTourId, runTour, cleanup]);

  // ---------------------------------------------------------------------------
  // Path 2: Event-driven tours (from toggle context / auto-start)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handlePageStart = (e: Event) => {
      const { tourId, mode } = (e as CustomEvent<{ tourId: string; mode: 'page' | 'full-app' }>).detail;

      // Cleanup any existing tour
      cleanup();
      startedRef.current = true;

      const timer = setTimeout(() => {
        void runTour(tourId, mode);
      }, 300);

      return () => clearTimeout(timer);
    };

    const handleStop = () => {
      cleanup();
      startedRef.current = false;
    };

    window.addEventListener(TOUR_PAGE_START, handlePageStart);
    window.addEventListener(TOUR_STOP, handleStop);
    return () => {
      window.removeEventListener(TOUR_PAGE_START, handlePageStart);
      window.removeEventListener(TOUR_STOP, handleStop);
    };
  }, [cleanup, runTour]);

  // Listen for tour re-run events (when already on the same page)
  useEffect(() => {
    const handleRerun = () => {
      startedRef.current = false;
    };
    window.addEventListener('tripbuilt:tour-rerun', handleRerun);
    return () => window.removeEventListener('tripbuilt:tour-rerun', handleRerun);
  }, []);

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);
}
