import { STATUS_VARIANT_MAP } from "./constants";
import type { BadgeVariant, CalendarEvent, EventLane, PersonalEventData } from "./types";

// ---------------------------------------------------------------------------
// Date arithmetic helpers
// ---------------------------------------------------------------------------

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/**
 * Returns an array representing the calendar grid for a month.
 * Leading `null` entries pad the grid so day 1 aligns to its weekday column.
 */
export function getMonthDays(year: number, month: number): (number | null)[] {
  const firstDay = getFirstDayOfMonth(year, month);
  const totalDays = getDaysInMonth(year, month);

  const padding: (number | null)[] = Array.from<null>({ length: firstDay }).fill(null);
  const days: (number | null)[] = Array.from({ length: totalDays }, (_, i) => i + 1);

  return [...padding, ...days];
}

// ---------------------------------------------------------------------------
// Event filtering
// ---------------------------------------------------------------------------

/**
 * Returns events whose date range overlaps with the given day.
 */
export function getEventsForDay(
  events: CalendarEvent[],
  year: number,
  month: number,
  day: number,
): CalendarEvent[] {
  const dayStart = new Date(year, month, day, 0, 0, 0, 0);
  const dayEnd = new Date(year, month, day, 23, 59, 59, 999);

  return events.filter((event) => {
    const eventStart = new Date(event.startDate);
    const eventEnd = event.endDate ? new Date(event.endDate) : eventStart;

    return eventStart <= dayEnd && eventEnd >= dayStart;
  });
}

// ---------------------------------------------------------------------------
// Week helpers
// ---------------------------------------------------------------------------

/**
 * Returns an array of 7 Date objects for the week (Sun-Sat) that contains
 * the given date.
 */
export function getWeekDates(date: Date): Date[] {
  const dayOfWeek = date.getDay();
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - dayOfWeek);
  sunday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

/**
 * Returns all week ranges that cover the month grid (including leading/
 * trailing days from adjacent months).
 */
export function getWeeksInMonth(
  year: number,
  month: number,
): { weekStart: Date; weekEnd: Date }[] {
  const firstDay = new Date(year, month, 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());
  gridStart.setHours(0, 0, 0, 0);

  const lastDay = new Date(year, month, getDaysInMonth(year, month));
  const gridEnd = new Date(lastDay);
  gridEnd.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
  gridEnd.setHours(23, 59, 59, 999);

  const weeks: { weekStart: Date; weekEnd: Date }[] = [];
  const cursor = new Date(gridStart);

  while (cursor <= gridEnd) {
    const weekStart = new Date(cursor);
    const weekEnd = new Date(cursor);
    weekEnd.setDate(cursor.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    weeks.push({ weekStart, weekEnd });
    cursor.setDate(cursor.getDate() + 7);
  }

  return weeks;
}

// ---------------------------------------------------------------------------
// Date comparison helpers
// ---------------------------------------------------------------------------

export function isToday(year: number, month: number, day: number): boolean {
  const now = new Date();
  return (
    now.getFullYear() === year &&
    now.getMonth() === month &&
    now.getDate() === day
  );
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/**
 * Formats a date range as "Mar 3" or "Mar 3 — Mar 8".
 */
export function formatDateRange(start: string, end: string | null): string {
  const startDate = new Date(start);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (!end) return fmt(startDate);

  const endDate = new Date(end);
  if (isSameDay(startDate, endDate)) return fmt(startDate);

  return `${fmt(startDate)} — ${fmt(endDate)}`;
}

/**
 * Formats an amount in Indian Rupee locale (e.g. "₹1,23,456").
 * Returns empty string if amount is null.
 */
export function formatAmount(
  amount: number | null,
  currency?: string | null,
): string {
  if (amount === null || amount === undefined) return "";

  const symbol = currency === "USD" ? "$" : "₹";
  const locale = currency === "USD" ? "en-US" : "en-IN";

  return `${symbol}${amount.toLocaleString(locale, { maximumFractionDigits: 0 })}`;
}

// ---------------------------------------------------------------------------
// Status → badge variant lookup
// ---------------------------------------------------------------------------

export function getStatusVariant(status: string): BadgeVariant {
  const normalized = status.toLowerCase().trim();
  return STATUS_VARIANT_MAP[normalized] ?? "default";
}

// ---------------------------------------------------------------------------
// Lane assignment for multi-day events in week view
// ---------------------------------------------------------------------------

/**
 * Assigns lane positions to multi-day events that overlap a given week.
 *
 * Algorithm:
 * 1. Filter to events spanning more than one day that overlap the week
 * 2. Sort by start date, then by duration (longest first)
 * 3. Greedily assign each event to the first available lane (row)
 * 4. Clamp startCol and span to the visible week boundaries
 */
export function computeEventLanes(
  events: CalendarEvent[],
  weekStart: Date,
  weekEnd: Date,
  monthStart: Date,
  monthEnd: Date,
): EventLane[] {
  const weekStartTime = weekStart.getTime();
  const weekEndTime = weekEnd.getTime();

  // Filter to multi-day events overlapping this week
  const multiDayEvents = events.filter((event) => {
    if (!event.endDate) return false;

    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);

    // Must span more than a single calendar day
    if (isSameDay(eventStart, eventEnd)) return false;

    // Must overlap the week
    return eventStart.getTime() <= weekEndTime && eventEnd.getTime() >= weekStartTime;
  });

  // Sort: earliest start first, then longest duration first
  const sorted = [...multiDayEvents].sort((a, b) => {
    const aStart = new Date(a.startDate).getTime();
    const bStart = new Date(b.startDate).getTime();
    if (aStart !== bStart) return aStart - bStart;

    const aEnd = new Date(a.endDate!).getTime();
    const bEnd = new Date(b.endDate!).getTime();
    return bEnd - bStart - (aEnd - aStart); // longer first
  });

  // Track which columns are occupied in each lane
  // lanes[laneIndex] = Set of occupied column indices (0-6)
  const lanes: Set<number>[] = [];

  return sorted.map((event) => {
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate!);

    // Clamp to week + month boundaries
    const clampedStart = new Date(
      Math.max(eventStart.getTime(), weekStartTime, monthStart.getTime()),
    );
    const clampedEnd = new Date(
      Math.min(eventEnd.getTime(), weekEndTime, monthEnd.getTime()),
    );

    const startCol = clampedStart.getDay();
    const endCol = clampedEnd.getDay();
    const span = Math.max(1, endCol - startCol + 1);

    // Columns this event will occupy
    const occupiedCols = new Set(
      Array.from({ length: span }, (_, i) => startCol + i),
    );

    // Find the first lane with no overlap
    let assignedLane = -1;
    for (let l = 0; l < lanes.length; l++) {
      const hasConflict = [...occupiedCols].some((col) => lanes[l].has(col));
      if (!hasConflict) {
        assignedLane = l;
        break;
      }
    }

    if (assignedLane === -1) {
      assignedLane = lanes.length;
      lanes.push(new Set<number>());
    }

    // Mark columns as occupied in this lane
    for (const col of occupiedCols) {
      lanes[assignedLane].add(col);
    }

    return { event, startCol, span, lane: assignedLane };
  });
}

