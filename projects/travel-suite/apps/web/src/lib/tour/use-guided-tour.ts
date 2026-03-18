"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TOUR_MAP } from './tour-steps';
import type { TourStepConfig } from './tour-types';

const LS_KEY_SKIPPED = 'tripbuilt:tour_skipped';

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

export function useGuidedTour() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const driverRef = useRef<ReturnType<
    typeof import('driver.js').driver
  > | null>(null);
  const startedRef = useRef(false);

  const setupParam = searchParams.get('setup');

  const cleanup = useCallback(() => {
    if (driverRef.current) {
      driverRef.current.destroy();
      driverRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!setupParam || startedRef.current) return;

    const tourConfig = TOUR_MAP[setupParam];
    if (!tourConfig) return;

    // Check if user previously skipped this tour
    const skipped = JSON.parse(
      localStorage.getItem(LS_KEY_SKIPPED) || '{}',
    ) as Record<string, boolean>;
    if (skipped[setupParam]) return;

    startedRef.current = true;

    const initTour = async () => {
      const { driver } = await import('driver.js');
      // @ts-expect-error -- CSS import handled by Next.js bundler at runtime
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

      const d = driver({
        showProgress: true,
        animate: true,
        overlayColor: 'rgba(0, 0, 0, 0.6)',
        stagePadding: 8,
        stageRadius: 12,
        popoverClass: 'tripbuilt-tour-popover',
        nextBtnText: 'Next',
        prevBtnText: 'Back',
        doneBtnText: 'Done',
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
              JSON.stringify({ ...existing, [setupParam]: true }),
            );
          }

          d.destroy();

          // Only redirect back on completion (last step), not skip
          if (isLastStep) {
            router.push('/admin');
          }
        },
      });

      driverRef.current = d;

      // Small delay to let driver.js measure element positions after render
      requestAnimationFrame(() => {
        d.drive();
      });
    };

    // Delay slightly so the page has time to render all elements
    const timer = setTimeout(() => {
      void initTour();
    }, 600);

    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, [setupParam, router, cleanup]);

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);
}
