"use client";

import { Suspense } from "react";
import { CalendarCommandCenter } from "@/features/calendar/CalendarCommandCenter";
import { CalendarSkeleton } from "@/features/calendar/CalendarSkeleton";

export default function CalendarPage() {
  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <CalendarCommandCenter />
    </Suspense>
  );
}
