"use client";

import { useState, useEffect, useCallback } from "react";
import type { TripWithCosts, TripServiceCost, VendorHistoryItem } from "./types";

export function useTripCosts(month: string) {
  const [trips, setTrips] = useState<TripWithCosts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/pricing/trips?month=${month}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setTrips(json.trips || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load trips");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void fetchTrips();
  }, [fetchTrips]);

  const createCost = useCallback(async (
    data: Omit<TripServiceCost, "id" | "organization_id" | "created_by" | "created_at" | "updated_at">
  ) => {
    const res = await fetch("/api/admin/pricing/trip-costs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    await fetchTrips();
    return res.json();
  }, [fetchTrips]);

  const updateCost = useCallback(async (id: string, data: Partial<TripServiceCost>) => {
    const res = await fetch(`/api/admin/pricing/trip-costs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    await fetchTrips();
    return res.json();
  }, [fetchTrips]);

  const deleteCost = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/pricing/trip-costs/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    await fetchTrips();
  }, [fetchTrips]);

  const fetchVendorHistory = useCallback(async (
    vendorName: string, category: string
  ): Promise<VendorHistoryItem[]> => {
    const params = new URLSearchParams({ vendor: vendorName, category });
    const res = await fetch(`/api/admin/pricing/vendor-history?${params}`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.history || [];
  }, []);

  return {
    trips, loading, error, reload: fetchTrips,
    createCost, updateCost, deleteCost, fetchVendorHistory,
  };
}
