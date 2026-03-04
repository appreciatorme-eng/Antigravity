"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { calendarKeys } from "./useCalendarEvents";

// ---------------------------------------------------------------------------
// Auth helper (mirrors useCalendarEvents)
// ---------------------------------------------------------------------------

type SupabaseClient = ReturnType<typeof createClient>;

async function getOrgId(supabase: SupabaseClient): Promise<string> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error("Not authenticated");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.organization_id) {
    throw new Error("No organization found");
  }

  return profile.organization_id;
}

// ---------------------------------------------------------------------------
// Types for mutation inputs
// ---------------------------------------------------------------------------

interface UpdateTripStatusInput {
  tripId: string;
  status: string;
}

interface RecordPaymentInput {
  invoice_id: string;
  amount: number;
  payment_date: string;
  method: string;
}

interface RespondConciergeInput {
  id: string;
  response: string;
}

// ---------------------------------------------------------------------------
// Hook: useCalendarActions
// ---------------------------------------------------------------------------

export function useCalendarActions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // -- Update trip status ---------------------------------------------------

  const updateTripStatus = useMutation({
    mutationFn: async ({ tripId, status }: UpdateTripStatusInput) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("trips")
        .update({ status })
        .eq("id", tripId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      toast({
        title: "Trip status updated",
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: "Failed to update trip status",
        variant: "error",
      });
    },
  });

  // -- Send invoice ---------------------------------------------------------

  const sendInvoice = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/invoices/${id}/send`, {
        method: "POST",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to send invoice");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      toast({
        title: "Invoice sent",
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: "Failed to send invoice",
        variant: "error",
      });
    },
  });

  // -- Record payment -------------------------------------------------------

  const recordPayment = useMutation({
    mutationFn: async (input: RecordPaymentInput) => {
      const supabase = createClient();
      const orgId = await getOrgId(supabase);
      const { data, error } = await supabase
        .from("invoice_payments")
        .insert({
          invoice_id: input.invoice_id,
          amount: input.amount,
          payment_date: input.payment_date,
          method: input.method,
          status: "completed",
          organization_id: orgId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      toast({
        title: "Payment recorded",
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: "Failed to record payment",
        variant: "error",
      });
    },
  });

  // -- Send proposal --------------------------------------------------------

  const sendProposal = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/proposals/${id}/send`, {
        method: "POST",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to send proposal");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      toast({
        title: "Proposal sent",
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: "Failed to send proposal",
        variant: "error",
      });
    },
  });

  // -- Convert proposal to trip ---------------------------------------------

  const convertProposal = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/proposals/${id}/convert`, {
        method: "POST",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to convert proposal");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      toast({
        title: "Proposal converted to trip",
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: "Failed to convert proposal",
        variant: "error",
      });
    },
  });

  // -- Respond to concierge request -----------------------------------------

  const respondConcierge = useMutation({
    mutationFn: async ({ id, response }: RespondConciergeInput) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("concierge_requests")
        .update({ response, status: "resolved" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      toast({
        title: "Response sent",
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: "Failed to send response",
        variant: "error",
      });
    },
  });

  // -- Create personal event -------------------------------------------------

  const createPersonalEvent = useMutation({
    mutationFn: async (input: {
      title: string;
      description: string | null;
      startDate: string;
      endDate: string | null;
      location: string | null;
      category: string;
      allDay: boolean;
    }) => {
      const supabase = createClient();
      const orgId = await getOrgId(supabase);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await (supabase as any)
        .from("calendar_events")
        .insert({
          organization_id: orgId,
          created_by: user.id,
          title: input.title,
          description: input.description,
          location: input.location,
          start_time: input.startDate,
          end_time: input.endDate,
          all_day: input.allDay,
          category: input.category,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      toast({ title: "Event created", variant: "success" });
    },
    onError: () => {
      toast({ title: "Failed to create event", variant: "error" });
    },
  });

  // -- Update personal event -------------------------------------------------

  const updatePersonalEvent = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      [key: string]: any;
    }) => {
      const supabase = createClient();
      const { data, error } = await (supabase as any)
        .from("calendar_events")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      toast({ title: "Event updated", variant: "success" });
    },
    onError: () => {
      toast({ title: "Failed to update event", variant: "error" });
    },
  });

  // -- Delete personal event -------------------------------------------------

  const deletePersonalEvent = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await (supabase as any)
        .from("calendar_events")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      toast({ title: "Event deleted", variant: "success" });
    },
    onError: () => {
      toast({ title: "Failed to delete event", variant: "error" });
    },
  });

  return {
    updateTripStatus,
    sendInvoice,
    recordPayment,
    sendProposal,
    convertProposal,
    respondConcierge,
    createPersonalEvent,
    updatePersonalEvent,
    deletePersonalEvent,
  };
}
