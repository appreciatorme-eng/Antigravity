"use client";

import { useMemo, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import {
  CalendarDays,
  Check,
  CircleCheckBig,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Users,
} from "lucide-react";

import type { TripRequestFormState, TripRequestSubmitterRole } from "@/lib/whatsapp/trip-intake.server";
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
  "Luxury stays",
  "Family time",
  "Honeymoon",
  "Adventure",
  "Food trails",
  "Culture",
  "Shopping",
  "Nature",
  "Wellness",
] as const;

const HOTEL_OPTIONS = ["3 star", "4 star", "5 star", "Boutique", "Villa", "Flexible"] as const;
const BUDGET_OPTIONS = ["Under 50k", "50k - 1L", "1L - 2L", "2L - 4L", "Luxury"] as const;
const DURATION_OPTIONS = [3, 5, 7, 10, 14] as const;
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

function formatDateLabel(value: string): string {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function splitInterests(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function SearchableLocationField({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  accentColor,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder: string;
  accentColor: string;
}) {
  const [open, setOpen] = useState(false);
  const normalized = value.trim().toLowerCase();
  const matches = useMemo(
    () =>
      options
        .filter((option) => option.toLowerCase().includes(normalized))
        .slice(0, 8),
    [normalized, options],
  );

  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          name={name}
          value={value}
          autoComplete="off"
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 120);
          }}
          className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
        />
        {open && matches.length > 0 ? (
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_20px_40px_-24px_rgba(15,23,42,0.25)]">
            {matches.map((option) => (
              <button
                key={option}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange(option);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-700 transition last:border-b-0 hover:bg-slate-50"
              >
                <span>{option}</span>
                {value === option ? (
                  <Check className="h-4 w-4" style={{ color: accentColor }} />
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
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
  const accentColor = state.organizationPrimaryColor || "#0f766e";
  const softAccent = hexToRgba(accentColor, 0.1);
  const softerAccent = hexToRgba(accentColor, 0.04);
  const initialRole: TripRequestSubmitterRole =
    state.clientName || state.clientEmail || state.clientPhone ? "client" : "client";

  const [submitterRole, setSubmitterRole] = useState<TripRequestSubmitterRole>(initialRole);
  const [destination, setDestination] = useState(state.destination);
  const [originCity, setOriginCity] = useState(state.originCity);
  const [durationDays, setDurationDays] = useState<number>(state.durationDays ?? 5);
  const [travelerCount, setTravelerCount] = useState<number>(state.travelerCount ?? 2);
  const [hotelPreference, setHotelPreference] = useState(state.hotelPreference);
  const [budget, setBudget] = useState(state.budget);
  const [interests, setInterests] = useState<string[]>(splitInterests(state.interests));
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    state.startDate && state.endDate
      ? {
          from: new Date(`${state.startDate}T00:00:00`),
          to: new Date(`${state.endDate}T00:00:00`),
        }
      : undefined,
  );

  const startDate = dateRange?.from ? dateRange.from.toISOString().slice(0, 10) : "";
  const endDate = dateRange?.to ? dateRange.to.toISOString().slice(0, 10) : "";
  const isCompleted = state.status === "completed";
  const activeServiceBullets =
    state.organizationServiceBullets.length > 0
      ? state.organizationServiceBullets
      : ["Tailored itineraries", "Hotel and transport planning", "Fast WhatsApp follow-up"];

  const toggleInterest = (value: string) => {
    setInterests((current) =>
      current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value],
    );
  };

  return (
    <main className="min-h-[100dvh] bg-[#f6f3ee] px-4 py-4 text-slate-950 sm:px-6 sm:py-6">
      <div className="mx-auto grid min-h-[calc(100dvh-2rem)] max-w-7xl overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.3)] lg:grid-cols-[0.95fr_1.35fr]">
        <section
          className="relative overflow-hidden border-b border-black/5 p-6 sm:p-8 lg:border-b-0 lg:border-r"
          style={{ backgroundColor: softerAccent }}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-48"
            style={{
              background: `linear-gradient(180deg, ${hexToRgba(accentColor, 0.18)}, transparent)`,
            }}
          />
          <div className="relative flex h-full flex-col">
            <div className="flex items-center gap-4">
              {state.organizationLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={state.organizationLogoUrl}
                  alt={state.organizationName}
                  className="h-14 w-14 rounded-2xl border border-black/5 bg-white object-cover p-2"
                />
              ) : (
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-semibold text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {state.organizationName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {state.organizationRegionLine || "Trip request"}
                </p>
                <h1 className="font-[family:var(--font-cormorant)] text-4xl leading-none text-slate-950 sm:text-5xl">
                  {state.organizationName}
                </h1>
              </div>
            </div>

            <div className="mt-10 space-y-5">
              <div className="space-y-3">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  Tell us how you want this trip to feel.
                </h2>
                <p className="max-w-xl text-sm leading-6 text-slate-600">
                  {state.organizationDescription}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {activeServiceBullets.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-black/5 bg-white/80 px-4 py-3 text-sm text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto grid gap-4 pt-10 text-sm text-slate-600 sm:grid-cols-2">
              {state.organizationContactPhone ? (
                <div className="rounded-2xl border border-black/5 bg-white/80 px-4 py-4">
                  <div className="mb-2 flex items-center gap-2 text-slate-500">
                    <Phone className="h-4 w-4" />
                    Contact
                  </div>
                  <p className="font-medium text-slate-900">{state.organizationContactPhone}</p>
                </div>
              ) : null}
              {state.organizationOfficeHours ? (
                <div className="rounded-2xl border border-black/5 bg-white/80 px-4 py-4">
                  <div className="mb-2 flex items-center gap-2 text-slate-500">
                    <CalendarDays className="h-4 w-4" />
                    Availability
                  </div>
                  <p className="font-medium text-slate-900">{state.organizationOfficeHours}</p>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="bg-[#fcfbf8] p-6 sm:p-8 lg:p-10">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 flex items-start justify-between gap-6">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                  Complete the trip brief
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  This goes directly to {state.organizationName}. Once it is reviewed, the final trip link and itinerary PDF will be shared back here and on WhatsApp.
                </p>
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-black/5 bg-white px-3 py-2 text-xs font-medium text-slate-500 sm:flex">
                <Sparkles className="h-4 w-4" style={{ color: accentColor }} />
                Powered by TripBuilt
              </div>
            </div>

            {errorMessage ? (
              <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            {submitted || isCompleted ? (
              <div className="mb-6 rounded-2xl border px-4 py-4 text-sm" style={{ borderColor: softAccent, backgroundColor: softerAccent }}>
                <div className="flex items-start gap-3">
                  <CircleCheckBig className="mt-0.5 h-5 w-5 shrink-0" style={{ color: accentColor }} />
                  <div>
                    <p className="font-semibold text-slate-900">
                      {isCompleted ? "Trip request completed" : "Trip request submitted"}
                    </p>
                    <p className="mt-1 text-slate-600">
                      {isCompleted
                        ? `The final trip package is ready for ${state.clientName || "the traveler"}.`
                        : "Your details were saved successfully."}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {isCompleted ? (
              <section className="space-y-6">
                <div className="grid gap-4 rounded-[20px] border border-black/5 bg-white p-5 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Destination</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{state.destination || "Planned trip"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Travel window</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">
                      {state.startDate && state.endDate
                        ? `${formatDateLabel(state.startDate)} to ${formatDateLabel(state.endDate)}`
                        : "Dates confirmed"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Travellers</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{state.travelerCount || 1}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <a
                    href={state.shareUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-12 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    Open trip link
                  </a>
                  <a
                    href={state.pdfUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900"
                  >
                    Download itinerary PDF
                  </a>
                </div>
              </section>
            ) : (
              <form action={`/api/trip-request/${token}`} method="post" className="space-y-8">
                <input type="hidden" name="submitter_role" value={submitterRole} />
                <input type="hidden" name="destination" value={destination} />
                <input type="hidden" name="duration_days" value={durationDays} />
                <input type="hidden" name="traveler_count" value={travelerCount} />
                <input type="hidden" name="start_date" value={startDate} />
                <input type="hidden" name="end_date" value={endDate} />
                <input type="hidden" name="hotel_preference" value={hotelPreference} />
                <input type="hidden" name="budget" value={budget} />
                <input type="hidden" name="interests" value={interests.join(", ")} />
                <input type="hidden" name="origin_city" value={originCity} />

                <section className="space-y-4 rounded-[20px] border border-black/5 bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">Who is filling this brief?</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Defaulted for a client or traveller, but operators can use the same link too.
                      </p>
                    </div>
                    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                      {[
                        { value: "client", label: "Client / traveller" },
                        { value: "operator", label: "Tour operator" },
                        { value: "other", label: "Other" },
                      ].map((option) => {
                        const active = submitterRole === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setSubmitterRole(option.value as TripRequestSubmitterRole)}
                            className={cn(
                              "rounded-lg px-3 py-2 text-sm transition",
                              active ? "bg-white text-slate-950 shadow-sm" : "text-slate-500",
                            )}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Your name</span>
                      <input
                        name="submitted_by"
                        defaultValue=""
                        placeholder="Who is submitting this form?"
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Traveller name</span>
                      <input
                        name="client_name"
                        defaultValue={state.clientName}
                        required
                        placeholder="Full name"
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Email address</span>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          name="client_email"
                          type="email"
                          defaultValue={state.clientEmail}
                          placeholder="name@example.com"
                          className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                        />
                      </div>
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">WhatsApp number</span>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          name="client_phone"
                          defaultValue={state.clientPhone}
                          placeholder="+91 98xxxxxx21"
                          className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                        />
                      </div>
                    </label>
                  </div>
                </section>

                <section className="space-y-5 rounded-[20px] border border-black/5 bg-white p-5">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Trip essentials</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Give the core trip details first. The rest helps {state.organizationName} shape the final itinerary.
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

                  <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
                    <div className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div>
                        <p className="text-sm font-medium text-slate-700">Trip length</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {DURATION_OPTIONS.map((value) => {
                            const active = durationDays === value;
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setDurationDays(value)}
                                className={cn(
                                  "rounded-xl border px-3 py-2 text-sm transition",
                                  active
                                    ? "border-transparent text-white"
                                    : "border-slate-200 bg-white text-slate-700",
                                )}
                                style={active ? { backgroundColor: accentColor } : undefined}
                              >
                                {value} days
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-slate-700">Travellers</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {TRAVELER_OPTIONS.map((value) => {
                            const active = travelerCount === value;
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setTravelerCount(value)}
                                className={cn(
                                  "rounded-xl border px-3 py-2 text-sm transition",
                                  active
                                    ? "border-transparent text-white"
                                    : "border-slate-200 bg-white text-slate-700",
                                )}
                                style={active ? { backgroundColor: accentColor } : undefined}
                              >
                                {value === 6 ? "6+" : value}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-2">
                          <span className="text-sm font-medium text-slate-700">Exact duration</span>
                          <input
                            type="number"
                            min={1}
                            value={durationDays}
                            onChange={(event) => setDurationDays(Math.max(1, Number(event.target.value) || 1))}
                            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                          />
                        </label>
                        <label className="space-y-2">
                          <span className="text-sm font-medium text-slate-700">Total travellers</span>
                          <div className="relative">
                            <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="number"
                              min={1}
                              value={travelerCount}
                              onChange={(event) => setTravelerCount(Math.max(1, Number(event.target.value) || 1))}
                              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                            />
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-slate-700">Travel dates</p>
                          <p className="mt-1 text-sm text-slate-500">Pick a start and end date for the trip.</p>
                        </div>
                        <div
                          className="rounded-xl border px-3 py-2 text-right text-xs font-medium text-slate-600"
                          style={{ borderColor: softAccent, backgroundColor: "#fff" }}
                        >
                          {startDate && endDate
                            ? `${formatDateLabel(startDate)} to ${formatDateLabel(endDate)}`
                            : "Select dates"}
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3">
                        <DayPicker
                          mode="range"
                          selected={dateRange}
                          onSelect={setDateRange}
                          showOutsideDays
                          classNames={{
                            months: "flex flex-col gap-5 lg:flex-row",
                            month: "space-y-4",
                            caption: "flex items-center justify-center text-sm font-semibold text-slate-900",
                            nav: "hidden",
                            table: "w-full border-collapse",
                            head_row: "grid grid-cols-7 text-slate-400",
                            head_cell: "py-1 text-center text-xs font-medium",
                            row: "grid grid-cols-7",
                            cell: "p-1",
                            day: "h-10 w-full rounded-xl text-sm text-slate-700 transition hover:bg-slate-100",
                            day_selected: "text-white hover:text-white",
                            day_range_middle: "bg-slate-100 text-slate-900",
                            day_today: "border border-slate-300 text-slate-900",
                          }}
                          modifiersStyles={{
                            selected: { backgroundColor: accentColor, color: "#fff" },
                            range_middle: { backgroundColor: softAccent, color: "#0f172a" },
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-5 rounded-[20px] border border-black/5 bg-white p-5">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Preferences and style</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      These details help {state.organizationName} return a more tailored itinerary.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="mb-3 text-sm font-medium text-slate-700">Hotel preference</p>
                      <div className="flex flex-wrap gap-2">
                        {HOTEL_OPTIONS.map((option) => {
                          const active = hotelPreference === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => setHotelPreference(option)}
                              className={cn(
                                "rounded-xl border px-3 py-2 text-sm transition",
                                active
                                  ? "border-transparent text-white"
                                  : "border-slate-200 bg-slate-50 text-slate-700",
                              )}
                              style={active ? { backgroundColor: accentColor } : undefined}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <p className="mb-3 text-sm font-medium text-slate-700">Budget comfort range</p>
                      <div className="flex flex-wrap gap-2">
                        {BUDGET_OPTIONS.map((option) => {
                          const active = budget === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => setBudget(option)}
                              className={cn(
                                "rounded-xl border px-3 py-2 text-sm transition",
                                active
                                  ? "border-transparent text-white"
                                  : "border-slate-200 bg-slate-50 text-slate-700",
                              )}
                              style={active ? { backgroundColor: accentColor } : undefined}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <p className="mb-3 text-sm font-medium text-slate-700">What matters most?</p>
                      <div className="flex flex-wrap gap-2">
                        {INTEREST_OPTIONS.map((option) => {
                          const active = interests.includes(option);
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => toggleInterest(option)}
                              className={cn(
                                "rounded-xl border px-3 py-2 text-sm transition",
                                active
                                  ? "border-transparent text-white"
                                  : "border-slate-200 bg-slate-50 text-slate-700",
                              )}
                              style={active ? { backgroundColor: accentColor } : undefined}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>

                <div className="flex flex-col gap-4 rounded-[20px] border border-black/5 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-xl text-sm leading-6 text-slate-500">
                    Once submitted, {state.organizationName} can create the trip in Planner and Trips, then share the final trip link and itinerary PDF back on WhatsApp.
                  </p>
                  <button
                    type="submit"
                    className="inline-flex h-12 items-center justify-center rounded-xl px-5 text-sm font-semibold text-white transition hover:opacity-95"
                    style={{ backgroundColor: accentColor }}
                  >
                    Submit trip brief
                  </button>
                </div>
              </form>
            )}

            <div className="mt-8 text-center text-xs text-slate-400 sm:hidden">
              Powered by TripBuilt
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
