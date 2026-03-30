"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

/** Debounce delay in milliseconds */
const DEBOUNCE_MS = 300;
/** Minimum characters before triggering a search */
const MIN_QUERY_LENGTH = 2;

export interface SearchResultClient {
  readonly type: "client";
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly href: string;
}

export interface SearchResultTrip {
  readonly type: "trip";
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly href: string;
}

export type SearchResult = SearchResultClient | SearchResultTrip;

interface GlobalSearchState {
  readonly query: string;
  readonly results: readonly SearchResult[];
  readonly isLoading: boolean;
  readonly error: string | null;
}

const EMPTY_RESULTS: readonly SearchResult[] = [];

const INITIAL_STATE: GlobalSearchState = {
  query: "",
  results: EMPTY_RESULTS,
  isLoading: false,
  error: null,
};

async function fetchSearchResults(
  query: string,
  signal: AbortSignal
): Promise<readonly SearchResult[]> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return EMPTY_RESULTS;
  }

  const headers = { Authorization: `Bearer ${session.access_token}` };
  const encodedQuery = encodeURIComponent(query);

  const [clientsRes, tripsRes] = await Promise.allSettled([
    fetch(`/api/admin/clients?search=${encodedQuery}`, {
      headers,
      signal,
    }),
    fetch(`/api/admin/trips?search=${encodedQuery}`, {
      headers,
      signal,
    }),
  ]);

  const results: SearchResult[] = [];

  if (clientsRes.status === "fulfilled" && clientsRes.value.ok) {
    const payload = await clientsRes.value.json();
    const clients = Array.isArray(payload.clients) ? payload.clients : [];
    for (const c of clients.slice(0, 5)) {
      results.push({
        type: "client",
        id: c.id,
        title: c.full_name || c.email || "Unnamed client",
        subtitle: c.email || "",
        href: `/clients/${c.id}`,
      });
    }
  }

  if (tripsRes.status === "fulfilled" && tripsRes.value.ok) {
    const payload = await tripsRes.value.json();
    const trips = Array.isArray(payload.trips) ? payload.trips : [];
    for (const t of trips.slice(0, 5)) {
      const destination = t.destination || t.itineraries?.destination || "";
      const tripTitle = t.itineraries?.trip_title || destination || "Untitled trip";
      const clientName = t.profiles?.full_name || "";
      results.push({
        type: "trip",
        id: t.id,
        title: tripTitle,
        subtitle: clientName ? `Client: ${clientName}` : "",
        href: `/trips/${t.id}`,
      });
    }
  }

  return results;
}

export function useGlobalSearch() {
  const [state, setState] = useState<GlobalSearchState>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, query }));
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();
    setState(INITIAL_STATE);
  }, []);

  useEffect(() => {
    const trimmed = state.query.trim();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      // Clear results when query is too short, but keep the query text
      setState((prev) =>
        prev.results.length === 0 && !prev.isLoading && !prev.error
          ? prev
          : { ...prev, results: EMPTY_RESULTS, isLoading: false, error: null }
      );
      return;
    }

    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    if (timerRef.current) clearTimeout(timerRef.current);

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    timerRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;

      fetchSearchResults(trimmed, controller.signal)
        .then((results) => {
          if (!controller.signal.aborted) {
            setState((prev) => ({
              ...prev,
              results,
              isLoading: false,
              error: null,
            }));
          }
        })
        .catch((err) => {
          if (!controller.signal.aborted) {
            setState((prev) => ({
              ...prev,
              results: EMPTY_RESULTS,
              isLoading: false,
              error:
                err instanceof Error ? err.message : "Search failed",
            }));
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [state.query]);

  return {
    query: state.query,
    results: state.results,
    isLoading: state.isLoading,
    error: state.error,
    setQuery,
    reset,
  } as const;
}
