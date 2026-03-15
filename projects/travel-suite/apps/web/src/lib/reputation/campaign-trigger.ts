// Reputation campaign trigger — core send logic extracted for reuse.
// Called by the cron handler with a service-role client to process all orgs.

import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

export interface CampaignTriggerResult {
  sends_created: number;
  errors: string[];
}

interface CampaignRow {
  id: string;
  name: string;
  trigger_delay_hours: number | null;
  channel_sequence: string[] | null;
  whatsapp_template_name: string | null;
  email_template_name: string | null;
}

interface TripRow {
  id: string;
  client_id: string | null;
}

interface ClientRow {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
}

interface ExistingSendRow {
  trip_id: string;
}

interface InsertedSendRow {
  id: string;
  trip_id: string;
  client_phone: string | null;
  client_email: string | null;
}

type QueryErrorLike = { message: string } | null;

type UntypedBuilder = {
  select: (columns: string) => UntypedBuilder;
  eq: (column: string, value: unknown) => UntypedBuilder;
  in: (column: string, values: readonly string[]) => UntypedBuilder;
  limit: (count: number) => UntypedBuilder;
  maybeSingle: () => Promise<{ data: unknown; error: QueryErrorLike }>;
  single: () => Promise<{ data: unknown; error: QueryErrorLike }>;
  insert: (values: unknown) => UntypedBuilder;
  update: (values: unknown) => UntypedBuilder;
};

type UntypedSupabase = {
  from: (relation: string) => UntypedBuilder;
};

