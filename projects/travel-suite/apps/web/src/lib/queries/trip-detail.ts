import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type {
  TripDetailPayload,
  TripInvoice,
  TripNotificationEntry,
  TripAddOn,
} from "@/features/trip-detail/types";
import type { Json } from "@/lib/database.types";

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const tripDetailKeys = {
  all: ["trips"] as const,
  detail: (id: string) => ["trips", "detail", id] as const,
  invoices: (id: string) => ["trips", "detail", id, "invoices"] as const,
  notifications: (id: string) =>
    ["trips", "detail", id, "notifications"] as const,
  addOns: (id: string) => ["trips", "detail", id, "add-ons"] as const,
};

// ---------------------------------------------------------------------------
// Auth helper (shared across hooks)
// ---------------------------------------------------------------------------

async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }

  return { Authorization: `Bearer ${session.access_token}` };
}

// ---------------------------------------------------------------------------
// useTripDetail — replaces the raw fetch + useState in the trip detail page
// ---------------------------------------------------------------------------

export function useTripDetail(tripId: string) {
  return useQuery({
    queryKey: tripDetailKeys.detail(tripId),
    queryFn: async (): Promise<TripDetailPayload> => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/trips/${tripId}`, { headers });
      if (!response.ok) throw new Error("Failed to fetch trip details");
      return response.json();
    },
    enabled: !!tripId,
  });
}

// ---------------------------------------------------------------------------
// useTripInvoices — GET /api/trips/{id}/invoices
// ---------------------------------------------------------------------------

export function useTripInvoices(tripId: string) {
  return useQuery({
    queryKey: tripDetailKeys.invoices(tripId),
    queryFn: async (): Promise<{ invoices: TripInvoice[] }> => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/trips/${tripId}/invoices`, {
        headers,
      });
      if (!response.ok) throw new Error("Failed to fetch trip invoices");
      return response.json();
    },
    enabled: !!tripId,
  });
}

// ---------------------------------------------------------------------------
// useTripNotifications — GET /api/trips/{id}/notifications
// ---------------------------------------------------------------------------

export function useTripNotifications(tripId: string) {
  return useQuery({
    queryKey: tripDetailKeys.notifications(tripId),
    queryFn: async (): Promise<{ notifications: TripNotificationEntry[] }> => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/trips/${tripId}/notifications`, {
        headers,
      });
      if (!response.ok)
        throw new Error("Failed to fetch trip notifications");
      return response.json();
    },
    enabled: !!tripId,
  });
}

// ---------------------------------------------------------------------------
// useTripAddOns — GET /api/trips/{id}/add-ons
// ---------------------------------------------------------------------------

export function useTripAddOns(tripId: string) {
  return useQuery({
    queryKey: tripDetailKeys.addOns(tripId),
    queryFn: async (): Promise<{ addOns: TripAddOn[] }> => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/trips/${tripId}/add-ons`, {
        headers,
      });
      if (!response.ok) throw new Error("Failed to fetch trip add-ons");
      return response.json();
    },
    enabled: !!tripId,
  });
}

// ---------------------------------------------------------------------------
// useCreateTripInvoice — POST /api/invoices with trip_id pre-set
// ---------------------------------------------------------------------------

interface CreateInvoiceInput {
  tripId: string;
  clientId: string | null;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate?: number;
  }>;
  dueDate?: string;
  notes?: string;
}

export function useCreateTripInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateInvoiceInput) => {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          trip_id: input.tripId,
          client_id: input.clientId,
          items: input.items,
          due_date: input.dueDate,
          notes: input.notes,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(
          err.error || "Failed to create invoice",
        );
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: tripDetailKeys.invoices(variables.tripId),
      });
      void queryClient.invalidateQueries({
        queryKey: tripDetailKeys.detail(variables.tripId),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// useSaveTripItinerary — save itinerary changes via Supabase
// ---------------------------------------------------------------------------

interface SaveItineraryInput {
  tripId: string;
  itineraryId: string;
  days: unknown[];
}

export function useSaveTripItinerary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveItineraryInput) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("itineraries")
        .update({ raw_data: { days: input.days } as unknown as Json })
        .eq("id", input.itineraryId);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: tripDetailKeys.detail(variables.tripId),
      });
    },
  });
}
