"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
  const supabase = useMemo(() => createClient(), []);

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

    if (isDemoMode) {
      return () => {
        isDisposed = true;
        controller.abort();
      };
    }

    const channel = supabase
      .channel("nav-counts-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "whatsapp_webhook_events" },
        () => {
          void loadCounts();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "proposals" },
        () => {
          void loadCounts();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trips" },
        () => {
          void loadCounts();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reputation_reviews" },
        () => {
          void loadCounts();
        },
      )
      .subscribe();

    return () => {
      isDisposed = true;
      controller.abort();
      void supabase.removeChannel(channel);
    };
  }, [demoOrgId, isDemoMode, supabase]);

  return counts;
}
