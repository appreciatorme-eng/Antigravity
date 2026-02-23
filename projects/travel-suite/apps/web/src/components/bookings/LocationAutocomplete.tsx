"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MapPin, PlaneTakeoff } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface LocationSuggestion {
    id: string;
    iataCode: string;
    cityName: string;
    name: string;
    subType: string;
    countryCode?: string;
    detailedName?: string;
    label: string;
}

interface LocationAutocompleteProps {
    label: string;
    placeholder: string;
    kind: "flight" | "hotel";
    value: string;
    selected?: LocationSuggestion | null;
    onValueChange: (nextValue: string) => void;
    onSelectSuggestion: (suggestion: LocationSuggestion) => void;
}

export function LocationAutocomplete({
    label,
    placeholder,
    kind,
    value,
    selected,
    onValueChange,
    onSelectSuggestion,
}: LocationAutocompleteProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [error, setError] = useState("");
    const rootRef = useRef<HTMLDivElement | null>(null);

    const query = value.trim();
    const minimumQueryLength = 1;
    const shouldSearch = query.length >= minimumQueryLength;

    useEffect(() => {
        const handleClickAway = (event: MouseEvent) => {
            if (!rootRef.current) return;
            if (!rootRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickAway);
        return () => document.removeEventListener("mousedown", handleClickAway);
    }, []);

    useEffect(() => {
        if (!shouldSearch) {
            setSuggestions([]);
            setLoading(false);
            setError("");
            return;
        }

        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            setLoading(true);
            setError("");
            try {
                const res = await fetch(
                    `/api/bookings/locations/search?q=${encodeURIComponent(query)}&kind=${kind}`,
                    { signal: controller.signal }
                );
                const json = await res.json();
                if (!res.ok) {
                    throw new Error(json.error || "Failed to load suggestions");
                }
                setSuggestions(Array.isArray(json.suggestions) ? json.suggestions : []);
            } catch (error) {
                if ((error as { name?: string })?.name === "AbortError") return;
                const message = error instanceof Error ? error.message : "Failed to load suggestions";
                setError(message);
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        }, 220);

        return () => {
            controller.abort();
            window.clearTimeout(timer);
        };
    }, [kind, query, shouldSearch]);

    const showDropdown = useMemo(() => {
        return open && (loading || suggestions.length > 0 || !!error) && shouldSearch;
    }, [error, loading, open, shouldSearch, suggestions.length]);

    return (
        <div className="space-y-2" ref={rootRef}>
            <label className="text-[11px] uppercase tracking-[0.14em] font-bold text-slate-500">{label}</label>
            <div className="relative">
                <Input
                    value={value}
                    onChange={(event) => {
                        onValueChange(event.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder}
                    className="h-12 pl-11 pr-3 rounded-xl border-slate-200 bg-white/90 focus-visible:ring-emerald-400"
                />
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                    {kind === "flight" ? <PlaneTakeoff className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                </span>

                {showDropdown && (
                    <div className="absolute z-30 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                        {loading && (
                            <div className="p-3 text-sm text-slate-500 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Searching locations...
                            </div>
                        )}
                        {!loading && error && (
                            <div className="p-3 text-sm text-rose-500">{error}</div>
                        )}
                        {!loading && !error && suggestions.length === 0 && (
                            <div className="p-3 text-sm text-slate-500">No matching locations found.</div>
                        )}
                        {!loading && !error && suggestions.length > 0 && (
                            <ul className="max-h-64 overflow-y-auto">
                                {suggestions.map((item) => (
                                    <li key={item.id}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onSelectSuggestion(item);
                                                onValueChange(item.cityName);
                                                setOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition-colors"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{item.cityName}</p>
                                                    <p className="text-xs text-slate-500 truncate">
                                                        {item.detailedName || item.name}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-emerald-600">{item.iataCode}</p>
                                                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
                                                        {item.subType}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
            {selected && (
                <p className="text-[11px] text-slate-500">
                    Selected: <span className="font-semibold text-slate-700">{selected.cityName}</span> ({selected.iataCode})
                </p>
            )}
        </div>
    );
}
