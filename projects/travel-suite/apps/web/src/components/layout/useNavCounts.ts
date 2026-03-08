"use client";

import { useEffect, useState } from "react";
import { useDemoMode } from "@/lib/demo/demo-mode-context";

export interface NavCounts {
  inboxUnread: number;
  proposalsPending: number;
  bookingsToday: number;
  reviewsNeedingResponse: number;
}

const EMPTY_COUNTS: NavCounts = {
  inboxUnread: 0,
  proposalsPending: 0,
  bookingsToday: 0,
  reviewsNeedingResponse: 0,
};

export function useNavCounts() {
  const { isDemoMode, demoOrgId } = useDemoMode();
  const [counts, setCounts] = useState<NavCounts>(EMPTY_COUNTS);

  useEffect(() => {
    let isDisposed = false;
    const controller = new AbortController();

    const loadCounts = async () => {
      try {
        const headers = new Headers();
        if (isDemoMode) {
          headers.set("X-Demo-Org-Id", demoOrgId);
        }

        const response = await fetch("/api/nav/counts", {
          headers,
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) return;

        const payload = (await response.json()) as Partial<NavCounts>;
        if (!isDisposed) {
          setCounts({
            inboxUnread: payload.inboxUnread ?? 0,
            proposalsPending: payload.proposalsPending ?? 0,
            bookingsToday: payload.bookingsToday ?? 0,
            reviewsNeedingResponse: payload.reviewsNeedingResponse ?? 0,
          });
        }
      } catch (error) {
        if (
          error instanceof DOMException &&
          (error.name === "AbortError" || error.message === "signal is aborted without reason")
        ) {
          return;
        }
        console.error("[useNavCounts] Failed to refresh navigation counts", error);
      }
    };

    void loadCounts();
    const intervalId = window.setInterval(() => {
      void loadCounts();
    }, 60_000);

    return () => {
      isDisposed = true;
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [demoOrgId, isDemoMode]);

  return counts;
}
