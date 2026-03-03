"use client";

import { Hotel, Globe, Search } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassInput } from "@/components/glass/GlassInput";
import { GlassButton } from "@/components/glass/GlassButton";
import type { Accommodation } from "@/features/trip-detail/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TripAccommodationCardProps {
  accommodation: Accommodation | undefined;
  onAccommodationChange: (field: keyof Accommodation, value: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TripAccommodationCard({
  accommodation,
  onAccommodationChange,
}: TripAccommodationCardProps) {
  return (
    <GlassCard padding="xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
            <Hotel className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-secondary dark:text-white">
              Accommodation
            </h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mt-0.5">
              Residency Details
            </p>
          </div>
        </div>
        <Globe className="w-5 h-5 text-blue-500/60" />
      </div>

      {/* Hotel Name */}
      <div className="mb-4">
        <GlassInput
          label="Hotel Name"
          type="text"
          value={accommodation?.hotel_name ?? ""}
          onChange={(e) => onAccommodationChange("hotel_name", e.target.value)}
          placeholder="Enter hotel name"
        />
      </div>

      {/* Check-in Time / Contact Phone */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <GlassInput
          label="Check-in Time"
          type="time"
          value={accommodation?.check_in_time ?? "15:00"}
          onChange={(e) => onAccommodationChange("check_in_time", e.target.value)}
        />
        <GlassInput
          label="Contact Phone"
          type="tel"
          value={accommodation?.contact_phone ?? ""}
          onChange={(e) => onAccommodationChange("contact_phone", e.target.value)}
          placeholder="+1 234 567 8900"
        />
      </div>

      {/* Auto-Locate Button */}
      <GlassButton variant="outline" fullWidth size="md">
        <Search className="w-4 h-4" />
        Auto-Locate Hotel
      </GlassButton>
    </GlassCard>
  );
}
