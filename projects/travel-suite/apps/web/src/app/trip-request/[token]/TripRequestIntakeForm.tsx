"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  X,
} from "lucide-react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";

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
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  accentColor: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-[44px] rounded-full border px-4 py-2 text-sm transition",
        active
          ? "border-transparent text-white shadow-sm"
          : "border-stone-200 bg-white text-stone-700 hover:border-stone-300",
      )}
      style={active ? { backgroundColor: accentColor } : undefined}
    >
      {label}
    </button>
  );
}

function RangeDateField({
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
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const nights = getNights(startDate, endDate);

  // Close desktop popover on outside click.
  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      const target = event.target as Node;
      if (
        popoverRef.current && !popoverRef.current.contains(target) &&
        triggerRef.current && !triggerRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Lock body scroll when the mobile sheet is open.
  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;
    if (window.innerWidth >= 768) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const range: DateRange | undefined = useMemo(() => {
    const from = parseIsoDate(startDate);
    const to = parseIsoDate(endDate);
    if (!from && !to) return undefined;
    return { from, to };
  }, [startDate, endDate]);

  const handleRange = (next: DateRange | undefined) => {
    onChange({
      startDate: toIsoDate(next?.from),
      endDate: toIsoDate(next?.to),
    });
  };

  const confirmDisabled = !range?.from || !range?.to;
  const headerColor = accentColor;

  return (
    <div className="relative">
      <div
        ref={triggerRef}
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className="group cursor-pointer rounded-[22px] border border-stone-200 bg-white p-4 transition hover:border-stone-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 sm:p-5"
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{ backgroundColor: headerColor }}
          >
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <FieldLabel label="Travel dates" required />
            <p className="mt-1 text-xs text-stone-500">
              Tap to choose your departure &amp; return
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

        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
          <div className="rounded-2xl border border-stone-200 bg-stone-50/60 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              Departure
            </p>
            <p className="mt-1 text-[17px] font-semibold tracking-tight text-stone-950 sm:text-lg">
              {startDate ? formatShort(startDate) : "Select"}
            </p>
            <p className="mt-0.5 text-[11px] text-stone-500">
              {startDate ? formatFull(startDate).split(" ").slice(-1)[0] : "Start of trip"}
            </p>
          </div>
          <div className="flex items-center justify-center text-stone-300">
            <ArrowRight className="h-4 w-4" />
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50/60 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              Return
            </p>
            <p className="mt-1 text-[17px] font-semibold tracking-tight text-stone-950 sm:text-lg">
              {endDate ? formatShort(endDate) : "Select"}
            </p>
            <p className="mt-0.5 text-[11px] text-stone-500">
              {endDate ? formatFull(endDate).split(" ").slice(-1)[0] : "End of trip"}
            </p>
          </div>
        </div>
        {nights > 0 ? (
          <div
            className="mt-3 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold sm:hidden"
            style={{ backgroundColor: hexToRgba(accentColor, 0.1), color: accentColor }}
          >
            {nights} night{nights === 1 ? "" : "s"} · {nights + 1} days
          </div>
        ) : null}
      </div>

      {/* Desktop popover */}
      {open ? (
        <div
          ref={popoverRef}
          className="absolute left-0 right-0 z-30 mt-2 hidden overflow-hidden rounded-[22px] border border-stone-200 bg-white p-4 shadow-[0_30px_80px_-40px_rgba(28,25,23,0.35)] md:block"
          style={{ ["--rdp-accent-color" as string]: accentColor }}
        >
          <RangeCalendar
            range={range}
            onChange={handleRange}
            accentColor={accentColor}
            numberOfMonths={2}
          />
          <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
            <button
              type="button"
              onClick={() => handleRange(undefined)}
              className="text-sm font-medium text-stone-500 hover:text-stone-700"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={confirmDisabled}
              className="rounded-full px-5 py-2 text-sm font-semibold text-white transition disabled:opacity-50"
              style={{ backgroundColor: accentColor }}
            >
              Confirm
            </button>
          </div>
        </div>
      ) : null}

      {/* Mobile bottom sheet */}
      {open ? (
        <div className="fixed inset-0 z-40 flex items-end md:hidden">
          <button
            type="button"
            aria-label="Close calendar"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-stone-950/40 backdrop-blur-sm"
          />
          <div
            className="relative z-10 w-full max-h-[92dvh] overflow-y-auto rounded-t-[28px] bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-[0_-24px_60px_-16px_rgba(28,25,23,0.35)]"
            style={{ ["--rdp-accent-color" as string]: accentColor }}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-stone-200" />
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-base font-semibold tracking-tight text-stone-950">
                  Choose travel dates
                </p>
                <p className="mt-0.5 text-xs text-stone-500">
                  Pick your departure, then return day
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-stone-500 hover:bg-stone-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <RangeCalendar
              range={range}
              onChange={handleRange}
              accentColor={accentColor}
              numberOfMonths={1}
            />
            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleRange(undefined)}
                className="h-12 rounded-2xl px-4 text-sm font-medium text-stone-600 hover:bg-stone-100"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={confirmDisabled}
                className="h-12 flex-1 rounded-2xl px-4 text-sm font-semibold text-white transition disabled:opacity-50"
                style={{ backgroundColor: accentColor }}
              >
                {confirmDisabled
                  ? "Select dates"
                  : `Confirm · ${nights} night${nights === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RangeCalendar({
  range,
  onChange,
  accentColor,
  numberOfMonths,
}: {
  range: DateRange | undefined;
  onChange: (next: DateRange | undefined) => void;
  accentColor: string;
  numberOfMonths: number;
}) {
  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  return (
    <DayPicker
      mode="range"
      selected={range}
      onSelect={onChange}
      numberOfMonths={numberOfMonths}
      disabled={{ before: today }}
      defaultMonth={range?.from ?? today}
      showOutsideDays={false}
      styles={{
        root: {
          ["--rdp-accent-color" as string]: accentColor,
          ["--rdp-accent-background-color" as string]: hexToRgba(accentColor, 0.14),
          ["--rdp-day-height" as string]: "42px",
          ["--rdp-day-width" as string]: "42px",
          ["--rdp-day_button-height" as string]: "40px",
          ["--rdp-day_button-width" as string]: "40px",
          ["--rdp-day_button-border-radius" as string]: "9999px",
        } as React.CSSProperties,
      }}
    />
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
  const [destination, setDestination] = useState(state.destination);
  const [originCity, setOriginCity] = useState(state.originCity);
  const [travelerCount, setTravelerCount] = useState<number>(state.travelerCount ?? 2);
  const [hotelPreference, setHotelPreference] = useState(state.hotelPreference);
  const [budget, setBudget] = useState(state.budget);
  const [interests, setInterests] = useState<string[]>(splitInterests(state.interests));
  const [startDate, setStartDate] = useState(state.startDate);
  const [endDate, setEndDate] = useState(state.endDate);

  const durationDays = getDurationDays(startDate, endDate, state.durationDays);
  const isCompleted = state.status === "completed";
  const trustPoints =
    state.organizationServiceBullets.length > 0
      ? state.organizationServiceBullets
      : ["Personal trip concierge", "Hand-picked stays", "24×7 on your journey"];

  const toggleInterest = (value: string) => {
    setInterests((current) =>
      current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value],
    );
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

            {errorMessage ? (
              <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                {errorMessage}
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
                      {isCompleted ? "Your trip request is ready" : "Your request has been received"}
                    </p>
                    <p className="mt-1 text-stone-600">
                      {isCompleted
                        ? `Your itinerary from ${state.organizationName} is now available.`
                        : `${state.organizationName} has received your travel details.`}
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
              <form action={`/api/trip-request/${token}`} method="post" className="space-y-5 sm:space-y-6">
                <input type="hidden" name="submitter_role" value="client" />
                <input type="hidden" name="destination" value={destination} />
                <input type="hidden" name="duration_days" value={durationDays} />
                <input type="hidden" name="traveler_count" value={travelerCount} />
                <input type="hidden" name="start_date" value={startDate} />
                <input type="hidden" name="end_date" value={endDate} />
                <input type="hidden" name="hotel_preference" value={hotelPreference} />
                <input type="hidden" name="budget" value={budget} />
                <input type="hidden" name="interests" value={interests.join(", ")} />
                <input type="hidden" name="origin_city" value={originCity} />

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
                        defaultValue={state.clientName}
                        required
                        placeholder="Full name"
                        className="h-[58px] w-full rounded-2xl border border-stone-200 bg-white px-4 text-[15px] text-stone-900 outline-none transition focus:border-stone-400 focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]"
                      />
                    </label>
                    <label className="space-y-2">
                      <FieldLabel label="WhatsApp number" required />
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <input
                          name="client_phone"
                          defaultValue={state.clientPhone}
                          required
                          placeholder="+91 98xxxxxx21"
                          className="h-[58px] w-full rounded-2xl border border-stone-200 bg-white pl-11 pr-4 text-[15px] text-stone-900 outline-none transition focus:border-stone-400 focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]"
                        />
                      </div>
                    </label>
                    <label className="space-y-2 sm:col-span-2">
                      <FieldLabel label="Email address" />
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <input
                          name="client_email"
                          type="email"
                          defaultValue={state.clientEmail}
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
                      name="destination_display"
                      value={destination}
                      onChange={setDestination}
                      options={DESTINATION_OPTIONS}
                      placeholder="Search destination"
                      accentColor={accentColor}
                      required
                    />
                    <SearchableLocationField
                      label="Departure city / airport"
                      name="origin_city_display"
                      value={originCity}
                      onChange={setOriginCity}
                      options={ORIGIN_OPTIONS}
                      placeholder="Where are you travelling from?"
                      accentColor={accentColor}
                    />
                  </div>

                  <div className="mt-5">
                    <RangeDateField
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
                        Ready to send your request
                      </p>
                      <p className="mt-1 text-sm leading-6 text-stone-500">
                        {state.organizationName} will review your details and share your itinerary.
                      </p>
                    </div>
                    <button
                      type="submit"
                      className="inline-flex h-14 w-full shrink-0 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-semibold text-white transition hover:opacity-95 sm:w-auto"
                      style={{ backgroundColor: accentColor }}
                    >
                      Send to {state.organizationName}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <p className="text-center text-[11px] text-stone-500 sm:hidden">
                      Your details are sent only to {state.organizationName}
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
