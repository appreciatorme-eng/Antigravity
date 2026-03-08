import crypto from "node:crypto";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import type { Database } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendWahaText } from "@/lib/whatsapp-waha.server";

type AdminProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "organization_id" | "phone" | "phone_whatsapp" | "role"
>;

type ExternalDriverRow = Pick<
  Database["public"]["Tables"]["external_drivers"]["Row"],
  "id" | "full_name" | "phone" | "organization_id" | "is_active"
>;

type TripRow = Pick<
  Database["public"]["Tables"]["trips"]["Row"],
  "id" | "client_id" | "organization_id" | "status"
>;

type BroadcastTarget = "all_clients" | "all_drivers" | "active_trips" | "custom";

type BroadcastRecipient = {
  id: string;
  name: string;
  phone: string;
};

const broadcastSchema = z.object({
  target: z.enum(["all_clients", "all_drivers", "active_trips", "custom"]),
  message: z.string().trim().min(1).max(4096),
});

const ACTIVE_TRIP_STATUSES = [
  "confirmed",
  "active",
  "in_progress",
  "payment_pending",
  "payment_confirmed",
] as const;

function normalizeDigits(phone: string | null | undefined) {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits : null;
}

function dedupeRecipients(recipients: BroadcastRecipient[]) {
  const unique = new Map<string, BroadcastRecipient>();

  for (const recipient of recipients) {
    const digits = normalizeDigits(recipient.phone);
    if (!digits) continue;

    if (!unique.has(digits)) {
      unique.set(digits, {
        ...recipient,
        phone: digits,
      });
    }
  }

  return Array.from(unique.values());
}

async function resolveBroadcastContext() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { response: apiError("Unauthorized", 401) };
  }

  const admin = createAdminClient();
  const { data: actor, error: actorError } = await admin
    .from("profiles")
    .select("id, organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (actorError) {
    console.error("[whatsapp/broadcast] failed to load actor profile:", actorError);
    return { response: apiError("Failed to load broadcast context", 500) };
  }

  if (!actor?.organization_id) {
    return { response: apiError("Organization not found", 404) };
  }

  const { data: connection, error: connectionError } = await admin
    .from("whatsapp_connections")
    .select("session_name, session_token, status")
    .eq("organization_id", actor.organization_id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (connectionError) {
    console.error("[whatsapp/broadcast] failed to load connection:", connectionError);
    return { response: apiError("Failed to load WhatsApp connection", 500) };
  }

  return {
    admin,
    actorId: actor.id,
    organizationId: actor.organization_id,
    connection,
  };
}

async function loadClientRecipients(
  admin: ReturnType<typeof createAdminClient>,
  organizationId: string,
) {
  const { data: clientRows, error: clientError } = await admin
    .from("clients")
    .select("id")
    .eq("organization_id", organizationId);

  if (clientError) {
    throw clientError;
  }

  const clientIds = (clientRows || []).map((row) => row.id).filter(Boolean);
  if (clientIds.length === 0) return [];

  const { data: profiles, error: profileError } = await admin
    .from("profiles")
    .select("id, full_name, phone, phone_whatsapp")
    .in("id", clientIds);

  if (profileError) {
    throw profileError;
  }

  return dedupeRecipients(
    ((profiles || []) as Array<Pick<AdminProfileRow, "id" | "full_name" | "phone" | "phone_whatsapp">>).map(
      (profile) => ({
        id: profile.id,
        name: profile.full_name || "Traveler",
        phone: profile.phone_whatsapp || profile.phone || "",
      }),
    ),
  );
}

async function loadDriverRecipients(
  admin: ReturnType<typeof createAdminClient>,
  organizationId: string,
) {
  const [profileDriversResult, externalDriversResult] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, phone, phone_whatsapp, role")
      .eq("organization_id", organizationId)
      .eq("role", "driver"),
    admin
      .from("external_drivers")
      .select("id, full_name, phone, is_active")
      .eq("organization_id", organizationId)
      .eq("is_active", true),
  ]);

  if (profileDriversResult.error) {
    throw profileDriversResult.error;
  }
  if (externalDriversResult.error) {
    throw externalDriversResult.error;
  }

  const recipients: BroadcastRecipient[] = [
    ...((profileDriversResult.data || []) as AdminProfileRow[]).map((driver) => ({
      id: driver.id,
      name: driver.full_name || "Assigned driver",
      phone: driver.phone_whatsapp || driver.phone || "",
    })),
    ...((externalDriversResult.data || []) as ExternalDriverRow[]).map((driver) => ({
      id: driver.id,
      name: driver.full_name,
      phone: driver.phone,
    })),
  ];

  return dedupeRecipients(recipients);
}

