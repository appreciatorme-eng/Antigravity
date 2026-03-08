export type AdminDateRangePreset = "today" | "7d" | "30d" | "90d" | "custom";

export interface AdminDateRangeSelection {
  preset: AdminDateRangePreset;
  from: string;
  to: string;
  label: string;
}

export interface ResolvedAdminDateRange extends AdminDateRangeSelection {
  fromDate: Date;
  toDate: Date;
  fromISO: string;
  toISO: string;
  toExclusiveISO: string;
  dayCount: number;
  granularity: "day" | "month";
}

function toUtcDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
}

function startOfUtcDay(value: Date) {
  return toUtcDate(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
}

function addUtcDays(value: Date, days: number) {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return startOfUtcDay(next);
}

function safeDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : startOfUtcDay(date);
}

export function toInputDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function formatRangeLabel(from: Date, to: Date) {
  const sameYear = from.getUTCFullYear() === to.getUTCFullYear();
  const fromLabel = from.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: "UTC",
  });
  const toLabel = to.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  if (toInputDate(from) === toInputDate(to)) {
    return toLabel;
  }

  return `${fromLabel} → ${toLabel}`;
}

export function createPresetRange(preset: Exclude<AdminDateRangePreset, "custom">): AdminDateRangeSelection {
  const today = startOfUtcDay(new Date());
  let from = today;
  let label = "Today";

  if (preset === "7d") {
    from = addUtcDays(today, -6);
    label = "Last 7 days";
  } else if (preset === "30d") {
    from = addUtcDays(today, -29);
    label = "Last 30 days";
  } else if (preset === "90d") {
    from = addUtcDays(today, -89);
    label = "Last 90 days";
  }

  return {
    preset,
    from: toInputDate(from),
    to: toInputDate(today),
    label,
  };
}

export function createCustomRange(from: Date, to: Date): AdminDateRangeSelection {
  const safeFrom = startOfUtcDay(from <= to ? from : to);
  const safeTo = startOfUtcDay(to >= from ? to : from);
  return {
    preset: "custom",
    from: toInputDate(safeFrom),
    to: toInputDate(safeTo),
    label: formatRangeLabel(safeFrom, safeTo),
  };
}

export function resolveAdminDateRange(
  searchParams?: URLSearchParams | null,
  fallbackPreset: Exclude<AdminDateRangePreset, "custom"> = "30d",
): ResolvedAdminDateRange {
  const presetParam = searchParams?.get("preset");
  const preset =
    presetParam === "today" ||
    presetParam === "7d" ||
    presetParam === "30d" ||
    presetParam === "90d" ||
    presetParam === "custom"
      ? presetParam
      : fallbackPreset;

  const fallback = createPresetRange(fallbackPreset);
  const fallbackFrom = safeDate(fallback.from)!;
  const fallbackTo = safeDate(fallback.to)!;

  const customFrom = safeDate(searchParams?.get("from"));
  const customTo = safeDate(searchParams?.get("to"));

  const baseSelection =
    preset === "custom" && customFrom && customTo
      ? createCustomRange(customFrom, customTo)
      : preset === "custom"
        ? fallback
        : createPresetRange(preset);

  const fromDate = safeDate(baseSelection.from) || fallbackFrom;
  const toDate = safeDate(baseSelection.to) || fallbackTo;
  const dayCount = Math.max(
    1,
    Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
  );

  return {
    ...baseSelection,
    fromDate,
    toDate,
    fromISO: fromDate.toISOString(),
    toISO: toDate.toISOString(),
    toExclusiveISO: addUtcDays(toDate, 1).toISOString(),
    dayCount,
    granularity: dayCount <= 45 ? "day" : "month",
  };
}
