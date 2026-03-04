import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 }
      );
    }

    // Fetch active campaigns for this org
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: campaigns, error: campaignsError } = await (supabase as any)
      .from("reputation_review_campaigns")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .eq("status", "active")
      .in("trigger_event", ["trip_completed", "trip_day_2"]);

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
        .eq("organization_id", profile.organization_id)
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

      for (const trip of trips) {
        // Dedup: check if a send already exists for this campaign + trip
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

        // Fetch client details for the send
        let clientName: string | null = null;
        let clientPhone: string | null = null;
        let clientEmail: string | null = null;

        if (trip.client_id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: client } = await (supabase as any)
            .from("clients")
            .select("name, phone, email")
            .eq("id", trip.client_id)
            .single();

          if (client) {
            clientName = client.name ?? null;
            clientPhone = client.phone ?? null;
            clientEmail = client.email ?? null;
          }
        }

        const npsToken = randomUUID();
        const tokenExpiresAt = new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString();

        const sendData = {
          organization_id: profile.organization_id,
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: send, error: sendError } = await (supabase as any)
          .from("reputation_campaign_sends")
          .insert(sendData)
          .select()
          .single();

        if (sendError) {
          console.error(
            `Error creating send for campaign ${campaign.id}, trip ${trip.id}:`,
            sendError
          );
          continue;
        }

        // Queue notification for WhatsApp delivery
        if (send && clientPhone && campaign.channel_sequence?.includes("whatsapp")) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: queueError } = await (supabase as any)
            .from("notification_queue")
            .insert({
              organization_id: profile.organization_id,
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
            });

          if (queueError) {
            console.error(
              `Error queuing notification for send ${send.id}:`,
              queueError
            );
          } else {
            // Update the send with the notification queue link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
              .from("reputation_campaign_sends")
              .update({ status: "sent", sent_at: new Date().toISOString() })
              .eq("id", send.id);
          }
        }

        totalSendsCreated++;
      }
    }

    return NextResponse.json({ sends_created: totalSendsCreated });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    console.error("Error triggering campaign sends:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
