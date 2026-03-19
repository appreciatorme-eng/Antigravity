"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

/** Custom event name used to trigger the tour from anywhere (e.g. sidebar button) */
export const TOUR_START_EVENT = "tripbuilt:start-tour";

export default function DemoTour() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleStartTour = () => {
      // If already on admin dashboard, add tour param
      if (pathname === "/admin" || pathname === "/") {
        // Use replace to avoid pushing duplicate history entries
        router.replace("/admin?tour=tour-dashboard");
        // Force re-trigger by dispatching a custom event after a tick
        setTimeout(() => {
          window.dispatchEvent(new Event("tripbuilt:tour-rerun"));
        }, 100);
      } else {
        router.push("/admin?tour=tour-dashboard");
      }
    };

    window.addEventListener(TOUR_START_EVENT, handleStartTour);
    return () => window.removeEventListener(TOUR_START_EVENT, handleStartTour);
  }, [router, pathname]);

  return null; // No visible UI — driver.js handles everything
}
