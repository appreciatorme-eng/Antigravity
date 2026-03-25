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
// Session naming -- deterministic, stable per org, <= 20 chars
// ---------------------------------------------------------------------------

export function sessionNameFromOrgId(orgId: string): string {
    return "org_" + orgId.replace(/-/g, "").slice(0, 8);
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
 * Create (or resume) an Evolution API instance for an org.
 * Returns the instance name (used as session identifier).
 * Idempotent: if the instance already exists, returns the name directly.
 */
export async function createEvolutionInstance(
    orgId: string,
    webhookUrl: string,
): Promise<string> {
    const instanceName = sessionNameFromOrgId(orgId);

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
                    "MESSAGES_SET",
                    "SEND_MESSAGE",
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
