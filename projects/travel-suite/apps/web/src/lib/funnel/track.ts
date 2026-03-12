// Funnel event tracker — fire-and-forget wrapper for conversion_events inserts.
// Errors are logged but never propagate; callers are never blocked.

import type { SupabaseClient } from "@supabase/supabase-js";
import { logError } from "@/lib/observability/logger";
import type { ConversionEventType } from "@/lib/leads/types";

interface TrackFunnelEventOptions {
  supabase: SupabaseClient;
  organizationId: string;
  eventType: ConversionEventType;
  leadId?: string | null;
  profileId?: string | null;
  tripId?: string | null;
  metadata?: Record<string, unknown>;
}

export function trackFunnelEvent({
  supabase,
  organizationId,
  eventType,
  leadId = null,
  profileId = null,
  tripId = null,
  metadata = {},
}: TrackFunnelEventOptions): void {
  void Promise.resolve(
    supabase.from("conversion_events").insert({
      organization_id: organizationId,
      event_type: eventType,
      lead_id: leadId,
      profile_id: profileId,
      trip_id: tripId,
      event_metadata: metadata,
    })
  )
    .then(({ error }) => {
      if (error) {
        logError(`[funnel] Failed to track ${eventType}`, error);
      }
    })
    .catch((err: unknown) => {
      logError(`[funnel] Exception tracking ${eventType}`, err);
    });
}
