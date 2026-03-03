"use client";

import {
  MapPin, Calendar, Clock, ArrowRight, IndianRupee, Map,
  Bell, FileDown, Sparkles, UtensilsCrossed, Compass,
  Wallet, ShieldAlert, LayoutDashboard,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { TripClientCard } from "@/features/trip-detail/components/TripClientCard";
import { TripFinancialSummary } from "@/features/trip-detail/components/TripFinancialSummary";
import { TripFlightDetails } from "@/features/trip-detail/components/TripFlightDetails";
import { formatDate, formatDateLong } from "@/features/trip-detail/utils";
import { cn } from "@/lib/utils";
import type {
  Trip, TripInvoiceSummaryData, TripDetailTab, FlightDetails,
} from "@/features/trip-detail/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface OverviewTabProps {
  trip: Trip;
  invoiceSummary: TripInvoiceSummaryData | null;
  loading: boolean;
  onTabChange: (tab: TripDetailTab) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeDurationLabel(trip: Trip): string {
  const durationDays = trip.itineraries?.duration_days;
  if (durationDays && durationDays > 0) {
    return `${durationDays} Day${durationDays > 1 ? "s" : ""}`;
  }
  if (trip.start_date && trip.end_date) {
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      const diffMs = end.getTime() - start.getTime();
      const days = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
      return `${days} Day${days > 1 ? "s" : ""}`;
    }
  }
  return "TBD";
}

function extractThemes(trip: Trip): readonly string[] {
  return (trip.itineraries?.raw_data?.days ?? [])
    .map((d) => d.theme)
    .filter((t): t is string => Boolean(t));
}

function extractFlights(trip: Trip): readonly FlightDetails[] {
  return trip.itineraries?.raw_data?.flights ?? [];
}

// ---------------------------------------------------------------------------
// Shared section header
// ---------------------------------------------------------------------------

function SectionHeader({ icon: Icon, label }: { icon: typeof Calendar; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <Icon className="w-4 h-4 text-primary" />
      <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
        {label}
      </span>
    </div>
  );
}

const DATE_CHIP =
  "inline-flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 text-sm text-secondary dark:text-slate-300";

// ---------------------------------------------------------------------------
// Trip Summary Card
// ---------------------------------------------------------------------------

