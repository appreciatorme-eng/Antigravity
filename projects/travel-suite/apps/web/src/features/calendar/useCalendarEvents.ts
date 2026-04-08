"use client";

import { useQuery } from "@tanstack/react-query";
import type { CalendarEvent } from "./types";

export const calendarKeys = {
  all: ["calendar"] as const,
  events: (month: number, year: number) =>
    [...calendarKeys.all, "events", year, month] as const,
};

type CalendarEventsResponse = {
  year: number;
  month: number;
  summary: {
    trips: number;
    invoices: number;
    payments: number;
    proposals: number;
    followUps: number;
  };
  events: CalendarEvent[];
};

export function useCalendarEvents(month: number, year: number) {
  return useQuery({
    queryKey: calendarKeys.events(month, year),
    queryFn: async (): Promise<CalendarEvent[]> => {
      const params = new URLSearchParams({
        year: String(year),
        month: String(month + 1),
      });

      const response = await fetch(`/api/calendar/events?${params.toString()}`, {
        credentials: "include",
      });

      const payload = (await response.json().catch(() => null)) as
        | CalendarEventsResponse
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload && "error" in payload && payload.error ? payload.error : "Failed to load calendar events");
      }

      return payload && "events" in payload ? payload.events : [];
    },
    staleTime: 30_000,
  });
}
