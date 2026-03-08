export interface OperatorUnavailability {
  id: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  createdAt: string | null;
}

export function toDateInputValue(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

export function formatBlockedRange(slot: Pick<OperatorUnavailability, "startDate" | "endDate" | "reason">) {
  const formatter = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  });
  const start = formatter.format(new Date(slot.startDate));
  const end = formatter.format(new Date(slot.endDate));
  const label = start === end ? start : `${start}–${end}`;
  return slot.reason ? `${slot.reason} | ${label}` : `Unavailable | ${label}`;
}

export function slotOverlapsRange(
  slot: Pick<OperatorUnavailability, "startDate" | "endDate">,
  startDate: string,
  endDate: string,
) {
  return slot.startDate <= endDate && slot.endDate >= startDate;
}

export function getOverlappingAvailability(
  slots: OperatorUnavailability[],
  startDate: string,
  endDate: string,
) {
  return slots.filter((slot) => slotOverlapsRange(slot, startDate, endDate));
}

export function getBlockedSlotsForDay(
  slots: OperatorUnavailability[],
  year: number,
  month: number,
  day: number,
) {
  const value = new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
  return slots.filter((slot) => slot.startDate <= value && slot.endDate >= value);
}
