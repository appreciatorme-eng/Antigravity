import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { ItineraryResult } from "@/types/itinerary";
import type { SharePaymentConfig, SharePaymentDefaults } from "@/lib/share/payment-config";
import { normalizeSharePaymentConfig } from "@/lib/share/payment-config";
import {
  readSharePaymentConfigFromRawData,
  withOptionalSharedItineraryPaymentConfig,
} from "@/lib/share/payment-config-compat";

type AdminClient = SupabaseClient<Database>;

interface PaymentContextArgs {
  adminClient: AdminClient;
  itineraryId: string;
  tripId?: string | null;
}

interface LinkedTripRow {
  id: string;
  client_id: string | null;
  itinerary_id: string | null;
}

interface ItineraryPaymentRow {
  id: string;
  user_id: string | null;
  trip_title: string | null;
  destination: string | null;
  raw_data: unknown;
}

interface ClientProfileRow {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  phone_whatsapp: string | null;
}

export interface SharePaymentContext {
  linkedTripId: string | null;
  linkedClientId: string | null;
  paymentEligible: boolean;
  paymentDisabledReason: string | null;
  paymentDefaults: SharePaymentDefaults | null;
  tripTitle: string;
  existingPaymentConfig: SharePaymentConfig | null;
}

function extractConfiguredAmountPaise(
  rawData: unknown,
): number {
  const itinerary = rawData as ItineraryResult | null;
  const extractedPricing = itinerary?.extracted_pricing;
  const structuredPricing = itinerary?.pricing;

  if (extractedPricing?.total_cost && extractedPricing.total_cost > 0) {
    const currency = extractedPricing.currency?.toUpperCase?.();
    if (!currency || currency === "INR") {
      return Math.round(extractedPricing.total_cost * 100);
    }
  }

  if (structuredPricing?.basePrice && structuredPricing.basePrice > 0) {
    const passengerCount = structuredPricing.passengerCount && structuredPricing.passengerCount > 0
      ? structuredPricing.passengerCount
      : 1;
    const serviceFee = structuredPricing.serviceFee && structuredPricing.serviceFee > 0
      ? structuredPricing.serviceFee
      : 0;
    return Math.round((structuredPricing.basePrice * passengerCount + serviceFee) * 100);
  }

  return 0;
}

export async function resolveSharePaymentContext({
  adminClient,
  itineraryId,
  tripId,
}: PaymentContextArgs): Promise<SharePaymentContext> {
  const [{ data: itinerary }, linkedTripResult, shareResult] = await Promise.all([
    adminClient
      .from("itineraries")
      .select("id, user_id, trip_title, destination, raw_data")
      .eq("id", itineraryId)
      .maybeSingle(),
    tripId
      ? adminClient
          .from("trips")
          .select("id, client_id, itinerary_id")
          .eq("id", tripId)
          .maybeSingle()
      : adminClient
          .from("trips")
          .select("id, client_id, itinerary_id")
          .eq("itinerary_id", itineraryId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
    withOptionalSharedItineraryPaymentConfig<{ payment_config?: unknown } | { id: string } | null>(
      async () =>
        adminClient
          .from("shared_itineraries")
          .select("payment_config")
          .eq("itinerary_id", itineraryId)
          .maybeSingle(),
      async () =>
        adminClient
          .from("shared_itineraries")
          .select("id")
          .eq("itinerary_id", itineraryId)
          .maybeSingle(),
    ),
  ]);

  const linkedTrip = (linkedTripResult.data as LinkedTripRow | null) ?? null;
  const resolvedItinerary = (itinerary as ItineraryPaymentRow | null) ?? null;
  const existingPaymentConfig = normalizeSharePaymentConfig(
    shareResult.paymentConfigSupported && shareResult.data && typeof shareResult.data === "object" && "payment_config" in shareResult.data
      ? shareResult.data.payment_config
      : readSharePaymentConfigFromRawData(resolvedItinerary?.raw_data),
  );
  const resolvedTripTitle =
    resolvedItinerary?.trip_title?.trim() ||
    resolvedItinerary?.destination?.trim() ||
    "Trip payment";

  if (!resolvedItinerary || !linkedTrip) {
    return {
      linkedTripId: linkedTrip?.id ?? null,
      linkedClientId: linkedTrip?.client_id ?? null,
      paymentEligible: false,
      paymentDisabledReason: "Link this itinerary to a saved trip before enabling payment.",
      paymentDefaults: null,
      tripTitle: resolvedTripTitle,
      existingPaymentConfig,
    };
  }

  if (!linkedTrip.client_id || linkedTrip.client_id === resolvedItinerary.user_id) {
    return {
      linkedTripId: linkedTrip.id,
      linkedClientId: linkedTrip.client_id,
      paymentEligible: false,
      paymentDisabledReason: "Assign a client to the linked trip before enabling payment.",
      paymentDefaults: null,
      tripTitle: resolvedTripTitle,
      existingPaymentConfig,
    };
  }

  const [invoiceResult, clientResult] = await Promise.all([
    adminClient
      .from("invoices")
      .select("total_amount")
      .eq("trip_id", linkedTrip.id),
    adminClient
      .from("profiles")
      .select("full_name, email, phone, phone_whatsapp")
      .eq("id", linkedTrip.client_id)
      .maybeSingle(),
  ]);

  const invoiceTotalPaise = Math.round(
    (invoiceResult.data || []).reduce((sum, row) => sum + (row.total_amount || 0), 0) * 100,
  );
  const pricingAmountPaise = extractConfiguredAmountPaise(resolvedItinerary.raw_data);
  const fullAmountPaise = invoiceTotalPaise > 0 ? invoiceTotalPaise : pricingAmountPaise;

  const client = (clientResult.data as ClientProfileRow | null) ?? null;

  return {
    linkedTripId: linkedTrip.id,
    linkedClientId: linkedTrip.client_id,
    paymentEligible: true,
    paymentDisabledReason: null,
    paymentDefaults: {
      // Missing pricing should not block payment setup; the operator can confirm the INR amount in the modal.
      full_amount_paise: Math.max(fullAmountPaise, 0),
      currency: "INR",
      client_name: client?.full_name ?? null,
      client_email: client?.email ?? null,
      client_phone: client?.phone_whatsapp ?? client?.phone ?? null,
      title: `${resolvedTripTitle} payment`,
      notes: null,
    },
    tripTitle: resolvedTripTitle,
    existingPaymentConfig,
  };
}
