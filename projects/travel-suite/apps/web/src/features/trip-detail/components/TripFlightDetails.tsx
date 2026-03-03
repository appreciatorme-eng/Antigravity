"use client";

import { Plane, ArrowRight } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import type { FlightDetails } from "@/features/trip-detail/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TripFlightDetailsProps {
  flights: FlightDetails[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFlightTime(isoOrTime: string): string {
  const date = new Date(isoOrTime);
  if (Number.isNaN(date.getTime())) return isoOrTime;
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function FlightsEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Plane className="w-10 h-10 text-gray-300 mb-3" />
      <p className="text-sm font-medium text-gray-400 mb-4">
        No flights linked
      </p>
      <GlassButton variant="outline" size="sm">
        <Plane className="w-3.5 h-3.5" />
        Search flights
      </GlassButton>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single flight row
// ---------------------------------------------------------------------------

function FlightRow({ flight }: { flight: FlightDetails }) {
  const reference = flight.pnr ?? flight.booking_reference;

  return (
    <div className="rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-gray-100 dark:border-slate-700 p-4 space-y-3">
      {/* Airline + flight number */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-secondary dark:text-white">
          {flight.airline} {flight.flight_number}
        </span>
        {reference && (
          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
            PNR: {reference}
          </span>
        )}
      </div>

      {/* Route: city to city */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-secondary dark:text-slate-300">
          {flight.departure_city}
        </span>
        <ArrowRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
        <span className="text-sm font-bold text-secondary dark:text-slate-300">
          {flight.arrival_city}
        </span>
      </div>

      {/* Times */}
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <span className="font-mono">
          {formatFlightTime(flight.departure_time)}
        </span>
        <ArrowRight className="w-3 h-3 shrink-0" />
        <span className="font-mono">
          {formatFlightTime(flight.arrival_time)}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TripFlightDetails({ flights }: TripFlightDetailsProps) {
  return (
    <GlassCard padding="xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Plane className="w-4 h-4 text-primary" />
        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
          Flight Details
        </span>
      </div>

      {flights.length === 0 ? (
        <FlightsEmpty />
      ) : (
        <div className="space-y-3">
          {flights.map((flight, idx) => (
            <FlightRow key={`${flight.flight_number}-${idx}`} flight={flight} />
          ))}
        </div>
      )}
    </GlassCard>
  );
}