async function loadActiveTripRecipients(
  admin: ReturnType<typeof createAdminClient>,
  organizationId: string,
) {
  const { data: trips, error: tripsError } = await admin
    .from("trips")
    .select("id, client_id, organization_id, status")
    .eq("organization_id", organizationId)
    .in("status", [...ACTIVE_TRIP_STATUSES]);

  if (tripsError) {
    throw tripsError;
  }

  const clientIds = ((trips || []) as TripRow[])
    .map((trip) => trip.client_id)
    .filter((value): value is string => Boolean(value));

  if (clientIds.length === 0) return [];

  const { data: profiles, error: profileError } = await admin
    .from("profiles")
    .select("id, full_name, phone, phone_whatsapp")
    .in("id", clientIds);

  if (profileError) {
    throw profileError;
  }

  return dedupeRecipients(
    ((profiles || []) as Array<Pick<AdminProfileRow, "id" | "full_name" | "phone" | "phone_whatsapp">>).map(
      (profile) => ({
        id: profile.id,
        name: profile.full_name || "Traveler",
        phone: profile.phone_whatsapp || profile.phone || "",
      }),
    ),
  );
}

async function resolveRecipients(
  admin: ReturnType<typeof createAdminClient>,
  organizationId: string,
  target: BroadcastTarget,
) {
  if (target === "custom") {
    return [] as BroadcastRecipient[];
  }

  if (target === "all_clients") {
    return loadClientRecipients(admin, organizationId);
  }

  if (target === "all_drivers") {
    return loadDriverRecipients(admin, organizationId);
  }

  return loadActiveTripRecipients(admin, organizationId);
}

export async function GET() {
  try {
    const context = await resolveBroadcastContext();
    if ("response" in context) {
      return context.response;
    }

    const [allClients, allDrivers, activeTrips] = await Promise.all([
      resolveRecipients(context.admin, context.organizationId, "all_clients"),
      resolveRecipients(context.admin, context.organizationId, "all_drivers"),
      resolveRecipients(context.admin, context.organizationId, "active_trips"),
    ]);

    return apiSuccess({
      counts: {
        all_clients: allClients.length,
        all_drivers: allDrivers.length,
        active_trips: activeTrips.length,
        custom: 0,
      },
      connectionStatus: context.connection?.status || "disconnected",
      canSend:
        Boolean(context.connection?.session_name) &&
        Boolean(context.connection?.session_token) &&
        context.connection?.status === "connected",
    });
  } catch (error) {
    console.error("[whatsapp/broadcast] failed to load broadcast metadata:", error);
    return apiError("Failed to load broadcast recipients", 500);
  }
}

export async function POST(request: Request) {
  try {
    const context = await resolveBroadcastContext();
    if ("response" in context) {
      return context.response;
    }

    if (
      !context.connection ||
      context.connection.status !== "connected" ||
      !context.connection.session_name ||
      !context.connection.session_token
    ) {
      return apiError("WhatsApp not connected", 409, {
        code: "whatsapp_not_connected",
      });
    }

    const body = await request.json().catch(() => null);
    const parsed = broadcastSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid broadcast payload", 400, {
        details: parsed.error.flatten(),
      });
    }

    if (parsed.data.target === "custom") {
      return apiError("Custom lists are not available yet. Choose a saved audience.", 400);
    }

    const recipients = await resolveRecipients(
      context.admin,
      context.organizationId,
      parsed.data.target,
    );

    if (recipients.length === 0) {
      return apiError("No recipients found for this broadcast audience", 404);
    }

    const sentAt = new Date().toISOString();
    const errors: Array<{ phone: string; message: string }> = [];
    let sent = 0;

    for (const recipient of recipients) {
      try {
        await sendWahaText(
          context.connection.session_name,
          context.connection.session_token,
          recipient.phone,
          parsed.data.message,
        );

        const providerMessageId = crypto.randomUUID();
        const payloadHash = crypto
          .createHash("sha256")
          .update(
            JSON.stringify({
              session: context.connection.session_name,
              wa_id: recipient.phone,
              body_preview: parsed.data.message,
              sent_at: sentAt,
              target: parsed.data.target,
            }),
          )
          .digest("hex");

        await context.admin.from("whatsapp_webhook_events").insert({
          provider_message_id: providerMessageId,
          payload_hash: payloadHash,
          event_type: "text",
          wa_id: recipient.phone,
          metadata: {
            session: context.connection.session_name,
            direction: "out",
            body_preview: parsed.data.message,
            sent_by: context.actorId,
            broadcast_target: parsed.data.target,
            recipient_name: recipient.name,
          },
          processing_status: "processed",
          processed_at: sentAt,
          received_at: sentAt,
        });

        sent += 1;
      } catch (sendError) {
        errors.push({
          phone: recipient.phone,
          message:
            sendError instanceof Error
              ? sendError.message
              : "Failed to send WhatsApp message",
        });
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 500);
      });
    }

    return apiSuccess({
      target: parsed.data.target,
      total: recipients.length,
      sent,
      failed: errors.length,
      errors,
    });
  } catch (error) {
    console.error("[whatsapp/broadcast] send failed:", error);
    return apiError("Failed to send broadcast", 500);
  }
}
