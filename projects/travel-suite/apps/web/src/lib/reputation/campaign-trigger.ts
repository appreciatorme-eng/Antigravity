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
  name: string | null;
  phone: string | null;
  email: string | null;
}

export async function triggerCampaignSendsForOrg(
  supabase: SupabaseClient,
  organizationId: string
): Promise<CampaignTriggerResult> {
  const errors: string[] = [];
  let sendsCreated = 0;

  const { data: campaigns, error: campaignsError } = await (supabase as any)
    .from("reputation_review_campaigns")
    .select(
      "id, name, trigger_delay_hours, channel_sequence, whatsapp_template_name, email_template_name"
    )
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .in("trigger_event", ["trip_completed", "trip_day_2"]);

  if (campaignsError) {
    errors.push(
      `Campaigns fetch failed for org ${organizationId}: ${campaignsError.message}`
    );
    return { sends_created: 0, errors };
  }

  if (!campaigns || campaigns.length === 0) {
    return { sends_created: 0, errors };
  }

  for (const campaign of campaigns as CampaignRow[]) {
    const delayHours = campaign.trigger_delay_hours ?? 24;
    const cutoffTime = new Date(
      Date.now() - delayHours * 60 * 60 * 1000
    ).toISOString();
    const now = new Date().toISOString();

    const { data: trips, error: tripsError } = await supabase
      .from("trips")
      .select("id, client_id")
      .eq("organization_id", organizationId)
      .eq("status", "completed")
      .gte("end_date", cutoffTime)
      .lte("end_date", now);

    if (tripsError) {
      errors.push(
        `Trips query failed for campaign ${campaign.id}: ${tripsError.message}`
      );
      continue;
    }

    if (!trips || trips.length === 0) {
      continue;
    }

    for (const trip of trips as TripRow[]) {
      const { data: existingSend } = await (supabase as any)
        .from("reputation_campaign_sends")
        .select("id")
        .eq("campaign_id", campaign.id)
        .eq("trip_id", trip.id)
        .limit(1)
        .maybeSingle();

      if (existingSend) {
        continue;
      }

      let clientName: string | null = null;
      let clientPhone: string | null = null;
      let clientEmail: string | null = null;

      if (trip.client_id) {
        const { data: client } = await (supabase as any)
          .from("clients")
          .select("name, phone, email")
          .eq("id", trip.client_id)
          .single();

        if (client) {
          const c = client as ClientRow;
          clientName = c.name ?? null;
          clientPhone = c.phone ?? null;
          clientEmail = c.email ?? null;
        }
      }

      const npsToken = randomUUID();
      const tokenExpiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      const npsLink = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/reputation/nps/${npsToken}`;

      const { data: send, error: sendError } = await (supabase as any)
        .from("reputation_campaign_sends")
        .insert({
          organization_id: organizationId,
          campaign_id: campaign.id,
          trip_id: trip.id,
          client_id: trip.client_id,
          client_name: clientName,
          client_phone: clientPhone,
          client_email: clientEmail,
          status: "pending",
          nps_token: npsToken,
          nps_token_expires_at: tokenExpiresAt,
          review_link_clicked: false,
          review_submitted: false,
        })
        .select()
        .single();

      if (sendError) {
        errors.push(
          `Send creation failed (campaign ${campaign.id} / trip ${trip.id}): ${sendError.message}`
        );
        continue;
      }

      const channelSequence: string[] = campaign.channel_sequence ?? [];
      const templateData = {
        client_name: clientName,
        nps_link: npsLink,
        campaign_name: campaign.name,
      };

      let notificationQueued = false;

      if (clientPhone && channelSequence.includes("whatsapp")) {
        const { error: waError } = await (supabase as any)
          .from("notification_queue")
          .insert({
            organization_id: organizationId,
            channel: "whatsapp",
            recipient: clientPhone,
            template_name: campaign.whatsapp_template_name ?? "nps_survey",
            template_data: templateData,
            status: "pending",
            related_type: "campaign_send",
            related_id: send.id,
          });

        if (waError) {
          errors.push(
            `WhatsApp queue failed for send ${send.id}: ${waError.message}`
          );
        } else {
          notificationQueued = true;
        }
      }

      if (clientEmail && channelSequence.includes("email")) {
        const { error: emailError } = await (supabase as any)
          .from("notification_queue")
          .insert({
            organization_id: organizationId,
            channel: "email",
            recipient: clientEmail,
            template_name: campaign.email_template_name ?? "nps_survey_email",
            template_data: templateData,
            status: "pending",
            related_type: "campaign_send",
            related_id: send.id,
          });

        if (emailError) {
          errors.push(
            `Email queue failed for send ${send.id}: ${emailError.message}`
          );
        } else {
          notificationQueued = true;
        }
      }

      if (notificationQueued) {
        await (supabase as any)
          .from("reputation_campaign_sends")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", send.id);
      }

      sendsCreated++;
    }
  }

  return { sends_created: sendsCreated, errors };
}
