export interface TimeWindow {
  startISO: string;
  endISO: string;
  label: string;
}

export type DashboardRange = "1y" | "6m" | "3m" | "1m";

export const RANGE_TO_MONTHS: Record<DashboardRange, number> = {
  "1y": 12,
  "6m": 6,
  "3m": 3,
  "1m": 1,
};

export function toNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export function monthKeyFromDate(dateValue: string | null): string | null {
  if (!dateValue) return null;
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toLocaleDateString("en-US", { month: "short" });
}

export function getLastMonthKeys(count: number): string[] {
  const keys: string[] = [];
  const now = new Date();

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const monthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    keys.push(`${monthDate.getUTCFullYear()}-${String(monthDate.getUTCMonth() + 1).padStart(2, "0")}`);
  }

  return keys;
}

export function resolveWindow(monthKey: string | null, range: DashboardRange): TimeWindow {
  if (monthKey) {
    const [y, m] = monthKey.split("-").map(Number);
    if (Number.isFinite(y) && Number.isFinite(m) && m >= 1 && m <= 12) {
      const start = new Date(Date.UTC(y, m - 1, 1));
      const end = new Date(Date.UTC(y, m, 1));
      return {
        startISO: start.toISOString(),
        endISO: end.toISOString(),
        label: start.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      };
    }
  }

  const now = new Date();
  const months = RANGE_TO_MONTHS[range];
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  return {
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    label: `Last ${months} ${months === 1 ? "month" : "months"}`,
  };
}

export interface DriverCallout {
  title: string;
  detail: string;
  direction: "up" | "down" | "flat";
}

export interface MoMInputPoint {
  revenue: number;
  bookings: number;
  proposals?: number;
  conversionRate?: number;
}

function pctDelta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function directionFromDelta(delta: number): "up" | "down" | "flat" {
  if (delta > 0.25) return "up";
  if (delta < -0.25) return "down";
  return "flat";
}

export function buildMoMDriverCallouts(series: MoMInputPoint[]): DriverCallout[] {
  if (series.length < 2) return [];

  const current = series[series.length - 1];
  const previous = series[series.length - 2];

  const revenueDelta = pctDelta(current.revenue, previous.revenue);
  const bookingDelta = pctDelta(current.bookings, previous.bookings);
  const conversionDelta = pctDelta(current.conversionRate || 0, previous.conversionRate || 0);

  const callouts: DriverCallout[] = [
    {
      title: `Revenue ${revenueDelta >= 0 ? "up" : "down"} ${Math.abs(revenueDelta).toFixed(1)}%`,
      detail:
        revenueDelta >= 0
          ? "More payments collected this month — great job closing deals!"
          : "Fewer payments came in this month. Follow up on pending invoices.",
      direction: directionFromDelta(revenueDelta),
    },
    {
      title: `Bookings ${bookingDelta >= 0 ? "up" : "down"} ${Math.abs(bookingDelta).toFixed(1)}%`,
      detail:
        bookingDelta >= 0
          ? "More trips confirmed! Your quotes are converting well."
          : "Fewer trips booked. Try following up on open quotes sooner.",
      direction: directionFromDelta(bookingDelta),
    },
    {
      title: `Conversion ${conversionDelta >= 0 ? "up" : "down"} ${Math.abs(conversionDelta).toFixed(1)}%`,
      detail:
        conversionDelta >= 0
          ? "More enquiries turning into bookings — keep it up!"
          : "Enquiries are taking longer to convert. Quick follow-ups can help.",
      direction: directionFromDelta(conversionDelta),
    },
  ];

  return callouts;
}
