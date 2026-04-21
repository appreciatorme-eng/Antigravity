"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CircleCheckBig,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";

import type { TripRequestFormState } from "@/lib/whatsapp/trip-intake.server";
import { cn } from "@/lib/utils";

const DESTINATION_OPTIONS = [
  "Bali",
  "Dubai",
  "Singapore",
  "Thailand",
  "Phuket",
  "Krabi",
  "Maldives",
  "Sri Lanka",
  "Kerala",
  "Kashmir",
  "Goa",
  "Andaman",
  "Shimla",
  "Manali",
  "Delhi",
  "Rajasthan",
  "Ladakh",
  "Vietnam",
  "Japan",
  "Europe",
  "Turkey",
  "Azerbaijan",
  "Georgia",
  "Seychelles",
] as const;

const ORIGIN_OPTIONS = [
  "Hyderabad",
  "Bengaluru",
  "Chennai",
  "Mumbai",
  "Delhi",
  "Kolkata",
  "Visakhapatnam",
  "Vijayawada",
  "Rajahmundry",
  "Tirupati",
  "Cochin",
  "Ahmedabad",
  "Pune",
  "Doha",
  "Dubai",
] as const;

const INTEREST_OPTIONS = [
  "Beach escapes",
  "Family holiday",
  "Honeymoon",
  "Luxury stays",
  "Adventure",
  "Shopping",
  "Culture",
  "Nature",
  "Food",
  "Relaxation",
] as const;

const HOTEL_OPTIONS = ["3 star", "4 star", "5 star", "Boutique", "Villa", "Flexible"] as const;
const BUDGET_OPTIONS = ["Under 50k", "50k - 1L", "1L - 2L", "2L - 4L", "Luxury"] as const;
const TRAVELER_OPTIONS = [1, 2, 4, 6] as const;
const COUNTRY_CODE_OPTIONS = ["+91", "+971", "+65", "+44", "+1", "+61"] as const;
const DRAFT_CACHE_VERSION = 2 as const;

const PILL_TONES = [
  { bg: "#fdf2f8", border: "#f9a8d4", text: "#9d174d" },
  { bg: "#eff6ff", border: "#93c5fd", text: "#1d4ed8" },
  { bg: "#ecfeff", border: "#67e8f9", text: "#0f766e" },
  { bg: "#fef3c7", border: "#fcd34d", text: "#a16207" },
  { bg: "#eef2ff", border: "#a5b4fc", text: "#4338ca" },
  { bg: "#ecfccb", border: "#bef264", text: "#4d7c0f" },
] as const;

