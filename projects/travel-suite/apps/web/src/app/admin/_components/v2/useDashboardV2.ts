import { useEffect, useMemo, useState } from "react";
import {
  createPresetRange,
  type AdminDateRangeSelection,
} from "@/lib/admin/date-range";
import { useDemoFetch } from "@/lib/demo/use-demo-fetch";
import { createClient } from "@/lib/supabase/client";
import type { DashboardOverview, DashboardPhase, DashboardV2State } from "./types";

export function useDashboardV2(): DashboardV2State {
  const supabase = useMemo(() => createClient(), []);
  const demoFetch = useDemoFetch();

  const [phase, setPhase] = useState<DashboardPhase>("loading");
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<AdminDateRangeSelection>(() =>
    createPresetRange("30d"),
  );

  const rangeQuery = useMemo(() => {
    const params = new URLSearchParams({
      preset: dateRange.preset,
      from: dateRange.from,
      to: dateRange.to,
    });
    return params.toString();
  }, [dateRange]);

  useEffect(() => {
    let cancelled = false;

    async function fetchOverview() {
      setPhase("loading");
      setError(null);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }

        const response = await demoFetch(`/api/admin/dashboard/overview?${rangeQuery}`, {
          headers,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Dashboard overview failed: ${response.status}`);
        }

        const payload = (await response.json()) as
          | { data?: DashboardOverview | null; error?: string | null }
          | DashboardOverview;
        const nextOverview =
          "data" in payload && payload.data ? payload.data : (payload as DashboardOverview);

        if (cancelled) return;

        setOverview(nextOverview);
        setPhase("ready");
      } catch (fetchError) {
        if (cancelled) return;
        console.error("Dashboard overview fetch failed:", fetchError);
        setError("Failed to load dashboard overview");
        setPhase("error");
      }
    }

    void fetchOverview();

    return () => {
      cancelled = true;
    };
  }, [demoFetch, rangeQuery, supabase]);

  return {
    phase,
    overview,
    error,
    dateRange,
    setDateRange,
  };
}
