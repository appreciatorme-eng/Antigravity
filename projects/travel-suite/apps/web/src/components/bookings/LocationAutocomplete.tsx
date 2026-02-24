"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
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
    const inputId = useId();
    const listboxId = `${inputId}-listbox`;
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [error, setError] = useState("");
    const [activeIndex, setActiveIndex] = useState<number>(-1);
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
            setActiveIndex(-1);
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
                setActiveIndex(-1);
            } catch (error) {
                if ((error as { name?: string })?.name === "AbortError") return;
                const message = error instanceof Error ? error.message : "Failed to load suggestions";
                setError(message);
                setSuggestions([]);
                setActiveIndex(-1);
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

    useEffect(() => {
        if (!open) {
            setActiveIndex(-1);
        }
    }, [open]);

    function commitSuggestion(suggestion: LocationSuggestion) {
        onSelectSuggestion(suggestion);
        onValueChange(suggestion.cityName);
        setOpen(false);
        setActiveIndex(-1);
    }

    return (
        <div className="space-y-2" ref={rootRef}>
            <label htmlFor={inputId} className="text-[11px] uppercase tracking-[0.14em] font-bold text-slate-500">{label}</label>
            <div className="relative">
                <Input
                    id={inputId}
                    value={value}
                    onChange={(event) => {
                        onValueChange(event.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={(event) => {
                        if (!showDropdown || loading || suggestions.length === 0) {
                            if (event.key === "Escape") setOpen(false);
                            return;
                        }

                        if (event.key === "ArrowDown") {
                            event.preventDefault();
                            setActiveIndex((previous) => {
                                const next = previous + 1;
                                return next >= suggestions.length ? 0 : next;
                            });
                            return;
                        }

                        if (event.key === "ArrowUp") {
                            event.preventDefault();
                            setActiveIndex((previous) => {
                                if (previous <= 0) return suggestions.length - 1;
                                return previous - 1;
                            });
                            return;
                        }

                        if (event.key === "Enter" && activeIndex >= 0 && activeIndex < suggestions.length) {
                            event.preventDefault();
                            commitSuggestion(suggestions[activeIndex]);
                            return;
                        }

                        if (event.key === "Escape") {
                            event.preventDefault();
                            setOpen(false);
                        }
                    }}
                    placeholder={placeholder}
                    className="h-12 pl-11 pr-3 rounded-xl border-slate-200 bg-white/90 focus-visible:ring-emerald-400"
                    role="combobox"
                    aria-expanded={showDropdown}
                    aria-controls={listboxId}
                    aria-autocomplete="list"
                />
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                    {kind === "flight" ? <PlaneTakeoff className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                </span>

                {showDropdown && (
                    <div
                        id={listboxId}
                        role="listbox"
                        className="absolute z-30 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
                    >
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
                                {suggestions.map((item, index) => (
                                    <li key={item.id}>
                                        <button
                                            type="button"
                                            role="option"
                                            aria-selected={activeIndex === index}
                                            onMouseEnter={() => setActiveIndex(index)}
                                            onClick={() => commitSuggestion(item)}
                                            className={`w-full text-left px-4 py-3 transition-colors ${
                                                activeIndex === index ? "bg-emerald-50" : "hover:bg-emerald-50"
                                            }`}
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
