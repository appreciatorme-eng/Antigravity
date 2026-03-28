"use client";

import { useRouter } from "next/navigation";
import { useTourToggle } from "@/lib/tour/tour-toggle-context";
import { TourCompletePrompt } from "./TourCompletePrompt";

/**
 * Wrapper that connects TourCompletePrompt to the tour toggle context.
 * Uses Next.js router for smooth SPA transitions (no hard reload).
 */
export function ConnectedTourCompletePrompt() {
  const router = useRouter();
  const { startFullAppTour, progress } = useTourToggle();

  return (
    <TourCompletePrompt
      progress={progress}
      onTourApp={() => {
        // #6: Use router + context instead of window.location.href
        router.push("/?tour=tour-dashboard");
        // Small delay to let navigation settle, then start full-app tour
        setTimeout(() => startFullAppTour(), 200);
      }}
      onDismiss={() => {}}
    />
  );
}
