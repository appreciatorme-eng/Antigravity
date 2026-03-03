import "server-only";

/* ------------------------------------------------------------------
 * Natural Language Date Parser -- converts human date expressions
 * to ISO dates (YYYY-MM-DD) using date-fns for all arithmetic.
 * ------------------------------------------------------------------ */

import { format, addDays, addWeeks, isValid, parse, startOfDay } from "date-fns";

const DATE_FORMAT = "yyyy-MM-dd";

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const IN_N_DAYS_REGEX = /^in\s+(\d+)\s+day(s)?$/i;

const IN_N_WEEKS_REGEX = /^in\s+(\d+)\s+week(s)?$/i;

const NEXT_WEEKDAY_REGEX = /^next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i;

const WEEKDAYS: Readonly<Record<string, number>> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const MONTH_FORMATS_SHORT_FIRST: readonly string[] = [
  "MMM d, yyyy",
  "MMMM d, yyyy",
  "MMM d",
  "MMMM d",
  "d MMM",
  "d MMMM",
];

function nextWeekday(targetDay: number): Date {
  const today = startOfDay(new Date());
  const currentDay = today.getDay();
  let daysUntil = targetDay - currentDay;
  if (daysUntil <= 0) daysUntil += 7;
  return addDays(today, daysUntil);
}

function formatDate(date: Date): string | null {
  if (!isValid(date)) {
    return null;
  }
  return format(date, DATE_FORMAT);
}

function tryParseFormats(input: string): string | null {
  const referenceDate = new Date();

  for (const fmt of MONTH_FORMATS_SHORT_FIRST) {
    try {
      const parsed = parse(input, fmt, referenceDate);
      if (isValid(parsed)) {
        return format(parsed, DATE_FORMAT);
      }
    } catch {
      continue;
    }
  }

  return null;
}

export function parseNaturalDate(input: string): string | null {
  const normalized = input.trim().toLowerCase();

  if (normalized.length === 0) {
    return null;
  }

  if (normalized === "today") {
    return formatDate(startOfDay(new Date()));
  }

  if (normalized === "tomorrow") {
    return formatDate(addDays(startOfDay(new Date()), 1));
  }

  if (normalized === "yesterday") {
    return formatDate(addDays(startOfDay(new Date()), -1));
  }

  const daysMatch = IN_N_DAYS_REGEX.exec(normalized);
  if (daysMatch) {
    const count = parseInt(daysMatch[1], 10);
    return formatDate(addDays(startOfDay(new Date()), count));
  }

  const weeksMatch = IN_N_WEEKS_REGEX.exec(normalized);
  if (weeksMatch) {
    const count = parseInt(weeksMatch[1], 10);
    return formatDate(addWeeks(startOfDay(new Date()), count));
  }

  const weekdayMatch = NEXT_WEEKDAY_REGEX.exec(normalized);
  if (weekdayMatch) {
    const dayName = weekdayMatch[1].toLowerCase();
    const targetDay = WEEKDAYS[dayName];
    if (targetDay !== undefined) {
      return formatDate(nextWeekday(targetDay));
    }
  }

  if (ISO_DATE_REGEX.test(normalized)) {
    const parsed = parse(normalized, DATE_FORMAT, new Date());
    if (isValid(parsed)) {
      return normalized;
    }
    return null;
  }

  const trimmedOriginal = input.trim();
  return tryParseFormats(trimmedOriginal);
}
