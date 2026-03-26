/* ------------------------------------------------------------------
 * POST /api/admin/whatsapp/import-history
 * Triggers on-demand import of WhatsApp message history via Evolution API.
 * ------------------------------------------------------------------ */

import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchEvolutionMessages } from "@/lib/whatsapp-evolution.server";
import { apiError } from "@/lib/api/response";
import { logError, logEvent } from "@/lib/observability/logger";

export async function POST(request: Request): Promise<Response> {
    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) return auth.response;

    const { organizationId } = auth;
    const orgId = organizationId!;
    const admin = createAdminClient();

    // Check connection exists and is connected
    const { data: connection } = await admin
        .from("whatsapp_connections")
        .select("id, status, history_imported, session_name")
        .eq("organization_id", orgId)
        .maybeSingle();

    if (!connection) {
        return NextResponse.json(
            { error: "WhatsApp is not connected. Link your device first." },
            { status: 400 },
        );
    }

    const sessionName = (connection as { session_name?: string }).session_name;
    if (!sessionName) return apiError("No active WhatsApp session", 404);

    if (connection.status !== "connected") {
        return NextResponse.json(
            { error: "WhatsApp is disconnected. Reconnect before importing." },
            { status: 400 },
        );
    }

    try {
        logEvent("info", `[whatsapp/import-history] Starting import for ${sessionName}`);

        const messages = await fetchEvolutionMessages(sessionName);

        if (messages.length === 0) {
            return NextResponse.json({
                imported: 0,
                skipped: 0,
                message: "No messages found in WhatsApp message store.",
            });
        }

        // Filter to personal chats with text content
        const validMessages = messages.filter((msg) => {
            const jid = msg.key?.remoteJid ?? "";
            const isPersonalChat = jid.includes("@s.whatsapp.net") && !jid.includes("@g.us");
            const text =
                msg.message?.conversation ??
                msg.message?.extendedTextMessage?.text ??
                "";
            return isPersonalChat && text;
        });

        // Batch upsert
        const BATCH_SIZE = 100;
        let imported = 0;
        let skipped = 0;

        for (let i = 0; i < validMessages.length; i += BATCH_SIZE) {
            const batch = validMessages.slice(i, i + BATCH_SIZE);

            const rows = batch.map((msg) => {
                const waId = (msg.key?.remoteJid ?? "").replace(/@s\.whatsapp\.net$/, "");
                const providerId = "evo_hist_" + msg.key.id;
                const text =
                    msg.message?.conversation ??
                    msg.message?.extendedTextMessage?.text ??
                    "";
                const isFromMe = msg.key?.fromMe === true;

                const ts = msg.messageTimestamp;
                const receivedAt = ts
                    ? new Date(typeof ts === "string" ? parseInt(ts, 10) * 1000 : ts * 1000).toISOString()
                    : new Date().toISOString();

                return {
                    provider_message_id: providerId,
                    wa_id: waId,
                    event_type: "text" as const,
                    payload_hash: createHmac("sha256", providerId).update(providerId).digest("hex"),
                    processing_status: "received" as const,
                    received_at: receivedAt,
                    metadata: {
                        session: sessionName,
                        body_preview: text.slice(0, 500),
                        direction: isFromMe ? "out" : "in",
                        pushName: msg.pushName ?? null,
                        imported: true,
                    },
                };
            });

            const { error, count } = await admin
                .from("whatsapp_webhook_events")
                .upsert(rows, { onConflict: "provider_message_id", ignoreDuplicates: true, count: "exact" });

            if (error) {
                logError("[whatsapp/import-history] batch insert error", error);
                skipped += batch.length;
            } else {
                imported += count ?? batch.length;
                skipped += batch.length - (count ?? batch.length);
            }
        }

        // Mark history as imported
        await admin
            .from("whatsapp_connections")
            .update({ history_imported: true })
            .eq("session_name", sessionName);

        logEvent("info", `[whatsapp/import-history] Done: ${imported} imported, ${skipped} skipped for ${sessionName}`);

        return NextResponse.json({
            imported,
            skipped,
            total: validMessages.length,
            message: `Imported ${imported} messages from WhatsApp history.`,
        });
    } catch (error) {
        logError("[whatsapp/import-history] Import failed", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Import failed" },
            { status: 500 },
        );
    }
}

export async function GET(request: Request): Promise<Response> {
    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) return auth.response;

    const { organizationId } = auth;
    const orgId = organizationId!;
    const admin = createAdminClient();

    const { data: connection } = await admin
        .from("whatsapp_connections")
        .select("status, history_imported, session_name")
        .eq("organization_id", orgId)
        .maybeSingle();

    if (!connection) {
        return NextResponse.json({ connected: false, historyImported: false });
    }

    const baseSessionName = `org_${orgId.replace(/-/g, "").slice(0, 8)}`;

    // Count imported messages
    const { count } = await admin
        .from("whatsapp_webhook_events")
        .select("id", { count: "exact", head: true })
        .filter("metadata->>session", "like", `${baseSessionName}%`)
        .filter("metadata->>imported", "eq", "true");

    return NextResponse.json({
        connected: connection.status === "connected",
        historyImported: connection.history_imported,
        importedMessageCount: count ?? 0,
    });
}
