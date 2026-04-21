"use client";

import { useMemo, useState } from "react";
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

function formatDateLabel(value: string): string {
  if (!value) return "Select date";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getDurationDays(startDate: string, endDate: string, fallback: number | null): number {
  if (!startDate || !endDate) {
    return fallback ?? 1;
  }
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const diffMs = end.getTime() - start.getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return fallback ?? 1;
  }
  return Math.max(1, Math.round(diffMs / 86_400_000) + 1);
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
          className="h-14 w-full rounded-2xl border border-stone-200 bg-white pl-11 pr-4 text-[15px] text-stone-900 outline-none transition focus:border-stone-400"
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
        "rounded-full border px-4 py-2 text-sm transition",
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

function DateCard({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <div className="relative rounded-[22px] border border-stone-200 bg-white p-4 transition focus-within:border-stone-400">
        <input
          type="date"
          value={value}
          required={required}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 z-10 cursor-pointer opacity-0"
        />
        <div className="flex items-start justify-between gap-4">
          <div>
            <FieldLabel label={label} required={required} />
            <p className="mt-3 text-lg font-semibold tracking-tight text-stone-950">
              {formatDateLabel(value)}
            </p>
            <p className="mt-1 text-sm text-stone-500">
              Tap to choose from your calendar
            </p>
          </div>
          <div className="rounded-full border border-stone-200 bg-stone-50 p-3 text-stone-500">
            <CalendarDays className="h-5 w-5" />
          </div>
        </div>
      </div>
    </label>
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
  const brandPanel = `linear-gradient(180deg, ${hexToRgba(accentColor, 0.2)} 0%, rgba(20,17,14,0) 65%)`;
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
      : ["Tailored itineraries", "Trusted travel coordination", "Responsive updates on WhatsApp"];

  const toggleInterest = (value: string) => {
    setInterests((current) =>
      current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value],
    );
  };

  return (
    <main className="min-h-[100dvh] bg-[#ede7df] px-3 py-3 text-stone-950 sm:px-5 sm:py-5">
      <div className="mx-auto max-w-[1200px] overflow-hidden rounded-[28px] border border-black/5 bg-[#f7f2ea] shadow-[0_40px_100px_-48px_rgba(28,25,23,0.38)]">
        <section className="relative overflow-hidden border-b border-black/5 bg-[#171310] px-5 py-6 text-stone-100 sm:px-8 sm:py-8">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-40"
            style={{ background: brandPanel }}
          />
          <div className="relative mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-4">
                {state.organizationLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={state.organizationLogoUrl}
                    alt={state.organizationName}
                    className="h-16 w-16 rounded-2xl border border-white/10 bg-white object-cover p-2"
                  />
                ) : (
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-semibold text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    {state.organizationName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="font-[family:var(--font-cormorant)] text-[2.5rem] leading-none tracking-tight text-white sm:text-[3.6rem]">
                    {state.organizationName}
                  </h1>
                  {state.organizationRegionLine ? (
                    <p className="mt-2 text-sm text-stone-300">{state.organizationRegionLine}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <p className="max-w-2xl text-[15px] leading-7 text-stone-300 sm:text-base">
                  {state.organizationDescription ||
                    `Share your travel plans with ${state.organizationName} and receive a personalised itinerary prepared for your journey.`}
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

            <div className="grid gap-3 text-sm text-stone-300 sm:grid-cols-2 lg:min-w-[360px]">
              {state.organizationAddress ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-2 flex items-center gap-2 text-stone-400">
                    <MapPin className="h-4 w-4" />
                    <span>Office address</span>
                  </div>
                  <p className="leading-6 text-stone-100">{state.organizationAddress}</p>
                </div>
              ) : null}
              <div className="grid gap-3">
                {state.organizationContactPhone ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-2 flex items-center gap-2 text-stone-400">
                      <Phone className="h-4 w-4" />
                      <span>Call or WhatsApp</span>
                    </div>
                    <p className="text-stone-100">{state.organizationContactPhone}</p>
                  </div>
                ) : null}
                {state.organizationContactEmail ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-2 flex items-center gap-2 text-stone-400">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </div>
                    <p className="break-all text-stone-100">{state.organizationContactEmail}</p>
                  </div>
                ) : state.organizationOfficeHours ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-2 flex items-center gap-2 text-stone-400">
                      <BadgeCheck className="h-4 w-4" />
                      <span>Availability</span>
                    </div>
                    <p className="text-stone-100">{state.organizationOfficeHours}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-5 sm:px-7 sm:py-7 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-[2rem] font-semibold tracking-tight text-stone-950 sm:text-[2.4rem]">
                  Tell us about your trip
                </h2>
                <p className="mt-2 max-w-3xl text-[15px] leading-7 text-stone-600">
                  Fill in the details below and {state.organizationName} will review your request and share a tailored itinerary with you.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-stone-500">
                <ShieldCheck className="h-4 w-4" style={{ color: accentColor }} />
                Secure request form
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
                        ? `${formatDateLabel(state.startDate)} to ${formatDateLabel(state.endDate)}`
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
              <form action={`/api/trip-request/${token}`} method="post" className="space-y-5">
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
                    <h3 className="text-xl font-semibold tracking-tight text-stone-950">Traveller details</h3>
                    <p className="mt-1 text-sm leading-6 text-stone-500">
                      We use these details to prepare your trip and send updates.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2">
                      <FieldLabel label="Traveller name" required />
                      <input
                        name="client_name"
                        defaultValue={state.clientName}
                        required
                        placeholder="Full name"
                        className="h-14 w-full rounded-2xl border border-stone-200 bg-white px-4 text-[15px] text-stone-900 outline-none transition focus:border-stone-400"
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
                          className="h-14 w-full rounded-2xl border border-stone-200 bg-white pl-11 pr-4 text-[15px] text-stone-900 outline-none transition focus:border-stone-400"
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
                          className="h-14 w-full rounded-2xl border border-stone-200 bg-white pl-11 pr-4 text-[15px] text-stone-900 outline-none transition focus:border-stone-400"
                        />
                      </div>
                    </label>
                  </div>
                </section>

                <section className="rounded-[24px] border border-black/5 bg-white p-4 sm:p-6">
                  <div className="mb-5">
                    <h3 className="text-xl font-semibold tracking-tight text-stone-950">Trip details</h3>
                    <p className="mt-1 text-sm leading-6 text-stone-500">
                      Tell us where you want to go, when you want to travel, and how many people are joining.
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

                  <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <DateCard
                        label="Departure date"
                        value={startDate}
                        onChange={setStartDate}
                        required
                      />
                      <DateCard
                        label="Return date"
                        value={endDate}
                        onChange={setEndDate}
                        required
                      />
                    </div>

                    <div
                      className="rounded-[24px] border px-4 py-5"
                      style={{ borderColor: accentSoft, backgroundColor: accentSofter }}
                    >
                      <p className="text-sm font-medium text-stone-700">Selected travel window</p>
                      <p className="mt-3 text-[1.65rem] font-semibold tracking-tight text-stone-950">
                        {startDate && endDate
                          ? `${formatDateLabel(startDate)} to ${formatDateLabel(endDate)}`
                          : "Choose your dates"}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <div className="rounded-full border border-white/70 bg-white/70 px-3 py-2 text-sm text-stone-700">
                          {durationDays} day{durationDays > 1 ? "s" : ""}
                        </div>
                        <div className="rounded-full border border-white/70 bg-white/70 px-3 py-2 text-sm text-stone-700">
                          {travelerCount} traveller{travelerCount > 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
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
                    <h3 className="text-xl font-semibold tracking-tight text-stone-950">Stay and preferences</h3>
                    <p className="mt-1 text-sm leading-6 text-stone-500">
                      These details help shape the style and comfort level of your itinerary.
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

                <div className="sticky bottom-3 z-10 rounded-[24px] border border-black/5 bg-[rgba(255,251,245,0.92)] p-4 shadow-[0_20px_50px_-32px_rgba(28,25,23,0.28)] backdrop-blur sm:static sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:rounded-[24px] sm:border sm:border-black/5 sm:bg-white sm:p-5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-950">
                        Ready to send your request
                      </p>
                      <p className="mt-1 text-sm leading-6 text-stone-500">
                        {state.organizationName} will review your travel details and share your itinerary back with you.
                      </p>
                    </div>
                    <button
                      type="submit"
                      className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-semibold text-white transition hover:opacity-95"
                      style={{ backgroundColor: accentColor }}
                    >
                      Submit travel request
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="mt-6 text-center text-xs text-stone-400">
              Powered by TripBuilt
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
