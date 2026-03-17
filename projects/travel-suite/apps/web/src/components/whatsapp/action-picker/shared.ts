import { useState, useEffect } from "react";

import type { ConversationContact } from "../whatsapp.types";

export type ActionPickerChannel = "whatsapp" | "email";

export type ActionPickerSendHandler = (
  message: string,
  subject?: string
) => boolean | void | Promise<boolean | void>;

export interface ActionPickerProps {
  contact: ConversationContact;
  channel: ActionPickerChannel;
  onSend: ActionPickerSendHandler;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  duration: string;
  pax: number;
  hotel: string;
  amount: number;
  bookingId: string;
  itinerarySummary: string;
  status: string | null;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  vehicleNumber: string;
  rating: number;
  available: boolean;
}

export type LocationType = "hotel" | "airport" | "railway" | "home" | "custom";

export function formatCurrency(value: number) {
  return "₹" + value.toLocaleString("en-IN");
}

// ─── DATA HOOKS ──────────────────────────────────────────────────────────────

interface UseDataResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

export function useOrganizationTrips(): UseDataResult<Trip> {
  const [data, setData] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchTrips() {
      try {
        const res = await fetch("/api/admin/trips");
        if (!res.ok) throw new Error("Failed to load trips");
        const json = await res.json();
        if (cancelled) return;

        const trips: Trip[] = (json.trips ?? []).map(
          (t: {
            id: string;
            status?: string | null;
            start_date?: string | null;
            end_date?: string | null;
            destination?: string | null;
            pax_count?: number | null;
            itineraries?: {
              trip_title?: string | null;
              duration_days?: number | null;
              destination?: string | null;
            } | null;
            profiles?: { full_name?: string | null } | null;
          }) => ({
            id: t.id,
            name:
              t.itineraries?.trip_title || t.destination || "Untitled Trip",
            destination:
              t.destination || t.itineraries?.destination || "",
            startDate: t.start_date
              ? new Date(t.start_date).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                })
              : "",
            endDate: t.end_date
              ? new Date(t.end_date).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                })
              : "",
            duration: t.itineraries?.duration_days
              ? `${t.itineraries.duration_days - 1}N/${t.itineraries.duration_days}D`
              : "",
            pax: t.pax_count ?? 0,
            hotel: t.destination || t.itineraries?.destination || "",
            amount: 0,
            bookingId: `GB-${t.id.slice(0, 8).toUpperCase()}`,
            itinerarySummary: "",
            status: t.status ?? null,
          }),
        );

        setData(trips);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load trips",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTrips();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}

export function useOrganizationDrivers(): UseDataResult<Driver> {
  const [data, setData] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchDrivers() {
      try {
        const res = await fetch("/api/drivers/search?limit=100");
        if (!res.ok) throw new Error("Failed to load drivers");
        const json = await res.json();
        if (cancelled) return;

        const drivers: Driver[] = (json.drivers ?? []).map(
          (d: {
            id: string;
            fullName: string;
            phone: string;
            vehicleType: string | null;
            vehiclePlate: string | null;
            todayTripCount: number;
          }) => ({
            id: d.id,
            name: d.fullName,
            phone: d.phone,
            vehicle: d.vehicleType || "Not assigned",
            vehicleNumber: d.vehiclePlate || "",
            rating: 0,
            available: d.todayTripCount === 0,
          }),
        );

        setData(drivers);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load drivers",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDrivers();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
