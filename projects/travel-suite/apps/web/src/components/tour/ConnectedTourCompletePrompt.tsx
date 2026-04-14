"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTourToggle } from "@/lib/tour/tour-toggle-context";
import { getNextTourPage, getTourIdForPath } from "@/lib/tour/tour-registry";
import { TourCompletePrompt } from "./TourCompletePrompt";

/**
 * Wrapper that connects TourCompletePrompt to the tour toggle context.
 * Navigates to the NEXT page in the tour sequence (not back to dashboard).
 */
export function ConnectedTourCompletePrompt() {
  const router = useRouter();
  const pathname = usePathname();
  const { progress } = useTourToggle();

  return (
    <TourCompletePrompt
      progress={progress}
      onTourApp={() => {
        const currentPath = pathname ?? "/";
        const nextPage = getNextTourPage(currentPath);

        if (nextPage) {
          // Set full-app mode so subsequent pages chain correctly
          try {
            sessionStorage.setItem("tripbuilt:tour_mode", "full-app");
          } catch { /* noop */ }

          const nextTourId = getTourIdForPath(nextPage);
          router.push(nextTourId ? `${nextPage}?tour=${nextTourId}` : nextPage);
        } else {
          // Already on the last page — start from the beginning
          try {
            sessionStorage.setItem("tripbuilt:tour_mode", "full-app");
          } catch { /* noop */ }

          router.push("/?tour=tour-dashboard");
        }
      }}
      onDismiss={() => {}}
    />
  );
}
