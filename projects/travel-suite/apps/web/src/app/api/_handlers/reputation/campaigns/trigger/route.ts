import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { REPUTATION_REVIEW_CAMPAIGN_SELECT } from "@/lib/reputation/selects";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { randomUUID } from "crypto";
import type { Database } from "@/lib/database.types";

type CampaignRow = Database["public"]["Tables"]["reputation_review_campaigns"]["Row"];

type InsertedSendRow = Pick<
  Database["public"]["Tables"]["reputation_campaign_sends"]["Row"],
  "id" | "trip_id" | "client_phone" | "nps_token" | "client_name"
>;

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
      const cutoffTime = new Date(Date.now() - delayHours * 60 * 60 * 1000).toISOString();

      const { data: trips, error: tripsError } = await supabase
        .from("trips")
        .select("id, client_id, organization_id")
        .eq("organization_id", organizationId)
        .eq("status", "completed")
        .gte("end_date", cutoffTime)
        .lte("end_date", new Date().toISOString());

      if (tripsError) {
        console.error(`Error querying trips for campaign ${campaign.id}:`, tripsError);
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
            .filter((value): value is string => typeof value === "string" && value.length > 0),
        ),
      );

      const [{ data: existingSendsData, error: existingSendsError }, clientsResult] = await Promise.all([
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
        console.error(`Error checking existing sends for campaign ${campaign.id}:`, existingSendsError);
        continue;
      }

      if (clientsResult.error) {
        console.error(`Error loading clients for campaign ${campaign.id}:`, clientsResult.error);
        continue;
      }

      const existingTripIds = new Set((existingSendsData ?? []).map((send) => send.trip_id));
      const clientById = new Map((clientsResult.data ?? []).map((client) => [client.id, client]));

      const sendInsertPayloads = trips
        .filter((trip) => !existingTripIds.has(trip.id))
        .map((trip) => {
          const client = trip.client_id ? clientById.get(trip.client_id) : null;
          const npsToken = randomUUID();
          const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

          return {
            organization_id: organizationId,
            campaign_id: campaign.id,
            trip_id: trip.id,
            client_id: trip.client_id,
            client_name: client?.name ?? null,
            client_phone: client?.phone ?? null,
            client_email: client?.email ?? null,
            status: "pending" as const,
            nps_token: npsToken,
            nps_token_expires_at: tokenExpiresAt,
            review_link_clicked: false,
            review_submitted: false,
          };
        });

      if (sendInsertPayloads.length === 0) {
        continue;
      }

      const { data: insertedSendsData, error: sendInsertError } = await supabase
        .from("reputation_campaign_sends")
        .insert(sendInsertPayloads)
        .select("id,trip_id,client_phone,nps_token,client_name");

      const insertedSends = (insertedSendsData as unknown as InsertedSendRow[] | null) ?? [];

      if (sendInsertError) {
        console.error(`Error creating sends for campaign ${campaign.id}:`, sendInsertError);
        continue;
      }

      totalSendsCreated += insertedSends.length;

      if (!campaign.channel_sequence?.includes("whatsapp")) {
        continue;
      }

      const notificationPayloads = insertedSends
        .filter((send) => typeof send.client_phone === "string" && send.client_phone.length > 0)
        .map((send) => ({
          organization_id: organizationId,
          channel: "whatsapp",
          recipient: send.client_phone,
          template_name: campaign.whatsapp_template_name || "nps_survey",
          template_data: {
            client_name: send.client_name ?? null,
            nps_link: `${process.env.NEXT_PUBLIC_APP_URL || ""}/reputation/nps/${send.nps_token}`,
            campaign_name: campaign.name,
          },
          status: "pending",
          related_type: "campaign_send",
          related_id: send.id,
        }));

      if (notificationPayloads.length === 0) {
        continue;
      }

      const { error: queueError } = await supabase
        .from("notification_queue")
        .insert(notificationPayloads as unknown as Database["public"]["Tables"]["notification_queue"]["Insert"][]);

      if (queueError) {
        console.error(`Error queueing notifications for campaign ${campaign.id}:`, queueError);
        continue;
      }

      const sendIds = insertedSends.map((send) => send.id);
      if (sendIds.length > 0) {
        const { error: sendUpdateError } = await supabase
          .from("reputation_campaign_sends")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .in("id", sendIds);

        if (sendUpdateError) {
          console.error(`Error updating campaign sends for campaign ${campaign.id}:`, sendUpdateError);
        }
      }
    }

    return NextResponse.json({ sends_created: totalSendsCreated });
  } catch (error: unknown) {
    const message = safeErrorMessage(error, "Request failed");
    console.error("Error triggering campaign sends:", error);
    return apiError(message, 500);
  }
}
