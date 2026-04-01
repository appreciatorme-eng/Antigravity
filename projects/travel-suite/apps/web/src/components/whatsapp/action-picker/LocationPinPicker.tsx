/* Location pin picker — send a location pin (pickup point, hotel, etc.) via WhatsApp. */
"use client";

import { useState } from "react";
import { MapPin, Send, Loader2 } from "lucide-react";
import { authedFetch } from "@/lib/api/authed-fetch";
import type { ActionPickerProps } from "./shared";

const PRESET_LOCATIONS = [
    { label: "Airport Pickup", name: "Airport", lat: 0, lng: 0, placeholder: true },
    { label: "Hotel", name: "Hotel", lat: 0, lng: 0, placeholder: true },
    { label: "Railway Station", name: "Railway Station", lat: 0, lng: 0, placeholder: true },
];

export function LocationPinPicker({ contact, onSend }: ActionPickerProps) {
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [lat, setLat] = useState("");
    const [lng, setLng] = useState("");
    const [sending, setSending] = useState(false);

    async function handleSend() {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        if (isNaN(latitude) || isNaN(longitude)) return;

        setSending(true);
        try {
            const phone = contact.phone.replace(/\D/g, "");
            const res = await authedFetch("/api/whatsapp/send-rich", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "location",
                    phone,
                    latitude,
                    longitude,
                    name: name.trim() || "Location",
                    address: address.trim() || undefined,
                }),
            });
            if (res.ok) {
                await onSend(`📍 ${name.trim() || "Location"} — ${address.trim() || `${latitude}, ${longitude}`}`);
            }
        } finally {
            setSending(false);
        }
    }

    function handlePreset(preset: typeof PRESET_LOCATIONS[number]) {
        setName(preset.name);
        // Preset locations have placeholder coords — user fills in real ones
    }

    const isValid = lat.trim() && lng.trim() && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));

    return (
        <div className="space-y-4">
            {/* Quick presets */}
            <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Quick Select</label>
                <div className="flex gap-2">
                    {PRESET_LOCATIONS.map((p) => (
                        <button
                            key={p.label}
                            onClick={() => handlePreset(p)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                                name === p.name ? "bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366]" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                            }`}
                        >
                            <MapPin className="w-3 h-3" /> {p.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Location Name</label>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Taj Hotel, Cochin Airport"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-white/20"
                />
            </div>

            <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Address</label>
                <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Full address (optional)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-white/20"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Latitude</label>
                    <input
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                        placeholder="e.g. 9.9312"
                        type="number"
                        step="any"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-white/20"
                    />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Longitude</label>
                    <input
                        value={lng}
                        onChange={(e) => setLng(e.target.value)}
                        placeholder="e.g. 76.2673"
                        type="number"
                        step="any"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-white/20"
                    />
                </div>
            </div>

            <p className="text-[10px] text-slate-600">
                Tip: Find coordinates on Google Maps → right-click → &quot;Copy coordinates&quot;
            </p>

            <button
                onClick={() => { void handleSend(); }}
                disabled={!isValid || sending}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? "Sending..." : `Send Location to ${contact.name}`}
            </button>
        </div>
    );
}
