"use client";

import { Suspense } from 'react';
import { useGuidedTour } from '@/lib/tour/use-guided-tour';

function GuidedTourInner() {
  useGuidedTour();
  return null; // driver.js creates its own overlay portal
}

/** Mount on any page that should support guided setup tours.
 *  Reads `?setup=<tourId>` from URL and starts the matching tour. */
export function GuidedTour() {
  return (
    <Suspense fallback={null}>
      <GuidedTourInner />
    </Suspense>
  );
}
