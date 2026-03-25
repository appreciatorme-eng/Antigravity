"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  Car,
  Check,
  MapPin,
  Search,
  Star,
  UserCheck,
} from "lucide-react";

import {
  fillTemplate,
  WHATSAPP_TEMPLATES,
} from "@/lib/whatsapp/india-templates";

import {
  ActionPickerProps,
  type Driver,
  useOrgName,
  useOrganizationDrivers,
} from "./shared";

export function DriverPicker({
  contact,
  channel,
  onSend,
}: ActionPickerProps) {
  const { data: drivers, loading, error } = useOrganizationDrivers();
  const orgName = useOrgName();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Driver | null>(null);
  const [pickupTime, setPickupTime] = useState("06:00");
  const [pickupLocation, setPickupLocation] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return drivers.filter(
      (driver) =>
        driver.name.toLowerCase().includes(q) ||
        driver.vehicle.toLowerCase().includes(q) ||
        driver.vehicleNumber.toLowerCase().includes(q)
    );
  }, [search, drivers]);

  function buildMessage(): { body: string; subject?: string } {
    if (!selected) return { body: "" };
    const trip = contact.trip ?? "your trip";
    const pickup = pickupLocation || "Hotel lobby";
    const time = pickupTime;

    if (channel === "whatsapp") {
      const template = WHATSAPP_TEMPLATES.find(
        (entry) => entry.id === "driver_assign_en"
      );
      if (!template) return { body: "" };

      return {
        body: fillTemplate(template, {
          client_name: contact.name,
          destination: trip.split(" ")[0] ?? "your destination",
          driver_name: selected.name,
          driver_phone: selected.phone,
          vehicle_type: selected.vehicle,
          vehicle_number: selected.vehicleNumber,
          pickup_time: time,
          pickup_location: pickup,
          company_name: orgName,
        }),
      };
    }

    return {
      subject: `Driver Assignment — ${selected.name} for ${trip}`,
      body: `Dear ${contact.name},\n\nWe are pleased to share your driver details for ${trip}.\n\n━━━━━━━━━━━━━━━━━━━━━\nYOUR DRIVER\n━━━━━━━━━━━━━━━━━━━━━\n\n👤 Name: ${selected.name}\n📞 Phone: ${selected.phone}\n🚗 Vehicle: ${selected.vehicle}\n🔢 Number: ${selected.vehicleNumber}\n⭐ Rating: ${selected.rating}/5.0\n\n━━━━━━━━━━━━━━━━━━━━━\nPICKUP DETAILS\n━━━━━━━━━━━━━━━━━━━━━\n\n⏰ Pickup Time: ${time}\n📍 Pickup Location: ${pickup}\n\nYour driver will call you 30 minutes before pickup. You can also contact them directly on the number above.\n\nHave a wonderful journey! 🌟\n\nWarm regards,\nTeam TripBuilt\n📞 +91 98765 00000`,
    };
  }

  const { body, subject } = buildMessage();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <p className="text-xs text-red-400 text-center py-6">{error}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 bg-white/8 border border-white/15 rounded-xl px-3 py-2">
        <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <input
          autoFocus
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by driver name or vehicle..."
          className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
        />
      </div>

      <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
        {filtered.map((driver) => (
          <button
            key={driver.id}
            onClick={() => setSelected(driver)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
              selected?.id === driver.id
                ? "border-amber-500/50 bg-amber-500/10"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <Car className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-white">{driver.name}</p>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    driver.available
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {driver.available ? "Available" : "On Trip"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {driver.vehicle} · {driver.vehicleNumber}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-[11px] text-yellow-300 font-semibold">
                  {driver.rating}
                </span>
                <span className="text-[10px] text-slate-500">
                  {driver.phone}
                </span>
              </div>
            </div>
            {selected?.id === driver.id && (
              <Check className="w-4 h-4 text-amber-400 shrink-0" />
            )}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-6">
            No drivers found
          </p>
        )}
      </div>

      {selected && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Pickup Time
            </p>
            <div className="flex items-center gap-2 bg-white/8 border border-white/15 rounded-xl px-3 py-2">
              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <input
                type="time"
                value={pickupTime}
                onChange={(event) => setPickupTime(event.target.value)}
                className="flex-1 bg-transparent text-sm text-white outline-none [color-scheme:dark]"
              />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Pickup Location
            </p>
            <div className="flex items-center gap-2 bg-white/8 border border-white/15 rounded-xl px-3 py-2">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <input
                type="text"
                value={pickupLocation}
                onChange={(event) => setPickupLocation(event.target.value)}
                placeholder="Hotel lobby"
                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="rounded-xl border border-white/10 bg-black/25 p-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Preview
          </p>
          <pre className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-28 overflow-y-auto custom-scrollbar font-sans">
            {body}
          </pre>
        </div>
      )}

      <button
        onClick={() => selected && onSend(body, subject)}
        disabled={!selected}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors"
      >
        <UserCheck className="w-4 h-4" />
        {channel === "email"
          ? "Send Driver Details via Email"
          : "Send Driver Details"}
      </button>
    </div>
  );
}