export async function triggerCampaignSendsForOrg(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<CampaignTriggerResult> {
  const errors: string[] = [];
  let sendsCreated = 0;
  const rawSupabase = supabase as unknown as UntypedSupabase;

  const { data: campaigns, error: campaignsError } = await ((rawSupabase
    .from("reputation_review_campaigns")
    .select(
      "id, name, trigger_delay_hours, channel_sequence, whatsapp_template_name, email_template_name",
    )
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .in("trigger_event", ["trip_completed", "trip_day_2"])) as unknown as Promise<{
    data: CampaignRow[] | null;
    error: QueryErrorLike;
  }>);

  if (campaignsError) {
    errors.push(
      `Campaigns fetch failed for org ${organizationId}: ${campaignsError.message}`,
    );
    return { sends_created: 0, errors };
  }

  if (!campaigns || campaigns.length === 0) {
    return { sends_created: 0, errors };
  }

  for (const campaign of campaigns) {
    const delayHours = campaign.trigger_delay_hours ?? 24;
    const cutoffTime = new Date(Date.now() - delayHours * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    const { data: trips, error: tripsError } = await supabase
      .from("trips")
      .select("id, client_id")
      .eq("organization_id", organizationId)
      .eq("status", "completed")
      .gte("end_date", cutoffTime)
      .lte("end_date", now);

    if (tripsError) {
      errors.push(`Trips query failed for campaign ${campaign.id}: ${tripsError.message}`);
      continue;
    }

    const tripRows = (trips as TripRow[] | null) ?? [];
    if (tripRows.length === 0) {
      continue;
    }

    const tripIds = tripRows.map((trip) => trip.id);

    const { data: existingSends, error: existingSendsError } = await ((rawSupabase
      .from("reputation_campaign_sends")
      .select("trip_id")
      .eq("campaign_id", campaign.id)
      .in("trip_id", tripIds)) as unknown as Promise<{
      data: ExistingSendRow[] | null;
      error: QueryErrorLike;
    }>);

    if (existingSendsError) {
      errors.push(
        `Existing send lookup failed for campaign ${campaign.id}: ${existingSendsError.message}`,
      );
      continue;
    }

    const existingTripIds = new Set((existingSends ?? []).map((row) => row.trip_id));

    const clientIds = Array.from(
      new Set(
        tripRows
          .map((trip) => trip.client_id)
          .filter((value): value is string => typeof value === "string" && value.length > 0),
      ),
    );

    let clientById = new Map<string, ClientRow>();
    if (clientIds.length > 0) {
      const { data: clients, error: clientsError } = await ((rawSupabase
        .from("clients")
        .select("id, name, phone, email")
        .in("id", clientIds)) as unknown as Promise<{
        data: ClientRow[] | null;
        error: QueryErrorLike;
      }>);

      if (clientsError) {
        errors.push(
          `Client lookup failed for campaign ${campaign.id}: ${clientsError.message}`,
        );
        continue;
      }

      clientById = new Map((clients ?? []).map((client) => [client.id, client]));
    }

    const sendPayloadByTripId = new Map<
      string,
      {
        npsToken: string;
        clientName: string | null;
      }
    >();

    const sendInsertPayloads = tripRows
      .filter((trip) => !existingTripIds.has(trip.id))
      .map((trip) => {
        const client = trip.client_id ? clientById.get(trip.client_id) : null;
        const npsToken = randomUUID();
        const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        sendPayloadByTripId.set(trip.id, {
          npsToken,
          clientName: client?.name ?? null,
        });

        return {
          organization_id: organizationId,
          campaign_id: campaign.id,
          trip_id: trip.id,
          client_id: trip.client_id,
          client_name: client?.name ?? null,
          client_phone: client?.phone ?? null,
          client_email: client?.email ?? null,
          status: "pending",
          nps_token: npsToken,
          nps_token_expires_at: tokenExpiresAt,
          review_link_clicked: false,
          review_submitted: false,
        };
      });

    if (sendInsertPayloads.length === 0) {
      continue;
    }

    const { data: insertedSends, error: sendInsertError } = await ((rawSupabase
      .from("reputation_campaign_sends")
      .insert(sendInsertPayloads)
      .select("id, trip_id, client_phone, client_email")) as unknown as Promise<{
      data: InsertedSendRow[] | null;
      error: QueryErrorLike;
    }>);

    if (sendInsertError || !insertedSends) {
      errors.push(
        `Send creation failed for campaign ${campaign.id}: ${sendInsertError?.message ?? "unknown error"}`,
      );
      continue;
    }

    sendsCreated += insertedSends.length;

    const channelSequence: string[] = campaign.channel_sequence ?? [];
    if (channelSequence.length === 0) {
      continue;
    }

    const queueInserts: Array<Record<string, unknown>> = [];
    const queuedSendIds = new Set<string>();

    for (const send of insertedSends) {
      const sendPayload = sendPayloadByTripId.get(send.trip_id);
      if (!sendPayload) {
        continue;
      }

      const templateData = {
        client_name: sendPayload.clientName,
        nps_link: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/reputation/nps/${sendPayload.npsToken}`,
        campaign_name: campaign.name,
      };

      if (send.client_phone && channelSequence.includes("whatsapp")) {
        queueInserts.push({
          organization_id: organizationId,
          channel: "whatsapp",
          recipient: send.client_phone,
          template_name: campaign.whatsapp_template_name ?? "nps_survey",
          template_data: templateData,
          status: "pending",
          related_type: "campaign_send",
          related_id: send.id,
        });
        queuedSendIds.add(send.id);
      }

      if (send.client_email && channelSequence.includes("email")) {
        queueInserts.push({
          organization_id: organizationId,
          channel: "email",
          recipient: send.client_email,
          template_name: campaign.email_template_name ?? "nps_survey_email",
          template_data: templateData,
          status: "pending",
          related_type: "campaign_send",
          related_id: send.id,
        });
        queuedSendIds.add(send.id);
      }
    }

    if (queueInserts.length > 0) {
      const { error: queueError } = await supabase
        .from("notification_queue")
        .insert(queueInserts);

      if (queueError) {
        errors.push(`Queue insert failed for campaign ${campaign.id}: ${queueError.message}`);
      }
    }

    const sendIdsToMarkSent = Array.from(queuedSendIds);
    if (sendIdsToMarkSent.length > 0) {
      await rawSupabase
        .from("reputation_campaign_sends")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .in("id", sendIdsToMarkSent);
    }
  }

  return { sends_created: sendsCreated, errors };
}
