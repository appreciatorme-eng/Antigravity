import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authedFetch } from "@/lib/api/authed-fetch";
import type {
  TripDetailPayload,
  TripInvoice,
  TripNotificationEntry,
  TripAddOn,
  AvailableAddOn,
  TripItineraryRawData,
  Accommodation,
} from "@/features/trip-detail/types";
import type { ItineraryTemplateId } from "@/components/pdf/itinerary-types";
import type { Json } from "@/lib/database.types";

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const tripDetailKeys = {
  all: ["trips"] as const,
  detail: (id: string) => ["trips", "detail", id] as const,
  invoices: (id: string) => ["trips", "detail", id, "invoices"] as const,
  invoice: (id: string) => ["trips", "detail", "invoice", id] as const,
  notifications: (id: string) =>
    ["trips", "detail", id, "notifications"] as const,
  addOns: (id: string) => ["trips", "detail", id, "add-ons"] as const,
  addOnCatalog: ["trips", "detail", "add-on-catalog"] as const,
};

// ---------------------------------------------------------------------------
// useTripDetail — replaces the raw fetch + useState in the trip detail page
// ---------------------------------------------------------------------------

export function useTripDetail(tripId: string) {
  return useQuery({
    queryKey: tripDetailKeys.detail(tripId),
    queryFn: async (): Promise<TripDetailPayload> => {
      const response = await authedFetch(`/api/trips/${tripId}`);
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
      const response = await authedFetch(`/api/trips/${tripId}/invoices`);
      if (!response.ok) throw new Error("Failed to fetch trip invoices");
      return response.json();
    },
    enabled: !!tripId,
  });
}

export function useTripInvoiceDetail(invoiceId: string | null) {
  return useQuery({
    queryKey: invoiceId ? tripDetailKeys.invoice(invoiceId) : tripDetailKeys.invoice("pending"),
    queryFn: async (): Promise<{ invoice: TripInvoice }> => {
      const response = await authedFetch(`/api/invoices/${invoiceId}`);
      if (!response.ok) throw new Error("Failed to fetch invoice details");
      return response.json();
    },
    enabled: !!invoiceId,
  });
}

// ---------------------------------------------------------------------------
// useTripNotifications — GET /api/trips/{id}/notifications
// ---------------------------------------------------------------------------

export function useTripNotifications(tripId: string) {
  return useQuery({
    queryKey: tripDetailKeys.notifications(tripId),
    queryFn: async (): Promise<{ notifications: TripNotificationEntry[] }> => {
      const response = await authedFetch(`/api/trips/${tripId}/notifications`);
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
      const response = await authedFetch(`/api/trips/${tripId}/add-ons`);
      if (!response.ok) throw new Error("Failed to fetch trip add-ons");
      return response.json();
    },
    enabled: !!tripId,
  });
}

export function useAvailableAddOnsCatalog() {
  return useQuery({
    queryKey: tripDetailKeys.addOnCatalog,
    queryFn: async (): Promise<{ addOns: AvailableAddOn[] }> => {
      const response = await authedFetch("/api/add-ons");
      if (!response.ok) throw new Error("Failed to fetch add-on catalog");
      return response.json();
    },
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
  placeOfSupply?: string | null;
  sacCode?: string | null;
}

export function useCreateTripInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateInvoiceInput) => {
      const items = input.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: typeof item.tax_rate === "number" ? item.tax_rate : 0,
      }));

      const body = {
        ...(input.tripId ? { trip_id: input.tripId } : {}),
        ...(input.clientId ? { client_id: input.clientId } : {}),
        items,
        ...(input.dueDate ? { due_date: input.dueDate } : {}),
        ...(input.notes ? { notes: input.notes } : {}),
        ...(input.placeOfSupply !== undefined
          ? { place_of_supply: input.placeOfSupply || null }
          : {}),
        ...(input.sacCode !== undefined ? { sac_code: input.sacCode || null } : {}),
        status: "issued" as const,
      };

      const response = await authedFetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

interface UpdateTripInvoiceInput {
  invoiceId: string;
  tripId: string;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate?: number;
  }>;
  dueDate?: string | null;
  notes?: string | null;
  placeOfSupply?: string | null;
  sacCode?: string | null;
}

export function useUpdateTripInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTripInvoiceInput) => {
      const items = input.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: typeof item.tax_rate === "number" ? item.tax_rate : 0,
      }));

      const body = {
        items,
        due_date: input.dueDate || null,
        notes: input.notes || null,
        place_of_supply: input.placeOfSupply || null,
        sac_code: input.sacCode || null,
      };

      const response = await authedFetch(`/api/invoices/${input.invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update invoice");
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
      void queryClient.invalidateQueries({
        queryKey: tripDetailKeys.invoice(variables.invoiceId),
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
  rawData?: TripItineraryRawData | null;
  accommodations?: Record<number, Accommodation>;
  templateId?: ItineraryTemplateId;
}

export function useSaveTripItinerary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveItineraryInput) => {
      const response = await authedFetch(`/api/trips/${input.tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itineraryId: input.itineraryId,
          templateId: input.templateId,
          days: input.days,
          accommodations: input.accommodations,
          rawData: {
            ...(input.rawData || {}),
            days: input.days,
          } as unknown as Json,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save trip itinerary");
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: tripDetailKeys.detail(variables.tripId),
      });
    },
  });
}

interface UpdateTripAddOnInput {
  tripId: string;
  addOnId: string;
  quantity?: number;
  unit_price?: number;
  is_selected?: boolean;
}

export function useUpdateTripAddOn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTripAddOnInput) => {
      const response = await authedFetch(`/api/trips/${input.tripId}/add-ons`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update add-on");
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: tripDetailKeys.addOns(variables.tripId),
      });
    },
  });
}

interface CreateTripAddOnInput {
  tripId: string;
  name?: string;
  category?: string;
  unit_price?: number;
  quantity?: number;
  description?: string;
  is_selected?: boolean;
  addOnId?: string;
}

export function useCreateTripAddOn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTripAddOnInput) => {
      const response = await authedFetch(`/api/trips/${input.tripId}/add-ons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create add-on");
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: tripDetailKeys.addOns(variables.tripId),
      });
    },
  });
}