function TripSummaryCard({ trip }: { trip: Trip }) {
  const title = trip.itineraries?.trip_title || trip.destination || "Untitled Trip";
  const themes = extractThemes(trip);

  return (
    <GlassCard padding="xl">
      <SectionHeader icon={LayoutDashboard} label="Trip Summary" />
      <h2 className="text-3xl font-serif text-secondary dark:text-white tracking-tight mb-4">
        {title}
      </h2>
      <div className="mb-4">
        <GlassBadge variant="info" icon={MapPin}>{trip.destination}</GlassBadge>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <span className={DATE_CHIP}>
          <Calendar className="w-4 h-4 text-text-muted" />
          {formatDate(trip.start_date)}
        </span>
        <ArrowRight className="w-4 h-4 text-text-muted shrink-0" />
        <span className={DATE_CHIP}>
          <Calendar className="w-4 h-4 text-text-muted" />
          {formatDate(trip.end_date)}
        </span>
        <span className={DATE_CHIP}>
          <Clock className="w-4 h-4 text-text-muted" />
          {computeDurationLabel(trip)}
        </span>
      </div>
      {themes.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
            Daily Themes
          </p>
          <div className="flex flex-wrap gap-2">
            {themes.map((theme, idx) => (
              <GlassBadge key={idx} variant="secondary" size="sm">
                Day {idx + 1}: {theme}
              </GlassBadge>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Key Dates Timeline
// ---------------------------------------------------------------------------

interface TimelineEntry { label: string; value: string; active: boolean }

function buildTimelineEntries(trip: Trip): readonly TimelineEntry[] {
  return [
    { label: "Trip Created", value: "N/A", active: false },
    { label: "Start Date", value: formatDateLong(trip.start_date), active: Boolean(trip.start_date) },
    { label: "End Date", value: formatDateLong(trip.end_date), active: Boolean(trip.end_date) },
  ];
}

function KeyDatesTimeline({ trip }: { trip: Trip }) {
  const entries = buildTimelineEntries(trip);

  return (
    <GlassCard padding="xl">
      <SectionHeader icon={Calendar} label="Key Dates" />
      <div className="relative space-y-6 pl-6">
        <div className="absolute left-[7px] top-1 bottom-1 w-px bg-gray-200 dark:bg-slate-700" />
        {entries.map((entry, idx) => (
          <div key={idx} className="relative flex items-start gap-4">
            <div
              className={cn(
                "absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2",
                entry.active
                  ? "bg-primary border-primary/30"
                  : "bg-gray-200 border-gray-300 dark:bg-slate-600 dark:border-slate-500"
              )}
            />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                {entry.label}
              </p>
              <p className="text-sm font-bold text-secondary dark:text-white mt-0.5">
                {entry.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Quick Actions
// ---------------------------------------------------------------------------

const QUICK_ACTIONS = [
  { label: "Generate Invoice", icon: IndianRupee, tab: "financials" as TripDetailTab },
  { label: "View Itinerary", icon: Map, tab: "itinerary" as TripDetailTab },
  { label: "Send Notification", icon: Bell, tab: "comms" as TripDetailTab },
  { label: "Download Report", icon: FileDown, tab: undefined },
] as const;

function QuickActions({ onTabChange }: { onTabChange: (tab: TripDetailTab) => void }) {
  return (
    <GlassCard padding="xl">
      <SectionHeader icon={Sparkles} label="Quick Actions" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <GlassButton
              key={action.label}
              variant="outline"
              size="sm"
              className="flex-col gap-2 h-auto py-4 rounded-2xl"
              onClick={action.tab ? () => onTabChange(action.tab!) : undefined}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest leading-tight text-center">
                {action.label}
              </span>
            </GlassButton>
          );
        })}
      </div>
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Trip Preferences
// ---------------------------------------------------------------------------

interface PreferenceItem {
  label: string;
  value: string;
  icon: typeof UtensilsCrossed;
}

function formatBudgetRange(min?: number | null, max?: number | null): string | null {
  if (min == null && max == null) return null;
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (min != null) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

function buildPreferences(trip: Trip): readonly PreferenceItem[] {
  const client = trip.profiles;
  if (!client) return [];

  const items: PreferenceItem[] = [];

  if (client.dietary_requirements && client.dietary_requirements.length > 0) {
    items.push({
      label: "Dietary Requirements",
      value: client.dietary_requirements.join(", "),
      icon: UtensilsCrossed,
    });
  }

  if (client.travel_style) {
    items.push({ label: "Travel Style", value: client.travel_style, icon: Compass });
  }

  const budgetStr = formatBudgetRange(client.budget_min, client.budget_max);
  if (budgetStr) {
    items.push({ label: "Budget Range", value: budgetStr, icon: Wallet });
  }

  if (client.mobility_needs) {
    items.push({ label: "Mobility Needs", value: client.mobility_needs, icon: ShieldAlert });
  }

  return items;
}

function TripPreferences({ trip }: { trip: Trip }) {
  const preferences = buildPreferences(trip);
  if (preferences.length === 0) return null;

  return (
    <GlassCard padding="xl">
      <SectionHeader icon={Compass} label="Preferences" />
      <div className="space-y-4">
        {preferences.map((pref) => {
          const Icon = pref.icon;
          return (
            <div key={pref.label} className="space-y-1">
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-text-muted" />
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  {pref.label}
                </p>
              </div>
              <p className="text-sm font-bold text-secondary dark:text-slate-300 pl-[22px]">
                {pref.value}
              </p>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function OverviewTab({ trip, invoiceSummary, loading, onTabChange }: OverviewTabProps) {
  const flights = extractFlights(trip);

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left column */}
      <div className="col-span-12 xl:col-span-8 space-y-6">
        <TripSummaryCard trip={trip} />
        <TripFinancialSummary invoiceSummary={invoiceSummary} loading={loading} />
        <KeyDatesTimeline trip={trip} />
        <QuickActions onTabChange={onTabChange} />
      </div>

      {/* Right column */}
      <div className="col-span-12 xl:col-span-4 space-y-6">
        <TripClientCard client={trip.profiles} />
        <TripFlightDetails flights={[...flights]} />
        <TripPreferences trip={trip} />
      </div>
    </div>
  );
}
