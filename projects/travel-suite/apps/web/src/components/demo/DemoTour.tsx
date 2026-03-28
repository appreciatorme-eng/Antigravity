"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getTourIdForPath } from "@/lib/tour/tour-registry";
import { TOUR_PAGE_START } from "@/lib/tour/tour-toggle-context";

/** Custom event name used to trigger the tour from anywhere (e.g. sidebar button) */
export const TOUR_START_EVENT = "tripbuilt:start-tour";

export default function DemoTour() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleStartTour = () => {
      const currentPath = pathname ?? "/";
      const tourId = getTourIdForPath(currentPath);

      if (tourId) {
        // Current page has a tour — start it in page mode
        try {
          sessionStorage.setItem("tripbuilt:tour_mode", "page");
        } catch { /* noop */ }

        window.dispatchEvent(
          new CustomEvent(TOUR_PAGE_START, {
            detail: { tourId, mode: "page" },
          })
        );
      } else {
        // No tour for current page — start full-app tour from dashboard
        try {
          sessionStorage.setItem("tripbuilt:tour_mode", "full-app");
        } catch { /* noop */ }

        if (currentPath === "/admin" || currentPath === "/") {
          router.replace("/admin?tour=tour-dashboard");
          setTimeout(() => {
            window.dispatchEvent(new Event("tripbuilt:tour-rerun"));
          }, 100);
        } else {
          router.push("/admin?tour=tour-dashboard");
        }
      }
    };

    window.addEventListener(TOUR_START_EVENT, handleStartTour);
    return () => window.removeEventListener(TOUR_START_EVENT, handleStartTour);
  }, [router, pathname]);

  return null;
}