function hexToRgba(color: string | null | undefined, alpha: number): string {
  if (!color) return `rgba(15, 23, 42, ${alpha})`;
  const normalized = color.trim().replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    return color;
  }
  const value = Number.parseInt(normalized, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function splitInterests(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function getDraftCacheKey(token: string): string {
  return `trip-request:draft:${DRAFT_CACHE_VERSION}:${token}`;
}

function splitPhoneParts(value: string): { countryCode: string; localNumber: string } {
  const raw = value.trim();
  if (!raw) {
    return { countryCode: "+91", localNumber: "" };
  }
  const digits = normalizeDigits(raw);
  if (!digits) {
    return { countryCode: "+91", localNumber: "" };
  }

  const matchedCountryCode = COUNTRY_CODE_OPTIONS.find((option) => digits.startsWith(option.slice(1)));
  if (matchedCountryCode) {
    return {
      countryCode: matchedCountryCode,
      localNumber: digits.slice(matchedCountryCode.length - 1),
    };
  }

  if (raw.startsWith("+")) {
    const guessedCode = `+${digits.slice(0, Math.max(1, digits.length - 10))}`;
    const guessedLocal = digits.slice(Math.max(1, digits.length - 10));
    return {
      countryCode: guessedCode || "+91",
      localNumber: guessedLocal,
    };
  }

  return {
    countryCode: "+91",
    localNumber: digits,
  };
}

function joinPhoneParts(countryCode: string, localNumber: string): string {
  const digits = normalizeDigits(localNumber);
  if (!digits) return "";
  return `${countryCode}${digits}`;
}

type CachedTripRequestDraft = Partial<{
  clientName: string;
  countryCode: string;
  clientPhone: string;
  clientEmail: string;
  destination: string;
  originCity: string;
  travelerCount: number;
  hotelPreference: string;
  budget: string;
  interests: string[];
  startDate: string;
  endDate: string;
}>;

function readCachedTripRequestDraft(token: string): CachedTripRequestDraft | null {
  if (typeof window === "undefined") return null;
  const cached = window.localStorage.getItem(getDraftCacheKey(token));
  if (!cached) return null;
  try {
    return JSON.parse(cached) as CachedTripRequestDraft;
  } catch {
    window.localStorage.removeItem(getDraftCacheKey(token));
    return null;
  }
}

function parseIsoDate(value: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toIsoDate(date: Date | undefined): string {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatShort(value: string): string {
  const date = parseIsoDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatFull(value: string): string {
  const date = parseIsoDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getNights(startDate: string, endDate: string): number {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  if (!start || !end) return 0;
  const diffMs = end.getTime() - start.getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return 0;
  return Math.max(0, Math.round(diffMs / 86_400_000));
}

function getDurationDays(startDate: string, endDate: string, fallback: number | null): number {
  const nights = getNights(startDate, endDate);
  if (nights <= 0) return fallback ?? 1;
  return nights + 1;
}

function SearchableLocationField({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  accentColor,
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder: string;
  accentColor: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const normalized = value.trim().toLowerCase();
  const matches = useMemo(
    () => options.filter((option) => option.toLowerCase().includes(normalized)).slice(0, 8),
    [normalized, options],
  );

  return (
    <label className="space-y-2">
      <FieldLabel label={label} required={required} />
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          name={name}
          value={value}
          autoComplete="off"
          required={required}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 120);
          }}
          className="h-[58px] w-full rounded-2xl border border-stone-200 bg-white pl-11 pr-4 text-[15px] text-stone-900 outline-none transition focus:border-stone-400 focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]"
        />
        {open && matches.length > 0 ? (
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_24px_60px_-32px_rgba(28,25,23,0.25)]">
            {matches.map((option) => (
              <button
                key={option}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange(option);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between border-b border-stone-100 px-4 py-3 text-left text-sm text-stone-700 transition last:border-b-0 hover:bg-stone-50"
              >
                <span>{option}</span>
                {value === option ? <Check className="h-4 w-4" style={{ color: accentColor }} /> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </label>
  );
}

function FieldLabel({
  label,
  required = false,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <span className="block text-sm font-medium text-stone-700">
      {label}
      {required ? <span className="ml-1 text-[#b91c1c]">*</span> : null}
    </span>
  );
}

function ChoicePill({
  active,
  label,
  onClick,
  accentColor,
  toneIndex = 0,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  accentColor: string;
  toneIndex?: number;
}) {
  const tone = PILL_TONES[toneIndex % PILL_TONES.length] ?? PILL_TONES[0];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-[46px] rounded-full border px-4 py-2 text-sm font-medium transition active:scale-[0.985]",
        active
          ? "border-transparent text-white shadow-sm"
          : "hover:-translate-y-[1px]",
      )}
      style={active
        ? {
            background: `linear-gradient(135deg, ${accentColor} 0%, ${hexToRgba(accentColor, 0.82)} 100%)`,
            boxShadow: `0 14px 30px -18px ${hexToRgba(accentColor, 0.65)}`,
          }
        : {
            borderColor: tone.border,
            backgroundColor: tone.bg,
            color: tone.text,
          }}
    >
      {label}
    </button>
  );
}

function NativeDateField({
  label,
  value,
  onChange,
  min,
  accentColor,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min: string;
  accentColor: string;
}) {
  return (
    <label className="space-y-2">
      <FieldLabel label={label} required />
      <div
        className="rounded-[22px] border bg-white p-3 shadow-[0_16px_40px_-32px_rgba(28,25,23,0.28)] transition focus-within:-translate-y-[1px]"
        style={{ borderColor: hexToRgba(accentColor, 0.16) }}
      >
        <div className="flex items-center gap-3 rounded-2xl bg-stone-50 px-3 py-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{ backgroundColor: accentColor }}
          >
            <CalendarDays className="h-4 w-4" />
          </div>
          <input
            type="date"
            name={label === "Departure date" ? "start_date" : "end_date"}
            required
            min={min}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-10 w-full border-0 bg-transparent px-0 text-[15px] font-medium text-stone-900 outline-none"
          />
        </div>
      </div>
    </label>
  );
}

function TravelDatesField({
  startDate,
  endDate,
  onChange,
  accentColor,
}: {
  startDate: string;
  endDate: string;
  onChange: (next: { startDate: string; endDate: string }) => void;
  accentColor: string;
}) {
  const nights = getNights(startDate, endDate);
  const todayIso = toIsoDate(new Date());

  return (
    <div className="rounded-[24px] border border-black/5 bg-white p-4 shadow-[0_18px_45px_-36px_rgba(28,25,23,0.4)] sm:p-5">
      <div
        className="rounded-[22px] border bg-[linear-gradient(180deg,#ffffff_0%,#fbf7f2_100%)] p-4 sm:p-5"
        style={{ borderColor: hexToRgba(accentColor, 0.16) }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{ backgroundColor: accentColor }}
          >
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <FieldLabel label="Travel dates" required />
            <p className="mt-1 text-xs text-stone-500">
              Use your phone&apos;s native date picker for the fastest selection.
            </p>
          </div>
          {nights > 0 ? (
            <div
              className="hidden shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold sm:inline-flex"
              style={{ backgroundColor: hexToRgba(accentColor, 0.1), color: accentColor }}
            >
              {nights} night{nights === 1 ? "" : "s"}
            </div>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <NativeDateField
            label="Departure date"
            value={startDate}
            min={todayIso}
            accentColor={accentColor}
            onChange={(nextStart) =>
              onChange({
                startDate: nextStart,
                endDate: endDate && nextStart && endDate < nextStart ? "" : endDate,
              })
            }
          />
          <NativeDateField
            label="Return date"
            value={endDate}
            min={startDate || todayIso}
            accentColor={accentColor}
            onChange={(nextEnd) =>
              onChange({
                startDate,
                endDate: nextEnd,
              })
            }
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {startDate && endDate ? (
            <>
              <div className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: hexToRgba(accentColor, 0.1), color: accentColor }}>
                {formatShort(startDate)} to {formatShort(endDate)}
              </div>
              <div className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700">
                {nights} night{nights === 1 ? "" : "s"} · {nights + 1} days
              </div>
            </>
          ) : (
            <div className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-600">
              Choose both departure and return dates to continue
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TripRequestIntakeForm({
  token,
  state,
  submitted,
  errorMessage,
}: {
  token: string;
  state: TripRequestFormState;
  submitted: boolean;
  errorMessage: string | null;
}) {
  const accentColor = state.organizationPrimaryColor || "#8b5e3c";
  const accentSoft = hexToRgba(accentColor, 0.12);
  const accentSofter = hexToRgba(accentColor, 0.06);
  const brandPanel = `linear-gradient(180deg, ${hexToRgba(accentColor, 0.25)} 0%, rgba(20,17,14,0) 65%)`;
  const cachedDraft = useMemo(() => readCachedTripRequestDraft(token), [token]);
  const initialPhoneParts = splitPhoneParts(
    cachedDraft?.countryCode && cachedDraft?.clientPhone
      ? joinPhoneParts(cachedDraft.countryCode, cachedDraft.clientPhone)
      : state.clientPhone,
  );
  const [clientName, setClientName] = useState(cachedDraft?.clientName ?? state.clientName);
  const [countryCode, setCountryCode] = useState(
    cachedDraft?.countryCode?.trim() ? cachedDraft.countryCode : initialPhoneParts.countryCode,
  );
  const [clientPhone, setClientPhone] = useState(cachedDraft?.clientPhone ?? initialPhoneParts.localNumber);
  const [clientEmail, setClientEmail] = useState(cachedDraft?.clientEmail ?? state.clientEmail);
  const [destination, setDestination] = useState(cachedDraft?.destination ?? state.destination);
  const [originCity, setOriginCity] = useState(cachedDraft?.originCity ?? state.originCity);
  const [travelerCount, setTravelerCount] = useState<number>(cachedDraft?.travelerCount ?? state.travelerCount ?? 2);
  const [hotelPreference, setHotelPreference] = useState(cachedDraft?.hotelPreference ?? state.hotelPreference);
  const [budget, setBudget] = useState(cachedDraft?.budget ?? state.budget);
  const [interests, setInterests] = useState<string[]>(cachedDraft?.interests ?? splitInterests(state.interests));
  const [startDate, setStartDate] = useState(cachedDraft?.startDate ?? state.startDate);
  const [endDate, setEndDate] = useState(cachedDraft?.endDate ?? state.endDate);
  const [submitPending, setSubmitPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const durationDays = getDurationDays(startDate, endDate, state.durationDays);
  const normalizedPhone = joinPhoneParts(countryCode, clientPhone);
  const phoneDigits = normalizeDigits(clientPhone);
  const hasValidDateRange = Boolean(startDate && endDate && endDate >= startDate);
  const isCompleted = state.status === "completed";
  const isProcessing = submitted && !isCompleted;
  const canSubmit =
    !submitPending &&
    !isProcessing &&
    clientName.trim().length > 0 &&
    phoneDigits.length >= 8 &&
    destination.trim().length > 0 &&
    hasValidDateRange &&
    travelerCount > 0 &&
    durationDays > 0;
  const trustPoints =
    state.organizationServiceBullets.length > 0
      ? state.organizationServiceBullets
      : ["Personal trip concierge", "Hand-picked stays", "24×7 on your journey"];

  useEffect(() => {
    if (!isProcessing) return;
    const timeoutId = window.setTimeout(() => {
      window.location.reload();
    }, 4000);
    return () => window.clearTimeout(timeoutId);
  }, [isProcessing]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isCompleted) {
      window.localStorage.removeItem(getDraftCacheKey(token));
      return;
    }
    window.localStorage.setItem(
      getDraftCacheKey(token),
      JSON.stringify({
        clientName,
        countryCode,
        clientPhone,
        clientEmail,
        destination,
        originCity,
        travelerCount,
        hotelPreference,
        budget,
        interests,
        startDate,
        endDate,
      }),
    );
  }, [
    budget,
    clientEmail,
    clientName,
    clientPhone,
    countryCode,
    destination,
    endDate,
    hotelPreference,
    interests,
    isCompleted,
    originCity,
    startDate,
    token,
    travelerCount,
  ]);

  const toggleInterest = (value: string) => {
    setInterests((current) =>
      current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value],
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitPending(true);
    setLocalError(null);

    try {
      /* eslint-disable no-restricted-syntax -- public token route is intentionally unauthenticated */
      const response = await fetch(`/api/trip-request/${token}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          destination,
          duration_days: durationDays,
          client_name: clientName,
          client_email: clientEmail || null,
          client_phone: normalizedPhone,
          traveler_count: travelerCount,
          start_date: startDate,
          end_date: endDate,
          budget: budget || null,
          hotel_preference: hotelPreference || null,
          interests,
          origin_city: originCity || null,
          submitter_role: "client",
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
      if (!response.ok) {
        setLocalError(payload?.error ?? "We couldn't submit your request right now. Please try again.");
        setSubmitPending(false);
        return;
      }
      /* eslint-enable no-restricted-syntax */

      window.localStorage.setItem(
        getDraftCacheKey(token),
        JSON.stringify({
          clientName,
          countryCode,
          clientPhone,
          clientEmail,
          destination,
          originCity,
          travelerCount,
          hotelPreference,
          budget,
          interests,
          startDate,
          endDate,
        }),
      );
      window.location.assign(`/trip-request/${token}?submitted=1`);
    } catch {
      setLocalError("We couldn't submit your request right now. Please check your connection and try again.");
      setSubmitPending(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-[#ede7df] px-3 pb-28 pt-3 text-stone-950 sm:px-5 sm:pb-8 sm:pt-5">
      <div className="mx-auto max-w-[1200px] overflow-hidden rounded-[28px] border border-black/5 bg-[#f7f2ea] shadow-[0_40px_100px_-48px_rgba(28,25,23,0.38)]">
        <section className="relative overflow-hidden border-b border-black/5 bg-[#171310] px-5 py-7 text-stone-100 sm:px-8 sm:py-9">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-48"
            style={{ background: brandPanel }}
          />
          <div className="relative mx-auto flex max-w-6xl flex-col gap-7 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                {state.organizationLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={state.organizationLogoUrl}
                    alt={state.organizationName}
                    className="h-[72px] w-[72px] rounded-2xl border border-white/15 bg-white object-cover p-2 shadow-[0_12px_36px_-18px_rgba(0,0,0,0.6)]"
                    style={{ boxShadow: `0 0 0 1px ${hexToRgba(accentColor, 0.35)}, 0 18px 40px -20px rgba(0,0,0,0.7)` }}
                  />
                ) : (
                  <div
                    className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl text-2xl font-semibold text-white shadow-[0_12px_36px_-18px_rgba(0,0,0,0.6)]"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor} 0%, ${hexToRgba(accentColor, 0.7)} 100%)`,
                    }}
                  >
                    {state.organizationName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="font-[family:var(--font-cormorant)] text-[2.2rem] leading-[1.02] tracking-tight text-white sm:text-[3rem] lg:text-[3.6rem]">
                    {state.organizationName}
                  </h1>
                  {state.organizationRegionLine ? (
                    <p className="mt-2 text-sm text-stone-300">{state.organizationRegionLine}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <p className="text-[15px] leading-7 text-stone-300 sm:max-w-2xl sm:text-base">
                  {state.organizationDescription ||
                    `Share your travel plans with ${state.organizationName} and receive a personalised itinerary crafted just for you.`}
                </p>
                <div className="flex flex-wrap gap-2 text-sm text-stone-200">
                  {trustPoints.map((point) => (
                    <div
                      key={point}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2"
                    >
                      {point}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile contact chips row */}
            <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 text-xs text-stone-200 md:hidden">
              {state.organizationAddress ? (
                <div className="flex min-w-[220px] shrink-0 items-start gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 text-stone-400" />
                  <p className="leading-5 text-stone-100">{state.organizationAddress}</p>
                </div>
              ) : null}
              {state.organizationContactPhone ? (
                <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
                  <Phone className="h-3.5 w-3.5 text-stone-400" />
                  <p className="whitespace-nowrap text-stone-100">{state.organizationContactPhone}</p>
                </div>
              ) : null}
              {state.organizationContactEmail ? (
                <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
                  <Mail className="h-3.5 w-3.5 text-stone-400" />
                  <p className="whitespace-nowrap text-stone-100">{state.organizationContactEmail}</p>
                </div>
              ) : null}
              {state.organizationOfficeHours && !state.organizationContactEmail ? (
                <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
                  <BadgeCheck className="h-3.5 w-3.5 text-stone-400" />
                  <p className="whitespace-nowrap text-stone-100">{state.organizationOfficeHours}</p>
                </div>
              ) : null}
            </div>

            {/* Desktop consolidated contact card */}
            <div className="hidden min-w-[320px] max-w-[380px] rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-stone-200 md:block">
              {state.organizationAddress ? (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                      Visit us
                    </p>
                    <p className="mt-1 leading-6 text-stone-100">{state.organizationAddress}</p>
                  </div>
                </div>
              ) : null}
              {(state.organizationContactPhone || state.organizationContactEmail) && state.organizationAddress ? (
                <div className="my-4 h-px bg-white/10" />
              ) : null}
              <div className="space-y-3">
                {state.organizationContactPhone ? (
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                        Call or WhatsApp
                      </p>
                      <p className="mt-1 text-stone-100">{state.organizationContactPhone}</p>
                    </div>
                  </div>
                ) : null}
                {state.organizationContactEmail ? (
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                        Email
                      </p>
                      <p className="mt-1 break-all text-stone-100">{state.organizationContactEmail}</p>
                    </div>
                  </div>
                ) : null}
                {state.organizationOfficeHours && !state.organizationContactEmail ? (
                  <div className="flex items-start gap-3">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                        Availability
                      </p>
                      <p className="mt-1 text-stone-100">{state.organizationOfficeHours}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-6 sm:px-7 sm:py-8 lg:px-8 lg:py-9">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-[1.9rem] font-semibold tracking-tight text-stone-950 sm:text-[2.4rem]">
                  Plan your journey
                </h2>
                <p className="mt-2 max-w-3xl text-[15px] leading-7 text-stone-600">
                  Share a few details and {state.organizationName} will craft a tailored itinerary for your trip.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 self-start rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-stone-500">
                <ShieldCheck className="h-4 w-4" style={{ color: accentColor }} />
                Secure &amp; private
              </div>
            </div>

            {localError || errorMessage ? (
              <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                {localError || errorMessage}
              </div>
            ) : null}

            {submitted || isCompleted ? (
              <div
                className="mb-6 rounded-2xl border px-4 py-4 text-sm"
                style={{ borderColor: accentSoft, backgroundColor: accentSofter }}
              >
                <div className="flex items-start gap-3">
                  <CircleCheckBig className="mt-0.5 h-5 w-5 shrink-0" style={{ color: accentColor }} />
                  <div>
                    <p className="font-semibold text-stone-950">
                      {isCompleted ? "Your trip request is ready" : "Your request is being prepared"}
                    </p>
                    <p className="mt-1 text-stone-600">
                      {isCompleted
                        ? `Your itinerary from ${state.organizationName} is now available.`
                        : `${state.organizationName} has received your details and is building your itinerary now. This page will refresh automatically.`}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {isCompleted ? (
              <section className="space-y-6">
                <div className="grid gap-4 rounded-[24px] border border-black/5 bg-white p-5 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Destination</p>
                    <p className="mt-2 text-base font-semibold text-stone-950">{state.destination || "Planned trip"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Travel dates</p>
                    <p className="mt-2 text-base font-semibold text-stone-950">
                      {state.startDate && state.endDate
                        ? `${formatFull(state.startDate)} to ${formatFull(state.endDate)}`
                        : "Dates confirmed"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Travellers</p>
                    <p className="mt-2 text-base font-semibold text-stone-950">{state.travelerCount || 1}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <a
                    href={state.shareUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-14 items-center justify-center rounded-2xl px-5 text-sm font-semibold text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    View your itinerary
                  </a>
                  <a
                    href={state.pdfUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-14 items-center justify-center rounded-2xl border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-900"
                  >
                    Download PDF
                  </a>
                </div>
              </section>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">

                <section className="rounded-[24px] border border-black/5 bg-white p-4 sm:p-6">
                  <div className="mb-5">
                    <h3 className="text-lg font-semibold tracking-tight text-stone-950 sm:text-xl">Who is travelling?</h3>
                    <p className="mt-1 text-sm leading-6 text-stone-500">
                      We use your details to send updates about your trip.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2">
                      <FieldLabel label="Your name" required />
                        <input
                          name="client_name"
                          value={clientName}
                          onChange={(event) => setClientName(event.target.value)}
                          required
                          placeholder="Full name"
                          className="h-[58px] w-full rounded-2xl border border-stone-200 bg-white px-4 text-[15px] text-stone-900 outline-none transition focus:border-stone-400 focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]"
                        />
                    </label>
                    <label className="space-y-2">
                      <FieldLabel label="WhatsApp number" required />
                      <div className="grid grid-cols-[108px_minmax(0,1fr)] gap-2">
                        <div className="relative">
                          <select
                            value={countryCode}
                            onChange={(event) => setCountryCode(event.target.value)}
                            className="h-[58px] w-full appearance-none rounded-2xl border border-stone-200 bg-stone-50 px-4 text-[15px] font-medium text-stone-900 outline-none transition focus:border-stone-400 focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]"
                          >
                            {COUNTRY_CODE_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="relative">
                          <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                          <input
                            name="client_phone"
                            value={clientPhone}
                            onChange={(event) => setClientPhone(normalizeDigits(event.target.value).slice(0, 15))}
                            inputMode="numeric"
                            autoComplete="tel-national"
                            required
                            placeholder="98xxxxxx21"
                            className="h-[58px] w-full rounded-2xl border border-stone-200 bg-white pl-11 pr-4 text-[15px] text-stone-900 outline-none transition focus:border-stone-400 focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]"
                          />
                        </div>
                      </div>
                      <p className="text-xs leading-5 text-stone-500">
                        We’ll use WhatsApp to share your trip link and updates. Default country code is India.
                      </p>
                    </label>
                    <label className="space-y-2 sm:col-span-2">
                      <FieldLabel label="Email address" />
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <input
                          name="client_email"
                          type="email"
                          value={clientEmail}
                          onChange={(event) => setClientEmail(event.target.value)}
                          placeholder="name@example.com"
                          className="h-[58px] w-full rounded-2xl border border-stone-200 bg-white pl-11 pr-4 text-[15px] text-stone-900 outline-none transition focus:border-stone-400 focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]"
                        />
                      </div>
                    </label>
                  </div>
                </section>

                <section className="rounded-[24px] border border-black/5 bg-white p-4 sm:p-6">
                  <div className="mb-5">
                    <h3 className="text-lg font-semibold tracking-tight text-stone-950 sm:text-xl">Where and when</h3>
                    <p className="mt-1 text-sm leading-6 text-stone-500">
                      Tell us where you want to go and when you want to travel.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <SearchableLocationField
                      label="Destination"
                      name="destination"
                      value={destination}
                      onChange={setDestination}
                      options={DESTINATION_OPTIONS}
                      placeholder="Search destination"
                      accentColor={accentColor}
                      required
                    />
                    <SearchableLocationField
                      label="Departure city / airport"
                      name="origin_city"
                      value={originCity}
                      onChange={setOriginCity}
                      options={ORIGIN_OPTIONS}
                      placeholder="Where are you travelling from?"
                      accentColor={accentColor}
                    />
                  </div>

                  <div className="mt-5">
                    <TravelDatesField
                      startDate={startDate}
                      endDate={endDate}
                      onChange={({ startDate: nextStart, endDate: nextEnd }) => {
                        setStartDate(nextStart);
                        setEndDate(nextEnd);
                      }}
                      accentColor={accentColor}
                    />
                  </div>

                  <div className="mt-5">
                    <FieldLabel label="How many travellers?" required />
                    <div className="mt-3 flex flex-wrap gap-2">
                      {TRAVELER_OPTIONS.map((value) => (
                        <ChoicePill
                          key={value}
                          active={travelerCount === value}
                          label={value === 6 ? "6+" : `${value}`}
                          onClick={() => setTravelerCount(value)}
                          accentColor={accentColor}
                          toneIndex={value}
                        />
                      ))}
                    </div>
                  </div>
                </section>

                <section className="rounded-[24px] border border-black/5 bg-white p-4 sm:p-6">
                  <div className="mb-5">
                    <h3 className="text-lg font-semibold tracking-tight text-stone-950 sm:text-xl">Your style of travel</h3>
                    <p className="mt-1 text-sm leading-6 text-stone-500">
                      Help us shape the comfort, pace and feel of your trip.
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <FieldLabel label="Hotel preference" />
                      <div className="mt-3 flex flex-wrap gap-2">
                        {HOTEL_OPTIONS.map((option) => (
                          <ChoicePill
                            key={option}
                            active={hotelPreference === option}
                            label={option}
                            onClick={() => setHotelPreference(option)}
                            accentColor={accentColor}
                            toneIndex={HOTEL_OPTIONS.indexOf(option)}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <FieldLabel label="Budget range" />
                      <div className="mt-3 flex flex-wrap gap-2">
                        {BUDGET_OPTIONS.map((option) => (
                          <ChoicePill
                            key={option}
                            active={budget === option}
                            label={option}
                            onClick={() => setBudget(option)}
                            accentColor={accentColor}
                            toneIndex={BUDGET_OPTIONS.indexOf(option) + 1}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <FieldLabel label="What matters most on this trip?" />
                      <div className="mt-3 flex flex-wrap gap-2">
                        {INTEREST_OPTIONS.map((option) => (
                          <ChoicePill
                            key={option}
                            active={interests.includes(option)}
                            label={option}
                            onClick={() => toggleInterest(option)}
                            accentColor={accentColor}
                            toneIndex={INTEREST_OPTIONS.indexOf(option)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <div className="fixed inset-x-0 bottom-0 z-20 border-t border-black/5 bg-[rgba(247,242,234,0.96)] px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
                  <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:rounded-[24px] sm:border sm:border-black/5 sm:bg-white sm:p-5">
                    <div className="hidden min-w-0 sm:block">
                      <p className="text-sm font-medium text-stone-950">
                        {submitPending ? "Sending your request" : "Ready to send your request"}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-stone-500">
                        {canSubmit
                          ? `${state.organizationName} will review your details and share your itinerary.`
                          : "Fill the required traveller, WhatsApp, destination, and date details to continue."}
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className="inline-flex h-14 w-full shrink-0 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
                      style={{
                        background: `linear-gradient(135deg, ${accentColor} 0%, ${hexToRgba(accentColor, 0.82)} 100%)`,
                        boxShadow: canSubmit ? `0 18px 40px -24px ${hexToRgba(accentColor, 0.8)}` : undefined,
                      }}
                    >
                      {submitPending ? "Sending..." : `Send to ${state.organizationName}`}
                      {!submitPending ? <ArrowRight className="h-4 w-4" /> : null}
                    </button>
                    <p className="text-center text-[11px] text-stone-500 sm:hidden">
                      {canSubmit
                        ? `Your details are sent only to ${state.organizationName}`
                        : "Required: name, WhatsApp number, destination, travel dates, and travellers"}
                    </p>
                  </div>
                </div>
              </form>
            )}

            <div className="mt-8 flex flex-col items-center gap-1 text-center">
              <p className="text-xs text-stone-500">
                © {state.organizationName} — your travel partner
              </p>
              <p className="text-[11px] text-stone-400">
                Powered by{" "}
                <a
                  href="https://tripbuilt.com"
                  target="_blank"
                  rel="noreferrer"
                  className="underline-offset-2 hover:underline"
                >
                  TripBuilt
                </a>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
