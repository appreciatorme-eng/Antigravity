"use client";

import { useQuery } from "@tanstack/react-query";
import type { OperatorUnavailability } from "./availability";

export const calendarAvailabilityKeys = {
  all: ["calendar", "availability"] as const,
  month: (month: number, year: number) =>
    [...calendarAvailabilityKeys.all, year, month] as const,
};

export function useCalendarAvailability(month: number, year: number) {
  return useQuery({
    queryKey: calendarAvailabilityKeys.month(month, year),
    queryFn: async (): Promise<OperatorUnavailability[]> => {
      const firstOfMonth = new Date(year, month, 1);
      const lastOfMonth = new Date(year, month + 1, 0);

      const windowStart = new Date(firstOfMonth);
      windowStart.setDate(windowStart.getDate() - 7);

      const windowEnd = new Date(lastOfMonth);
      windowEnd.setDate(windowEnd.getDate() + 7);

      const params = new URLSearchParams({
        from: windowStart.toISOString().slice(0, 10),
        to: windowEnd.toISOString().slice(0, 10),
      });

      const response = await fetch(`/api/availability?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | { data?: OperatorUnavailability[]; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to load blocked dates");
      }

      return Array.isArray(payload?.data) ? payload.data : [];
    },
    staleTime: 30_000,
  });
}
