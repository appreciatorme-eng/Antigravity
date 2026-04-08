"use client";

import { useQuery } from "@tanstack/react-query";
import type { CalendarEvent } from "./types";

export type CalendarSource =
  | "trips"
  | "invoices"
  | "payments"
  | "proposals"
  | "follow_ups"
  | "social_posts"
  | "concierge"
  | "personal";

export type CalendarSourceError = {
  source: CalendarSource;
};

export type CalendarFeedResponse = {
  year: number;
  month: number;
  summary: {
    trips: number;
    invoices: number;
    payments: number;
    proposals: number;
    followUps: number;
    socialPosts: number;
    concierge: number;
    personal: number;
  };
  sourceErrors: CalendarSourceError[];
  events: CalendarEvent[];
};

export const calendarKeys = {
  all: ["calendar"] as const,
  events: (month: number, year: number) =>
    [...calendarKeys.all, "events", year, month] as const,
};

export async function fetchCalendarFeed(month: number, year: number): Promise<CalendarFeedResponse> {
  const params = new URLSearchParams({
    year: String(year),
    month: String(month + 1),
  });

  const response = await fetch(`/api/calendar/events?${params.toString()}`, {
    credentials: "include",
  });

  const payload = (await response.json().catch(() => null)) as
    | CalendarFeedResponse
    | { error?: string }
    | null;

  if (!response.ok) {
    throw new Error(
      payload && "error" in payload && payload.error
        ? payload.error
        : "Failed to load calendar events",
    );
  }

  if (!payload || !("events" in payload)) {
    throw new Error("Calendar feed returned an invalid payload");
  }

  return payload;
}

export function useCalendarEvents(month: number, year: number) {
  return useQuery({
    queryKey: calendarKeys.events(month, year),
    queryFn: () => fetchCalendarFeed(month, year),
    staleTime: 30_000,
  });
}
