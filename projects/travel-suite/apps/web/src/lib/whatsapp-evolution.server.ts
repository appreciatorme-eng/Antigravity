// Evolution API client -- server-only.
// Replaces WPPConnect with Evolution API (pure WebSocket via Baileys, no Chrome).
// API reference: https://doc.evolution-api.com/
import "server-only";
import { env } from "@/lib/config/env";
import { fetchWithRetry } from "@/lib/network/retry";

// ---------------------------------------------------------------------------
// Types -- exported so route handlers can type-check responses
// ---------------------------------------------------------------------------

export type WahaStatus =
    | "CONNECTED"
    | "DISCONNECTED"
    | "SCAN_QR_CODE"
    | "STARTING"
    | "FAILED";

export interface WahaSession {
    readonly name: string;
    readonly status: WahaStatus;
    readonly me?: {
        readonly id: string;
        readonly pushName: string;
    };
}

interface EvolutionConnectionState {
    readonly instance?: {
        readonly state?: string;
        readonly instanceName?: string;
    };
}

interface EvolutionInstanceInfo {
    readonly name?: string;
    readonly ownerJid?: string;
    readonly profileName?: string;
    readonly profilePicUrl?: string;
    readonly connectionStatus?: string;
    readonly instance?: {
        readonly instanceName?: string;
        readonly owner?: string;
        readonly profilePictureUrl?: string;
    };
}

interface EvolutionConnectResponse {
    readonly base64?: string;
    readonly code?: string;
    readonly qrcode?: {
        readonly base64?: string;
        readonly code?: string;
        readonly pairingCode?: string | null;
        readonly count?: number;
    };
}

// ---------------------------------------------------------------------------
// Session naming -- deterministic base, optional unique suffix for reconnects
// ---------------------------------------------------------------------------

export function sessionNameFromOrgId(orgId: string): string {
    return "org_" + orgId.replace(/-/g, "").slice(0, 8);
}

/**
 * Generate a unique session name for reconnection.
 * Appends a short random suffix so Evolution API cannot reuse cached
 * Baileys auth credentials stored under the old deterministic name.
 */
export function uniqueSessionName(orgId: string): string {
    const base = sessionNameFromOrgId(orgId);
    const suffix = Math.random().toString(36).slice(2, 6);
    return `${base}_${suffix}`;
}

// ---------------------------------------------------------------------------
// Internal fetch helper -- attaches apikey header
// ---------------------------------------------------------------------------

