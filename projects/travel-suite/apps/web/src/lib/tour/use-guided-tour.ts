"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TOUR_MAP } from './tour-steps';
import { APP_TOUR_MAP } from './app-tour-steps';
import type { TourStepConfig, TourConfig } from './tour-types';

const LS_KEY_SKIPPED = 'tripbuilt:tour_skipped';
const SS_KEY_CONTINUE = 'tripbuilt:tour_continue';

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

export function useGuidedTour() {
  const searchParams = useSearchParams();
  const router = useRouter();
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

  useEffect(() => {
    if (!activeTourId || startedRef.current) return;

    const tourConfig = findTourConfig(activeTourId);
    if (!tourConfig) return;

    // For app tours (?tour= param), skip localStorage skip-flag checks —
    // they should always run when explicitly triggered.
    if (!isAppTour) {
      // Check if user previously skipped this tour.
      // If ?setup= is in the URL, the user explicitly clicked from the setup wizard
      // so always run the tour (clear the skip flag for this tour and any linked tours).
      const skipped = JSON.parse(
        localStorage.getItem(LS_KEY_SKIPPED) || '{}',
      ) as Record<string, boolean>;

      if (setupParam) {
        // User explicitly requested this tour — clear any previous skip
        delete skipped[setupParam];
        delete skipped['share-detail']; // Clear linked continuation tour too
        localStorage.setItem(LS_KEY_SKIPPED, JSON.stringify(skipped));
      } else if (skipped[activeTourId]) {
        return;
      }
    }

    // Clear the sessionStorage continuation flag once consumed
    if (continueTourId) {
      sessionStorage.removeItem(SS_KEY_CONTINUE);
    }

    startedRef.current = true;

    const initTour = async () => {
      const { driver } = await import('driver.js');
      await import('driver.js/dist/driver.css');

      // Build steps, filtering out those whose elements don't exist (for async ones)
      const validSteps: Array<{
        element: string;
        popover: TourStepConfig['popover'];
      }> = [];

      for (const step of tourConfig.steps) {
        if (step.waitForElement) {
          const found = await waitForElement(step.element, 8_000);
          if (!found) continue; // Skip steps where async element never appeared
        } else {
          // For non-async steps, give a brief moment for DOM to settle
          await waitForElement(step.element, 2_000);
          if (!document.querySelector(step.element)) continue;
        }
        validSteps.push({
          element: step.element,
          popover: step.popover,
        });
      }

      if (validSteps.length === 0) return;

      // For multi-page tours: pre-set the continuation flag immediately
      // so it's ready when the user naturally clicks away (e.g. clicking a trip row)
      if (activeTourId === 'share') {
        sessionStorage.setItem(SS_KEY_CONTINUE, 'share-detail');
      }

      const d = driver({
        showProgress: true,
        animate: true,
        overlayColor: 'rgba(0, 0, 0, 0.6)',
        stagePadding: 8,
        stageRadius: 12,
        popoverClass: 'tripbuilt-tour-popover',
        nextBtnText: 'Next',
        prevBtnText: 'Back',
        doneBtnText: tourConfig.nextPage ? 'Continue →' : 'Done ✓',
        showButtons: ['next', 'previous', 'close'],
        steps: validSteps,
        onDestroyStarted: () => {
          // If not on the last step, treat as skip
          const activeIndex = d.getActiveIndex();
          const isLastStep = activeIndex === validSteps.length - 1;

          if (!isLastStep) {
            // Mark as skipped so it doesn't auto-start again
            const existing = JSON.parse(
              localStorage.getItem(LS_KEY_SKIPPED) || '{}',
            ) as Record<string, boolean>;
            localStorage.setItem(
              LS_KEY_SKIPPED,
              JSON.stringify({ ...existing, [activeTourId]: true }),
            );
            // Clear any pending continuation on skip
            sessionStorage.removeItem(SS_KEY_CONTINUE);
          }

          d.destroy();

          // On completion, navigate to next tour page or redirect to dashboard
          if (isLastStep) {
            if (tourConfig.nextPage) {
              router.push(tourConfig.nextPage);
            } else if (activeTourId !== 'share') {
              router.push('/admin');
            }
          }
        },
      });

      driverRef.current = d;

      // Auto-dismiss tour when user clicks any highlighted element
      // (e.g. clicking "Scan QR Code" opens a modal — tour should get out of the way)
      const handleHighlightClick = () => {
        setTimeout(() => {
          if (driverRef.current) {
            driverRef.current.destroy();
          }
        }, 150);
      };

      // Attach click listener whenever a new element is highlighted
      const observer = new MutationObserver(() => {
        const activeEl = document.querySelector('.driver-active-element');
        if (activeEl && !activeEl.hasAttribute('data-tour-click-attached')) {
          activeEl.setAttribute('data-tour-click-attached', 'true');
          activeEl.addEventListener('click', handleHighlightClick, { once: true });
        }
      });
      observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });

      // Small delay to let driver.js measure element positions after render
      requestAnimationFrame(() => {
        d.drive();
      });

      // Return cleanup for the observer
      return () => observer.disconnect();
    };

    // Delay slightly so the page has time to render all elements
    let observerCleanup: (() => void) | undefined;
    const timer = setTimeout(() => {
      const maybeCleanup = initTour();
      void maybeCleanup.then((fn) => { observerCleanup = fn; });
    }, 600);

    return () => {
      clearTimeout(timer);
      observerCleanup?.();
      cleanup();
    };
  }, [activeTourId, setupParam, isAppTour, continueTourId, router, cleanup]);

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
