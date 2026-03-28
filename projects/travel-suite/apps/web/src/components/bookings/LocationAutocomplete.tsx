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
        // Show "City (CODE)" in the input for better context
        onValueChange(`${suggestion.cityName} (${suggestion.iataCode})`);
        setOpen(false);
        setActiveIndex(-1);
    }

    return (
        <div className="space-y-1.5" ref={rootRef}>
            <label htmlFor={inputId} className="text-[11px] uppercase tracking-[0.14em] font-bold text-slate-500">{label}</label>
            <div className="relative">
                {/* Selected chip overlay — shows city + code when a suggestion is selected */}
                {selected && !open && (
                    <button
                        type="button"
                        className="absolute inset-0 z-10 flex items-center gap-2 pl-11 pr-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 cursor-text"
                        onClick={() => {
                            onValueChange("");
                            onSelectSuggestion(null as unknown as LocationSuggestion);
                            setOpen(true);
                            // Focus the underlying input
                            const input = document.getElementById(inputId);
                            if (input) setTimeout(() => input.focus(), 50);
                        }}
                    >
                        <span className="absolute inset-y-0 left-3 flex items-center text-emerald-500">
                            {kind === "flight" ? <PlaneTakeoff className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                        </span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {selected.cityName}
                        </span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">
                            {selected.iataCode}
                        </span>
                        {selected.countryCode && (
                            <span className="text-[10px] text-slate-400 uppercase">{selected.countryCode}</span>
                        )}
                    </button>
                )}

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
                    className="h-12 pl-11 pr-3 rounded-xl border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 focus-visible:ring-emerald-400"
                    role="combobox"
                    aria-expanded={showDropdown}
                    aria-controls={listboxId}
                    aria-autocomplete="list"
                />
                {!selected && (
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                        {kind === "flight" ? <PlaneTakeoff className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                    </span>
                )}

                {showDropdown && (
                    <div
                        id={listboxId}
                        role="listbox"
                        className="absolute z-30 mt-2 w-full min-w-[280px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
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
                            <div className="p-3 text-sm text-slate-500">
                                {query.length <= 2
                                    ? "Type a city name or airport code..."
                                    : "No matching locations found."}
                            </div>
                        )}
                        {!loading && !error && suggestions.length > 0 && (
                            <ul className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                {suggestions.map((item, index) => (
                                    <li key={item.id}>
                                        <button
                                            type="button"
                                            role="option"
                                            aria-selected={activeIndex === index}
                                            onMouseEnter={() => setActiveIndex(index)}
                                            onClick={() => commitSuggestion(item)}
                                            className={`w-full text-left px-4 py-3 transition-colors ${
                                                activeIndex === index
                                                    ? "bg-emerald-50 dark:bg-emerald-900/20"
                                                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.cityName}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                        {item.detailedName || item.name}
                                                    </p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{item.iataCode}</p>
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
        </div>
    );
}
