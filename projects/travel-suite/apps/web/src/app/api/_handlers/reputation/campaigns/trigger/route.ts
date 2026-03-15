import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import {
  REPUTATION_CAMPAIGN_SEND_SELECT,
  REPUTATION_REVIEW_CAMPAIGN_SELECT,
} from "@/lib/reputation/selects";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { randomUUID } from "crypto";
import type { Database } from "@/lib/database.types";

type CampaignRow = Database["public"]["Tables"]["reputation_review_campaigns"]["Row"];
type CampaignSendRow = Database["public"]["Tables"]["reputation_campaign_sends"]["Row"];

/** Fields selected from the clients table -- not all columns exist in generated types */
type ClientContactFields = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
};

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(req, { requireOrganization: true });
    if (!auth.ok) {
      return auth.response;
    }

    const organizationId = auth.organizationId!;
    const supabase = auth.adminClient;
    // Fetch active campaigns for this org
    const { data: campaignsData, error: campaignsError } = await supabase
      .from("reputation_review_campaigns")
      .select(REPUTATION_REVIEW_CAMPAIGN_SELECT)
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .in("trigger_event", ["trip_completed", "trip_day_2"]);
    const campaigns = campaignsData as unknown as CampaignRow[] | null;

    if (campaignsError) {
      throw campaignsError;
    }

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({ sends_created: 0 });
    }

    let totalSendsCreated = 0;

    for (const campaign of campaigns) {
      const delayHours = campaign.trigger_delay_hours ?? 24;
      const cutoffTime = new Date(
        Date.now() - delayHours * 60 * 60 * 1000
      ).toISOString();

      // Query trips that completed within the trigger window
      const { data: trips, error: tripsError } = await supabase
        .from("trips")
        .select("id, client_id, organization_id")
        .eq("organization_id", organizationId)
        .eq("status", "completed")
        .gte("end_date", cutoffTime)
        .lte("end_date", new Date().toISOString());

      if (tripsError) {
        console.error(
          `Error querying trips for campaign ${campaign.id}:`,
          tripsError
        );
        continue;
      }

      if (!trips || trips.length === 0) {
        continue;
      }

      const tripIds = trips.map((trip) => trip.id);
      const clientIds = Array.from(
        new Set(
          trips
            .map((trip) => trip.client_id)
            .filter((value): value is string => typeof value === "string" && value.length > 0)
        )
      );

      const [
        { data: existingSendsData, error: existingSendsError },
        clientsResult,
      ] = await Promise.all([
        supabase
          .from("reputation_campaign_sends")
          .select("trip_id")
          .eq("campaign_id", campaign.id)
          .in("trip_id", tripIds),
        clientIds.length > 0
          ? (supabase
              .from("clients")
              .select("id, name, phone, email")
              .in("id", clientIds) as unknown as Promise<{
              data: ClientContactFields[] | null;
              error: unknown;
            }>)
          : Promise.resolve({ data: [] as ClientContactFields[], error: null }),
      ]);

      if (existingSendsError) {
        console.error(
          `Error checking existing sends for campaign ${campaign.id}:`,
          existingSendsError
        );
        continue;
      }

      if (clientsResult.error) {
        console.error(
          `Error loading clients for campaign ${campaign.id}:`,
          clientsResult.error
        );
        continue;
      }

      const existingTripIds = new Set((existingSendsData ?? []).map((send) => send.trip_id));
      const clientById = new Map((clientsResult.data ?? []).map((client) => [client.id, client]));

      for (const trip of trips) {
        if (existingTripIds.has(trip.id)) {
          continue;
        }

        // Fetch client details for the send
        const client = trip.client_id ? clientById.get(trip.client_id) : null;
        const clientName = client?.name ?? null;
        const clientPhone = client?.phone ?? null;
        const clientEmail = client?.email ?? null;

        const npsToken = randomUUID();
        const tokenExpiresAt = new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString();

        const sendPayload = {
          organization_id: organizationId,
          campaign_id: campaign.id,
          trip_id: trip.id,
          client_id: trip.client_id,
          client_name: clientName,
          client_phone: clientPhone,
          client_email: clientEmail,
          status: "pending" as const,
          nps_token: npsToken,
          nps_token_expires_at: tokenExpiresAt,
          review_link_clicked: false,
          review_submitted: false,
        };

        const { data: sendRowData, error: sendError } = await supabase
          .from("reputation_campaign_sends")
          .insert(sendPayload)
          .select(REPUTATION_CAMPAIGN_SEND_SELECT)
          .single();
        const send = sendRowData as unknown as CampaignSendRow | null;

        if (sendError) {
          console.error(
            `Error creating send for campaign ${campaign.id}, trip ${trip.id}:`,
            sendError
          );
          continue;
        }

        // Queue notification for WhatsApp delivery
        if (send && clientPhone && campaign.channel_sequence?.includes("whatsapp")) {
          // notification_queue insert uses runtime schema fields not in generated types
          const notificationPayload = {
            organization_id: organizationId,
            channel: "whatsapp",
            recipient: clientPhone,
            template_name: campaign.whatsapp_template_name || "nps_survey",
            template_data: {
              client_name: clientName,
              nps_link: `${process.env.NEXT_PUBLIC_APP_URL || ""}/reputation/nps/${npsToken}`,
              campaign_name: campaign.name,
            },
            status: "pending",
            related_type: "campaign_send",
            related_id: send.id,
          };
          const { error: queueError } = await (supabase
            .from("notification_queue")
            .insert(notificationPayload as unknown as Database['public']['Tables']['notification_queue']['Insert'])
          );

          if (queueError) {
            console.error(
              `Error queuing notification for send ${send.id}:`,
              queueError
            );
          } else {
            // Update the send with the notification queue link
            const { error: sendUpdateError } = await supabase
              .from("reputation_campaign_sends")
              .update({ status: "sent", sent_at: new Date().toISOString() })
              .eq("id", send.id);
            if (sendUpdateError) {
              console.error(
                `Error updating campaign send ${send.id} after queueing:`,
                sendUpdateError
              );
            }
          }
        }

        totalSendsCreated++;
      }
    }

    return NextResponse.json({ sends_created: totalSendsCreated });
  } catch (error: unknown) {
    const message = safeErrorMessage(error, "Request failed");
    console.error("Error triggering campaign sends:", error);
    return apiError(message, 500);
  }
}
