"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, MapPin, Search, Send } from "lucide-react";

import {
  fillTemplate,
  getPreferredTemplate,
  mapDisplayLangToTemplateCode,
} from "@/lib/whatsapp/india-templates";

import {
  ActionPickerProps,
  formatCurrency,
  type Trip,
  useOrganizationTrips,
} from "./shared";

export function ItineraryPicker({
  contact,
  channel,
  onSend,
  language,
}: ActionPickerProps) {
  const { data: trips, loading, error } = useOrganizationTrips();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Trip | null>(null);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);

  // Fetch portal token when a trip is selected
  const selectedId = selected?.id ?? null;
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      if (!cancelled) setPortalUrl(null);
      try {
        const res = await fetch(`/api/admin/trips/${selectedId}/portal-token`, {
          signal: controller.signal,
        });
        const json = await res.json() as { data?: { portalToken?: string } };
        const token = json.data?.portalToken;
        if (!cancelled) setPortalUrl(token ? `https://tripbuilt.com/portal/${token}` : null);
      } catch {
        if (!cancelled) setPortalUrl(null);
      }
    })();
    return () => { cancelled = true; controller.abort(); };
  }, [selectedId]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return trips.filter(
      (trip) =>
        trip.name.toLowerCase().includes(q) ||
        trip.destination.toLowerCase().includes(q) ||
        trip.bookingId.toLowerCase().includes(q)
    );
  }, [search, trips]);

  function buildMessage(itineraryLink: string): { body: string; subject?: string } {
    if (!selected) return { body: "" };

    if (channel === "whatsapp") {
      const langCode = mapDisplayLangToTemplateCode(language ?? 'English');
      const template = getPreferredTemplate('ITINERARY_SHARE', langCode);
      if (!template) return { body: "" };

      return {
        body: fillTemplate(template, {
          client_name: contact.name,
          destination: selected.destination,
          trip_name: selected.name,
          start_date: selected.startDate,
          end_date: selected.endDate,
          duration: selected.duration,
          pax_count: String(selected.pax),
          itinerary_summary: selected.itinerarySummary,
          itinerary_link: itineraryLink,
          company_name: "TripBuilt",
        }),
      };
    }

    return {
      subject: `Your ${selected.destination} Trip Itinerary — ${selected.startDate}–${selected.endDate}`,
      body: `Dear ${contact.name},\n\nWe are pleased to share your day-wise itinerary for the upcoming trip.\n\n📋 Trip: ${selected.name}\n📅 Dates: ${selected.startDate} – ${selected.endDate} (${selected.duration})\n👥 Guests: ${selected.pax} person${selected.pax > 1 ? "s" : ""}\n🏨 Stay: ${selected.hotel}\n🔖 Booking ID: ${selected.bookingId}\n\n━━━━━━━━━━━━━━━━━━━━━\nDAY-WISE ITINERARY\n━━━━━━━━━━━━━━━━━━━━━\n${selected.itinerarySummary}\n\nYour full itinerary with vouchers is available at:\n${itineraryLink}\n\nPlease review and let us know if you need any changes. We are happy to customise!\n\nWarm regards,\nTeam TripBuilt\n📞 +91 98765 00000 | tripbuilt.com`,
    };
  }

  function getItineraryLink() {
    if (!selected) return "";
    return portalUrl ?? `https://tripbuilt.com/trips/${selected.id}`;
  }

  function handleSend() {
    if (!selected) return;
    const { body, subject } = buildMessage(getItineraryLink());
    onSend(body, subject);
  }

  const previewMessage = selected ? buildMessage(getItineraryLink()) : { body: "" };

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
          placeholder="Search by trip name or destination..."
          className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
        />
      </div>

      <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
        {filtered.map((trip) => (
          <button
            key={trip.id}
            onClick={() => setSelected(trip)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
              selected?.id === trip.id
                ? "border-[#25D366]/50 bg-[#25D366]/10"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {trip.name}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                <span>
                  {trip.startDate} – {trip.endDate}
                </span>
                <span>·</span>
                <span>{trip.pax} pax</span>
                <span>·</span>
                <span className="text-[#25D366] font-semibold">
                  {formatCurrency(trip.amount)}
                </span>
              </div>
              <p className="text-[10px] text-slate-600 mt-0.5">
                {trip.bookingId} · {trip.hotel}
              </p>
            </div>
            {selected?.id === trip.id && (
              <Check className="w-4 h-4 text-[#25D366] shrink-0" />
            )}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-6">
            No trips match your search
          </p>
        )}
      </div>

      {selected && (
        <div className="rounded-xl border border-white/10 bg-black/25 p-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Preview
          </p>
          <pre className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto custom-scrollbar font-sans">
            {previewMessage.body}
          </pre>
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={!selected}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] hover:bg-[#1FAF54] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors"
      >
        <Send className="w-4 h-4" />
        {channel === "email" ? "Send Itinerary Email" : "Send via WhatsApp"}
      </button>
    </div>
  );
}