// ---------------------------------------------------------------------------
// Time grid helpers (Day / Week views)
// ---------------------------------------------------------------------------

/**
 * Convert a Date to pixel offset from the top of the time grid.
 */
export function timeToPixelOffset(
  date: Date,
  startHour: number,
  hourHeight: number,
): number {
  const hours = date.getHours() + date.getMinutes() / 60;
  return Math.max(0, (hours - startHour) * hourHeight);
}

/**
 * Split a day's events into all-day (multi-day + explicit allDay) vs timed.
 */
export function partitionDayEvents(
  events: CalendarEvent[],
  year: number,
  month: number,
  day: number,
): { allDay: CalendarEvent[]; timed: CalendarEvent[] } {
  const dayEvents = getEventsForDay(events, year, month, day);
  const allDay: CalendarEvent[] = [];
  const timed: CalendarEvent[] = [];

  for (const event of dayEvents) {
    const start = new Date(event.startDate);
    const end = event.endDate ? new Date(event.endDate) : start;
    const isMultiDay = !isSameDay(start, end);
    const isAllDay =
      event.entityData.type === "personal" &&
      (event.entityData as PersonalEventData).allDay;

    if (isMultiDay || isAllDay) {
      allDay.push(event);
    } else {
      timed.push(event);
    }
  }

  return { allDay, timed };
}

/**
 * Assign side-by-side columns to overlapping timed events.
 * Uses a greedy sweep-line approach.
 */
export function computeTimeGridColumns(
  events: CalendarEvent[],
): Array<{ event: CalendarEvent; column: number; totalColumns: number }> {
  if (events.length === 0) return [];

  const sorted = [...events].sort((a, b) => {
    const aStart = new Date(a.startDate).getTime();
    const bStart = new Date(b.startDate).getTime();
    if (aStart !== bStart) return aStart - bStart;
    const aEnd = a.endDate ? new Date(a.endDate).getTime() : aStart + 3600000;
    const bEnd = b.endDate ? new Date(b.endDate).getTime() : bStart + 3600000;
    return (bEnd - bStart) - (aEnd - aStart);
  });

  const clusters: CalendarEvent[][] = [];
  let currentCluster: CalendarEvent[] = [];
  let clusterEnd = 0;

  for (const event of sorted) {
    const eventStart = new Date(event.startDate).getTime();
    const eventEnd = event.endDate
      ? new Date(event.endDate).getTime()
      : eventStart + 3600000;

    if (currentCluster.length === 0 || eventStart < clusterEnd) {
      currentCluster.push(event);
      clusterEnd = Math.max(clusterEnd, eventEnd);
    } else {
      clusters.push(currentCluster);
      currentCluster = [event];
      clusterEnd = eventEnd;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  const result: Array<{ event: CalendarEvent; column: number; totalColumns: number }> = [];

  for (const cluster of clusters) {
    const columns: CalendarEvent[][] = [];

    for (const event of cluster) {
      const eventStart = new Date(event.startDate).getTime();
      let placed = false;

      for (let col = 0; col < columns.length; col++) {
        const lastInCol = columns[col][columns[col].length - 1];
        const lastEnd = lastInCol.endDate
          ? new Date(lastInCol.endDate).getTime()
          : new Date(lastInCol.startDate).getTime() + 3600000;

        if (eventStart >= lastEnd) {
          columns[col].push(event);
          placed = true;
          break;
        }
      }

      if (!placed) {
        columns.push([event]);
      }
    }

    const totalColumns = columns.length;
    for (let col = 0; col < columns.length; col++) {
      for (const event of columns[col]) {
        result.push({ event, column: col, totalColumns });
      }
    }
  }

  return result;
}

/**
 * Format an hour number (0-23) as a display label.
 */
export function formatHourLabel(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}