async function evolutionFetch(
    path: string,
    options?: RequestInit,
): Promise<Response> {
    const baseUrl = env.evolution?.baseUrl;
    const apiKey = env.evolution?.apiKey;

    if (!baseUrl) throw new Error("EVOLUTION_API_URL env var is not configured");
    if (!apiKey) throw new Error("EVOLUTION_API_KEY env var is not configured");

    const base = baseUrl.replace(/\/$/, "");
    const url = `${base}${path}`;

    const headers: Record<string, string> = {
        apikey: apiKey,
    };
    if (options?.body) headers["Content-Type"] = "application/json";

    const res = await fetchWithRetry(url, {
        ...options,
        headers: {
            ...headers,
            ...(options?.headers as Record<string, string> | undefined),
        },
        cache: "no-store",
    }, {
        retries: 2,
        timeoutMs: 9000,
        baseDelayMs: 300,
    });

    return res;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create (or resume) an Evolution API instance.
 * Returns the instance name (used as session identifier).
 * Idempotent: if the instance already exists, returns the name directly.
 *
 * @param instanceName - The instance name to create (use uniqueSessionName() for reconnects)
 * @param webhookUrl - Webhook URL for Evolution events
 */
export async function createEvolutionInstance(
    instanceName: string,
    webhookUrl: string,
): Promise<string> {

    const res = await evolutionFetch("/instance/create", {
        method: "POST",
        body: JSON.stringify({
            instanceName,
            integration: "WHATSAPP-BAILEYS",
            qrcode: true,
            webhook: {
                url: webhookUrl,
                byEvents: false,
                base64: true,
                events: [
                    "MESSAGES_UPSERT",
                    "MESSAGES_UPDATE",
                    "MESSAGES_SET",
                    "SEND_MESSAGE",
                    "PRESENCE_UPDATE",
                    "CONNECTION_UPDATE",
                    "QRCODE_UPDATED",
                ],
            },
        }),
    });

    if (res.ok) {
        return instanceName;
    }

    // Instance may already exist (409 or similar)
    if (res.status === 409 || res.status === 400 || res.status === 403) {
        try {
            const stateRes = await evolutionFetch(
                `/instance/connectionState/${instanceName}`,
            );
            if (stateRes.ok) {
                return instanceName;
            }
        } catch {
            // Fall through to throw
        }
    }

    const text = await res.text().catch(() => "(no body)");
    throw new Error(
        `Evolution POST /instance/create -> ${res.status}: ${text}`,
    );
}

/**
 * Fetch the current QR code as a raw base64 string.
 * Returns empty string if already connected or QR not ready.
 */
export async function getEvolutionQR(instanceName: string): Promise<string | null> {
    const res = await evolutionFetch(`/instance/connect/${instanceName}`);

    if (!res.ok) {
        const text = await res.text().catch(() => "(no body)");
        throw new Error(
            `Evolution GET /instance/connect/${instanceName} -> ${res.status}: ${text}`,
        );
    }

    const json = (await res.json()) as EvolutionConnectResponse;
    // Return the raw QR code string (not the PNG image which has white-on-white rendering issues).
    // The frontend renders this with QRCodeSVG for reliable display.
    const code = json.qrcode?.code ?? json.code ?? "";
    return code || null;
}

/**
 * Fetch the current session status mapped to a WahaSession-compatible shape.
 */
export async function getEvolutionStatus(
    instanceName: string,
): Promise<WahaSession> {
    try {
        const res = await evolutionFetch(
            `/instance/connectionState/${instanceName}`,
        );

        if (!res.ok) {
            return { name: instanceName, status: "FAILED" };
        }

        const json = (await res.json()) as EvolutionConnectionState;
        const rawState = json.instance?.state ?? "close";

        const statusMap: Record<string, WahaStatus> = {
            open: "CONNECTED",
            close: "DISCONNECTED",
            connecting: "SCAN_QR_CODE",
        };
        const status = statusMap[rawState] ?? "DISCONNECTED";

        let me: { id: string; pushName: string } | undefined;
        if (status === "CONNECTED") {
            try {
                const infoRes = await evolutionFetch(
                    `/instance/fetchInstances?instanceName=${instanceName}`,
                );
                if (infoRes.ok) {
                    const infoJson = (await infoRes.json()) as
                        | readonly EvolutionInstanceInfo[]
                        | EvolutionInstanceInfo;
                    const instances = Array.isArray(infoJson) ? infoJson : [infoJson];
                    const instance = instances[0];
                    // v2.3.7: ownerJid + profileName at top level
                    const ownerJid = instance?.ownerJid ?? instance?.instance?.owner ?? "";
                    const userId = ownerJid.replace(/@s\.whatsapp\.net$/, "");
                    if (userId && userId.length >= 7) {
                        me = {
                            id: userId,
                            pushName: instance?.profileName ?? instance?.name ?? "",
                        };
                    }
                }
            } catch {
                // fetchInstances not available or failed -- leave me undefined
            }
        }

        return { name: instanceName, status, me };
    } catch {
        return { name: instanceName, status: "FAILED" };
    }
}

/**
 * Send a plain-text WhatsApp message from an Evolution instance.
 * phoneDigits -- E.164 digits without "+", e.g. "919876543210"
 */
export async function sendEvolutionText(
    instanceName: string,
    phoneDigits: string,
    text: string,
): Promise<void> {
    const digits = phoneDigits.replace(/\D/g, "");

    const res = await evolutionFetch(`/message/sendText/${instanceName}`, {
        method: "POST",
        body: JSON.stringify({ number: digits, text }),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => "(no body)");
        throw new Error(
            `Evolution POST /message/sendText/${instanceName} -> ${res.status}: ${body}`,
        );
    }
}

/**
 * Download media from a message as a base64 string.
 * Uses POST /chat/getBase64FromMediaMessage/{instance}.
 */
export async function getEvolutionMediaBase64(
    instanceName: string,
    messageId: string,
): Promise<string | null> {
    const res = await evolutionFetch(`/chat/getBase64FromMediaMessage/${instanceName}`, {
        method: "POST",
        body: JSON.stringify({
            message: { key: { id: messageId } },
            convertToMp4: false,
        }),
    });

    if (!res.ok) return null;

    const json = await res.json() as { base64?: string; data?: string };
    return json.base64 ?? json.data ?? null;
}

/**
 * Fetch all messages from an Evolution instance's local message store.
 * Uses POST /chat/findMessages/{instance} to pull cached messages.
 * Returns raw message array — caller is responsible for storage.
 */
export async function fetchEvolutionMessages(
    instanceName: string,
): Promise<readonly EvolutionHistoryMessage[]> {
    const res = await evolutionFetch(`/chat/findMessages/${instanceName}`, {
        method: "POST",
        body: JSON.stringify({ where: {} }),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => "(no body)");
        throw new Error(
            `Evolution POST /chat/findMessages/${instanceName} -> ${res.status}: ${body}`,
        );
    }

    const json = await res.json() as readonly EvolutionHistoryMessage[];
    return Array.isArray(json) ? json : [];
}

export interface EvolutionHistoryMessage {
    readonly key: {
        readonly remoteJid: string;
        readonly id: string;
        readonly fromMe?: boolean;
    };
    readonly message?: {
        readonly conversation?: string;
        readonly extendedTextMessage?: { readonly text?: string };
    };
    readonly pushName?: string;
    readonly messageTimestamp?: number | string;
}

/**
 * Send a media message (image, document, audio, video) from an Evolution instance.
 * mediaType: "image" | "document" | "audio" | "video"
 * media: URL to the file or base64 content
 */
export async function sendEvolutionMedia(
    instanceName: string,
    phoneDigits: string,
    media: string,
    mediaType: "image" | "document" | "audio" | "video",
    options?: { caption?: string; fileName?: string; mimetype?: string },
): Promise<void> {
    const digits = phoneDigits.replace(/\D/g, "");

    const res = await evolutionFetch(`/message/sendMedia/${instanceName}`, {
        method: "POST",
        body: JSON.stringify({
            number: digits,
            mediatype: mediaType === "image" ? "image" : mediaType === "video" ? "video" : "document",
            media,
            caption: options?.caption ?? "",
            fileName: options?.fileName ?? `file.${mediaType === "image" ? "jpg" : "pdf"}`,
            mimetype: options?.mimetype ?? (mediaType === "document" ? "application/pdf" : `${mediaType}/jpeg`),
        }),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => "(no body)");
        throw new Error(
            `Evolution POST /message/sendMedia/${instanceName} -> ${res.status}: ${body}`,
        );
    }
}

/**
 * Send a location pin from an Evolution instance.
 */
export async function sendEvolutionLocation(
    instanceName: string,
    phoneDigits: string,
    latitude: number,
    longitude: number,
    name?: string,
    address?: string,
): Promise<void> {
    const digits = phoneDigits.replace(/\D/g, "");

    const res = await evolutionFetch(`/message/sendLocation/${instanceName}`, {
        method: "POST",
        body: JSON.stringify({
            number: digits,
            latitude,
            longitude,
            name: name ?? "Location",
            address: address ?? "",
        }),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => "(no body)");
        throw new Error(
            `Evolution POST /message/sendLocation/${instanceName} -> ${res.status}: ${body}`,
        );
    }
}

/**
 * Send a poll from an Evolution instance.
 * selectableCount: how many options the recipient can choose (1 = single choice)
 */
export async function sendEvolutionPoll(
    instanceName: string,
    phoneDigits: string,
    question: string,
    options: readonly string[],
    selectableCount: number = 1,
): Promise<void> {
    const digits = phoneDigits.replace(/\D/g, "");

    const res = await evolutionFetch(`/message/sendPoll/${instanceName}`, {
        method: "POST",
        body: JSON.stringify({
            number: digits,
            name: question,
            selectableCount,
            values: options,
        }),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => "(no body)");
        throw new Error(
            `Evolution POST /message/sendPoll/${instanceName} -> ${res.status}: ${body}`,
        );
    }
}

/**
 * Send a presence update (typing, recording, available) to a contact.
 * Shows "typing..." or "recording audio..." in the client's WhatsApp.
 */
export async function sendEvolutionPresence(
    instanceName: string,
    phoneDigits: string,
    presence: "composing" | "recording" | "paused",
): Promise<void> {
    const digits = phoneDigits.replace(/\D/g, "");
    await evolutionFetch(`/chat/sendPresence/${instanceName}`, {
        method: "POST",
        body: JSON.stringify({
            number: `${digits}@s.whatsapp.net`,
            presence,
        }),
    }).catch(() => {
        // Best-effort — don't fail on presence errors
    });
}

/**
 * Delete an Evolution instance entirely. Must be recreated to reconnect.
 * Used for re-linking: delete → create → QR scan → MESSAGES_SET fires with full history.
 */
export async function deleteEvolutionInstance(
    instanceName: string,
): Promise<void> {
    try {
        await evolutionFetch(`/instance/delete/${instanceName}`, {
            method: "DELETE",
        });
    } catch {
        // Instance may already be gone
    }
}

/**
 * Disconnect an Evolution instance. Errors are swallowed -- session may already be gone.
 */
export async function disconnectEvolution(
    instanceName: string,
): Promise<void> {
    try {
        await evolutionFetch(`/instance/logout/${instanceName}`, {
            method: "DELETE",
        });
    } catch {
        // Intentional: safe to ignore -- session already gone
    }
}

/**
 * Logout (clear Baileys auth keys) then delete the instance.
 * This ensures a subsequent create with the same name cannot auto-reconnect
 * using cached session credentials.
 */
export async function logoutAndDeleteInstance(
    instanceName: string,
): Promise<void> {
    // Step 1: Logout — clears Baileys auth state (session keys) on the Evolution server
    try {
        const logoutRes = await evolutionFetch(`/instance/logout/${instanceName}`, {
            method: "DELETE",
        });
        // 404 = instance not found, which is fine
        if (!logoutRes.ok && logoutRes.status !== 404) {
            console.warn(
                `[evolution] logout ${instanceName} returned ${logoutRes.status}`,
            );
        }
    } catch {
        // Instance may not exist — continue to delete
    }

    // Brief pause so logout propagates before delete
    await new Promise((r) => setTimeout(r, 1000));

    // Step 2: Delete the instance
    try {
        await evolutionFetch(`/instance/delete/${instanceName}`, {
            method: "DELETE",
        });
    } catch {
        // Instance may already be gone
    }
}

// ---------------------------------------------------------------------------
// Group management -- for TripBuilt Assistant WhatsApp group
// ---------------------------------------------------------------------------

interface CreateGroupResponse {
    readonly id?: string;
    readonly groupJid?: string;
    readonly jid?: string;
}

/**
 * Create a WhatsApp group via Evolution API.
 * participantDigits -- array of E.164 phone numbers (digits only).
 * Returns the groupJid (e.g. "120363xxxx@g.us").
 */
export async function createEvolutionGroup(
    instanceName: string,
    subject: string,
    participantDigits: readonly string[],
): Promise<string> {
    const participants = participantDigits.map((d) => d.replace(/\D/g, ""));

    const res = await evolutionFetch(`/group/create/${instanceName}`, {
        method: "POST",
        body: JSON.stringify({
            subject,
            participants,
        }),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => "(no body)");
        throw new Error(
            `Evolution POST /group/create/${instanceName} -> ${res.status}: ${body}`,
        );
    }

    const json = (await res.json()) as CreateGroupResponse;
    const groupJid = json.groupJid ?? json.jid ?? json.id ?? "";

    if (!groupJid) {
        throw new Error("Evolution group/create returned no groupJid");
    }

    return groupJid;
}

/**
 * Update a WhatsApp group's profile picture.
 * imageBase64 -- base64-encoded image (PNG or JPEG).
 */
export async function updateEvolutionGroupPicture(
    instanceName: string,
    groupJid: string,
    imageBase64: string,
): Promise<void> {
    await evolutionFetch(`/group/updateGroupPicture/${instanceName}`, {
        method: "POST",
        body: JSON.stringify({
            groupJid,
            image: imageBase64,
        }),
    }).catch(() => {
        // Best-effort -- don't fail if picture update fails
    });
}

/**
 * Update a WhatsApp group's description.
 */
export async function updateEvolutionGroupDescription(
    instanceName: string,
    groupJid: string,
    description: string,
): Promise<void> {
    await evolutionFetch(`/group/updateGroupDescription/${instanceName}`, {
        method: "POST",
        body: JSON.stringify({
            groupJid,
            description,
        }),
    }).catch(() => {
        // Best-effort
    });
}

/**
 * Best-effort probe to verify a WhatsApp group still exists and is writable
 * for the connected session. Evolution does not have a dedicated wrapper here,
 * so we reuse the description update endpoint and check the raw response.
 */
export async function verifyEvolutionGroupAccess(
    instanceName: string,
    groupJid: string,
): Promise<boolean> {
    try {
        const res = await evolutionFetch(`/group/updateGroupDescription/${instanceName}`, {
            method: "POST",
            body: JSON.stringify({
                groupJid,
                description:
                    "Your private TripBuilt notification channel. Daily briefings, new leads, payments, and driver updates — all here.",
            }),
        });

        if (res.ok) {
            return true;
        }

        const body = await res.text().catch(() => "(no body)");
        throw new Error(
            `Evolution POST /group/updateGroupDescription/${instanceName} -> ${res.status}: ${body}`,
        );
    } catch {
        return false;
    }
}

// ---------------------------------------------------------------------------
// Guarded send wrappers — rate-limited via send-guard
// ---------------------------------------------------------------------------

import { checkSendGuard, applyDelay } from "@/lib/whatsapp/send-guard";
import { logWarn } from "@/lib/observability/logger";

/** Resolve orgId from an Evolution instance name. */
async function resolveOrgId(instanceName: string): Promise<string | null> {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { data } = await admin
        .from("whatsapp_connections")
        .select("organization_id")
        .eq("session_name", instanceName)
        .maybeSingle();
    return (data as { organization_id?: string } | null)?.organization_id ?? null;
}

export async function guardedSendText(
    instanceName: string,
    phoneDigits: string,
    text: string,
    automated: boolean = true,
): Promise<void> {
    const orgId = await resolveOrgId(instanceName);
    if (orgId) {
        const guard = checkSendGuard(orgId, phoneDigits, automated);
        if (!guard.allowed) {
            logWarn(`[send-guard] BLOCKED text to ${phoneDigits}: ${guard.reason}`);
            return;
        }
        await applyDelay(guard.delayMs);
    }
    await sendEvolutionText(instanceName, phoneDigits, text);
}

export async function guardedSendMedia(
    instanceName: string,
    phoneDigits: string,
    media: string,
    mediaType: "image" | "document" | "audio" | "video",
    options?: { caption?: string; fileName?: string; mimetype?: string },
    automated: boolean = true,
): Promise<void> {
    const orgId = await resolveOrgId(instanceName);
    if (orgId) {
        const guard = checkSendGuard(orgId, phoneDigits, automated);
        if (!guard.allowed) {
            logWarn(`[send-guard] BLOCKED media to ${phoneDigits}: ${guard.reason}`);
            return;
        }
        await applyDelay(guard.delayMs);
    }
    await sendEvolutionMedia(instanceName, phoneDigits, media, mediaType, options);
}

export async function guardedSendPoll(
    instanceName: string,
    phoneDigits: string,
    question: string,
    pollOptions: readonly string[],
    selectableCount: number = 1,
    automated: boolean = true,
): Promise<void> {
    const orgId = await resolveOrgId(instanceName);
    if (orgId) {
        const guard = checkSendGuard(orgId, phoneDigits, automated);
        if (!guard.allowed) {
            logWarn(`[send-guard] BLOCKED poll to ${phoneDigits}: ${guard.reason}`);
            return;
        }
        await applyDelay(guard.delayMs);
    }
    await sendEvolutionPoll(instanceName, phoneDigits, question, pollOptions, selectableCount);
}
