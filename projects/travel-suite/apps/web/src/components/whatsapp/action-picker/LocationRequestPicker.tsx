"use client";

import { useState } from "react";
import {
  Building,
  Calendar,
  Home,
  MapPin,
  Navigation,
  Phone,
  Plane,
  Train,
} from "lucide-react";

import {
  ActionPickerProps,
  type LocationType,
} from "./shared";

import { mapDisplayLangToTemplateCode } from "@/lib/whatsapp/india-templates";

export function LocationRequestPicker({
  contact,
  channel,
  onSend,
  language,
}: ActionPickerProps) {
  const [locationType, setLocationType] = useState<LocationType>("hotel");
  const [customAddress, setCustomAddress] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");

  const locationOptions: Array<{
    key: LocationType;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      key: "hotel",
      label: "Hotel",
      icon: <Building className="w-4 h-4" />,
    },
    {
      key: "airport",
      label: "Airport",
      icon: <Plane className="w-4 h-4" />,
    },
    {
      key: "railway",
      label: "Railway",
      icon: <Train className="w-4 h-4" />,
    },
    {
      key: "home",
      label: "Home",
      icon: <Home className="w-4 h-4" />,
    },
    {
      key: "custom",
      label: "Custom",
      icon: <MapPin className="w-4 h-4" />,
    },
  ];

  function buildMessage(): { body: string; subject?: string } {
    const name = contact.name;
    const dateStr = pickupDate ? ` on ${pickupDate}` : "";
    const timeStr = pickupTime ? ` at ${pickupTime}` : "";
    const langCode = mapDisplayLangToTemplateCode(language ?? 'English');
    const useEnglish = langCode === 'en';

    if (channel === "whatsapp") {
      if (locationType === "hotel") {
        return {
          body: useEnglish
            ? `Hi ${name} 🙏\n\nYour pickup is scheduled${dateStr}${timeStr}. Please share your hotel name and room number so the driver can reach you accurately.\n\n📋 Hotel Name:\n🔢 Room Number:\n📍 Hotel Address (if available):\n\nThank you! TripBuilt 🚗`
            : `${name} Ji 🙏\n\nAapka pickup${dateStr}${timeStr} schedule hai. Kripya apne hotel ka naam aur room number share karein taaki driver accurately locate kar sake.\n\n📋 Hotel Name:\n🔢 Room Number:\n📍 Hotel Address (agar nahin pata):\n\nThank you! TripBuilt 🚗`,
        };
      }
      if (locationType === "airport") {
        return {
          body: useEnglish
            ? `Hi ${name} 🙏\n\nYour airport pickup is scheduled${dateStr}${timeStr}. Please share these details:\n\n✈️ Flight Number:\n🏢 Terminal: (T1 / T2 / T3)\n⏰ Landing Time:\n📍 Arrival Gate (if known):\n\nYour driver will be waiting at the gate with a name board. TripBuilt 🚗`
            : `${name} Ji 🙏\n\nAapka airport pickup${dateStr}${timeStr} schedule hai. Kripya yeh details share karein:\n\n✈️ Flight Number:\n🏢 Terminal: (T1 / T2 / T3)\n⏰ Landing Time:\n📍 Arrival Gate (agar pata ho):\n\nDriver gate pe waiting karega aapki name board ke saath. TripBuilt 🚗`,
        };
      }
      if (locationType === "railway") {
        return {
          body: useEnglish
            ? `Hi ${name} 🙏\n\nYour railway station pickup is scheduled${dateStr}${timeStr}. Please share these details:\n\n🚂 Train Number & Name:\n🚉 Station Name:\n🔢 Platform Number (if known):\n⏰ Arrival Time:\n\nYour driver will be waiting at the platform. TripBuilt 🚗`
            : `${name} Ji 🙏\n\nAapka railway station pickup${dateStr}${timeStr} schedule hai. Kripya yeh details share karein:\n\n🚂 Train Number & Name:\n🚉 Station Name:\n🔢 Platform Number (agar pata ho):\n⏰ Arrival Time:\n\nDriver platform pe waiting karega. TripBuilt 🚗`,
        };
      }
      if (locationType === "home") {
        return {
          body: useEnglish
            ? `Hi ${name} 🙏\n\nYour home pickup is scheduled${dateStr}${timeStr}. Please share your complete address so the driver can set it on GPS:\n\n🏠 House/Flat No.:\n🏘️ Colony/Society:\n🗺️ Landmark:\n🏙️ City & PIN:\n\nOr you can share your Google Maps location. TripBuilt 🚗`
            : `${name} Ji 🙏\n\nAapka home pickup${dateStr}${timeStr} hai. Kripya apna complete address share karein taaki driver GPS pe set kar sake:\n\n🏠 House/Flat No.:\n🏘️ Colony/Society:\n🗺️ Landmark:\n🏙️ City & PIN:\n\nYa Google Maps location share kar sakte hain. TripBuilt 🚗`,
        };
      }
      return {
        body: useEnglish
          ? `Hi ${name} 🙏\n\nYour pickup is scheduled${dateStr}${timeStr}.\n\n📍 Pickup Location: ${customAddress || "[Address needed]"}\n\nPlease confirm or share your exact location. The driver will navigate directly to you.\n\nTripBuilt 🚗`
          : `${name} Ji 🙏\n\nAapka pickup${dateStr}${timeStr} schedule hai.\n\n📍 Pickup Location: ${customAddress || "[Address needed]"}\n\nKripya confirm karein ya apna exact location share karein. Driver coordinates pe directly navigate karega.\n\nTripBuilt 🚗`,
      };
    }

    const subject = `Pickup Location Details Required — ${pickupDate ? pickupDate : "Upcoming Trip"}`;

    if (locationType === "hotel") {
      return {
        subject,
        body: `Dear ${name},\n\nWe hope you are looking forward to your trip with TripBuilt!\n\nYour pickup is scheduled${dateStr}${timeStr}. To ensure your driver reaches you without any delays, we kindly request the following details:\n\n🏨 Hotel Name: ___________________\n🔢 Room Number: ___________________\n📍 Hotel Address (if available): ___________________\n\nPlease reply to this email at your earliest convenience. Our driver will arrive 10 minutes early.\n\nThank you!\nTeam TripBuilt\n📞 +91 98765 00000`,
      };
    }

    if (locationType === "airport") {
      return {
        subject,
        body: `Dear ${name},\n\nYour airport pickup is scheduled${dateStr}${timeStr}. Please share the following details:\n\n✈️ Flight Number: ___________________\n🏢 Terminal: ___________________\n⏰ Landing Time: ___________________\n📍 Arrival Gate: ___________________\n\nYour driver will be at the arrivals gate with a name board. In case of flight delays, please inform us via this email or call +91 98765 00000.\n\nSafe travels!\nTeam TripBuilt`,
      };
    }

    return {
      subject,
      body: `Dear ${name},\n\nYour pickup is scheduled${dateStr}${timeStr}.\n\nCould you please share your exact pickup address? This helps us provide accurate navigation to your driver.\n\n📍 Address: ${customAddress || "___________________"}\n\nAlternatively, you can share a Google Maps link in your reply.\n\nThank you!\nTeam TripBuilt\n📞 +91 98765 00000`,
    };
  }

  const { body, subject } = buildMessage();

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        {locationOptions.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setLocationType(key)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
              locationType === key
                ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-400"
            }`}
          >
            {icon}
            <span className="text-[10px] font-bold">{label}</span>
          </button>
        ))}
      </div>

      {locationType === "custom" && (
        <div className="flex items-center gap-2 bg-white/8 border border-white/15 rounded-xl px-3 py-2">
          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <input
            autoFocus
            value={customAddress}
            onChange={(event) => setCustomAddress(event.target.value)}
            placeholder="Enter specific address..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Date (optional)
          </p>
          <div className="flex items-center gap-2 bg-white/8 border border-white/15 rounded-xl px-3 py-2">
            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              type="date"
              value={pickupDate}
              onChange={(event) => setPickupDate(event.target.value)}
              className="flex-1 bg-transparent text-xs text-white outline-none [color-scheme:dark]"
            />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Time (optional)
          </p>
          <div className="flex items-center gap-2 bg-white/8 border border-white/15 rounded-xl px-3 py-2">
            <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              type="time"
              value={pickupTime}
              onChange={(event) => setPickupTime(event.target.value)}
              className="flex-1 bg-transparent text-xs text-white outline-none [color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/25 p-3">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
          Preview
        </p>
        <pre className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto custom-scrollbar font-sans">
          {body}
        </pre>
      </div>

      <button
        onClick={() => onSend(body, subject)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors"
      >
        <Navigation className="w-4 h-4" />
        {channel === "email"
          ? "Send Location Request Email"
          : "Request Location via WhatsApp"}
      </button>
    </div>
  );
}
