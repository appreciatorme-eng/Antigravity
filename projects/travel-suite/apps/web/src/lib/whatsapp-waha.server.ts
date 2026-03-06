// WAHA (WhatsApp HTTP API) client library — server-only.
// Wraps all WAHA REST calls; callers never touch fetch directly.
import "server-only";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const WAHA_URL = process.env.WAHA_URL;
const WAHA_API_KEY = process.env.WHATSAPP_API_KEY;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WahaStatus =
    | "SCAN_QR_CODE"
    | "STARTING"
    | "WORKING"
    | "STOPPED"
    | "FAILED";

export interface WahaSession {
    readonly name: string;
    readonly status: WahaStatus;
    readonly me?: {
        readonly id: string;
        readonly pushName: string;
    };
}

interface WahaQRResponse {
    readonly value?: string;
    readonly mime?: string;
    readonly data?: string;
}

// ---------------------------------------------------------------------------
// Session naming — deterministic, stable per org, ≤ 20 chars
// ---------------------------------------------------------------------------

export function sessionNameFromOrgId(orgId: string): string {
    return "org_" + orgId.replace(/-/g, "").slice(0, 8);
}

// ---------------------------------------------------------------------------
// Internal fetch helper
// ---------------------------------------------------------------------------

async function wahaFetch(
    path: string,
    options?: RequestInit,
): Promise<Response> {
    if (!WAHA_URL) throw new Error("WAHA_URL is not configured");

    const base = WAHA_URL.replace(/\/$/, "");
    const url = `${base}${path}`;

    const extraHeaders: Record<string, string> = {};
    if (WAHA_API_KEY) extraHeaders["X-Api-Key"] = WAHA_API_KEY;
    if (options?.body) extraHeaders["Content-Type"] = "application/json";

    const res = await fetch(url, {
        ...options,
        headers: { ...extraHeaders, ...(options?.headers as Record<string, string> | undefined) },
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "(no body)");
        throw new Error(
            `WAHA ${options?.method ?? "GET"} ${path} → ${res.status}: ${text}`,
        );
    }

    return res;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create (or restart) a named WAHA session for an org.
 * Idempotent: swallows 422 (session already exists) silently.
 * Configures webhook with HMAC if WAHA_WEBHOOK_SECRET is set.
 */
export async function createWahaSession(
    orgId: string,
    webhookUrl: string,
): Promise<void> {
    const sessionName = sessionNameFromOrgId(orgId);
    const webhookSecret = process.env.WAHA_WEBHOOK_SECRET;

    const webhookConfig = {
        url: webhookUrl,
        events: ["session.status", "message"],
        ...(webhookSecret ? { hmac: { key: webhookSecret } } : {}),
    };

    try {
        await wahaFetch("/api/sessions", {
            method: "POST",
            body: JSON.stringify({
                name: sessionName,
                start: true,
                config: { webhooks: [webhookConfig] },
            }),
        });
    } catch (err) {
        if (err instanceof Error && err.message.includes("422")) return;
        throw err;
    }
}

/**
 * Fetch the current QR code for a session as a raw base64 PNG string.
 * Returns base64 without the "data:image/png;base64," prefix.
 * Throws if the session is not in SCAN_QR_CODE state.
 */
export async function getWahaQR(sessionName: string): Promise<string> {
    const res = await wahaFetch(`/api/${sessionName}/auth/qr`);
    const json = (await res.json()) as WahaQRResponse;

    const dataUrl = json.data ?? "";
    if (dataUrl.includes(",")) {
        return dataUrl.split(",")[1] ?? "";
    }

    return dataUrl;
}

/**
 * Fetch the current session object from WAHA.
 */
export async function getWahaStatus(
    sessionName: string,
): Promise<WahaSession> {
    const res = await wahaFetch(`/api/sessions/${sessionName}`);
    return res.json() as Promise<WahaSession>;
}

/**
 * Send a plain-text WhatsApp message from a session.
 * phoneDigits — E.164 digits without "+", e.g. "919876543210"
 */
export async function sendWahaText(
    sessionName: string,
    phoneDigits: string,
    text: string,
): Promise<void> {
    const digits = phoneDigits.replace(/\D/g, "");
    const chatId = `${digits}@c.us`;

    await wahaFetch("/api/sendText", {
        method: "POST",
        body: JSON.stringify({ session: sessionName, chatId, text }),
    });
}

/**
 * Stop a WAHA session. Errors are swallowed — session may already be gone.
 */
export async function disconnectWahaSession(
    sessionName: string,
): Promise<void> {
    try {
        await wahaFetch(`/api/sessions/${sessionName}`, { method: "DELETE" });
    } catch {
        // Intentional: safe to ignore — session already gone
    }
}
