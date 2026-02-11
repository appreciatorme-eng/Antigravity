import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendNotificationToUser } from "@/lib/notifications";
import { sendWhatsAppText } from "@/lib/whatsapp.server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const queueSecret = process.env.NOTIFICATION_CRON_SECRET || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

type QueueStatus = "pending" | "processing" | "sent" | "failed" | "cancelled";

interface QueueItem {
    id: string;
    user_id: string | null;
    trip_id: string | null;
    recipient_phone: string | null;
    recipient_type: "client" | "driver" | "admin" | null;
    notification_type: string;
    payload: Record<string, unknown> | null;
    attempts: number;
    status: QueueStatus;
}

function getStringPayloadValue(payload: Record<string, unknown> | null, key: string): string {
    const value = payload?.[key];
    return typeof value === "string" ? value : "";
}

function addMinutes(date: Date, minutes: number): string {
    return new Date(date.getTime() + minutes * 60_000).toISOString();
}

async function resolveLiveLinkForQueueItem(item: QueueItem, payload: Record<string, unknown>) {
    const tripId = item.trip_id;
    if (!tripId) return null;

    const dayNumber = Number(payload.day_number || 0) || null;
    const nowIso = new Date().toISOString();

    let existingQuery = supabaseAdmin
        .from("trip_location_shares")
        .select("share_token")
        .eq("trip_id", tripId)
        .eq("is_active", true)
        .gt("expires_at", nowIso)
        .order("created_at", { ascending: false })
        .limit(1);

    if (dayNumber) {
        existingQuery = existingQuery.eq("day_number", dayNumber);
    }

    const { data: existing } = await existingQuery.maybeSingle();
    if (existing?.share_token) {
        return existing.share_token;
    }

    const shareToken = crypto.randomUUID().replace(/-/g, "");
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const { data: inserted } = await supabaseAdmin
        .from("trip_location_shares")
        .insert({
            trip_id: tripId,
            day_number: dayNumber,
            share_token: shareToken,
            is_active: true,
            expires_at: expiresAt,
        })
        .select("share_token")
        .single();

    return inserted?.share_token || null;
}

export async function POST(request: NextRequest) {
    try {
        const headerSecret = request.headers.get("x-notification-cron-secret") || "";
        if (!queueSecret || headerSecret !== queueSecret) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: dueRows, error: dueError } = await supabaseAdmin
            .from("notification_queue")
            .select("id,user_id,trip_id,recipient_phone,recipient_type,notification_type,payload,attempts,status")
            .eq("status", "pending")
            .lte("scheduled_for", new Date().toISOString())
            .order("scheduled_for", { ascending: true })
            .limit(25);

        if (dueError) {
            return NextResponse.json({ error: dueError.message }, { status: 500 });
        }

        const rows = (dueRows || []) as QueueItem[];
        let sent = 0;
        let failed = 0;

        for (const row of rows) {
            const { data: claimedRows } = await supabaseAdmin
                .from("notification_queue")
                .update({ status: "processing", last_attempt_at: new Date().toISOString() })
                .eq("id", row.id)
                .eq("status", "pending")
                .select("id");

            if (!claimedRows || claimedRows.length === 0) {
                continue;
            }

            const attempts = Number(row.attempts || 0) + 1;
            const payload = row.payload || {};
            const title = getStringPayloadValue(payload, "title") || "Trip Notification";
            let body = getStringPayloadValue(payload, "body") || "You have an update for your trip.";

            if (row.notification_type === "pickup_reminder") {
                const token = await resolveLiveLinkForQueueItem(row, payload);
                if (token) {
                    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
                    const liveUrl = `${appUrl.replace(/\/$/, "")}/live/${token}`;
                    body = `${body}\n\nTrack live location:\n${liveUrl}`;
                }
            }

            let whatsappSuccess = false;
            let pushSuccess = false;
            const channelErrors: string[] = [];

            if (row.recipient_phone) {
                const message = `${title}\n\n${body}`;
                const waResult = await sendWhatsAppText(row.recipient_phone, message);
                whatsappSuccess = waResult.success;
                if (!waResult.success && waResult.error) {
                    channelErrors.push(`whatsapp: ${waResult.error}`);
                }

                await supabaseAdmin.from("notification_logs").insert({
                    trip_id: row.trip_id,
                    recipient_id: row.user_id,
                    recipient_phone: row.recipient_phone,
                    recipient_type: row.recipient_type || "client",
                    notification_type: row.notification_type || "general",
                    title,
                    body,
                    status: waResult.success ? "sent" : "failed",
                    error_message: waResult.success ? null : waResult.error,
                    sent_at: new Date().toISOString(),
                });
            }

            if (row.user_id) {
                const pushResult = await sendNotificationToUser({
                    userId: row.user_id,
                    title,
                    body,
                    data: {
                        type: row.notification_type || "general",
                        tripId: row.trip_id || undefined,
                        dayNumber: Number(payload.day_number || 0) || undefined,
                    },
                });
                pushSuccess = pushResult.success;
                if (!pushResult.success && pushResult.error) {
                    channelErrors.push(`push: ${pushResult.error}`);
                }
            }

            const isSuccess = whatsappSuccess || pushSuccess;
            if (isSuccess) {
                sent += 1;
                await supabaseAdmin
                    .from("notification_queue")
                    .update({
                        status: "sent",
                        attempts,
                        processed_at: new Date().toISOString(),
                        error_message: null,
                    })
                    .eq("id", row.id);
            } else {
                failed += 1;
                if (attempts >= 3) {
                    await supabaseAdmin
                        .from("notification_queue")
                        .update({
                            status: "failed",
                            attempts,
                            processed_at: new Date().toISOString(),
                            error_message: channelErrors.join(" | ") || "All channels failed",
                        })
                        .eq("id", row.id);
                } else {
                    await supabaseAdmin
                        .from("notification_queue")
                        .update({
                            status: "pending",
                            attempts,
                            scheduled_for: addMinutes(new Date(), 5),
                            error_message: channelErrors.join(" | ") || "All channels failed",
                        })
                        .eq("id", row.id);
                }
            }
        }

        return NextResponse.json({
            ok: true,
            processed: rows.length,
            sent,
            failed,
        });
    } catch (error) {
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
