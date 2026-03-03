"use client";

import { Car, Shield, MessageCircle, Navigation } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassInput } from "@/components/glass/GlassInput";
import { GlassButton } from "@/components/glass/GlassButton";
import { cn } from "@/lib/utils";
import type { Driver, DriverAssignment } from "@/features/trip-detail/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TripDriverCardProps {
  drivers: Driver[];
  assignment: DriverAssignment | undefined;
  busyDriverIds: string[];
  onAssignmentChange: (field: keyof DriverAssignment, value: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TripDriverCard({
  drivers,
  assignment,
  busyDriverIds,
  onAssignmentChange,
}: TripDriverCardProps) {
  const selectedDriverId = assignment?.external_driver_id ?? "";
  const selectedDriver = drivers.find((d) => d.id === selectedDriverId);

  const whatsAppHref = selectedDriver?.phone
    ? `https://wa.me/${selectedDriver.phone}`
    : "#";

  return (
    <GlassCard padding="xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-secondary dark:text-white">
              Driver Logistics
            </h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mt-0.5">
              Transportation Details
            </p>
          </div>
        </div>
        <Shield className="w-5 h-5 text-emerald-500/60" />
      </div>

      {/* Driver Select */}
      <div className="mb-4">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1 block mb-1.5">
          Assigned Driver
        </label>
        <select
          value={selectedDriverId}
          onChange={(e) => onAssignmentChange("external_driver_id", e.target.value)}
          className={cn(
            "w-full bg-slate-50 dark:bg-slate-800/50",
            "border border-gray-100 dark:border-slate-800",
            "rounded-xl px-4 h-12 text-sm font-bold",
            "text-secondary dark:text-white",
            "focus:ring-2 focus:ring-emerald-500/20 outline-none"
          )}
        >
          <option value="">Awaiting Assignment...</option>
          {drivers.map((driver) => {
            const isBusy = busyDriverIds.includes(driver.id);
            return (
              <option key={driver.id} value={driver.id} disabled={isBusy}>
                {driver.full_name}
                {driver.vehicle_type ? ` - ${driver.vehicle_type}` : ""}
                {driver.vehicle_plate ? ` (${driver.vehicle_plate})` : ""}
                {isBusy ? " (Unavailable)" : ""}
              </option>
            );
          })}
        </select>
      </div>

      {/* Pickup Time / Location */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <GlassInput
          label="Pickup Time"
          type="time"
          value={assignment?.pickup_time ?? ""}
          onChange={(e) => onAssignmentChange("pickup_time", e.target.value)}
        />
        <GlassInput
          label="Pickup Location"
          type="text"
          value={assignment?.pickup_location ?? ""}
          onChange={(e) => onAssignmentChange("pickup_location", e.target.value)}
          placeholder="Hotel lobby, airport..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <a
          href={whatsAppHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1"
        >
          <GlassButton
            className="bg-emerald-500 hover:bg-emerald-600 w-full"
            size="md"
          >
            <MessageCircle className="w-4 h-4" />
            Driver WhatsApp
          </GlassButton>
        </a>
        <GlassButton variant="outline" size="md">
          <Navigation className="w-4 h-4" />
        </GlassButton>
      </div>
    </GlassCard>
  );
}
