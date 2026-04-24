import type { Day, HotelDetails, ItineraryResult } from '@/types/itinerary';

const normalizeDateValue = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const isoLike = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoLike) return isoLike[1];

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

const isDateWithinStay = (dayDate: string, hotel: HotelDetails) => {
  const checkIn = normalizeDateValue(hotel.check_in);
  const checkOut = normalizeDateValue(hotel.check_out);
  if (!checkIn && !checkOut) return false;
  if (checkIn && dayDate < checkIn) return false;
  if (checkOut && dayDate > checkOut) return false;
  return true;
};

export const resolveHotelForDay = (
  itinerary: ItineraryResult,
  day: Pick<Day, 'day_number' | 'date'>,
  dayIndex: number,
) => {
  const hotels = itinerary.logistics?.hotels || [];
  if (!hotels.length) return null;

  const normalizedDay = normalizeDateValue(day.date);
  if (normalizedDay) {
    const matchingHotel = hotels.find((hotel) => isDateWithinStay(normalizedDay, hotel));
    if (matchingHotel) return matchingHotel;
  }

  return hotels[Math.min(dayIndex, hotels.length - 1)] || hotels[0] || null;
};

const createStableHash = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
};

const ORG_CODE_STOP_WORDS = new Set([
  'AND',
  'COMPANY',
  'HOLIDAY',
  'HOLIDAYS',
  'LLP',
  'LTD',
  'PRIVATE',
  'PVT',
  'THE',
  'TOUR',
  'TOURS',
  'TRAVEL',
  'TRAVELS',
]);

const buildOrganizationCode = (value?: string | null) => {
  const words = (value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const meaningfulWords = words.filter((word) => !ORG_CODE_STOP_WORDS.has(word));
  const selectedWords = meaningfulWords.length ? meaningfulWords : words;

  if (!selectedWords.length) return 'ORG';
  if (selectedWords.length === 1) {
    return selectedWords[0].slice(0, 4).padEnd(3, 'X');
  }

  const initials = selectedWords.map((word) => word[0]).join('');
  if (initials.length >= 3) return initials.slice(0, 4);
  return `${initials}${selectedWords[0].slice(1)}`.slice(0, 3).padEnd(3, 'X');
};

const buildShortDateCode = (value?: string | null) => {
  const normalized = normalizeDateValue(value);
  if (!normalized) return '000000';
  const [year, month, day] = normalized.split('-');
  return `${year.slice(2)}${month}${day}`;
};

export type ItineraryReferenceContext = {
  organizationName?: string | null;
  issuedAt?: string | null;
  sequenceSource?: string | null;
};

export const buildItineraryReferenceNumber = (itinerary: Pick<
  ItineraryResult,
  'trip_title' | 'destination' | 'start_date' | 'end_date' | 'duration_days' | 'days' | 'branding'
>, context: ItineraryReferenceContext = {}) => {
  const issuedDate =
    context.issuedAt ||
    normalizeDateValue(itinerary.start_date) ||
    normalizeDateValue(itinerary.days?.[0]?.date) ||
    normalizeDateValue(itinerary.end_date);
  const orgCode = buildOrganizationCode(
    context.organizationName || itinerary.branding?.organizationName,
  );
  const dateCode = buildShortDateCode(issuedDate);
  const seed = [
    dateCode,
    orgCode,
    context.sequenceSource || '',
    itinerary.trip_title || '',
    itinerary.destination || '',
    normalizeDateValue(itinerary.start_date) || '',
    normalizeDateValue(itinerary.end_date) || '',
    String(itinerary.duration_days || itinerary.days?.length || 0),
    String(itinerary.days?.length || 0),
  ].join('|');
  const dailySequence = (Number.parseInt(createStableHash(seed).slice(0, 8), 16) % 99) + 1;

  return `TB-${orgCode}-${dateCode}-${String(dailySequence).padStart(2, '0')}`;
};
